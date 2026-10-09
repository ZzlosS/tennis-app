import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useDeletePartnerRequest, useGetPartnerRequest, useInvalidate, useUpdatePartnerRequest } from "@/api";
import { useAuth } from "@/auth";
import { Choice } from "@/components/Choice";
import { confirm } from "@/components/confirm";
import { Notice } from "@/components/Notice";
import { partnerState, useJoinLeave, useWhen } from "@/components/PartnerRow";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { useTheme } from "@/theme";
import { Avatar, Button, Card, ErrorState, ListRow, LoadingState, Screen, ScreenHeader, Text } from "@/ui";

export default function PartnerRequestDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const request = useGetPartnerRequest(id);
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidate();
  const when = useWhen();
  const { spacing } = useTheme();
  const { busy, run } = useJoinLeave();
  const update = useUpdatePartnerRequest();
  const remove = useDeletePartnerRequest();
  const [error, setError] = useState<string | null>(null);

  if (!request.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t("partners.request")} />
        {request.error ? (
          <ErrorState
            title={t("common.somethingWrong")}
            message={errorMessage(request.error)}
            retryLabel={t("common.retry")}
            onRetry={() => void request.refetch()}
          />
        ) : (
          <LoadingState label={t("common.loading")} />
        )}
      </Screen>
    );
  }

  const r = request.data;
  const state = partnerState(r, me?.id);
  const attempt = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  async function close() {
    const yes = await confirm({
      title: t("partners.closeTitle"),
      message: t("partners.closeMessage"),
      confirmLabel: t("partners.close"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!yes) return;
    await attempt(async () => {
      await remove.mutateAsync({ id: r.id });
      await invalidate("partners");
      goBack("/partners");
    });
  }

  return (
    <Screen>
      <ScreenHeader
        title={when(r)}
        subtitle={[r.booking.club?.name, r.booking.court.name].filter(Boolean).join(" · ")}
      />
      <Card style={{ gap: spacing.sm }}>
        <ListRow
          left={<Avatar name={r.createdBy.nickname} size={44} />}
          title={r.createdBy.nickname}
          subtitle={t(`level.${r.createdBy.level}`)}
          detail={t("partners.organiser")}
        />
        <Text>
          {r.level ? t("partners.wantsLevel", { level: t(`level.${r.level}`) }) : t("partners.anyLevel")}
        </Text>
        <Text variant="bodyStrong" tone="primary">
          {r.spotsLeft > 0
            ? t("partners.spotsLeft", { left: r.spotsLeft, needed: r.playersNeeded })
            : t("partners.full")}
        </Text>
      </Card>
      <Text variant="h2">{t("partners.joinedPlayers")}</Text>
      {r.joined.length === 0 ? <Text tone="muted">{t("partners.nobodyYet")}</Text> : null}
      {r.joined.map((player) => (
        <ListRow
          key={player.id}
          left={<Avatar name={player.nickname} size={40} />}
          title={player.nickname}
          subtitle={t(`level.${player.level}`)}
        />
      ))}
      {state.canJoin ? (
        <Button title={t("partners.join")} loading={busy} onPress={() => attempt(() => run(r.id, "join"))} />
      ) : null}
      {state.canLeave ? (
        <Button
          variant="secondary"
          title={t("partners.leave")}
          loading={busy}
          onPress={() => attempt(() => run(r.id, "leave"))}
        />
      ) : null}
      {state.mine || me?.role === "ADMIN" ? (
        <View style={{ gap: spacing.md }}>
          <Choice<"1" | "3">
            label={t("partners.playersNeeded")}
            value={String(r.playersNeeded) as "1" | "3"}
            onChange={(value) =>
              attempt(async () => {
                await update.mutateAsync({ id: r.id, data: { playersNeeded: Number(value) } });
                await invalidate("partners");
              })
            }
            options={[
              { value: "1", label: t("partners.singles") },
              { value: "3", label: t("partners.doubles") },
            ]}
          />
          <Button variant="ghost" title={t("partners.close")} loading={remove.isPending} onPress={close} />
        </View>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Screen>
  );
}
