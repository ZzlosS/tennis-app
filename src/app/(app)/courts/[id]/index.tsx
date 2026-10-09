import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "@/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useDeleteCourt, useGetCourt, useInvalidate } from "@/api";
import { useAuth } from "@/auth";
import { confirm } from "@/components/confirm";
import { canManageCourt, useCourtMeta } from "@/components/courtText";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  CourtKindTag,
  ErrorState,
  LoadingState,
  Price,
  Screen,
  ScreenHeader,
  SurfaceTile,
  Text,
} from "@/ui";

/** A court on its own: a public or private court, or one court of a club. */
export default function CourtScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const court = useGetCourt(id);
  const errorMessage = useErrorMessage();
  const courtMeta = useCourtMeta();
  const invalidate = useInvalidate();
  const { spacing } = useTheme();
  const remove = useDeleteCourt();
  const [error, setError] = useState<string | null>(null);

  if (!court.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t("court.title")} />
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
      </Screen>
    );
  }

  const data = court.data;
  const mine = canManageCourt(data, me);

  async function onDelete() {
    const yes = await confirm({
      title: t("court.deleteTitle", { name: data.name }),
      message: t("court.deleteMessage"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!yes) return;
    setError(null);
    try {
      await remove.mutateAsync({ id: data.id });
      await invalidate("courts");
      goBack("/explore");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={data.name}
        subtitle={data.club ? data.club.name : `${data.address}, ${data.city}`}
      />
      <Card style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
        <SurfaceTile surface={data.surface} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <CourtKindTag kind={data.kind} />
          <Text variant="small" tone="muted">
            {courtMeta(data)}
          </Text>
          <Price price={data.pricePerHour} perHour />
        </View>
      </Card>
      {!data.active ? <Notice>{t("court.closed")}</Notice> : null}
      {data.active ? (
        <Button title={t("explore.reserve")} onPress={() => router.push(`/courts/${data.id}/reserve`)} />
      ) : null}
      {data.club ? (
        <Button
          variant="secondary"
          title={t("court.openClub", { club: data.club.name })}
          onPress={() => router.push(`/clubs/${data.club!.id}`)}
        />
      ) : null}
      {mine ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" tone="muted">
            {t("court.yourCourt")}
          </Text>
          <Button
            variant="secondary"
            title={t("common.edit")}
            onPress={() => router.push(`/courts/${data.id}/edit`)}
          />
          {data.kind !== "CLUB" ? (
            <Button
              variant="secondary"
              title={t("court.giveToClub")}
              onPress={() => router.push(`/courts/${data.id}/handover`)}
            />
          ) : null}
          <Button variant="ghost" title={t("common.delete")} onPress={onDelete} loading={remove.isPending} />
          {error ? <Notice tone="error">{error}</Notice> : null}
        </View>
      ) : null}
    </Screen>
  );
}
