import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  useInvalidate,
  useJoinPartnerRequest,
  useLeavePartnerRequest,
  type PartnerRequestResponse,
} from "@/api";
import { useAuth } from "@/auth";
import { useErrorMessage } from "@/errors";
import { formatDate, formatTime } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Avatar, Button, Card, Text } from "@/ui";
import { Notice } from "./Notice";

/** What the signed-in player can do with a request. */
export function partnerState(request: PartnerRequestResponse, meId: string | undefined) {
  const mine = request.createdBy.id === meId;
  const joined = request.joined.some((player) => player.id === meId);
  const open = request.status === "OPEN" && request.spotsLeft > 0;
  return { mine, joined, canJoin: !mine && !joined && open, canLeave: joined };
}

/** Join or leave, refreshing every list that shows requests. */
export function useJoinLeave() {
  const invalidate = useInvalidate();
  const join = useJoinPartnerRequest();
  const leave = useLeavePartnerRequest();
  return {
    busy: join.isPending || leave.isPending,
    run: async (id: string, action: "join" | "leave") => {
      await (action === "join" ? join : leave).mutateAsync({ id });
      await invalidate("partners");
    },
  };
}

/** "Sat 11 Oct · 10:00". */
export function useWhen() {
  const { i18n } = useTranslation();
  const locale = intlLocale(i18n.language);
  return (request: PartnerRequestResponse) =>
    `${formatDate(request.booking.startsAt, locale)} · ${formatTime(request.booking.startsAt, locale)}`;
}

/** One open game in the Partners list or on Home. */
export function PartnerRow({ request }: { request: PartnerRequestResponse }) {
  const { t } = useTranslation();
  const { me } = useAuth();
  const { spacing } = useTheme();
  const errorMessage = useErrorMessage();
  const when = useWhen();
  const { busy, run } = useJoinLeave();
  const [error, setError] = useState<string | null>(null);
  const state = partnerState(request, me?.id);
  const where = request.booking.club?.name ?? request.booking.court.name;
  const level = request.level ? t(`level.${request.level}`) : t("partners.anyLevel");

  const act = async (action: "join" | "leave") => {
    setError(null);
    try {
      await run(request.id, action);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("partners.openGame", {
            player: request.createdBy.nickname,
            when: when(request),
          })}
          onPress={() => router.push(`/partners/${request.id}`)}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md }}
        >
          <Avatar name={request.createdBy.nickname} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{when(request)}</Text>
            <Text variant="small" tone="muted" numberOfLines={2}>
              {`${request.createdBy.nickname} · ${level} · ${where}`}
            </Text>
            <Text variant="small" tone="primary">
              {request.spotsLeft > 0
                ? t("partners.spotsLeft", { left: request.spotsLeft, needed: request.playersNeeded })
                : t("partners.full")}
            </Text>
          </View>
        </Pressable>
        {state.canJoin ? (
          <Button
            title={t("partners.join")}
            style={{ height: 40, paddingHorizontal: 16 }}
            loading={busy}
            onPress={() => act("join")}
          />
        ) : state.canLeave ? (
          <Button
            variant="secondary"
            title={t("partners.leave")}
            style={{ height: 40, paddingHorizontal: 16 }}
            loading={busy}
            onPress={() => act("leave")}
          />
        ) : state.mine ? (
          <Text variant="label" tone="muted">
            {t("partners.yours")}
          </Text>
        ) : null}
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Card>
  );
}
