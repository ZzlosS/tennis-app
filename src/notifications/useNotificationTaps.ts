import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useInvalidate } from "@/api";
import { registerIfAllowed } from "./push";
import { routeFor } from "./routes";

if (Platform.OS !== "web") {
  // A push that arrives while the app is open still shows as a banner.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** For signed-in screens: keeps the token fresh, opens the right screen on a tap, refreshes the inbox. */
export function useNotificationTaps() {
  const invalidate = useInvalidate();
  useEffect(() => {
    if (Platform.OS === "web") return;
    void registerIfAllowed();
    const open = (response: Notifications.NotificationResponse | null) => {
      const href = routeFor(response?.notification.request.content.data);
      if (href) router.push(href);
    };
    void Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    const received = Notifications.addNotificationReceivedListener(() => void invalidate("notifications"));
    return () => {
      tapped.remove();
      received.remove();
    };
  }, [invalidate]);
}
