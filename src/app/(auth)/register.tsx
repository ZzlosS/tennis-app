import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PlayerLevel } from "@/api";
import { useAuth } from "@/auth";
import { Choice } from "@/components/Choice";
import { hasErrors, isEmail, serverFields, type FieldErrors } from "@/components/forms";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, Screen, Text, TextInput } from "@/ui";

type Field =
  "firstName" | "lastName" | "nickname" | "email" | "password" | "level" | "address" | "city" | "country";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    password: "",
    address: "",
    city: "",
    country: "",
  });
  const [level, setLevel] = useState<PlayerLevel | undefined>();
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const required = (value: string) => (value.trim() ? undefined : t("auth.required"));

  async function submit() {
    const next: FieldErrors<Field> = {
      firstName: required(form.firstName),
      lastName: required(form.lastName),
      email: required(form.email) ?? (isEmail(form.email) ? undefined : t("auth.invalidEmail")),
      password: form.password.length >= 8 ? undefined : t("auth.passwordTooShort"),
      level: level ? undefined : t("auth.required"),
      address: required(form.address),
      city: required(form.city),
      country: required(form.country),
    };
    setErrors(next);
    setFormError(null);
    if (hasErrors(next) || !level) return;
    setBusy(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nickname: form.nickname.trim() || undefined,
        email: form.email,
        password: form.password,
        level,
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
      });
    } catch (error) {
      setFormError(errorMessage(error));
      const flagged = Object.fromEntries(serverFields(error).map((field) => [field, t("auth.fieldInvalid")]));
      setErrors((e) => ({ ...e, ...flagged }));
    } finally {
      setBusy(false);
    }
  }

  const levels = Object.values(PlayerLevel).map((value) => ({ value, label: t(`level.${value}`) }));

  return (
    <Screen>
      <View style={{ alignItems: "flex-end" }}>
        <LanguageSwitch />
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="h1">{t("auth.registerTitle")}</Text>
        <Text tone="muted">{t("auth.registerSubtitle")}</Text>
      </View>
      <View style={{ gap: spacing.md }}>
        <TextInput
          label={t("auth.firstName")}
          value={form.firstName}
          onChangeText={set("firstName")}
          autoComplete="given-name"
          error={errors.firstName}
        />
        <TextInput
          label={t("auth.lastName")}
          value={form.lastName}
          onChangeText={set("lastName")}
          autoComplete="family-name"
          error={errors.lastName}
        />
        <TextInput
          label={t("auth.nickname")}
          value={form.nickname}
          onChangeText={set("nickname")}
          error={errors.nickname}
        />
        <TextInput
          label={t("auth.email")}
          value={form.email}
          onChangeText={set("email")}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={errors.email}
        />
        <TextInput
          label={t("auth.password")}
          value={form.password}
          onChangeText={set("password")}
          secureTextEntry
          autoComplete="new-password"
          placeholder={t("auth.passwordHint")}
          error={errors.password}
        />
        <Choice
          label={t("auth.level")}
          options={levels}
          value={level}
          onChange={setLevel}
          error={errors.level}
        />
        <TextInput
          label={t("auth.address")}
          value={form.address}
          onChangeText={set("address")}
          autoComplete="street-address"
          error={errors.address}
        />
        <TextInput label={t("auth.city")} value={form.city} onChangeText={set("city")} error={errors.city} />
        <TextInput
          label={t("auth.country")}
          value={form.country}
          onChangeText={set("country")}
          autoComplete="country"
          error={errors.country}
        />
        {formError ? <Notice tone="error">{formError}</Notice> : null}
        <Button title={t("auth.register")} onPress={submit} loading={busy} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
        <Text tone="muted">{t("auth.haveAccount")}</Text>
        <Link href="/login">
          <Text variant="bodyStrong" tone="primary">
            {t("auth.signIn")}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
