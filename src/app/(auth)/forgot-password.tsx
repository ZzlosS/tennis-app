import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { forgotPassword } from "@/api";
import { isEmail } from "@/components/forms";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useLanguage } from "@/i18n/useLanguage";
import { useTheme } from "@/theme";
import { Button, Screen, Text, TextInput } from "@/ui";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const error = !email.trim() ? t("auth.required") : !isEmail(email) ? t("auth.invalidEmail") : undefined;
    setFieldError(error);
    setFormError(null);
    if (error) return;
    setBusy(true);
    try {
      // Always 204, whether or not the account exists, so nobody can probe for emails.
      await forgotPassword({ email: email.trim(), language });
      setSent(true);
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.xxl }}>
        <Text variant="h1">{t("auth.forgotTitle")}</Text>
        <Text tone="muted">{t("auth.forgotSubtitle")}</Text>
      </View>
      {sent ? (
        <Notice>{t("auth.linkSent")}</Notice>
      ) : (
        <View style={{ gap: spacing.md }}>
          <TextInput
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onSubmitEditing={submit}
            error={fieldError}
          />
          {formError ? <Notice tone="error">{formError}</Notice> : null}
          <Button title={t("auth.sendLink")} onPress={submit} loading={busy} />
        </View>
      )}
      <Link href="/login" asChild>
        <Button title={t("auth.backToSignIn")} variant="ghost" />
      </Link>
    </Screen>
  );
}
