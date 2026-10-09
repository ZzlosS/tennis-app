import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useGetClub, useInvalidate, useUpdateClub, type ClubDetailResponse, type OpeningHours } from "@/api";
import { serverFields } from "@/components/forms";
import { Notice } from "@/components/Notice";
import { OpeningHoursEditor, validHours } from "@/components/OpeningHoursEditor";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, LoadingState, Screen, Text, TextInput } from "@/ui";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function SettingsForm({ club }: { club: ClubDetailResponse }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidate();
  const update = useUpdateClub();
  const [form, setForm] = useState({
    name: club.name,
    address: club.address,
    city: club.city,
    description: club.description,
    cancelCutoffHours: String(club.cancelCutoffHours),
    seasonEndsOn: club.seasonEndsOn ?? "",
  });
  const [hours, setHours] = useState<OpeningHours>(club.openingHours);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function submit() {
    const cutoff = Number(form.cancelCutoffHours);
    const found = {
      name: form.name.trim() ? undefined : t("auth.required"),
      address: form.address.trim() ? undefined : t("auth.required"),
      city: form.city.trim() ? undefined : t("auth.required"),
      cancelCutoffHours: Number.isInteger(cutoff) && cutoff >= 0 ? undefined : t("clubAdmin.wholeHours"),
      seasonEndsOn:
        !form.seasonEndsOn || DATE.test(form.seasonEndsOn) ? undefined : t("clubAdmin.dateFormat"),
      hours: validHours(hours) ? undefined : t("hours.invalid"),
    };
    setErrors(found);
    setFormError(null);
    setSaved(false);
    if (Object.values(found).some(Boolean)) return;
    try {
      await update.mutateAsync({
        id: club.id,
        data: {
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          description: form.description.trim(),
          cancelCutoffHours: cutoff,
          ...(form.seasonEndsOn ? { seasonEndsOn: form.seasonEndsOn } : {}),
          openingHours: hours,
        },
      });
      await invalidate("courts");
      setSaved(true);
    } catch (e) {
      setFormError(errorMessage(e));
      setErrors((current) => ({
        ...current,
        ...Object.fromEntries(serverFields(e).map((field) => [field, t("auth.fieldInvalid")])),
      }));
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <TextInput
        label={t("courtForm.name")}
        value={form.name}
        onChangeText={set("name")}
        error={errors.name}
      />
      <TextInput
        label={t("auth.address")}
        value={form.address}
        onChangeText={set("address")}
        error={errors.address}
      />
      <TextInput label={t("auth.city")} value={form.city} onChangeText={set("city")} error={errors.city} />
      <TextInput
        label={t("clubAdmin.description")}
        value={form.description}
        onChangeText={set("description")}
        multiline
        style={{ height: 96, paddingTop: 12, textAlignVertical: "top" }}
      />
      <TextInput
        label={t("clubAdmin.cancelCutoff")}
        value={form.cancelCutoffHours}
        onChangeText={set("cancelCutoffHours")}
        keyboardType="number-pad"
        error={errors.cancelCutoffHours}
      />
      <TextInput
        label={t("clubAdmin.seasonEnds")}
        value={form.seasonEndsOn}
        onChangeText={set("seasonEndsOn")}
        placeholder="2027-05-31"
        error={errors.seasonEndsOn}
      />
      <OpeningHoursEditor value={hours} onChange={(h) => (setSaved(false), setHours(h))} />
      {errors.hours ? <Notice tone="error">{errors.hours}</Notice> : null}
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      {saved ? <Notice>{t("clubAdmin.saved")}</Notice> : null}
      <Button title={t("common.save")} onPress={submit} loading={update.isPending} />
    </View>
  );
}

export default function ClubSettings() {
  const { t } = useTranslation();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useGetClub(clubId);
  return (
    <Screen>
      <View>
        <Text variant="small" tone="muted">
          {t("clubAdmin.header", { club: club.data?.name ?? "" })}
        </Text>
        <Text variant="h1">{t("clubAdmin.settings")}</Text>
      </View>
      {club.data ? <SettingsForm club={club.data} /> : <LoadingState label={t("common.loading")} />}
    </Screen>
  );
}
