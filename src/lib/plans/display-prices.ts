/**
 * Amounts shown on plan cards. Checkout still sends a tier id to Stripe and
 * does not charge these numbers. taaiTraveler+ yearly matches the live Stripe
 * price of $183. Price ids are not stored here.
 */
export const DISPLAY_PLAN_PRICES = {
  taai_traveler: { monthly: 7.99, annual: 79.99 },
  taai_traveler_plus: { monthly: 19.0, annual: 183 },
  corp_taai_traveler_plus: { monthly: 99.0, annual: 999 },
} as const;

export type DisplayPlanId = keyof typeof DISPLAY_PLAN_PRICES;
