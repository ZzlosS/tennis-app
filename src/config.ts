import Constants from "expo-constants";
import { Platform } from "react-native";

export type AppEnv = "development" | "preview" | "production";

/** The API's port on a developer's computer, used when EXPO_PUBLIC_API_URL is "auto". */
const LOCAL_API_PORT = 8787;

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with their full literal name.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
const appEnv = ((Constants.expoConfig?.extra?.appEnv as AppEnv | undefined) ?? "development") as AppEnv;

/**
 * Turns EXPO_PUBLIC_API_URL into the address the app calls, with no trailing slash.
 * "auto" means "the computer Metro serves the app from, on port 8787". That is the computer's
 * LAN address on a phone and an emulator, and the page's host on web, so one .env.local works everywhere.
 * `devHost` is that computer's host name (from Metro's hostUri or the web page) or undefined when unknown.
 */
export function resolveApiUrl(raw: string, devHost: string | undefined): string {
  const value = raw.trim();
  if (value.toLowerCase() === "auto") {
    if (!devHost) return "";
    const host = devHost.includes(":") && !devHost.startsWith("[") ? `[${devHost}]` : devHost;
    return `http://${host}:${LOCAL_API_PORT}/v1`;
  }
  return value.replace(/\/+$/, "");
}

/** Host name of the computer running Metro, or of the web page; undefined in a store build. */
function devServerHost(): string | undefined {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.location.hostname || undefined : undefined;
  }
  // hostUri is "192.168.1.23:8081" while Metro serves the app (Expo Go or a dev build).
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;
  return hostUri.replace(/:\d+$/, "") || undefined;
}

const apiUrl = resolveApiUrl(
  rawApiUrl,
  rawApiUrl.trim().toLowerCase() === "auto" ? devServerHost() : undefined,
);

if (!apiUrl && appEnv === "development" && process.env.NODE_ENV !== "test") {
  console.warn(
    rawApiUrl
      ? 'EXPO_PUBLIC_API_URL is "auto" but the dev server address is unknown. Set the API URL in .env.local.'
      : "EXPO_PUBLIC_API_URL is not set. Copy example.env to .env.local and set it.",
  );
}

export const config = {
  appEnv,
  // No trailing slash, so paths can be appended as "/me".
  apiUrl,
  sentryDsn,
  isDev: appEnv === "development",
} as const;
