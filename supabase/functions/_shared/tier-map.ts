/**
 * Subscription tier mapping.
 *
 * Paid tiers come from Stripe product/price metadata, a lookup key, or the
 * stripe_price_tiers table. Published list prices are only a last resort when
 * a subscription is active and nothing else identifies the tier. Dead
 * hard-coded price IDs are not used.
 */

export const TIER_IDS = [
  'traveler',
  'taai_traveler',
  'taai_traveler_plus',
  'corp_taai_traveler_plus',
  'taai_enterprise_plus',
] as const;

export type TierId = (typeof TIER_IDS)[number];

/** Published plan limits. -1 means unlimited. Free is 3 trips, as published. */
export const PUBLISHED_LIMITS: Record<TierId, {
  maxItineraries: number;
  maxSharedFriends: number;
  monthlyAiCredits: number;
}> = {
  traveler: { maxItineraries: 3, maxSharedFriends: 10, monthlyAiCredits: 5 },
  taai_traveler: { maxItineraries: 20, maxSharedFriends: 20, monthlyAiCredits: 50 },
  taai_traveler_plus: { maxItineraries: -1, maxSharedFriends: -1, monthlyAiCredits: 100 },
  corp_taai_traveler_plus: { maxItineraries: 100, maxSharedFriends: 50, monthlyAiCredits: 200 },
  taai_enterprise_plus: { maxItineraries: -1, maxSharedFriends: -1, monthlyAiCredits: -1 },
};

/**
 * Published Stripe amounts in cents. Used only when metadata, lookup key, and
 * the price table are all empty. Amounts that are not unique are omitted.
 */
export const PUBLISHED_AMOUNT_CENTS: Record<number, TierId> = {
  799: 'taai_traveler',
  7999: 'taai_traveler',
  1900: 'taai_traveler_plus',
  // Yearly taaiTraveler+ amount fallback is $183. This map is not a Stripe price.
  18300: 'taai_traveler_plus',
  9900: 'corp_taai_traveler_plus',
  99900: 'corp_taai_traveler_plus',
};

const ALIASES: Record<string, TierId> = {
  traveler: 'traveler',
  free: 'traveler',
  taai_traveler: 'taai_traveler',
  taaitraveler: 'taai_traveler',
  taai_traveler_plus: 'taai_traveler_plus',
  taaitraveler_plus: 'taai_traveler_plus',
  taaitravelerplus: 'taai_traveler_plus',
  corp_taai_traveler_plus: 'corp_taai_traveler_plus',
  corp_taaitraveler_plus: 'corp_taai_traveler_plus',
  corporate: 'corp_taai_traveler_plus',
  taai_enterprise_plus: 'taai_enterprise_plus',
  taaienterprise_plus: 'taai_enterprise_plus',
  enterprise: 'taai_enterprise_plus',
};

export const normalizeTier = (value: unknown): TierId | null => {
  if (typeof value !== 'string') return null;
  const key = value
    .trim()
    .toLowerCase()
    .replace(/\+/g, '_plus')
    .replace(/[\s.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!key) return null;
  if (ALIASES[key]) return ALIASES[key];
  if (key.startsWith('corp_') || key.startsWith('corp_taai_traveler_plus')) return 'corp_taai_traveler_plus';
  if (key.startsWith('taai_enterprise')) return 'taai_enterprise_plus';
  if (key.startsWith('taai_traveler_plus') || key.startsWith('taaitraveler_plus')) return 'taai_traveler_plus';
  if (key.startsWith('taai_traveler') || key.startsWith('taaitraveler')) return 'taai_traveler';
  return null;
};

export type TierSource =
  | 'price.metadata.tier'
  | 'product.metadata.tier'
  | 'price.lookup_key'
  | 'stripe_price_tiers'
  | 'published_amount'
  | 'previous_tier'
  | 'free'
  | 'unmapped_paid';

export const mapSubscriptionTier = (input: {
  priceMetadata?: Record<string, string | null | undefined> | null;
  productMetadata?: Record<string, string | null | undefined> | null;
  lookupKey?: string | null;
  tableTier?: string | null;
  unitAmount?: number | null;
  previousTier?: string | null;
  subscribed: boolean;
}): { tier: TierId; source: TierSource } => {
  const fromPrice = normalizeTier(input.priceMetadata?.tier);
  if (fromPrice) return { tier: fromPrice, source: 'price.metadata.tier' };
  const fromProduct = normalizeTier(input.productMetadata?.tier);
  if (fromProduct) return { tier: fromProduct, source: 'product.metadata.tier' };
  const fromLookup = normalizeTier(input.lookupKey);
  if (fromLookup) return { tier: fromLookup, source: 'price.lookup_key' };
  const fromTable = normalizeTier(input.tableTier);
  if (fromTable) return { tier: fromTable, source: 'stripe_price_tiers' };
  if (input.subscribed && input.unitAmount != null && PUBLISHED_AMOUNT_CENTS[input.unitAmount]) {
    return { tier: PUBLISHED_AMOUNT_CENTS[input.unitAmount], source: 'published_amount' };
  }
  if (input.subscribed) {
    const previous = normalizeTier(input.previousTier);
    if (previous && previous !== 'traveler') return { tier: previous, source: 'previous_tier' };
    return { tier: 'traveler', source: 'unmapped_paid' };
  }
  return { tier: 'traveler', source: 'free' };
};

export const limitsForTier = (tier: string | null | undefined) =>
  PUBLISHED_LIMITS[normalizeTier(tier) ?? 'traveler'];
