import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { getGetMyBookingsQueryKey, useGetMyBookings, type BookingResponse } from "@/api";
import { useAuth } from "@/auth";
import { addDays, formatDate, formatMoney, formatTime, localDate } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Avatar, Card, Screen, Text, type IconName } from "@/ui";

function NextBooking({ booking }: { booking: BookingResponse }) {
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const today = localDate(new Date());
  const day = localDate(new Date(booking.startsAt));
  const when =
    day === today
      ? t("home.today")
      : day === addDays(today, 1)
        ? t("home.tomorrow")
        : formatDate(booking.startsAt, locale);
  const price = formatMoney(booking.totalPrice, locale);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.nextBooking")}
      onPress={() => router.push(`/bookings/${booking.id}`)}
    >
      <Card style={{ backgroundColor: colors.primary, gap: spacing.xs, padding: spacing.lg }}>
        <Text variant="label" tone="onPrimary">
          {when}
        </Text>
        <Text variant="h1" tone="onPrimary">
          {`${formatTime(booking.startsAt, locale)} – ${formatTime(booking.endsAt, locale)}`}
        </Text>
        <Text tone="onPrimary">
          {[booking.club?.name, booking.court.name, t(`surface.${booking.court.surface}`)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text variant="small" tone="onPrimary">
          {price ? `${t("booking.payAtClub")} · ${price}` : t("booking.free")}
        </Text>
      </Card>
    </Pressable>
  );
}

function QuickLink({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Card style={{ alignItems: "center", gap: spacing.sm, opacity: pressed ? 0.7 : 1 }}>
          <Ionicons name={icon} size={22} color={colors.primary} />
          <Text variant="label">{label}</Text>
        </Card>
      )}
    </Pressable>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { me } = useAuth();
  const { spacing } = useTheme();
  const today = new Intl.DateTimeFormat(intlLocale(i18n.language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const name = me ? `${me.firstName} ${me.lastName}`.trim() : "";
  const nextParams = { when: "upcoming" as const, limit: 1 };
  const next = useGetMyBookings(nextParams, { query: { queryKey: getGetMyBookingsQueryKey(nextParams) } });
  const nextBooking = next.data?.items.find((b) => b.status !== "CANCELLED");

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="small" tone="muted">
            {today}
          </Text>
          <Text variant="h1">
            {me ? t("home.greeting", { name: me.firstName }) : t("home.greetingNoName")}
          </Text>
        </View>
        {me ? <Avatar name={name} size={44} /> : null}
      </View>

      {nextBooking ? <NextBooking booking={nextBooking} /> : null}

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <QuickLink
          icon="map-outline"
          label={t("home.map")}
          onPress={() => router.push("/explore?view=map")}
        />
        <QuickLink
          icon="calendar-outline"
          label={t("home.reserve")}
          onPress={() => router.push("/explore")}
        />
        <QuickLink
          icon="people-outline"
          label={t("home.partners")}
          onPress={() => router.push("/partners")}
        />
      </View>
    </Screen>
  );
}
