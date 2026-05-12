import { useSubscription } from "@/hooks/useSubscription";
import {
  getCombinedRate,
  formatRatePercent,
  computeBookingTotals,
  type BookingTotals,
} from "@/lib/bookingFees";

/**
 * Resolves the user's combined "Taxes & Fees" rate from their active
 * subscription tier. Falls back to the free `traveler` rate when not loaded.
 *
 * Display rule: only the combined rate / amount is exposed. Never render the
 * sales-tax vs TAAI-fee split — that lives in the receipt only.
 */
export function useTaxesAndFeesRate() {
  const { subscriptionData } = useSubscription();
  const tier = subscriptionData?.subscription_tier ?? "traveler";
  const combinedRate = getCombinedRate(tier);

  return {
    tier,
    combinedRate,
    label: `Taxes & Fees (${formatRatePercent(combinedRate)})`,
    compute: (subtotal: number): BookingTotals =>
      computeBookingTotals({ subtotal, tier }),
  };
}
