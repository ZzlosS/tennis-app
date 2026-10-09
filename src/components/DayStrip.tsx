import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

import { addDays } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Text } from "@/ui";

type Props = {
  /** The first day shown, usually today in the court's time zone. */
  from: string;
  days?: number;
  value: string;
  onChange: (date: string) => void;
};

/** A row of days to pick from ("Thu 9", "Fri 10", ...). */
export function DayStrip({ from, days = 7, value, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm }}
      accessibilityRole="tablist"
      accessibilityLabel={t("reserve.day")}
    >
      {dates.map((date) => {
        const selected = date === value;
        const d = new Date(`${date}T12:00:00Z`);
        const weekday = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" }).format(d);
        const label = new Intl.DateTimeFormat(locale, {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(d);
        return (
          <Pressable
            key={date}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(date)}
            style={{
              width: 54,
              paddingVertical: spacing.sm,
              borderRadius: radius.control,
              alignItems: "center",
              gap: 2,
              backgroundColor: selected ? colors.primary : colors.surface,
            }}
          >
            <Text variant="small" style={{ color: selected ? colors.onPrimary : colors.textMuted }}>
              {weekday}
            </Text>
            <Text variant="h2" style={{ color: selected ? colors.onPrimary : colors.text }}>
              {String(d.getUTCDate())}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
