import { useTranslation } from "react-i18next";

import type { CourtResponse } from "@/api";

/** "Clay · Covered · Doubles", the one-line description under a court's name. */
export function useCourtMeta() {
  const { t } = useTranslation();
  return (court: Pick<CourtResponse, "surface" | "roof" | "double">) =>
    [
      t(`surface.${court.surface}`),
      court.roof ? t("court.covered") : t("court.outdoor"),
      ...(court.double ? [t("court.doubles")] : []),
    ].join(" · ");
}

/** Owners edit their own public and private courts; admins can edit any. */
export function canManageCourt(
  court: Pick<CourtResponse, "ownerId" | "kind">,
  me: { id: string; role: string } | undefined,
) {
  if (!me) return false;
  return me.role === "ADMIN" || (court.kind !== "CLUB" && court.ownerId === me.id);
}
