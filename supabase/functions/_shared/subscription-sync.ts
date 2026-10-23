import Stripe from 'https://esm.sh/stripe@14.21.0';
import { limitsForTier, mapSubscriptionTier, type TierId, type TierSource } from './tier-map.ts';

type AdminClient = {
  from: (table: string) => any;
};

export interface ResolvedSubscription {
  subscribed: boolean;
  tier: TierId;
  source: TierSource;
  priceId: string | null;
  productId: string | null;
  lookupKey: string | null;
  customerId: string | null;
  subscriptionEnd: string | null;
  creditsRemaining: number;
  maxItineraries: number;
  maxSharedFriends: number;
  status: string | null;
}

const monthStart = () => {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
};

export const creditsUsedThisMonth = async (admin: AdminClient, userId: string): Promise<number> => {
  const { data } = await admin
    .from('usage_tracking')
    .select('credits_used')
    .eq('user_id', userId)
    .eq('usage_type', 'ai_turn')
    .gte('created_at', monthStart());
  return (data ?? []).reduce((sum: number, row: { credits_used?: number }) => sum + (row.credits_used || 0), 0);
};

const priceRecord = (price: Stripe.Price) => {
  const product = price.product && typeof price.product === 'object' ? price.product as Stripe.Product : null;
  return {
    priceMetadata: price.metadata,
    productMetadata: product && !('deleted' in product && product.deleted) ? product.metadata : null,
    lookupKey: price.lookup_key,
    unitAmount: price.unit_amount,
    productId: typeof price.product === 'string' ? price.product : product?.id ?? null,
  };
};

export const resolveSubscription = async (
  stripe: Stripe,
  admin: AdminClient,
  input: { userId: string; email: string; previousTier?: string | null; stripeCustomerId?: string | null },
): Promise<ResolvedSubscription> => {
  let customerId = input.stripeCustomerId || null;
  if (!customerId && input.email) {
    const customers = await stripe.customers.list({ email: input.email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }

  let subscribed = false;
  let price: Stripe.Price | null = null;
  let subscriptionEnd: string | null = null;
  let status: string | null = null;

  if (customerId) {
    const active = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    const trial = active.data[0]
      ? null
      : await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });
    const subscription = active.data[0] ?? trial?.data[0] ?? null;
    if (subscription) {
      subscribed = true;
      status = subscription.status;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const priceId = subscription.items.data[0]?.price?.id;
      if (priceId) price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    }
  }

  let tableTier: string | null = null;
  if (price?.id) {
    const { data } = await admin.from('stripe_price_tiers').select('tier').eq('price_id', price.id).maybeSingle();
    tableTier = data?.tier ?? null;
  }

  const details = price ? priceRecord(price) : { priceMetadata: null, productMetadata: null, lookupKey: null, unitAmount: null, productId: null };
  const mapped = mapSubscriptionTier({
    ...details,
    tableTier,
    previousTier: input.previousTier,
    subscribed,
  });
  const limits = limitsForTier(mapped.tier);
  const used = input.userId ? await creditsUsedThisMonth(admin, input.userId) : 0;
  const creditsRemaining = limits.monthlyAiCredits < 0
    ? -1
    : Math.max(limits.monthlyAiCredits - used, 0);

  if (price?.id && mapped.source !== 'unmapped_paid' && mapped.source !== 'free' && mapped.source !== 'previous_tier') {
    await admin.from('stripe_price_tiers').upsert({
      price_id: price.id,
      product_id: details.productId,
      lookup_key: details.lookupKey,
      tier: mapped.tier,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'price_id' });
  }

  return {
    subscribed,
    tier: mapped.tier,
    source: mapped.source,
    priceId: price?.id ?? null,
    productId: details.productId,
    lookupKey: details.lookupKey,
    customerId,
    subscriptionEnd,
    creditsRemaining,
    maxItineraries: limits.maxItineraries,
    maxSharedFriends: limits.maxSharedFriends,
    status,
  };
};

export const upsertSubscriber = async (
  admin: AdminClient,
  user: { id: string; email: string },
  resolved: ResolvedSubscription,
) => {
  await admin.from('subscribers').upsert({
    email: user.email,
    user_id: user.id,
    stripe_customer_id: resolved.customerId,
    subscribed: resolved.subscribed,
    subscription_tier: resolved.tier,
    subscription_end: resolved.subscriptionEnd,
    credits_remaining: resolved.creditsRemaining,
    max_itineraries: resolved.maxItineraries,
    max_shared_friends: resolved.maxSharedFriends,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });
};
