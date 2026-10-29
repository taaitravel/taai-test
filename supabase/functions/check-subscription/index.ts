import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticate, buildCorsHeaders, guardOrigin, readBoundedJson } from "../_shared/edge-guard.ts";
import { resolveSubscription, upsertSubscriber } from "../_shared/subscription-sync.ts";
import { limitsForTier } from "../_shared/tier-map.ts";
import { unpaidInvoiceKeepsFailure } from "../_shared/account-policy.ts";

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

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

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

    const { data: userData, error: userError } = await admin.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''));
    if (userError || !userData.user?.email) return json({ error: 'Authentication required' }, 401);
    const user = userData.user;

    const { data: existing } = await admin
      .from('subscribers')
      .select('stripe_customer_id, subscription_tier, payment_failed_at, payment_retry_at, payment_failure_summary')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const resolved = await resolveSubscription(stripe, admin, {
      userId: user.id,
      email: user.email,
      previousTier: existing?.subscription_tier,
      stripeCustomerId: existing?.stripe_customer_id,
    });

    // invoice.payment_failed can land before the subscription status leaves `active`.
    // Keep the failed state until the latest invoice is paid, so a page load cannot
    // mark the account subscribed again with no notice.
    if (existing?.payment_failed_at && resolved.subscribed && resolved.customerId) {
      const invoices = await stripe.invoices.list({ customer: resolved.customerId, limit: 1 });
      const latest = invoices.data[0];
      if (unpaidInvoiceKeepsFailure({
        status: latest?.status ?? null,
        amountRemaining: latest?.amount_remaining ?? 0,
      })) {
        const free = limitsForTier('traveler');
        resolved.subscribed = false;
        resolved.paymentFailed = true;
        resolved.tier = 'traveler';
        resolved.maxItineraries = free.maxItineraries;
        resolved.maxSharedFriends = free.maxSharedFriends;
        resolved.monthlyAiCredits = free.monthlyAiCredits;
        resolved.creditsRemaining = free.monthlyAiCredits < 0 ? -1 : Math.min(resolved.creditsRemaining, free.monthlyAiCredits);
        resolved.cancelAtPeriodEnd = false;
      }
    }

    await upsertSubscriber(admin, { id: user.id, email: user.email }, resolved, {
      existingPaymentFailedAt: existing?.payment_failed_at,
      existingPaymentRetryAt: existing?.payment_retry_at,
      existingPaymentFailureSummary: existing?.payment_failure_summary,
    });

    return json({
      subscribed: resolved.subscribed,
      subscription_tier: resolved.tier,
      tier_source: resolved.source,
      subscription_end: resolved.subscriptionEnd,
      subscription_status: resolved.status,
      credits_remaining: resolved.creditsRemaining,
      monthly_ai_credits: resolved.monthlyAiCredits,
      max_itineraries: resolved.maxItineraries,
      max_shared_friends: resolved.maxSharedFriends,
      payment_failed: resolved.paymentFailed,
      payment_retry_at: resolved.paymentFailed ? existing?.payment_retry_at ?? null : null,
      payment_failure_summary: resolved.paymentFailed ? existing?.payment_failure_summary ?? null : null,
      cancel_at_period_end: resolved.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error('Subscription check error:', error instanceof Error ? error.message : 'error');
    return json({ error: 'Unable to check subscription status. Please try again or contact support.' }, 500);
  }
});
