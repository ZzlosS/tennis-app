import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerDevice, unregisterDevice } from "@/api";
import { readSetting, writeSetting } from "@/settings";

const TOKEN_KEY = "pushToken";
const ASKED_KEY = "pushAsked";

/** The Expo project id from app.config.ts (EAS_PROJECT_ID). Push needs it; without it the app skips push. */
function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Push works on a real phone with a project id; web, simulators and builds without the id skip it. */
export function pushSupported(): boolean {
  return Platform.OS !== "web" && Device.isDevice && projectId() != null;
}

/** Sends this phone's push token to the API, if the player already allowed notifications. */
export async function registerIfAllowed(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    await registerDevice({ token });
    await writeSetting(TOKEN_KEY, token);
  } catch {
    // No token (offline, no Play Services): the app works without push.
  }
}

/** Asks for permission once, after the player's first booking rather than at launch. */
export async function askForPushAfterBooking(): Promise<void> {
  if (!pushSupported()) return;
  if (await readSetting<boolean>(ASKED_KEY)) return;
  await writeSetting(ASKED_KEY, true);
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== "granted" && current.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    return;
  }
  await registerIfAllowed();
}

/** Stops pushes to this phone; called on sign-out while the session still works. */
export async function forgetPushToken(): Promise<void> {
  const token = await readSetting<string>(TOKEN_KEY);
  if (!token) return;
  await unregisterDevice({ token }).catch(() => {});
  await writeSetting(TOKEN_KEY, null);
}
