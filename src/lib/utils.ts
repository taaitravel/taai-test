import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Locale-aware currency formatter. Uses Intl.NumberFormat so EUR renders with
 * "10.116,25 EUR" style and USD as "$1,435.21 USD" depending on locale.
 * Falls back gracefully when given an unknown currency.
 */
const localeForCurrency: Record<string, string> = {
  USD: "en-US",
  CAD: "en-CA",
  GBP: "en-GB",
  EUR: "de-DE",
  JPY: "ja-JP",
  AUD: "en-AU",
};

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = "USD",
  opts: { compact?: boolean; showCode?: boolean } = {},
): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const code = (currency || "USD").toUpperCase();
  const locale = localeForCurrency[code] || "en-US";
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      notation: opts.compact ? "compact" : "standard",
      minimumFractionDigits: code === "JPY" ? 0 : 2,
      maximumFractionDigits: code === "JPY" ? 0 : 2,
    }).format(safe);
    return opts.showCode ? `${formatted} ${code}` : formatted;
  } catch {
    return `${safe.toFixed(2)} ${code}`;
  }
}
