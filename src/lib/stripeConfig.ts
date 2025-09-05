// Stripe Price ID configuration for subscription tiers
export const STRIPE_PRICE_IDS = {
  taai_traveler: {
    monthly: "price_1QnqYlP0pUOcQcULV8VsVVfP", // $7.99/month
    annual: "price_1QnqZKP0pUOcQcULqtXgYPXk"   // $79.99/year
  },
  taai_traveler_plus: {
    monthly: "price_1QnqZlP0pUOcQcULOdKfTKhG", // $19.00/month  
    annual: "price_1Qnqa9P0pUOcQcULM3XfNf3L"   // $199.00/year
  },
  corp_taai_traveler_plus: {
    monthly: "price_1QnqaXP0pUOcQcUL8VNhQmxD", // $99.00/month
    annual: "price_1QnqauP0pUOcQcULRtWxNQzY"   // $999.00/year
  }
} as const;

export type TierType = keyof typeof STRIPE_PRICE_IDS;
export type BillingFrequency = 'monthly' | 'annual';

// Calculate annual savings percentage
export const getAnnualSavings = (tier: TierType): number => {
  const monthlyPrices = {
    taai_traveler: 7.99,
    taai_traveler_plus: 19.00,
    corp_taai_traveler_plus: 99.00
  };
  
  const annualPrices = {
    taai_traveler: 79.99,
    taai_traveler_plus: 199.00,
    corp_taai_traveler_plus: 999.00
  };
  
  const monthlyTotal = monthlyPrices[tier] * 12;
  const annualPrice = annualPrices[tier];
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  
  return Math.round(savings);
};