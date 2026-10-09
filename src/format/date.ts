/** Clubs without a time zone of their own use the backend's default. */
export const DEFAULT_TIME_ZONE = "Europe/Belgrade";

function format(iso: string, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(new Date(iso));
}

/** "Sat 10 Oct" in the club's time zone. */
export function formatDate(iso: string, locale: string, timeZone = DEFAULT_TIME_ZONE): string {
  return format(iso, locale, timeZone, { weekday: "short", day: "numeric", month: "short" });
}

/** "18:00" in the club's time zone. Times are always 24-hour, as on the design canvas. */
export function formatTime(iso: string, locale: string, timeZone = DEFAULT_TIME_ZONE): string {
  return format(iso, locale, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** "Sat 10 Oct, 18:00–19:00" for a booking. */
export function formatSlot(
  startsAt: string,
  endsAt: string,
  locale: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return `${formatDate(startsAt, locale, timeZone)}, ${formatTime(startsAt, locale, timeZone)}–${formatTime(endsAt, locale, timeZone)}`;
}

/** The calendar date ("2026-10-09") at `instant` in a time zone. */
export function localDate(instant: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "2026-10-09" plus `days` calendar days. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Thu 9" or "Thursday 9 October" for a calendar date, whatever the device's time zone. */
export function formatDay(date: string, locale: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: style,
    day: "numeric",
    ...(style === "long" ? { month: "long" } : {}),
  }).format(new Date(`${date}T12:00:00Z`));
}
