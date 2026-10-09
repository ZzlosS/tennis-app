import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme";
import type { IconName } from "@/ui";

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={String(color)} size={size} />;
  };
}

/** Reservations, Courts and Settings for one club, as on the canvas's club admin screens. */
export default function ClubTabs() {
  const { t } = useTranslation();
  const { colors, fonts } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.medium },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: t("clubAdmin.reservations"), tabBarIcon: icon("calendar-outline") }}
      />
      <Tabs.Screen
        name="courts"
        options={{ title: t("clubAdmin.courts"), tabBarIcon: icon("grid-outline") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("clubAdmin.settings"), tabBarIcon: icon("settings-outline") }}
      />
    </Tabs>
  );
}
