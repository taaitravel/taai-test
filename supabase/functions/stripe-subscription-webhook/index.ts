import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { guardOrigin } from "../_shared/edge-guard.ts";
import { resolveSubscription, upsertSubscriber } from "../_shared/subscription-sync.ts";

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
    if (userId) {
      const { data } = await admin.from('subscribers').select('subscription_tier').eq('user_id', userId).maybeSingle();
      previousTier = data?.subscription_tier ?? null;
    } else {
      const { data } = await admin.from('subscribers').select('user_id, subscription_tier, email').eq('stripe_customer_id', customerId).maybeSingle();
      userId = data?.user_id ?? null;
      previousTier = data?.subscription_tier ?? null;
    }
    if (!userId && email) {
      const { data } = await admin.from('subscribers').select('user_id, subscription_tier').eq('email', email).maybeSingle();
      userId = data?.user_id ?? null;
      previousTier = previousTier ?? data?.subscription_tier ?? null;
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
    if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const failed = event.type === 'invoice.payment_failed';
      resolved.subscribed = failed ? resolved.subscribed : false;
      if (!resolved.subscribed) {
        resolved.tier = 'traveler';
        resolved.subscriptionEnd = null;
      }
    }
    await upsertSubscriber(admin, { id: userId, email }, resolved);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Stripe webhook handler failed', error instanceof Error ? error.message : 'error');
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
});
