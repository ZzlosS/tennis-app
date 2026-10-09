import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CourtSurface, type CourtResponse, type OpeningHours } from "@/api";
import { minorUnits } from "@/format";
import { useTheme } from "@/theme";
import { Button, TextInput, ToggleRow } from "@/ui";
import { Choice } from "./Choice";
import { fromMinor, serverFields, toMinor } from "./forms";
import { Notice } from "./Notice";
import { OpeningHoursEditor, validHours } from "./OpeningHoursEditor";

export type ClubCourtValues = {
  name: string;
  surface: CourtSurface;
  roof: boolean;
  double: boolean;
  /** 0 for a free court. */
  pricePerHourMinor: number;
  /** Null when the court keeps the club's hours. */
  openingHours: OpeningHours | null;
};

type Props = {
  court?: CourtResponse;
  currency: string;
  clubHours: OpeningHours;
  submitLabel: string;
  onSubmit: (values: ClubCourtValues) => Promise<void>;
  describeError: (error: unknown) => string;
};

/** A club court's name, surface, price and hours, for Add court and Edit court. */
export function ClubCourtForm({ court, currency, clubHours, submitLabel, onSubmit, describeError }: Props) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const digits = minorUnits(currency);
  const [name, setName] = useState(court?.name ?? "");
  const [surface, setSurface] = useState<CourtSurface>(court?.surface ?? "CLAY");
  const [roof, setRoof] = useState(court?.roof ?? false);
  const [double, setDouble] = useState(court?.double ?? true);
  const [price, setPrice] = useState(
    court?.pricePerHour ? fromMinor(court.pricePerHour.amountMinor, digits) : "",
  );
  const sameHours = court == null || JSON.stringify(court.openingHours) === JSON.stringify(clubHours);
  const [ownHours, setOwnHours] = useState(!sameHours);
  const [hours, setHours] = useState<OpeningHours>(court?.openingHours ?? clubHours);
  const [errors, setErrors] = useState<{ name?: string; price?: string; hours?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const minor = price.trim() ? toMinor(price, digits) : 0;
    const found = {
      name: name.trim() ? undefined : t("auth.required"),
      price: minor === undefined ? t("courtForm.priceInvalid") : undefined,
      hours: ownHours && !validHours(hours) ? t("hours.invalid") : undefined,
    };
    setErrors(found);
    setFormError(null);
    if (found.name || found.price || found.hours) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        surface,
        roof,
        double,
        pricePerHourMinor: minor ?? 0,
        openingHours: ownHours ? hours : null,
      });
    } catch (error) {
      setFormError(describeError(error));
      if (serverFields(error).includes("name")) setErrors((e) => ({ ...e, name: t("auth.fieldInvalid") }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <TextInput label={t("courtForm.name")} value={name} onChangeText={setName} error={errors.name} />
      <Choice<CourtSurface>
        label={t("courtForm.surface")}
        value={surface}
        onChange={setSurface}
        options={Object.values(CourtSurface).map((value) => ({ value, label: t(`surface.${value}`) }))}
      />
      <ToggleRow label={t("court.covered")} value={roof} onChange={setRoof} />
      <ToggleRow label={t("court.doubles")} value={double} onChange={setDouble} />
      <TextInput
        label={t("clubAdmin.pricePerHour", { currency })}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder={t("clubAdmin.emptyIsFree")}
        error={errors.price}
      />
      <ToggleRow
        label={t("clubAdmin.ownHours")}
        description={t("clubAdmin.ownHoursHint")}
        value={ownHours}
        onChange={setOwnHours}
      />
      {ownHours ? <OpeningHoursEditor value={hours} onChange={setHours} /> : null}
      {errors.hours ? <Notice tone="error">{errors.hours}</Notice> : null}
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      <Button title={submitLabel} onPress={submit} loading={busy} />
    </View>
  );
}
