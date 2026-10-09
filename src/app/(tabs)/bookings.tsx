import { useTranslation } from "react-i18next";

import { EmptyState, Screen, Text } from "@/ui";

// Filled in by the Phase 5 slices.
export default function Bookings() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <Text variant="h1">{t("tabs.bookings")}</Text>
      <EmptyState title={t("common.comingSoon")} message={t("placeholder.bookings")} />
    </Screen>
  );
}
