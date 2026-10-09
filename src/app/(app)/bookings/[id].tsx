import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useGetBooking } from "@/api";
import { useCancelFlow, usePartnerNote } from "@/components/BookingCard";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatDate, formatMoney, formatTime, useNow } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Badge, Button, Card, ErrorState, LoadingState, Screen, ScreenHeader, SurfaceTile, Text } from "@/ui";

export default function BookingDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useGetBooking(id);
  const errorMessage = useErrorMessage();
  const partnerNote = usePartnerNote();
  const cancel = useCancelFlow();
  const { spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  if (!booking.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t("bookingDetail.title")} />
        {booking.error ? (
          <ErrorState
            title={t("common.somethingWrong")}
            message={errorMessage(booking.error)}
            retryLabel={t("common.retry")}
            onRetry={() => void booking.refetch()}
          />
        ) : (
          <LoadingState label={t("common.loading")} />
        )}
      </Screen>
    );
  }

  const b = booking.data;
  const price = formatMoney(b.totalPrice, locale);
  const past = new Date(b.endsAt).getTime() < now;
  const cancelled = b.status === "CANCELLED";
  const note = partnerNote(b);

  return (
    <Screen>
      <ScreenHeader title={t("bookingDetail.title")} />
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
          <SurfaceTile surface={b.court.surface} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="h2">{b.court.name}</Text>
            {b.club ? (
              <Text variant="small" tone="muted">
                {b.club.name}
              </Text>
            ) : null}
          </View>
          <Badge
            label={cancelled ? t("reservations.cancelled") : t(`bookingType.${b.bookingType}`)}
            tone={cancelled ? "warning" : "neutral"}
          />
        </View>
        <Text variant="bodyStrong">{`${formatDate(b.startsAt, locale)}, ${formatTime(b.startsAt, locale)}–${formatTime(b.endsAt, locale)}`}</Text>
        <Text>{price ? `${t("booking.payAtClub")} · ${price}` : t("booking.free")}</Text>
        {b.paidAt ? <Badge label={t("clubAdmin.paid")} tone="positive" /> : null}
        {note ? <Text tone="primary">{note}</Text> : null}
      </Card>
      {b.partnerRequest ? (
        <Button
          variant="secondary"
          title={t("bookingDetail.openRequest")}
          onPress={() => router.push(`/partners/${b.partnerRequest!.id}`)}
        />
      ) : null}
      {!cancelled && !past && !b.partnerRequest ? (
        <Button
          variant="secondary"
          title={t("reservations.findPartner")}
          onPress={() => router.push(`/partners/new?bookingId=${b.id}`)}
        />
      ) : null}
      {!cancelled && past ? (
        <Button
          title={t("reservations.addResult")}
          onPress={() => router.push(`/matches/new?bookingId=${b.id}`)}
        />
      ) : null}
      <Button
        variant="secondary"
        title={t("bookingDetail.openCourt")}
        onPress={() => router.push(`/courts/${b.court.id}`)}
      />
      {!cancelled && !past ? (
        <Button
          variant="ghost"
          title={t("reservations.cancel")}
          onPress={async () => {
            setError(null);
            try {
              await cancel(b);
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        />
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Screen>
  );
}
