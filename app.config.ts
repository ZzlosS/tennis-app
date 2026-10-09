import type { ConfigContext, ExpoConfig } from "expo/config";

// Which backend the app talks to. EAS build profiles set APP_ENV; locally it defaults to development.
type AppEnv = "development" | "preview" | "production";
const APP_ENV = (process.env.APP_ENV ?? "development") as AppEnv;

const sentryPlugin: [string, Record<string, string>][] =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? [
        [
          "@sentry/react-native/expo",
          { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT },
        ],
      ]
    : [];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_ENV === "production" ? "Rally" : `Rally (${APP_ENV})`,
  slug: "tennis-app",
  scheme: "rally",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.zzloss.tennis",
    supportsTablet: true,
  },
  android: {
    package: "com.zzloss.tennis",
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-localization",
    [
      "expo-splash-screen",
      { image: "./assets/splash-icon.png", imageWidth: 160, backgroundColor: "#FFFFFF" },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Rally shows the tennis courts near you.",
      },
    ],
    ["expo-notifications", { color: "#0B7A4F" }],
    // iOS uses Apple Maps and needs no key; Android needs a Google Maps key for release builds.
    [
      "react-native-maps",
      process.env.GOOGLE_MAPS_ANDROID_API_KEY
        ? { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }
        : {},
    ],
    ...sentryPlugin,
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
});
