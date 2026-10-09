import { useTranslation } from "react-i18next";

import { EmptyState, Screen, Text } from "@/ui";

// Filled in by the Phase 5 slices.
export default function Explore() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <Text variant="h1">{t("tabs.explore")}</Text>
      <EmptyState title={t("common.comingSoon")} message={t("placeholder.explore")} />
    </Screen>
  );
}
