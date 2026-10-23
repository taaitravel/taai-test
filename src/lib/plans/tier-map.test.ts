import { describe, expect, it } from 'vitest';
import { mapSubscriptionTier, normalizeTier } from '../../../supabase/functions/_shared/tier-map';

describe('subscription tier mapping', () => {
  it('does not treat a hard-coded legacy price id as a tier', () => {
    const mapped = mapSubscriptionTier({
      lookupKey: 'price_1QnqYlP0pUOcQcULV8VsVVfP',
      subscribed: true,
      unitAmount: null,
    });
    expect(mapped).toEqual({ tier: 'traveler', source: 'unmapped_paid' });
  });

  it('prefers price metadata, then product metadata, then lookup key, then the price table', () => {
    expect(mapSubscriptionTier({
      priceMetadata: { tier: 'taai_traveler' },
      productMetadata: { tier: 'taai_traveler_plus' },
      subscribed: true,
    })).toEqual({ tier: 'taai_traveler', source: 'price.metadata.tier' });

    expect(mapSubscriptionTier({
      productMetadata: { tier: 'taaiTraveler+' },
      subscribed: true,
    })).toEqual({ tier: 'taai_traveler_plus', source: 'product.metadata.tier' });

    expect(mapSubscriptionTier({
      lookupKey: 'corp_taai_traveler_plus_monthly',
      subscribed: true,
    })).toEqual({ tier: 'corp_taai_traveler_plus', source: 'price.lookup_key' });

    expect(mapSubscriptionTier({
      tableTier: 'taai_enterprise_plus',
      subscribed: true,
    })).toEqual({ tier: 'taai_enterprise_plus', source: 'stripe_price_tiers' });
  });

  it('uses a published amount only when nothing else identifies an active subscription', () => {
    expect(mapSubscriptionTier({ subscribed: true, unitAmount: 1900 })).toEqual({
      tier: 'taai_traveler_plus',
      source: 'published_amount',
    });
    expect(mapSubscriptionTier({ subscribed: false, unitAmount: 1900 })).toEqual({
      tier: 'traveler',
      source: 'free',
    });
  });

  it('keeps a previously stored paid tier when Stripe metadata is missing', () => {
    expect(mapSubscriptionTier({
      subscribed: true,
      previousTier: 'taai_traveler',
    })).toEqual({ tier: 'taai_traveler', source: 'previous_tier' });
    expect(normalizeTier('Corp. taaiTraveler+')).toBe('corp_taai_traveler_plus');
  });
});
