import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { resetPassword } from "@/api";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, Screen, Text, TextInput } from "@/ui";

// Opened from the backend's email: APP_URL/reset-password?token=…
export default function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const error = password.length >= 8 ? undefined : t("auth.passwordTooShort");
    setFieldError(error);
    setFormError(null);
    if (error || !token) return;
    setBusy(true);
    try {
      await resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text variant="h1" style={{ marginTop: spacing.xxl }}>
        {t("auth.resetTitle")}
      </Text>
      {!token ? (
        <Notice tone="error">{t("auth.linkIncomplete")}</Notice>
      ) : done ? (
        <Notice>{t("auth.passwordChanged")}</Notice>
      ) : (
        <View style={{ gap: spacing.md }}>
          <TextInput
            label={t("auth.newPassword")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder={t("auth.passwordHint")}
            onSubmitEditing={submit}
            error={fieldError}
          />
          {formError ? <Notice tone="error">{formError}</Notice> : null}
          <Button title={t("auth.savePassword")} onPress={submit} loading={busy} />
        </View>
      )}
      <Link href="/" asChild>
        <Button title={t("auth.backToSignIn")} variant="ghost" />
      </Link>
    </Screen>
  );
}
