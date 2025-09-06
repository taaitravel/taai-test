// Stripe configuration for subscription tiers
export const STRIPE_PRICE_IDS = {
  traveler: {
    monthly: "free", 
    annual: "free"
  },
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
  },
  taai_enterprise_plus: {
    monthly: "enterprise",
    annual: "enterprise"
  }
} as const;

export type TierType = keyof typeof STRIPE_PRICE_IDS;
export type BillingFrequency = 'monthly' | 'annual';

// Generate external Stripe checkout URLs
export const getStripeCheckoutUrl = (tier: TierType, billing: BillingFrequency = 'monthly'): string => {
  if (tier === 'traveler' || tier === 'taai_enterprise_plus') return '';
  
  const priceId = STRIPE_PRICE_IDS[tier][billing];
  const baseUrl = 'https://buy.stripe.com';
  
  // Map price IDs to Stripe checkout URLs (these need to be replaced with actual URLs from your Stripe dashboard)
  const checkoutUrls: Record<string, string> = {
    [STRIPE_PRICE_IDS.taai_traveler.monthly]: `${baseUrl}/test_28o6qW144cKG0ak9AA`,
    [STRIPE_PRICE_IDS.taai_traveler.annual]: `${baseUrl}/test_28o6qW144cKG0ak9AB`,
    [STRIPE_PRICE_IDS.taai_traveler_plus.monthly]: `${baseUrl}/test_28o6qW144cKG0ak9AC`,
    [STRIPE_PRICE_IDS.taai_traveler_plus.annual]: `${baseUrl}/test_28o6qW144cKG0ak9AD`,
    [STRIPE_PRICE_IDS.corp_taai_traveler_plus.monthly]: `${baseUrl}/test_28o6qW144cKG0ak9AE`,
    [STRIPE_PRICE_IDS.corp_taai_traveler_plus.annual]: `${baseUrl}/test_28o6qW144cKG0ak9AF`,
  };
  
  return checkoutUrls[priceId] || '';
};

// Calculate annual savings percentage
export const getAnnualSavings = (tier: TierType): number => {
  if (tier === 'traveler' || tier === 'taai_enterprise_plus') return 0;
  
  const monthlyPrices = {
    taai_traveler: 7.99,
    taai_traveler_plus: 19.00,
    corp_taai_traveler_plus: 99.00
  };
  
  const annualPrices = {
    taai_traveler: 79.99,
    taai_traveler_plus: 192.00,
    corp_taai_traveler_plus: 999.00
  };
  
  const monthlyTotal = monthlyPrices[tier] * 12;
  const annualPrice = annualPrices[tier];
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  
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