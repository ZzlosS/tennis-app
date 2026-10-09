import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme";
import type { IconName } from "@/ui";

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    // Ionicons takes a string colour; the tab bar passes the strings set in screenOptions.
    return <Ionicons name={name} color={String(color)} size={size} />;
  };
}

export default function TabsLayout() {
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
      <Tabs.Screen name="home" options={{ title: t("tabs.home"), tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="explore" options={{ title: t("tabs.explore"), tabBarIcon: icon("search") }} />
      <Tabs.Screen
        name="reservations"
        options={{ title: t("tabs.reservations"), tabBarIcon: icon("calendar-outline") }}
      />
      <Tabs.Screen
        name="partners"
        options={{ title: t("tabs.partners"), tabBarIcon: icon("people-outline") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile"), tabBarIcon: icon("person-circle-outline") }}
      />
    </Tabs>
  );
}
