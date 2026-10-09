import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { getClub, getGetClubQueryKey, useCancelBooking, useInvalidate, type BookingResponse } from "@/api";
import { useErrorMessage } from "@/errors";
import { formatDate, formatMoney, formatTime } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Badge, Button, Card, Text } from "@/ui";
import { choose, confirm } from "./confirm";
import { Notice } from "./Notice";

/** "Partner found · 1 of 1 joined" or "Looking for a partner · 0 of 1 joined". */
export function usePartnerNote() {
  const { t } = useTranslation();
  return (booking: BookingResponse) => {
    const request = booking.partnerRequest;
    if (!request) return null;
    const joined = request.playersNeeded - request.spotsLeft;
    const counts = t("reservations.joined", { joined, needed: request.playersNeeded });
    return request.spotsLeft === 0
      ? `${t("reservations.partnerFound")} · ${counts}`
      : `${t("reservations.lookingForPartner")} · ${counts}`;
  };
}

/** Asks, then cancels a booking: one or the whole series for repeats. Resolves true when cancelled. */
export function useCancelFlow() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  const cancel = useCancelBooking();
  return async (booking: BookingResponse): Promise<boolean> => {
    let cutoffHours: number | undefined;
    if (booking.club) {
      const clubId = booking.club.id;
      const club = await queryClient
        .fetchQuery({ queryKey: getGetClubQueryKey(clubId), queryFn: () => getClub(clubId) })
        .catch(() => undefined);
      cutoffHours = club?.cancelCutoffHours;
    }
    const message = cutoffHours != null ? t("reservations.cutoff", { hours: cutoffHours }) : undefined;
    const pick = booking.seriesId
      ? await choose(
          t("reservations.cancelTitle"),
          [
            { value: "one", label: t("reservations.cancelOne"), destructive: true },
            { value: "series", label: t("reservations.cancelSeries"), destructive: true },
          ],
          t("common.no"),
          message,
        )
      : (await confirm({
            title: t("reservations.cancelTitle"),
            message,
            confirmLabel: t("reservations.cancel"),
            cancelLabel: t("common.no"),
            destructive: true,
          }))
        ? "one"
        : null;
    if (!pick) return false;
    await cancel.mutateAsync({ id: booking.id, params: pick === "series" ? { series: true } : undefined });
    await invalidate("bookings");
    return true;
  };
}

/** One reservation, as on the canvas's Reservations screen. */
export function BookingCard({ booking, past = false }: { booking: BookingResponse; past?: boolean }) {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const errorMessage = useErrorMessage();
  const partnerNote = usePartnerNote();
  const cancel = useCancelFlow();
  const [error, setError] = useState<string | null>(null);
  const price = formatMoney(booking.totalPrice, locale);
  const where = [booking.club?.name, booking.court.name, t(`surface.${booking.court.surface}`)]
    .filter(Boolean)
    .join(" · ");
  const note = partnerNote(booking);
  const cancelled = booking.status === "CANCELLED";
  const small = { height: 38, paddingHorizontal: 14, flex: 1 } as const;

  return (
    <Card style={{ gap: spacing.sm, opacity: cancelled ? 0.6 : 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${formatDate(booking.startsAt, locale)}, ${booking.court.name}`}
        onPress={() => router.push(`/bookings/${booking.id}`)}
        style={{ gap: 4 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {formatDate(booking.startsAt, locale)}
          </Text>
          <Badge label={cancelled ? t("reservations.cancelled") : t(`bookingType.${booking.bookingType}`)} />
        </View>
        <Text variant="h2">{`${formatTime(booking.startsAt, locale)}–${formatTime(booking.endsAt, locale)}`}</Text>
        <Text variant="small" tone="muted">
          {where}
        </Text>
        <Text variant="label">{price ? `${t("booking.payAtClub")} · ${price}` : t("booking.free")}</Text>
        {note ? (
          <Text variant="small" tone="primary">
            {note}
          </Text>
        ) : null}
      </Pressable>
      {!cancelled ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {past ? (
            <Button
              variant="secondary"
              title={t("reservations.addResult")}
              style={small}
              onPress={() => router.push(`/matches/new?bookingId=${booking.id}`)}
            />
          ) : (
            <>
              {!booking.partnerRequest ? (
                <Button
                  variant="secondary"
                  title={t("reservations.findPartner")}
                  style={small}
                  onPress={() => router.push(`/partners/new?bookingId=${booking.id}`)}
                />
              ) : null}
              <Button
                variant="ghost"
                title={t("reservations.cancel")}
                style={small}
                onPress={async () => {
                  setError(null);
                  try {
                    await cancel(booking);
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              />
            </>
          )}
        </View>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Card>
  );
}
