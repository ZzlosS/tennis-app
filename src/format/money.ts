import type { Money } from "@/api";

// ISO 4217 currencies without a minor unit. Everything else the API sends has two decimals
// (180000 RSD in minor units is 1,800.00 RSD).
const ZERO_DECIMAL = new Set(["JPY", "KRW", "ISK", "CLP", "VND", "PYG", "UGX", "XAF", "XOF"]);

export function minorUnits(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * "1.800 RSD" or "€25.50". Returns null for a free court (no price), so the caller can say "Free".
 * Whole amounts drop the decimals.
 */
export function formatMoney(price: Money | null | undefined, locale: string): string | null {
  if (!price) return null;
  const digits = minorUnits(price.currency);
  const amount = price.amountMinor / 10 ** digits;
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
    currencyDisplay: "code",
    minimumFractionDigits: whole ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
