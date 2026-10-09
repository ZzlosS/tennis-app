import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  useConfirmMatch,
  useDisputeMatch,
  useInvalidate,
  type MatchResponse,
  type PlayerSummary,
} from "@/api";
import { useAuth } from "@/auth";
import { useErrorMessage } from "@/errors";
import { formatDate } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Badge, Button, Card, Text, type BadgeTone } from "@/ui";
import { Notice } from "./Notice";

/** Which team the player is on, whether that team won, and whether they are the ones to answer. */
export function matchView(match: MatchResponse, meId: string | undefined) {
  const inFirst = match.firstTeam.some((p) => p.id === meId);
  const inSecond = match.secondTeam.some((p) => p.id === meId);
  const firstSets = match.sets.filter((s) => s.firstTeam > s.secondTeam).length;
  const firstWon = firstSets * 2 > match.sets.length;
  const won = inFirst ? firstWon : inSecond ? !firstWon : null;
  const enteredByFirst = match.firstTeam.some((p) => p.id === match.createdBy.id);
  const canAnswer =
    match.status === "PENDING" && ((inFirst && !enteredByFirst) || (inSecond && enteredByFirst));
  return { won, firstWon, canAnswer };
}

function TeamRow({ players, scores, bold }: { players: PlayerSummary[]; scores: number[]; bold: boolean }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <Text variant={bold ? "bodyStrong" : "body"} style={{ flex: 1 }} numberOfLines={1}>
        {players.map((p) => p.nickname).join(" / ")}
      </Text>
      {scores.map((score, i) => (
        <Text key={i} variant={bold ? "bodyStrong" : "body"} style={{ width: 20, textAlign: "center" }}>
          {String(score)}
        </Text>
      ))}
    </View>
  );
}

/** One match with its set scores, and Confirm or Dispute when it waits for this player's team. */
export function MatchCard({ match, linked = true }: { match: MatchResponse; linked?: boolean }) {
  const { t, i18n } = useTranslation();
  const { me } = useAuth();
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const confirm = useConfirmMatch();
  const dispute = useDisputeMatch();
  const [error, setError] = useState<string | null>(null);
  const view = matchView(match, me?.id);
  const meta = [formatDate(match.playedAt, intlLocale(i18n.language)), match.club?.name, match.court.name]
    .filter(Boolean)
    .join(" · ");
  const badge: { label: string; tone: BadgeTone } =
    match.status === "PENDING"
      ? { label: t("matches.pending"), tone: "warning" }
      : match.status === "DISPUTED"
        ? { label: t("matches.disputed"), tone: "warning" }
        : view.won === true
          ? { label: t("matches.won"), tone: "positive" }
          : view.won === false
            ? { label: t("matches.lost"), tone: "neutral" }
            : { label: t("matches.confirmed"), tone: "neutral" };

  const answer = async (yes: boolean) => {
    setError(null);
    try {
      await (yes ? confirm : dispute).mutateAsync({ id: match.id });
      await invalidate("matches");
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const body = (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text variant="small" tone="muted" style={{ flex: 1 }}>
          {meta}
        </Text>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <TeamRow players={match.firstTeam} scores={match.sets.map((s) => s.firstTeam)} bold={view.firstWon} />
      <TeamRow
        players={match.secondTeam}
        scores={match.sets.map((s) => s.secondTeam)}
        bold={!view.firstWon}
      />
    </View>
  );

  return (
    <Card style={{ gap: spacing.md }}>
      {linked ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/matches/${match.id}`)}>
          {body}
        </Pressable>
      ) : (
        body
      )}
      {view.canAnswer ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="small" tone="muted">
            {t("matches.waitingForYou", { player: match.createdBy.nickname })}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button
              style={{ flex: 1 }}
              title={t("matches.confirm")}
              loading={confirm.isPending}
              onPress={() => answer(true)}
            />
            <Button
              style={{ flex: 1 }}
              variant="secondary"
              title={t("matches.dispute")}
              loading={dispute.isPending}
              onPress={() => answer(false)}
            />
          </View>
        </View>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Card>
  );
}
