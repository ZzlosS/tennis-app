import { isApiError } from "@/api";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string) => EMAIL.test(value.trim());

/** Field names the API flagged in a VALIDATION_FAILED answer. */
export function serverFields(error: unknown): string[] {
  return isApiError(error) && error.fields ? Object.keys(error.fields) : [];
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/** "12,50" or "1800" to minor units (1250, 180000); undefined when it is not a price. */
export function toMinor(text: string, digits: number): number | undefined {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined;
  const value = Math.round(Number(normalized) * 10 ** digits);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Minor units back to text for an input ("1800", "12.5"). */
export function fromMinor(amountMinor: number, digits: number): string {
  return String(amountMinor / 10 ** digits);
}
