import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getGetMeQueryKey, useUpdateMe } from "@/api";
import { useAuth } from "@/auth";
import { Choice } from "@/components/Choice";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme, useThemeSettings, type SchemePreference, type ThemeName } from "@/theme";
import { Avatar, Button, Card, Divider, ErrorState, LoadingState, Screen, Text } from "@/ui";

export default function Profile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { me, meError, refetchMe, signOut } = useAuth();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const { themeName, setThemeName, schemePreference, setSchemePreference } = useThemeSettings();
  const updateMe = useUpdateMe({
    mutation: { onSuccess: (updated) => queryClient.setQueryData(getGetMeQueryKey(), updated) },
  });

  if (!me) {
    return meError ? (
      <ErrorState
        title={t("common.somethingWrong")}
        message={errorMessage(meError)}
        retryLabel={t("common.retry")}
        onRetry={refetchMe}
      />
    ) : (
      <LoadingState label={t("common.loading")} />
    );
  }

  const name = `${me.firstName} ${me.lastName}`.trim();

  return (
    <Screen>
      <Text variant="h1">{t("profile.title")}</Text>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Avatar name={name} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h2">{name}</Text>
          <Text tone="muted">{me.email}</Text>
          <Text variant="small" tone="muted">
            {t(`profile.role.${me.role}`)}
          </Text>
        </View>
      </Card>
      {!me.emailVerified ? <Notice>{t("profile.emailNotVerified")}</Notice> : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="muted">
          {t("language.title")}
        </Text>
        {/* Saving the language on the profile makes emails and push notifications match it. */}
        <LanguageSwitch onChange={(language) => updateMe.mutate({ data: { language } })} />
        {updateMe.isError ? <Notice tone="error">{errorMessage(updateMe.error)}</Notice> : null}
      </View>

      <Choice<ThemeName>
        label={t("appearance.look")}
        value={themeName}
        onChange={setThemeName}
        options={[
          { value: "minimal", label: t("appearance.minimal") },
          { value: "wimbledon", label: t("appearance.wimbledon") },
        ]}
      />
      <Choice<SchemePreference>
        label={t("appearance.scheme")}
        value={schemePreference}
        onChange={setSchemePreference}
        options={[
          { value: "system", label: t("appearance.system") },
          { value: "light", label: t("appearance.light") },
          { value: "dark", label: t("appearance.dark") },
        ]}
      />
      <Divider />
      <Button title={t("auth.signOut")} variant="secondary" onPress={signOut} />
    </Screen>
  );
}
