import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { tokens, useDeleteMe } from "@/api";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import { Button, IconButton, Screen, ScreenHeader, Text, TextInput } from "@/ui";

/** The stores require an in-app way to delete the account; the password confirms it. */
export default function DeleteAccount() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const remove = useDeleteMe();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  async function submit() {
    if (!password) {
      setError(t("auth.required"));
      return;
    }
    setError(undefined);
    try {
      await remove.mutateAsync({ data: { password } });
      // Clearing the session sends the player back to sign in.
      await tokens.clear();
    } catch {
      // Shown below from remove.error.
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("profile.deleteAccount")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack("/profile")} />}
      />
      <View style={{ gap: spacing.md }}>
        <Text>{t("profile.deleteExplain")}</Text>
        <TextInput
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          error={error}
        />
        {remove.isError ? <Notice tone="error">{errorMessage(remove.error)}</Notice> : null}
        <Button
          variant="danger"
          title={t("profile.deleteForever")}
          onPress={submit}
          loading={remove.isPending}
        />
      </View>
    </Screen>
  );
}
