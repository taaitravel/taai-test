import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { guardOrigin } from "../_shared/edge-guard.ts";
import { resolveSubscription, upsertSubscriber } from "../_shared/subscription-sync.ts";
import { limitsForTier } from "../_shared/tier-map.ts";
import { sendLifecycleEmail } from "../_shared/lifecycle-mail.ts";
import {
  APP_ORIGIN,
  FREE_EDITABLE_ITINERARIES,
  billingDecision,
  formatEmailDate,
  formatMoney,
  planDisplayName,
} from "../_shared/account-policy.ts";

const MAX_BYTES = 256 * 1024;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const originCheck = guardOrigin(origin);
  if (!originCheck.ok) return new Response(JSON.stringify({ error: originCheck.error }), { status: 403 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe webhook secrets are not set');
    return new Response(JSON.stringify({ error: 'Webhook is not configured' }), { status: 500 });
  }

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 });
  }
  const body = await req.text();
  if (body.length > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get('stripe-signature') ?? '', webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature rejected', error instanceof Error ? error.message : 'error');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const interesting = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
  ]);
  if (!interesting.has(event.type)) return new Response(JSON.stringify({ received: true }), { status: 200 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  const object = event.data.object as { customer?: string; metadata?: Record<string, string> };
  const customerId = typeof object.customer === 'string' ? object.customer : null;
  if (!customerId) return new Response(JSON.stringify({ received: true }), { status: 200 });

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return new Response(JSON.stringify({ received: true }), { status: 200 });
    const email = customer.email;
    const metadataUserId = customer.metadata?.supabase_user_id || object.metadata?.supabase_user_id || null;

    let userId = metadataUserId;
    let previousTier: string | null = null;
    let storedPriceId: string | null = null;
    let existingFailure: { payment_failed_at: string | null; payment_retry_at: string | null; payment_failure_summary: string | null } | null = null;
    const subscriberSelect = 'user_id, subscription_tier, email, stripe_price_id, payment_failed_at, payment_retry_at, payment_failure_summary';
    if (userId) {
      const { data } = await admin.from('subscribers').select(subscriberSelect).eq('user_id', userId).maybeSingle();
      previousTier = data?.subscription_tier ?? null;
      storedPriceId = data?.stripe_price_id ?? null;
      existingFailure = data;
    } else {
      const { data } = await admin.from('subscribers').select(subscriberSelect).eq('stripe_customer_id', customerId).maybeSingle();
      userId = data?.user_id ?? null;
      previousTier = data?.subscription_tier ?? null;
      storedPriceId = data?.stripe_price_id ?? null;
      existingFailure = data;
    }
    if (!userId && email) {
      const { data } = await admin.from('subscribers').select(subscriberSelect).eq('email', email).maybeSingle();
      userId = data?.user_id ?? null;
      previousTier = previousTier ?? data?.subscription_tier ?? null;
      storedPriceId = storedPriceId ?? data?.stripe_price_id ?? null;
      existingFailure = existingFailure ?? data;
    }
    if (!userId || !email) {
      console.error('Stripe webhook could not match a taai user', event.type);
      return new Response(JSON.stringify({ received: true, matched: false }), { status: 200 });
    }

    const resolved = await resolveSubscription(stripe, admin, {
      userId,
      email,
      previousTier,
      stripeCustomerId: customerId,
    });

    const invoice = event.type.startsWith('invoice.') ? event.data.object as Stripe.Invoice : null;
    const checkout = event.type === 'checkout.session.completed' ? event.data.object as Stripe.Checkout.Session : null;
    const previous = (event.data.previous_attributes ?? {}) as { cancel_at_period_end?: boolean; items?: unknown };
    const line = invoice?.lines?.data?.[0];
    const interval = line?.price?.recurring?.interval
      ?? (resolved.lookupKey?.includes('year') ? 'year' : resolved.lookupKey?.includes('month') ? 'month' : null);
    const priceChanged = Boolean(previous.items) || (!!storedPriceId && !!resolved.priceId && storedPriceId !== resolved.priceId);
    const { data: closure } = await admin.from('account_closures').select('reopened_at').eq('user_id', userId).maybeSingle();
    const decision = billingDecision({
      eventType: event.type,
      stripeStatus: checkout?.mode === 'subscription' && checkout.payment_status !== 'paid' && checkout.payment_status !== 'no_payment_required'
        ? 'incomplete'
        : resolved.status,
      cancelAtPeriodEnd: resolved.cancelAtPeriodEnd,
      previousCancelAtPeriodEnd: Object.prototype.hasOwnProperty.call(previous, 'cancel_at_period_end')
        ? previous.cancel_at_period_end === true
        : null,
      priceId: resolved.priceId,
      previousPriceId: priceChanged ? (storedPriceId ?? 'previous') : null,
      interval,
      billingReason: invoice?.billing_reason ?? null,
      accountClosed: !!closure && closure.reopened_at == null,
      subscriptionId: (typeof invoice?.subscription === 'string' ? invoice.subscription : null)
        ?? (typeof checkout?.subscription === 'string' ? checkout.subscription : null)
        ?? customerId,
      invoiceId: invoice?.id ?? null,
      checkoutPaid: checkout?.mode === 'subscription' && (checkout.payment_status === 'paid' || checkout.payment_status === 'no_payment_required'),
    });

    if (!decision.subscribed) {
      const free = limitsForTier('traveler');
      resolved.subscribed = false;
      resolved.tier = 'traveler';
      resolved.maxItineraries = free.maxItineraries;
      resolved.maxSharedFriends = free.maxSharedFriends;
      resolved.monthlyAiCredits = free.monthlyAiCredits;
      resolved.creditsRemaining = free.monthlyAiCredits < 0 ? -1 : Math.min(resolved.creditsRemaining, free.monthlyAiCredits);
      resolved.cancelAtPeriodEnd = false;
      if (decision.lockToFreePlan) resolved.subscriptionEnd = null;
    }
    resolved.paymentFailed = decision.paymentFailed;
    if (decision.subscribed) resolved.cancelAtPeriodEnd = decision.cancelAtPeriodEnd;

    const amountCents = invoice?.amount_paid || invoice?.amount_due || line?.amount || checkout?.amount_total || null;
    const plan = line?.description || resolved.productName || planDisplayName(previousTier);
    const summary = `${plan} · ${formatMoney(amountCents, invoice?.currency ?? 'usd')}`;
    await upsertSubscriber(admin, { id: userId, email }, resolved, {
      existingPaymentFailedAt: existingFailure?.payment_failed_at,
      existingPaymentRetryAt: existingFailure?.payment_retry_at,
      existingPaymentFailureSummary: existingFailure?.payment_failure_summary,
      paymentRetryAt: invoice?.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
      paymentFailureSummary: decision.paymentFailed ? summary : null,
    });

    if (decision.lockToFreePlan) {
      await admin.rpc('apply_free_itinerary_locks', { p_user_id: userId, p_keep: FREE_EDITABLE_ITINERARIES });
    } else if (decision.unlockAll) {
      await admin.rpc('apply_free_itinerary_locks', { p_user_id: userId, p_keep: -1 });
    }

    let portalUrl = `${APP_ORIGIN}/profile?tab=billing`;
    if (decision.emails.some((item) => item.kind === 'payment_failed')) {
      try {
        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: portalUrl,
        });
        portalUrl = portal.url;
      } catch (portalError) {
        console.error('Billing portal link failed', portalError instanceof Error ? portalError.message : 'error');
      }
    }

    const vars = {
      name: email,
      plan,
      new_plan: resolved.productName || plan,
      old_plan: planDisplayName(previousTier),
      amount: formatMoney(amountCents, invoice?.currency ?? checkout?.currency ?? 'usd'),
      interval: interval === 'year' ? 'year' : interval === 'month' ? 'month' : 'billing period',
      next_date: formatEmailDate(resolved.subscriptionEnd),
      retry_date: formatEmailDate(invoice?.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null, 'the next retry'),
      effective_date: formatEmailDate(new Date().toISOString()),
      end_date: formatEmailDate(resolved.subscriptionEnd ?? (decision.lockToFreePlan ? new Date().toISOString() : null)),
      portal_url: portalUrl,
    };
    for (const item of decision.emails) {
      const mailed = await sendLifecycleEmail(admin, { kind: item.kind, to: email, dedupeKey: item.dedupeKey, vars });
      if (!mailed.ok) {
        return new Response(JSON.stringify({ error: 'Lifecycle email failed', reason: mailed.error }), { status: 500 });
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Stripe webhook handler failed', error instanceof Error ? error.message : 'error');
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
});
