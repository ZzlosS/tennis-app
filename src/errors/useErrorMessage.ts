import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { isApiError } from "@/api";

/**
 * Turns any error into text for the screen, in the current language. API errors are translated by
 * their code; anything else falls back to the INTERNAL text. Never shows the backend's English message.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => (isApiError(error) ? t(`errors.${error.code}`) : t("errors.INTERNAL")),
    [t],
  );
}
