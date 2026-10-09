import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { reportError } from "@/observability/sentry";
import { ThemeProvider } from "@/theme";
import { ErrorState, Screen } from "@/ui";

function Fallback({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  useEffect(() => reportError(error), [error]);
  return (
    <Screen scroll={false}>
      <ErrorState
        title={t("common.somethingWrong")}
        message={t("errors.INTERNAL")}
        retryLabel={t("common.retry")}
        onRetry={retry}
      />
    </Screen>
  );
}

/**
 * Shown by Expo Router when a screen crashes while rendering. It sits outside the layout's
 * providers, so it brings its own.
 */
export function AppErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Fallback {...props} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
