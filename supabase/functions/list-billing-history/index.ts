import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticate, buildCorsHeaders, guardOrigin, readBoundedJson, stripCallerIdentity } from "../_shared/edge-guard.ts";

type HistoryRow = {
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  amount_refunded: number;
  receipt_url: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  kind: 'subscription' | 'one_off';
  brand: string | null;
  last4: string | null;
};

const statusLabel = (invoiceStatus: string | null, amount: number, refunded: number) => {
  if (refunded > 0 && refunded >= amount) return 'Refunded';
  if (refunded > 0) return 'Partially refunded';
  if (invoiceStatus === 'paid' || invoiceStatus === 'succeeded') return 'Paid';
  if (invoiceStatus === 'uncollectible' || invoiceStatus === 'failed') return 'Failed';
  if (invoiceStatus === 'open') return 'Open';
  return invoiceStatus || 'Unknown';
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const originCheck = guardOrigin(origin);
  if (!originCheck.ok) return json({ error: originCheck.error }, originCheck.status);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const bounded = await readBoundedJson(req);
  if (!bounded.ok) return json({ error: bounded.error }, 400);
  const payload = stripCallerIdentity((bounded.value ?? {}) as Record<string, unknown>);

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Billing is not configured yet.' }, 503);
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );
    const auth = await authenticate(req, async (token) => {
      const { data, error } = await admin.auth.getUser(token);
      return { userId: error || !data?.user ? null : data.user.id };
    });
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const { data: userWrap } = await admin.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const user = userWrap.user;
    if (!user?.email) return json({ error: 'Authentication required' }, 401);

    const { data: subscriber } = await admin
      .from('subscribers')
      .select('stripe_customer_id, subscription_tier, subscribed, subscription_end')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    let customerId = subscriber?.stripe_customer_id as string | null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
      if (customerId) {
        await admin.from('subscribers').upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      }
    }

    if (payload.action === 'refund_request') {
      const note = typeof payload.note === 'string' ? payload.note.slice(0, 1000) : '';
      await admin.from('contact_inquiries').insert({
        name: user.email,
        email: user.email,
        inquiry_type: 'billing',
        subject: 'Billing refund request',
        message: note || 'Traveler asked about a subscription charge. No self-serve refund was issued.',
      });
      return json({ ok: true, message: 'Request sent. Refunds are reviewed by taai and issued in Stripe. This does not refund travel, because taai does not sell travel.' });
    }

    if (!customerId) {
      return json({
        tier: subscriber?.subscription_tier ?? 'traveler',
        subscribed: subscriber?.subscribed ?? false,
        subscription_end: subscriber?.subscription_end ?? null,
        history: [],
      });
    }

    const [invoices, charges] = await Promise.all([
      stripe.invoices.list({ customer: customerId, limit: 24 }),
      stripe.charges.list({ customer: customerId, limit: 24 }),
    ]);
    const invoicedChargeIds = new Set(
      invoices.data.map((invoice) => (typeof invoice.charge === 'string' ? invoice.charge : invoice.charge?.id)).filter(Boolean),
    );

    const history: HistoryRow[] = invoices.data.map((invoice) => ({
      date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
      description: invoice.lines.data[0]?.description || invoice.description || 'Subscription',
      amount: (invoice.amount_paid || invoice.total || 0) / 100,
      currency: (invoice.currency || 'usd').toUpperCase(),
      status: statusLabel(invoice.status, invoice.amount_paid || 0, invoice.amount_remaining && invoice.status === 'paid' ? 0 : 0),
      amount_refunded: 0,
      receipt_url: null,
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      kind: 'subscription',
      brand: null,
      last4: null,
    }));

    for (const charge of charges.data) {
      if (invoicedChargeIds.has(charge.id)) {
        const match = history.find((row) => row.kind === 'subscription' && !row.receipt_url);
        if (match && charge.receipt_url) match.receipt_url = charge.receipt_url;
        const card = charge.payment_method_details?.card;
        if (match && card) {
          match.brand = card.brand || null;
          match.last4 = card.last4 || null;
          match.amount_refunded = (charge.amount_refunded || 0) / 100;
          match.status = statusLabel(charge.status, charge.amount / 100, (charge.amount_refunded || 0) / 100);
        }
        continue;
      }
      const card = charge.payment_method_details?.card;
      history.push({
        date: charge.created ? new Date(charge.created * 1000).toISOString() : null,
        description: charge.description || 'Charge',
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: statusLabel(charge.status, charge.amount / 100, (charge.amount_refunded || 0) / 100),
        amount_refunded: (charge.amount_refunded || 0) / 100,
        receipt_url: charge.receipt_url || null,
        invoice_pdf: null,
        hosted_invoice_url: null,
        kind: charge.invoice ? 'subscription' : 'one_off',
        brand: card?.brand || null,
        last4: card?.last4 || null,
      });
    }

    history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return json({
      tier: subscriber?.subscription_tier ?? 'traveler',
      subscribed: subscriber?.subscribed ?? false,
      subscription_end: subscriber?.subscription_end ?? null,
      history,
    });
  } catch (error) {
    console.error('Billing history error', error instanceof Error ? error.message : 'error');
    return json({ error: 'Unable to load billing history.' }, 500);
  }
});
