import { Redirect, Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/auth";
import { useTheme } from "@/theme";
import { LoadingState } from "@/ui";

// Club admin screens exist only for club admins and admins; anyone else is sent to their profile.
// The API checks each club again, so this only keeps players out of screens they cannot use.
export default function ClubAdminLayout() {
  const { t } = useTranslation();
  const { me, isClubAdmin } = useAuth();
  const { colors } = useTheme();
  if (!me) return <LoadingState label={t("common.loading")} />;
  if (!isClubAdmin) return <Redirect href="/profile" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}
