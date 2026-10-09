import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { tokens, useChangePassword } from "@/api";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import { Button, IconButton, Screen, ScreenHeader, TextInput } from "@/ui";

export default function ChangePassword() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [done, setDone] = useState(false);

  async function submit() {
    const found = {
      current: current ? undefined : t("auth.required"),
      next: next.length >= 8 ? undefined : t("auth.passwordTooShort"),
    };
    setErrors(found);
    if (found.current || found.next) return;
    try {
      // Changing the password signs out every other device; this one gets fresh tokens.
      const auth = await change.mutateAsync({ data: { currentPassword: current, newPassword: next } });
      await tokens.set({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
      setDone(true);
    } catch {
      // Shown below from change.error.
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("profile.changePassword")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack("/profile")} />}
      />
      {done ? (
        <View style={{ gap: spacing.md }}>
          <Notice>{t("profile.passwordChanged")}</Notice>
          <Button title={t("common.done")} onPress={() => goBack("/profile")} />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <TextInput
            label={t("profile.currentPassword")}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
            error={errors.current}
          />
          <TextInput
            label={t("auth.newPassword")}
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoComplete="new-password"
            placeholder={t("auth.passwordHint")}
            error={errors.next}
          />
          {change.isError ? <Notice tone="error">{errorMessage(change.error)}</Notice> : null}
          <Button title={t("auth.savePassword")} onPress={submit} loading={change.isPending} />
        </View>
      )}
    </Screen>
  );
}
