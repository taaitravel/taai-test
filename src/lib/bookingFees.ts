/**
 * Booking fee math. Single source of truth.
 *
 * Display rule: cart, search, and checkout surfaces must only show the combined
 * `taxesAndFees` value. The split between sales tax and the TAAI fee is for
 * receipts / invoices / accounting only — never expose it in the UI.
 */

export const SALES_TAX_RATE = 0.07; // federal/state combined sales tax shown to user

export type FeeTier =
  | "traveler"
  | "taai_traveler"
  | "taai_traveler_plus"
  | "corp_taai_traveler_plus"
  | "taai_enterprise_plus";

/** Internal — TAAI admin fee per subscription tier. */
export function getTaaiFeeRate(tier?: string | null): number {
  switch (tier) {
    case "taai_traveler":
      return 0.007;
    case "taai_traveler_plus":
    case "corp_taai_traveler_plus":
    case "taai_enterprise_plus":
      return 0.0035;
    case "traveler":
    default:
      return 0.01;
  }
}

/** Combined "Taxes & Fees" rate shown to the user. */
export function getCombinedRate(tier?: string | null): number {
  return SALES_TAX_RATE + getTaaiFeeRate(tier);
}

/** Format a rate as a percentage string trimmed of trailing zeros (e.g. 7.35%). */
export function formatRatePercent(rate: number): string {
  const pct = rate * 100;
  // Show up to 2 decimals, drop trailing zeros, drop trailing dot.
  return `${pct.toFixed(2).replace(/\.?0+$/, "")}%`;
}

export interface BookingTotals {
  subtotal: number;
  taxesAndFees: number;
  total: number;
  /** Internal — for receipts / ledger only. Do not render in UI. */
  _breakdown: {
    salesTax: number;
    taaiFee: number;
    salesTaxRate: number;
    taaiFeeRate: number;
    combinedRate: number;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeBookingTotals(params: {
  subtotal: number;
  tier?: string | null;
}): BookingTotals {
  const subtotal = round2(params.subtotal);
  const salesTaxRate = SALES_TAX_RATE;
  const taaiFeeRate = getTaaiFeeRate(params.tier);
  const combinedRate = salesTaxRate + taaiFeeRate;

  const salesTax = round2(subtotal * salesTaxRate);
  const taaiFee = round2(subtotal * taaiFeeRate);
  const taxesAndFees = round2(salesTax + taaiFee);
  const total = round2(subtotal + taxesAndFees);

  return {
    subtotal,
    taxesAndFees,
    total,
    _breakdown: { salesTax, taaiFee, salesTaxRate, taaiFeeRate, combinedRate },
  };
}
