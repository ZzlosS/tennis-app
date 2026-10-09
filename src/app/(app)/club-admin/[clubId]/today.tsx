import { useTranslation } from "react-i18next";

import { EmptyState, Screen, ScreenHeader } from "@/ui";

// Filled in by the club admin step.
export default function ClubToday() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <ScreenHeader title={t("common.comingSoon")} />
      <EmptyState title={t("common.comingSoon")} />
    </Screen>
  );
}
