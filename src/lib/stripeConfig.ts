import { DISPLAY_PLAN_PRICES } from '@/lib/plans/display-prices';

/**
 * Legacy price id notes. Not used for checkout or for tier mapping.
 * Card copy is $7.99 / $79.99, $19 / $183, and $99 / $999.
 * The $183 yearly taaiTraveler+ figure matches Stripe. These ids are not changed.
 */
export const STRIPE_PRICE_IDS = {
  traveler: {
    monthly: "free",
    annual: "free"
  },
  taai_traveler: {
    monthly: "price_1QnqYlP0pUOcQcULV8VsVVfP",
    annual: "price_1QnqZKP0pUOcQcULqtXgYPXk"
  },
  taai_traveler_plus: {
    monthly: "price_1QnqZlP0pUOcQcULOdKfTKhG",
    annual: "price_1Qnqa9P0pUOcQcULM3XfNf3L"
  },
  corp_taai_traveler_plus: {
    monthly: "price_1QnqaXP0pUOcQcUL8VNhQmxD",
    annual: "price_1QnqauP0pUOcQcULRtWxNQzY"
  },
  taai_enterprise_plus: {
    monthly: "enterprise",
    annual: "enterprise"
  }
} as const;

export type TierType = keyof typeof STRIPE_PRICE_IDS;
export type BillingFrequency = 'monthly' | 'annual';

// Calculate annual savings percentage using the published plan prices.
export const getAnnualSavings = (tier: TierType, monthlyPrice?: number, annualPrice?: number): number => {
  if (tier === 'traveler' || tier === 'taai_enterprise_plus') return 0;
  
  // Use provided prices or fallback to hardcoded values
  const monthlyPrices = {
    taai_traveler: monthlyPrice || 7.99,
    taai_traveler_plus: monthlyPrice || 19.00,
    corp_taai_traveler_plus: monthlyPrice || 99.00
  };
  
  const annualPrices = {
    taai_traveler: annualPrice || 79.99,
    taai_traveler_plus: annualPrice || DISPLAY_PLAN_PRICES.taai_traveler_plus.annual,
    corp_taai_traveler_plus: annualPrice || 999.00
  };
  
  const monthlyTotal = monthlyPrices[tier] * 12;
  const yearlyPrice = annualPrices[tier];
  const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  
  return Math.round(savings);
};

// Tier definitions
export interface TierData {
  id: TierType;
  name: string;
  monthlyPrice: number;
  annualPrice?: number;
  priceText: {
    monthly: string;
    annual?: string;
  };
  taxNote?: string;
  description: string;
  icon: React.ReactElement;
  features: string[];
  isPaid: boolean;
  isPopular: boolean;
  isInquiryOnly?: boolean;
}