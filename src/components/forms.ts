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
