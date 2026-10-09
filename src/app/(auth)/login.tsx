import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAuth } from "@/auth";
import { isEmail, type FieldErrors } from "@/components/forms";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, Screen, Text, TextInput } from "@/ui";

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const errorMessage = useErrorMessage();
  const { colors, radius, spacing } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"email" | "password">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const errors = {
      email: !email.trim() ? t("auth.required") : !isEmail(email) ? t("auth.invalidEmail") : undefined,
      password: !password ? t("auth.required") : undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: "flex-end" }}>
        <LanguageSwitch />
      </View>
      <View style={{ marginTop: spacing.xxl * 2, gap: spacing.lg }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.control + 2,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="tennisball-outline" size={30} color={colors.onPrimary} />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text variant="title">{t("auth.welcomeTitle")}</Text>
          <Text tone="muted">{t("auth.welcomeSubtitle")}</Text>
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <TextInput
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={fieldErrors.email}
        />
        <TextInput
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          error={fieldErrors.password}
        />
        {formError ? <Notice tone="error">{formError}</Notice> : null}
        <Button title={t("auth.signIn")} onPress={submit} loading={busy} />
        <Link href="/forgot-password" asChild>
          <Button title={t("auth.forgotPassword")} variant="ghost" />
        </Link>
      </View>
      <View style={{ marginTop: "auto", flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
        <Text tone="muted">{t("auth.newHere")}</Text>
        <Link href="/register">
          <Text variant="bodyStrong" tone="primary">
            {t("auth.createAccount")}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
