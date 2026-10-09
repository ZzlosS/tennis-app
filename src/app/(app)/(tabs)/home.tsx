import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  getGetMyBookingsQueryKey,
  getGetPartnerRequestsQueryKey,
  useGetMyBookings,
  useGetMyUnreadCount,
  useGetPartnerRequests,
  type BookingResponse,
} from "@/api";
import { PartnerRow } from "@/components/PartnerRow";
import { useAuth } from "@/auth";
import { addDays, formatDate, formatMoney, formatTime, localDate } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Avatar, Card, IconButton, Screen, Text, type IconName } from "@/ui";

/** The bell on Home, with the number of unread notifications. */
function Bell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unread = useGetMyUnreadCount().data?.count ?? 0;
  return (
    <View>
      <IconButton
        icon="notifications-outline"
        label={unread > 0 ? t("notifications.bellUnread", { count: unread }) : t("notifications.title")}
        onPress={() => router.push("/notifications")}
      />
      {unread > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.danger,
          }}
        >
          <Text variant="label" style={{ color: colors.onDanger, fontSize: 11 }}>
            {unread > 9 ? "9+" : String(unread)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

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
  const gamesParams = { status: "OPEN" as const, limit: 10 };
  const games = useGetPartnerRequests(gamesParams, {
    query: { queryKey: getGetPartnerRequestsQueryKey(gamesParams) },
  });
  // Other players' games that still have room, soonest first, as on the canvas.
  const lookingForGame = (games.data?.items ?? [])
    .filter((r) => r.createdBy.id !== me?.id && r.spotsLeft > 0 && new Date(r.booking.startsAt) > new Date())
    .slice(0, 3);

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
        <Bell />
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

      {lookingForGame.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text variant="h2" style={{ flex: 1 }}>
              {t("home.lookingForGame")}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/partners")} hitSlop={8}>
              <Text variant="label" tone="primary">
                {t("common.seeAll")}
              </Text>
            </Pressable>
          </View>
          {lookingForGame.map((request) => (
            <PartnerRow key={request.id} request={request} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
