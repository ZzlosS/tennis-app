import { useTranslation } from "react-i18next";
import { Switch, TextInput as RNTextInput, View } from "react-native";

import type { OpeningHours, OpeningHoursDay } from "@/api";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Text } from "@/ui";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True when every open day has valid "HH:MM" times with opening before closing. */
export function validHours(hours: OpeningHours): boolean {
  return hours.every(
    (day) => day == null || (TIME.test(day.open) && TIME.test(day.close) && day.open < day.close),
  );
}

/** Monday to Sunday, as the API orders them. */
function weekdayNames(locale: string): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long" }).format(
      new Date(Date.UTC(2024, 0, 1 + i)),
    ),
  );
}

type Props = { value: OpeningHours; onChange: (hours: OpeningHours) => void };

/** Seven rows: open or closed, and the opening and closing time. */
export function OpeningHoursEditor({ value, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, fonts, radius, spacing } = useTheme();
  const names = weekdayNames(intlLocale(i18n.language));
  const days = Array.from({ length: 7 }, (_, i) => value[i] ?? null);

  const setDay = (index: number, day: OpeningHoursDay | null) =>
    onChange(days.map((current, i) => (i === index ? day : current)));

  const timeInput = (label: string, text: string, onText: (text: string) => void) => (
    <RNTextInput
      accessibilityLabel={label}
      value={text}
      onChangeText={onText}
      placeholder="08:00"
      placeholderTextColor={colors.textMuted}
      maxLength={5}
      style={{
        width: 64,
        height: 40,
        textAlign: "center",
        borderRadius: radius.control,
        backgroundColor: colors.surface,
        color: TIME.test(text) ? colors.text : colors.danger,
        fontFamily: fonts.medium,
      }}
    />
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" tone="muted">
        {t("hours.title")}
      </Text>
      {days.map((day, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 }}>
          <Text style={{ flex: 1 }}>{names[i]}</Text>
          <Switch
            accessibilityLabel={t("hours.openOn", { day: names[i] })}
            value={day != null}
            onValueChange={(open) => setDay(i, open ? { open: "08:00", close: "22:00" } : null)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.card}
          />
          {day ? (
            <>
              {timeInput(t("hours.opensOn", { day: names[i] }), day.open, (open) =>
                setDay(i, { ...day, open }),
              )}
              <Text tone="muted">–</Text>
              {timeInput(t("hours.closesOn", { day: names[i] }), day.close, (close) =>
                setDay(i, { ...day, close }),
              )}
            </>
          ) : (
            <Text tone="muted" style={{ width: 150, textAlign: "center" }}>
              {t("hours.closed")}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
