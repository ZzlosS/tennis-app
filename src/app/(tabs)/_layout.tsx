import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/auth";
import { useTheme } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    // Ionicons takes a string colour; the tab bar passes the strings set in screenOptions.
    return <Ionicons name={name} color={String(color)} size={size} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isClubAdmin } = useAuth();
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
      <Tabs.Screen name="explore" options={{ title: t("tabs.explore"), tabBarIcon: icon("search") }} />
      <Tabs.Screen
        name="bookings"
        options={{ title: t("tabs.bookings"), tabBarIcon: icon("calendar-outline") }}
      />
      <Tabs.Screen
        name="partners"
        options={{ title: t("tabs.partners"), tabBarIcon: icon("people-outline") }}
      />
      {/* Club admin screens exist only for club admins and admins. */}
      <Tabs.Protected guard={isClubAdmin}>
        <Tabs.Screen
          name="club-admin"
          options={{ title: t("tabs.clubAdmin"), tabBarIcon: icon("business-outline") }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile"), tabBarIcon: icon("person-circle-outline") }}
      />
    </Tabs>
  );
}
