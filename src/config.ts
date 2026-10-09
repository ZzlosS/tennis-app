import Constants from "expo-constants";

export type AppEnv = "development" | "preview" | "production";

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with their full literal name.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
const appEnv = ((Constants.expoConfig?.extra?.appEnv as AppEnv | undefined) ?? "development") as AppEnv;

if (!apiUrl && appEnv === "development" && process.env.NODE_ENV !== "test") {
  console.warn("EXPO_PUBLIC_API_URL is not set. Copy example.env to .env.local and set it.");
}

export const config = {
  appEnv,
  // No trailing slash, so paths can be appended as "/me".
  apiUrl: apiUrl.replace(/\/+$/, ""),
  sentryDsn,
  isDev: appEnv === "development",
} as const;
