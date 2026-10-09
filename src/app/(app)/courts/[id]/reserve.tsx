import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  isApiError,
  PlayerLevel,
  useCreateBooking,
  useGetAvailability,
  useGetCourt,
  useInvalidate,
  type AvailabilitySlot,
  type BookingType,
} from "@/api";
import { Choice } from "@/components/Choice";
import { useCourtMeta } from "@/components/courtText";
import { DayStrip } from "@/components/DayStrip";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatDay, formatMoney, formatTime, localDate, useNow } from "@/format";
import { intlLocale } from "@/i18n";
import { askForPushAfterBooking } from "@/notifications";
import { useTheme } from "@/theme";
import { Button, ErrorState, LoadingState, ScreenHeader, Segmented, Text, ToggleRow } from "@/ui";

const DURATIONS = [1, 2, 3];
const DAYS_AHEAD = 30;

/** The slots starting at `index` that make a `hours`-long booking, or null if one is not free. */
function freeRun(
  slots: AvailabilitySlot[],
  index: number,
  hours: number,
  now: number,
): AvailabilitySlot[] | null {
  const run = slots.slice(index, index + hours);
  if (run.length < hours) return null;
  for (let i = 0; i < run.length; i++) {
    if (run[i]!.status !== "FREE") return null;
    if (i > 0 && run[i - 1]!.endsAt !== run[i]!.startsAt) return null;
  }
  return new Date(run[0]!.startsAt).getTime() > now ? run : null;
}

export default function Reserve() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const court = useGetCourt(id);
  const courtMeta = useCourtMeta();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidate();
  const { colors, radius, spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const timeZone = court.data?.timeZone ?? "Europe/Belgrade";
  const today = localDate(new Date(), timeZone);
  const [date, setDate] = useState<string>();
  const day = date ?? today;
  const availability = useGetAvailability(id, { date: day });
  const create = useCreateBooking();
  const [start, setStart] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [repeat, setRepeat] = useState<BookingType>("ONE_TIME");
  const [partner, setPartner] = useState(false);
  const [playersNeeded, setPlayersNeeded] = useState<"1" | "3">("1");
  const [level, setLevel] = useState<PlayerLevel | "ANY">("ANY");
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  if (!court.data) {
    return (
      <SafeAreaView style={{ flex: 1, padding: spacing.xl }}>
        <ScreenHeader title={t("reserve.title")} />
        {court.error ? (
          <ErrorState
            title={t("common.somethingWrong")}
            message={errorMessage(court.error)}
            retryLabel={t("common.retry")}
            onRetry={() => void court.refetch()}
          />
        ) : (
          <LoadingState label={t("common.loading")} />
        )}
      </SafeAreaView>
    );
  }

  const slots = availability.data?.slots ?? [];
  const startIndex = slots.findIndex((slot) => slot.startsAt === start);
  const run = startIndex >= 0 ? freeRun(slots, startIndex, hours, now) : null;
  const price = availability.data?.pricePerHour ?? court.data.pricePerHour;
  const priceText = formatMoney(price, locale);
  const where = [court.data.club?.name, courtMeta(court.data)].filter(Boolean).join(" · ");

  function pickDay(next: string) {
    setDate(next);
    setStart(null);
    setError(null);
  }

  async function reserve() {
    if (!run) return;
    setError(null);
    try {
      const booking = await create.mutateAsync({
        data: {
          courtId: id,
          startsAt: run[0]!.startsAt,
          endsAt: run.at(-1)!.endsAt,
          bookingType: repeat,
          ...(partner
            ? {
                partnerRequest: {
                  playersNeeded: Number(playersNeeded),
                  ...(level !== "ANY" ? { level } : {}),
                },
              }
            : {}),
        },
      });
      await invalidate("bookings");
      void askForPushAfterBooking();
      router.replace(`/bookings/${booking.id}`);
    } catch (e) {
      if (isApiError(e) && e.code === "SLOT_TAKEN") {
        setStart(null);
        await availability.refetch();
      }
      setError(errorMessage(e));
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 180 }}>
        <ScreenHeader title={court.data.name} subtitle={where} />
        <DayStrip from={today} days={DAYS_AHEAD} value={day} onChange={pickDay} />

        <Text variant="label" tone="muted">
          {t("reserve.startTime")}
        </Text>
        {availability.isLoading ? <LoadingState label={t("common.loading")} /> : null}
        {availability.isSuccess && slots.every((slot, i) => !freeRun(slots, i, 1, now)) ? (
          <Text tone="muted">{t("reserve.nothingFree")}</Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {slots.map((slot, index) => {
            const open = freeRun(slots, index, 1, now) != null;
            const selected = slot.startsAt === start;
            return (
              <Pressable
                key={slot.startsAt}
                accessibilityRole="button"
                accessibilityLabel={open ? slot.localTime : t("reserve.taken", { time: slot.localTime })}
                accessibilityState={{ disabled: !open, selected }}
                disabled={!open}
                onPress={() => {
                  setStart(slot.startsAt);
                  setError(null);
                  // Keep the longest duration that still fits from the new start.
                  const fits = DURATIONS.filter((h) => freeRun(slots, index, h, now));
                  if (!fits.includes(hours)) setHours(fits.at(-1) ?? 1);
                }}
                style={{
                  width: 76,
                  height: 44,
                  borderRadius: radius.control,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? colors.primary : colors.surface,
                  opacity: open ? 1 : 0.4,
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: selected ? colors.onPrimary : colors.text,
                    textDecorationLine: open ? "none" : "line-through",
                  }}
                >
                  {slot.localTime}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="label" tone="muted">
          {t("reserve.duration")}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {DURATIONS.map((h) => {
            const fits = startIndex < 0 || freeRun(slots, startIndex, h, now) != null;
            const selected = h === hours;
            return (
              <Pressable
                key={h}
                accessibilityRole="button"
                accessibilityState={{ disabled: !fits, selected }}
                disabled={!fits}
                onPress={() => setHours(h)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? colors.text : colors.surface,
                  opacity: fits ? 1 : 0.4,
                }}
              >
                <Text variant="label" style={{ color: selected ? colors.background : colors.text }}>
                  {t("reserve.hours", { count: h })}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Segmented<BookingType>
          label={t("reserve.repeat")}
          value={repeat}
          onChange={setRepeat}
          options={[
            { value: "ONE_TIME", label: t("bookingType.ONE_TIME") },
            { value: "MONTH", label: t("bookingType.MONTH") },
            { value: "SEASON", label: t("bookingType.SEASON") },
          ]}
        />

        <ToggleRow
          label={t("reserve.lookForPartner")}
          description={t("reserve.lookForPartnerHint")}
          value={partner}
          onChange={setPartner}
        />
        {partner ? (
          <>
            <Choice<"1" | "3">
              label={t("partners.playersNeeded")}
              value={playersNeeded}
              onChange={setPlayersNeeded}
              options={[
                { value: "1", label: t("partners.singles") },
                { value: "3", label: t("partners.doubles") },
              ]}
            />
            <Choice<PlayerLevel | "ANY">
              label={t("partners.level")}
              value={level}
              onChange={setLevel}
              options={[
                { value: "ANY", label: t("partners.anyLevel") },
                ...Object.values(PlayerLevel).map((value) => ({ value, label: t(`level.${value}`) })),
              ]}
            />
          </>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.lg,
          gap: spacing.sm,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {run
                ? `${formatDay(day, locale)} · ${formatTime(run[0]!.startsAt, locale, timeZone)}–${formatTime(run.at(-1)!.endsAt, locale, timeZone)}`
                : t("reserve.pickTime")}
            </Text>
            <Text variant="small" tone="muted">
              {priceText
                ? `${t("reserve.priceTimes", { price: priceText, hours })} · ${t("booking.payAtClub")}`
                : t("booking.free")}
            </Text>
          </View>
          <Button title={t("explore.reserve")} disabled={!run} loading={create.isPending} onPress={reserve} />
        </View>
      </View>
    </SafeAreaView>
  );
}
