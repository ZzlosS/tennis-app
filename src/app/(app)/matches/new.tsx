import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput as RNTextInput, View } from "react-native";

import {
  getGetMyBookingsQueryKey,
  getGetPlayersQueryKey,
  isApiError,
  useCreateMatch,
  useGetBooking,
  useGetMyBookings,
  useGetPartnerRequest,
  useGetPlayers,
  useInvalidate,
  type BookingResponse,
  type PlayerSummary,
} from "@/api";
import { useAuth } from "@/auth";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatSlot } from "@/format";
import { intlLocale } from "@/i18n";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import {
  Avatar,
  Button,
  Card,
  IconButton,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Segmented,
  Text,
} from "@/ui";

type Format = "singles" | "doubles";
type Slot = "partner" | "opponent1" | "opponent2";
type Score = { mine: string; theirs: string };

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/** Search players by name, with the booking's partners offered first. */
function PlayerPicker({
  suggestions,
  exclude,
  onPick,
}: {
  suggestions: PlayerSummary[];
  exclude: string[];
  onPick: (player: PlayerSummary) => void;
}) {
  const { t } = useTranslation();
  const { colors, fonts, radius, spacing } = useTheme();
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim());
  const params = { q, limit: 10 };
  const found = useGetPlayers(params, {
    query: { enabled: q.length >= 2, queryKey: getGetPlayersQueryKey(params) },
  });
  const results: PlayerSummary[] =
    q.length >= 2
      ? (found.data?.items ?? []).map((p) => ({ id: p.id, nickname: p.nickname, level: p.level }))
      : suggestions;
  const shown = results.filter((p) => !exclude.includes(p.id));
  return (
    <Card style={{ gap: spacing.sm }}>
      <RNTextInput
        accessibilityLabel={t("matches.searchPlayer")}
        placeholder={t("matches.searchPlayer")}
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoFocus
        style={{
          height: 46,
          borderRadius: radius.control,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          color: colors.text,
          fontFamily: fonts.medium,
        }}
      />
      {shown.map((player) => (
        <ListRow
          key={player.id}
          left={<Avatar name={player.nickname} size={36} />}
          title={player.nickname}
          subtitle={t(`level.${player.level}`)}
          accessibilityLabel={t("matches.pick", { player: player.nickname })}
          onPress={() => onPick(player)}
        />
      ))}
      {q.length >= 2 && found.isSuccess && shown.length === 0 ? (
        <Text tone="muted">{t("matches.noPlayers")}</Text>
      ) : null}
    </Card>
  );
}

function PickBooking() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const params = { when: "past" as const, limit: 20 };
  const past = useGetMyBookings(params, { query: { queryKey: getGetMyBookingsQueryKey(params) } });
  const items = (past.data?.items ?? []).filter((b) => b.status !== "CANCELLED");
  return (
    <>
      <Text tone="muted">{t("matches.pickBooking")}</Text>
      {past.isLoading ? <LoadingState label={t("common.loading")} /> : null}
      {past.isSuccess && items.length === 0 ? <Text tone="muted">{t("matches.noPastBookings")}</Text> : null}
      {items.map((b) => (
        <Card key={b.id}>
          <ListRow
            title={formatSlot(b.startsAt, b.endsAt, intlLocale(i18n.language))}
            subtitle={[b.club?.name, b.court.name].filter(Boolean).join(" · ")}
            onPress={() => router.setParams({ bookingId: b.id })}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
        </Card>
      ))}
    </>
  );
}

function ResultForm({ booking }: { booking: BookingResponse }) {
  const { t, i18n } = useTranslation();
  const { me } = useAuth();
  const { colors, fonts, radius, spacing } = useTheme();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidate();
  const create = useCreateMatch();
  const request = useGetPartnerRequest(booking.partnerRequest?.id ?? "", {
    query: { enabled: booking.partnerRequest != null },
  });
  const [format, setFormat] = useState<Format>(
    booking.partnerRequest && booking.partnerRequest.playersNeeded >= 3 ? "doubles" : "singles",
  );
  const [players, setPlayers] = useState<Partial<Record<Slot, PlayerSummary>>>({});
  const [picking, setPicking] = useState<Slot | null>(null);
  const [sets, setSets] = useState<Score[]>([
    { mine: "", theirs: "" },
    { mine: "", theirs: "" },
  ]);
  const [errors, setErrors] = useState<{ players?: string; sets?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const slots: Slot[] = format === "doubles" ? ["partner", "opponent1", "opponent2"] : ["opponent1"];
  const others = request.data ? [request.data.createdBy, ...request.data.joined] : [];
  const suggestions = others.filter((p) => p.id !== me?.id);
  const chosenIds = [me?.id ?? "", ...Object.values(players).map((p) => p?.id ?? "")];
  const slotLabel = {
    partner: t("matches.partner"),
    opponent1: t("matches.opponent"),
    opponent2: t("matches.opponent2"),
  };

  const setScore = (index: number, key: keyof Score, value: string) =>
    setSets((all) => all.map((s, i) => (i === index ? { ...s, [key]: value.replace(/\D/g, "") } : s)));

  async function submit() {
    const missing = slots.some((slot) => !players[slot]);
    const filled = sets.filter((s) => s.mine !== "" || s.theirs !== "");
    const badSets = filled.length === 0 || filled.some((s) => s.mine === "" || s.theirs === "");
    setErrors({
      players: missing ? t("matches.pickPlayers") : undefined,
      sets: badSets ? t("matches.fillSets") : undefined,
    });
    setFormError(null);
    if (missing || badSets || !me) return;
    try {
      const match = await create.mutateAsync({
        data: {
          firstTeam: [me.id, ...(format === "doubles" ? [players.partner!.id] : [])],
          secondTeam: [players.opponent1!.id, ...(format === "doubles" ? [players.opponent2!.id] : [])],
          sets: filled.map((s) => ({ firstTeam: Number(s.mine), secondTeam: Number(s.theirs) })),
          courtId: booking.court.id,
          playedAt: booking.startsAt,
        },
      });
      await invalidate("matches");
      router.replace(`/matches/${match.id}`);
    } catch (e) {
      setFormError(errorMessage(e));
      if (isApiError(e) && e.fields?.sets)
        setErrors((current) => ({ ...current, sets: t("matches.impossibleScore") }));
    }
  }

  const scoreInput = (label: string, value: string, onChange: (v: string) => void) => (
    <RNTextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChange}
      keyboardType="number-pad"
      maxLength={2}
      style={{
        width: 56,
        height: 46,
        textAlign: "center",
        borderRadius: radius.control,
        backgroundColor: colors.surface,
        color: colors.text,
        fontFamily: fonts.semibold,
        fontSize: 18,
      }}
    />
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text variant="bodyStrong">
          {formatSlot(booking.startsAt, booking.endsAt, intlLocale(i18n.language))}
        </Text>
        <Text variant="small" tone="muted">
          {[booking.club?.name, booking.court.name].filter(Boolean).join(" · ")}
        </Text>
      </Card>
      <Segmented<Format>
        label={t("matches.format")}
        value={format}
        onChange={(next) => {
          setFormat(next);
          setPicking(null);
        }}
        options={[
          { value: "singles", label: t("matches.singles") },
          { value: "doubles", label: t("matches.doubles") },
        ]}
      />
      <View style={{ gap: spacing.sm }}>
        {slots.map((slot) => (
          <View key={slot} style={{ gap: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${slotLabel[slot]}: ${players[slot]?.nickname ?? t("matches.choose")}`}
              onPress={() => setPicking(picking === slot ? null : slot)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 48 }}
            >
              <Text variant="label" tone="muted" style={{ width: 110 }}>
                {slotLabel[slot]}
              </Text>
              <Text variant="bodyStrong" tone={players[slot] ? "default" : "primary"} style={{ flex: 1 }}>
                {players[slot]?.nickname ?? t("matches.choose")}
              </Text>
            </Pressable>
            {picking === slot ? (
              <PlayerPicker
                suggestions={suggestions}
                exclude={chosenIds}
                onPick={(player) => {
                  setPlayers((current) => ({ ...current, [slot]: player }));
                  setPicking(null);
                }}
              />
            ) : null}
          </View>
        ))}
        {errors.players ? (
          <Text variant="small" tone="danger">
            {errors.players}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Text variant="label" tone="muted" style={{ flex: 1 }}>
            {t("matches.sets")}
          </Text>
          <Text variant="label" tone="muted" style={{ width: 56, textAlign: "center" }}>
            {t("matches.you")}
          </Text>
          <Text variant="label" tone="muted" style={{ width: 56, textAlign: "center" }}>
            {t("matches.them")}
          </Text>
        </View>
        {sets.map((set, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Text style={{ flex: 1 }}>{t("matches.setN", { n: i + 1 })}</Text>
            {scoreInput(t("matches.yourGames", { n: i + 1 }), set.mine, (v) => setScore(i, "mine", v))}
            {scoreInput(t("matches.theirGames", { n: i + 1 }), set.theirs, (v) => setScore(i, "theirs", v))}
          </View>
        ))}
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {sets.length < 5 ? (
            <Button
              variant="ghost"
              title={t("matches.addSet")}
              onPress={() => setSets((all) => [...all, { mine: "", theirs: "" }])}
            />
          ) : null}
          {sets.length > 1 ? (
            <Button
              variant="ghost"
              title={t("matches.removeSet")}
              onPress={() => setSets((all) => all.slice(0, -1))}
            />
          ) : null}
        </View>
        {errors.sets ? (
          <Text variant="small" tone="danger">
            {errors.sets}
          </Text>
        ) : null}
      </View>
      <Text variant="small" tone="muted">
        {t("matches.confirmNote")}
      </Text>
      {formError ? <Notice tone="error">{formError}</Notice> : null}
      <Button title={t("matches.save")} onPress={submit} loading={create.isPending} />
    </View>
  );
}

/** "Add result" on a past reservation: court and time come from the booking, players and sets are typed. */
export default function NewMatch() {
  const { t } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const booking = useGetBooking(bookingId ?? "", { query: { enabled: !!bookingId } });
  return (
    <Screen>
      <ScreenHeader
        title={t("matches.add")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack("/matches")} />}
      />
      {!bookingId ? (
        <PickBooking />
      ) : booking.data ? (
        <ResultForm booking={booking.data} />
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
    </Screen>
  );
}
