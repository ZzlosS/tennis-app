import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CourtSurface, type CourtResponse } from "@/api";
import { useAuth } from "@/auth";
import { minorUnits } from "@/format";
import { useTheme } from "@/theme";
import { Button, Segmented, Text, TextInput, ToggleRow } from "@/ui";
import { Choice } from "./Choice";
import { fromMinor, hasErrors, serverFields, toMinor, type FieldErrors } from "./forms";
import { Notice } from "./Notice";

export type CourtFormValues = {
  kind: "PUBLIC" | "PRIVATE";
  name: string;
  address: string;
  city: string;
  country: string;
  surface: CourtSurface;
  roof: boolean;
  double: boolean;
  /** Undefined for a free court. */
  pricePerHourMinor: number | undefined;
  currency: string;
};

type Field = "name" | "address" | "city" | "country" | "price";

type Props = {
  /** The court being edited; empty for a new one. */
  court?: CourtResponse;
  submitLabel: string;
  onSubmit: (values: CourtFormValues) => Promise<void>;
  /** Turns a failed submit into a sentence for the form. */
  describeError: (error: unknown) => string;
};

const CURRENCIES = ["RSD", "EUR"];

/** The fields of a public or private court, shared by Add a court and Edit. */
export function CourtForm({ court, submitLabel, onSubmit, describeError }: Props) {
  const { t } = useTranslation();
  const { me } = useAuth();
  const { spacing } = useTheme();
  const editing = court != null;
  const [kind, setKind] = useState<"PUBLIC" | "PRIVATE">(court?.kind === "PRIVATE" ? "PRIVATE" : "PUBLIC");
  const [form, setForm] = useState({
    name: court?.name ?? "",
    address: court?.address ?? "",
    city: court?.city ?? me?.city ?? "",
    country: court?.country ?? me?.country ?? "",
  });
  const [surface, setSurface] = useState<CourtSurface>(court?.surface ?? "HARD");
  const [roof, setRoof] = useState(court?.roof ?? false);
  const [double, setDouble] = useState(court?.double ?? true);
  const [currency, setCurrency] = useState(court?.pricePerHour?.currency ?? "RSD");
  const [free, setFree] = useState(editing ? court.pricePerHour == null : true);
  const [price, setPrice] = useState(
    court?.pricePerHour
      ? fromMinor(court.pricePerHour.amountMinor, minorUnits(court.pricePerHour.currency))
      : "",
  );
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const required = (value: string) => (value.trim() ? undefined : t("auth.required"));

  async function submit() {
    const minor = free ? undefined : toMinor(price, minorUnits(currency));
    const next: FieldErrors<Field> = {
      name: required(form.name),
      address: required(form.address),
      city: required(form.city),
      country: required(form.country),
      price: free || minor !== undefined ? undefined : t("courtForm.priceInvalid"),
    };
    setErrors(next);
    setFormError(null);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      await onSubmit({
        kind,
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        surface,
        roof,
        double,
        pricePerHourMinor: minor,
        currency,
      });
    } catch (error) {
      setFormError(describeError(error));
      const flagged = serverFields(error).map((field) => (field === "pricePerHourMinor" ? "price" : field));
      setErrors((e) => ({
        ...e,
        ...Object.fromEntries(flagged.map((field) => [field, t("auth.fieldInvalid")])),
      }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      {!editing ? (
        <View style={{ gap: spacing.xs }}>
          <Segmented<"PUBLIC" | "PRIVATE">
            label={t("courtForm.whoCanUse")}
            value={kind}
            onChange={setKind}
            options={[
              { value: "PUBLIC", label: t("courtKind.PUBLIC") },
              { value: "PRIVATE", label: t("courtKind.PRIVATE") },
            ]}
          />
          <Text variant="small" tone="muted">
            {kind === "PUBLIC" ? t("courtForm.publicHint") : t("courtForm.privateHint")}
          </Text>
        </View>
      ) : null}
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
        label={t("auth.country")}
        value={form.country}
        onChangeText={set("country")}
        error={errors.country}
      />
      <Choice<CourtSurface>
        label={t("courtForm.surface")}
        value={surface}
        onChange={setSurface}
        options={Object.values(CourtSurface).map((value) => ({ value, label: t(`surface.${value}`) }))}
      />
      <ToggleRow label={t("court.covered")} value={roof} onChange={setRoof} />
      <ToggleRow label={t("court.doubles")} value={double} onChange={setDouble} />
      <ToggleRow label={t("courtForm.free")} value={free} onChange={setFree} />
      {!free ? (
        <>
          <TextInput
            label={t("courtForm.price")}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            error={errors.price}
          />
          <Choice
            label={t("courtForm.currency")}
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((value) => ({ value, label: value }))}
          />
        </>
      ) : null}
      {!editing ? (
        <Text variant="small" tone="muted">
          {t("courtForm.ownerNote")}
        </Text>
      ) : null}
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      <Button title={submitLabel} onPress={submit} loading={busy} />
    </View>
  );
}
