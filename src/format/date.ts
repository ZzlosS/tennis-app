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
