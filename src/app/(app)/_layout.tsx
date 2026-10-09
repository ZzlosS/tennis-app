import { Stack } from "expo-router";

import { useTheme } from "@/theme";

// Forms open as modals: a card on phones, a full page on web.
const MODALS = new Set([
  "courts/new",
  "courts/[id]/edit",
  "courts/[id]/handover",
  "profile/edit",
  "profile/password",
  "profile/delete-account",
  "partners/new",
  "matches/new",
]);

// Everything a signed-in player sees: the tabs, plus detail screens and forms pushed on top of them.
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        presentation: MODALS.has(route.name) ? "modal" : "card",
      })}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
