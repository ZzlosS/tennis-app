import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getGetMeQueryKey, PlayerLevel, useInvalidate, useUpdateMe } from "@/api";
import { useAuth } from "@/auth";
import { Choice } from "@/components/Choice";
import { hasErrors, serverFields, type FieldErrors } from "@/components/forms";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import { Button, IconButton, LoadingState, Screen, ScreenHeader, TextInput } from "@/ui";

type Field = "firstName" | "lastName" | "nickname" | "address" | "city" | "country";

export default function EditProfile() {
  const { t } = useTranslation();
  const { me } = useAuth();
  if (!me) return <LoadingState label={t("common.loading")} />;
  return <EditForm me={me} />;
}

function EditForm({ me }: { me: NonNullable<ReturnType<typeof useAuth>["me"]> }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const update = useUpdateMe();
  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName,
    nickname: me.nickname,
    address: me.address,
    city: me.city,
    country: me.country,
  });
  const [level, setLevel] = useState<PlayerLevel>(me.level);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: Field) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const required = (value: string) => (value.trim() ? undefined : t("auth.required"));

  async function submit() {
    const next: FieldErrors<Field> = {
      firstName: required(form.firstName),
      lastName: required(form.lastName),
      nickname: required(form.nickname),
      address: required(form.address),
      city: required(form.city),
      country: required(form.country),
    };
    setErrors(next);
    setFormError(null);
    if (hasErrors(next)) return;
    try {
      const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      const updated = await update.mutateAsync({ data: { ...trimmed, level } });
      queryClient.setQueryData(getGetMeQueryKey(), updated);
      await invalidate("profile");
      goBack("/profile");
    } catch (error) {
      setFormError(errorMessage(error));
      setErrors((e) => ({
        ...e,
        ...Object.fromEntries(serverFields(error).map((field) => [field, t("auth.fieldInvalid")])),
      }));
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("profile.edit")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack("/profile")} />}
      />
      <View style={{ gap: spacing.md }}>
        <TextInput
          label={t("auth.firstName")}
          value={form.firstName}
          onChangeText={set("firstName")}
          error={errors.firstName}
        />
        <TextInput
          label={t("auth.lastName")}
          value={form.lastName}
          onChangeText={set("lastName")}
          error={errors.lastName}
        />
        <TextInput
          label={t("profile.nickname")}
          value={form.nickname}
          onChangeText={set("nickname")}
          error={errors.nickname}
        />
        <Choice
          label={t("auth.level")}
          value={level}
          onChange={setLevel}
          options={Object.values(PlayerLevel).map((value) => ({ value, label: t(`level.${value}`) }))}
        />
        <TextInput
          label={t("auth.address")}
          value={form.address}
          onChangeText={set("address")}
          error={errors.address}
        />
        <TextInput label={t("auth.city")} value={form.city} onChangeText={set("city")} error={errors.city} />
        <TextInput
          label={t("auth.country")}
          value={form.country}
          onChangeText={set("country")}
          error={errors.country}
        />
        {formError ? <Notice tone="error">{formError}</Notice> : null}
        <Button title={t("common.save")} onPress={submit} loading={update.isPending} />
      </View>
    </Screen>
  );
}
