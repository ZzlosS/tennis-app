import * as Sentry from "@sentry/react-native";

import { config } from "@/config";

// Crash reporting. Off unless EXPO_PUBLIC_SENTRY_DSN is set. Never sends tokens, emails or bodies.

let started = false;

type SentryEvent = Parameters<NonNullable<Sentry.ReactNativeOptions["beforeSend"]>>[0];
type Breadcrumb = Parameters<NonNullable<Sentry.ReactNativeOptions["beforeBreadcrumb"]>>[0];

export function scrubEvent<T extends SentryEvent>(event: T): T {
  if (event.user) event.user = { id: event.user.id };
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    for (const key of Object.keys(headers)) {
      if (/authorization|cookie/i.test(key)) delete headers[key];
    }
    event.request.headers = headers;
  }
  if (event.request) delete event.request.data;
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
    const data = breadcrumb.data ?? {};
    breadcrumb.data = { method: data.method, url: data.url, status_code: data.status_code };
  }
  return breadcrumb;
}

/** Starts Sentry when a DSN is configured. Returns whether it started. */
export function startCrashReporting(dsn: string = config.sentryDsn): boolean {
  if (!dsn || started) return started;
  Sentry.init({
    dsn,
    environment: config.appEnv,
    sendDefaultPii: false,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  });
  started = true;
  return true;
}

export function reportError(error: unknown): void {
  if (started) Sentry.captureException(error);
}

/** The signed-in player's id only, so crashes can be grouped per player without personal data. */
export function setReportedUser(id: string | null): void {
  if (started) Sentry.setUser(id ? { id } : null);
}
