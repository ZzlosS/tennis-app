import { Stack } from "expo-router";

import { useTheme } from "@/theme";

// One club's admin screens: its tabs, plus adding and editing a court on top of them.
export default function ClubLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="court/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="court/[courtId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
