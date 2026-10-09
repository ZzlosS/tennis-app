import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useCancelBooking,
  useCreateBlock,
  useDeleteBlock,
  useGetBooking,
  useGetClub,
  useGetSchedule,
  useInvalidate,
  useMarkPaid,
  useUnmarkPaid,
  type ScheduleCourt,
  type ScheduleSlot,
} from "@/api";
import { choose, confirm } from "@/components/confirm";
import { DayStrip } from "@/components/DayStrip";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatDay, formatTime, localDate } from "@/format";
import { intlLocale } from "@/i18n";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import { Badge, Button, Card, ErrorState, IconButton, LoadingState, Price, Text } from "@/ui";

const ROW = 52;
const COLUMN = 116;

type Picked = { court: ScheduleCourt; slots: ScheduleSlot[] };

/** The slots of one booking (or block) that starts at `index`, in order. */
function runFrom(slots: ScheduleSlot[], index: number): ScheduleSlot[] {
  const first = slots[index]!;
  const key = first.booking?.id ?? first.block?.id;
  const run = [first];
  for (let i = index + 1; i < slots.length; i++) {
    const slot = slots[i]!;
    if ((slot.booking?.id ?? slot.block?.id) !== key) break;
    run.push(slot);
  }
  return run;
}

function BookingPanel({
  picked,
  timeZone,
  onClose,
}: {
  picked: Picked;
  timeZone: string;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const locale = intlLocale(i18n.language);
  const scheduled = picked.slots[0]!.booking!;
  const booking = useGetBooking(scheduled.id);
  const markPaid = useMarkPaid();
  const unmarkPaid = useUnmarkPaid();
  const cancel = useCancelBooking();
  const [error, setError] = useState<string | null>(null);
  const paid = (booking.data?.paidAt ?? scheduled.paidAt) != null;
  const start = picked.slots[0]!.startsAt;
  const end = picked.slots.at(-1)!.endsAt;
  const time = `${formatTime(start, locale, timeZone)}–${formatTime(end, locale, timeZone)}`;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await invalidate("bookings");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function onCancel() {
    const series = scheduled.seriesId != null;
    const pick = series
      ? await choose(
          t("clubAdmin.cancelTitle", { player: scheduled.player.nickname }),
          [
            { value: "one", label: t("reservations.cancelOne"), destructive: true },
            { value: "series", label: t("reservations.cancelSeries"), destructive: true },
          ],
          t("common.cancel"),
        )
      : (await confirm({
            title: t("clubAdmin.cancelTitle", { player: scheduled.player.nickname }),
            message: t("clubAdmin.cancelMessage"),
            confirmLabel: t("clubAdmin.cancelBooking"),
            cancelLabel: t("common.no"),
            destructive: true,
          }))
        ? "one"
        : null;
    if (!pick) return;
    await run(() => cancel.mutateAsync({ id: scheduled.id, params: { series: pick === "series" } }));
    onClose();
  }

  const info = [
    scheduled.seriesId ? t("clubAdmin.repeats") : null,
    booking.data?.partnerRequest?.status === "OPEN" ? t("clubAdmin.partnerOpen") : null,
  ].filter(Boolean);

  return (
    <Card style={{ gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h2">{scheduled.player.nickname}</Text>
          <Text variant="small" tone="muted">{`${picked.court.court.name} · ${time}`}</Text>
          {info.length > 0 ? (
            <Text variant="small" tone="muted">
              {info.join(" · ")}
            </Text>
          ) : null}
          {booking.data ? <Price price={booking.data.totalPrice} /> : null}
        </View>
        <Badge
          label={paid ? t("clubAdmin.paid") : t("clubAdmin.unpaid")}
          tone={paid ? "positive" : "warning"}
        />
        <IconButton icon="close" label={t("common.close")} size={36} onPress={onClose} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button
          style={{ flex: 1 }}
          title={paid ? t("clubAdmin.markUnpaid") : t("clubAdmin.markPaid")}
          variant={paid ? "secondary" : "primary"}
          loading={markPaid.isPending || unmarkPaid.isPending}
          onPress={() =>
            run(() =>
              paid
                ? unmarkPaid.mutateAsync({ id: scheduled.id })
                : markPaid.mutateAsync({ id: scheduled.id }),
            )
          }
        />
        <Button
          style={{ flex: 1 }}
          title={t("clubAdmin.cancelBooking")}
          variant="secondary"
          onPress={onCancel}
        />
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Card>
  );
}

export default function ClubToday() {
  const { t, i18n } = useTranslation();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useGetClub(clubId);
  const timeZone = club.data?.timeZone ?? "Europe/Belgrade";
  const today = localDate(new Date(), timeZone);
  const [picked, setPickedDate] = useState<string>();
  const date = picked ?? today;
  const schedule = useGetSchedule(clubId, { date });
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const createBlock = useCreateBlock();
  const deleteBlock = useDeleteBlock();
  const { colors, spacing, radius } = useTheme();
  const locale = intlLocale(i18n.language);
  const [selected, setSelected] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courts = schedule.data?.courts ?? [];
  const hours = courts[0]?.slots.map((slot) => slot.localTime) ?? [];
  const bookingIds = new Set(
    courts.flatMap((c) => c.slots.flatMap((s) => (s.booking ? [s.booking.id] : []))),
  );

  async function onFree(court: ScheduleCourt, slot: ScheduleSlot) {
    const time = `${formatTime(slot.startsAt, locale, timeZone)}–${formatTime(slot.endsAt, locale, timeZone)}`;
    const yes = await confirm({
      title: t("clubAdmin.blockTitle", { court: court.court.name, time }),
      message: t("clubAdmin.blockMessage"),
      confirmLabel: t("clubAdmin.block"),
      cancelLabel: t("common.cancel"),
    });
    if (!yes) return;
    setError(null);
    try {
      await createBlock.mutateAsync({
        courtId: court.court.id,
        data: { startsAt: slot.startsAt, endsAt: slot.endsAt },
      });
      await invalidate("bookings");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function onBlock(court: ScheduleCourt, slot: ScheduleSlot) {
    const yes = await confirm({
      title: t("clubAdmin.unblockTitle", { court: court.court.name }),
      message: slot.block?.reason || undefined,
      confirmLabel: t("clubAdmin.unblock"),
      cancelLabel: t("common.cancel"),
    });
    if (!yes || !slot.block) return;
    setError(null);
    try {
      await deleteBlock.mutateAsync({ courtId: court.court.id, blockId: slot.block.id });
      await invalidate("bookings");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function cell(court: ScheduleCourt, index: number) {
    const slot = court.slots[index]!;
    const previous = court.slots[index - 1];
    const key = `${court.court.id}-${slot.startsAt}`;
    const base = { height: ROW - 4, margin: 2, borderRadius: radius.control - 4, padding: 6 } as const;
    if (slot.booking) {
      if (previous?.booking?.id === slot.booking.id) return null;
      const run = runFrom(court.slots, index);
      const time = `${formatTime(run[0]!.startsAt, locale, timeZone)}–${formatTime(run.at(-1)!.endsAt, locale, timeZone)}`;
      const paid = slot.booking.paidAt != null;
      return (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`${slot.booking.player.nickname}, ${court.court.name}, ${time}`}
          onPress={() => setSelected({ court, slots: run })}
          style={{
            ...base,
            height: ROW * run.length - 4,
            backgroundColor: colors.courtPublic.background,
            borderLeftWidth: 3,
            borderLeftColor: paid ? colors.primary : colors.courtPrivate.text,
          }}
        >
          <Text variant="label" numberOfLines={1} style={{ color: colors.courtPublic.text }}>
            {slot.booking.player.nickname}
          </Text>
          <Text variant="small" numberOfLines={1} style={{ color: colors.courtPublic.text, fontSize: 12 }}>
            {time}
          </Text>
        </Pressable>
      );
    }
    if (slot.block) {
      if (previous?.block?.id === slot.block.id) return null;
      const run = runFrom(court.slots, index);
      return (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={t("clubAdmin.blockedAt", { court: court.court.name, time: slot.localTime })}
          onPress={() => onBlock(court, slot)}
          style={{ ...base, height: ROW * run.length - 4, backgroundColor: colors.surface }}
        >
          <Text variant="small" tone="muted" numberOfLines={1}>
            {slot.block.reason || t("clubAdmin.blocked")}
          </Text>
        </Pressable>
      );
    }
    if (slot.status === "CLOSED" || slot.status === "BOOKED" || slot.status === "BLOCKED") {
      return <View key={key} style={{ ...base, backgroundColor: colors.surface, opacity: 0.5 }} />;
    }
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={t("clubAdmin.freeAt", { court: court.court.name, time: slot.localTime })}
        onPress={() => onFree(court, slot)}
        style={{ ...base, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}
      />
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <IconButton
            icon="chevron-back"
            label={t("clubAdmin.playerApp")}
            onPress={() => goBack("/profile")}
          />
          <View style={{ flex: 1 }}>
            <Text variant="small" tone="muted" numberOfLines={1}>
              {t("clubAdmin.header", { club: club.data?.name ?? "" })}
            </Text>
            <Text variant="h1">
              {date === today ? t("clubAdmin.today") : formatDay(date, locale, "long")}
            </Text>
          </View>
        </View>
        <Text tone="muted">
          {`${formatDay(date, locale, "long")} · ${t("clubAdmin.reservationCount", { count: bookingIds.size })}`}
        </Text>
        <DayStrip
          from={today}
          days={14}
          value={date}
          onChange={(d) => (setPickedDate(d), setSelected(null))}
        />
        {error ? <Notice tone="error">{error}</Notice> : null}
      </View>
      {schedule.isLoading ? <LoadingState label={t("common.loading")} /> : null}
      {schedule.error ? (
        <ErrorState
          title={t("common.somethingWrong")}
          message={errorMessage(schedule.error)}
          retryLabel={t("common.retry")}
          onRetry={() => void schedule.refetch()}
        />
      ) : null}
      {schedule.data ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 220 }}>
          <ScrollView horizontal>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 52, paddingTop: 28 }}>
                {hours.map((hour) => (
                  <View key={hour} style={{ height: ROW }}>
                    <Text variant="small" tone="muted">
                      {hour}
                    </Text>
                  </View>
                ))}
              </View>
              {courts.map((court) => (
                <View key={court.court.id} style={{ width: COLUMN }}>
                  <Text variant="label" numberOfLines={1} style={{ height: 28, textAlign: "center" }}>
                    {court.court.name}
                  </Text>
                  {court.slots.map((_, index) => cell(court, index))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      ) : null}
      {selected ? (
        <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md }}>
          <BookingPanel
            key={selected.slots[0]!.startsAt}
            picked={selected}
            timeZone={timeZone}
            onClose={() => setSelected(null)}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
