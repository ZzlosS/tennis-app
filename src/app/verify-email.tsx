import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { getGetMeQueryKey, verifyEmail } from "@/api";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, LoadingState, Screen, Text } from "@/ui";

// Opened from the backend's email: APP_URL/verify-email?token=…
export default function VerifyEmail() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const { spacing } = useTheme();
  const verify = useMutation({
    mutationFn: (value: string) => verifyEmail({ token: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
  });
  const { mutate } = verify;

  useEffect(() => {
    if (token) mutate(token);
  }, [token, mutate]);

  return (
    <Screen>
      <Text variant="h1" style={{ marginTop: spacing.xxl }}>
        {t("auth.verifyTitle")}
      </Text>
      {!token ? (
        <Notice tone="error">{t("auth.linkIncomplete")}</Notice>
      ) : verify.isSuccess ? (
        <Notice>{t("auth.verified")}</Notice>
      ) : verify.isError ? (
        <Notice tone="error">{errorMessage(verify.error)}</Notice>
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
      <Link href="/" asChild>
        <Button title={t("common.back")} variant="ghost" />
      </Link>
    </Screen>
  );
}
