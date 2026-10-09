import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, View } from "react-native";

import {
  getGetClubCourtsQueryKey,
  getGetMyCourtHandoversQueryKey,
  useAccept,
  useDecline,
  useGetClub,
  useGetClubCourts,
  useGetMyCourtHandovers,
  useInvalidate,
  useUpdateClub,
  useUpdateCourt,
  type CourtResponse,
  type HandoverResponse,
} from "@/api";
import { Choice } from "@/components/Choice";
import { useCourtMeta } from "@/components/courtText";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatMoney } from "@/format";
import { intlLocale } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Card, ListRow, LoadingState, Screen, SurfaceTile, Text } from "@/ui";

const CURRENCIES = ["RSD", "EUR"];

function HandoverCard({ handover, onError }: { handover: HandoverResponse; onError: (e: unknown) => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const accept = useAccept();
  const decline = useDecline();
  const answer = async (yes: boolean) => {
    try {
      await (yes ? accept : decline).mutateAsync({ id: handover.id });
      await invalidate("courts");
    } catch (e) {
      onError(e);
    }
  };
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="bodyStrong">
        {t("clubAdmin.handoverAsk", { owner: handover.requestedBy.nickname, court: handover.court.name })}
      </Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button
          style={{ flex: 1 }}
          title={t("clubAdmin.accept")}
          loading={accept.isPending}
          onPress={() => answer(true)}
        />
        <Button
          style={{ flex: 1 }}
          variant="secondary"
          title={t("clubAdmin.decline")}
          loading={decline.isPending}
          onPress={() => answer(false)}
        />
      </View>
    </Card>
  );
}

function CourtRow({
  court,
  clubId,
  onError,
}: {
  court: CourtResponse;
  clubId: string;
  onError: (e: unknown) => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const courtMeta = useCourtMeta();
  const invalidate = useInvalidate();
  const update = useUpdateCourt();
  const price = formatMoney(court.pricePerHour, intlLocale(i18n.language));
  const state = court.active ? t("clubAdmin.open") : t("clubAdmin.closed");
  return (
    <Card>
      <ListRow
        left={<SurfaceTile surface={court.surface} />}
        title={court.name}
        subtitle={`${courtMeta(court)} · ${price ? t("booking.perHour", { price }) : t("booking.free")}`}
        detail={state}
        accessibilityLabel={t("clubAdmin.editCourt", { court: court.name })}
        onPress={() => router.push(`/club-admin/${clubId}/court/${court.id}`)}
        right={
          <Switch
            accessibilityLabel={t("clubAdmin.openFor", { court: court.name })}
            value={court.active}
            disabled={update.isPending}
            onValueChange={async (active) => {
              try {
                await update.mutateAsync({ id: court.id, data: { active } });
                await invalidate("courts");
              } catch (e) {
                onError(e);
              }
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.card}
          />
        }
      />
    </Card>
  );
}

export default function ClubCourts() {
  const { t } = useTranslation();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const { spacing } = useTheme();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidate();
  const club = useGetClub(clubId);
  const courtsParams = { limit: 100 };
  const courts = useGetClubCourts(clubId, courtsParams, {
    query: { queryKey: getGetClubCourtsQueryKey(clubId, courtsParams) },
  });
  const handoverParams = { status: "PENDING" as const, limit: 50 };
  const handovers = useGetMyCourtHandovers(handoverParams, {
    query: { queryKey: getGetMyCourtHandoversQueryKey(handoverParams) },
  });
  const updateClub = useUpdateClub();
  const [error, setError] = useState<string | null>(null);
  const onError = (e: unknown) => setError(errorMessage(e));

  const incoming = (handovers.data?.items ?? []).filter((h) => h.club.id === clubId);

  return (
    <Screen>
      <View>
        <Text variant="small" tone="muted">
          {t("clubAdmin.header", { club: club.data?.name ?? "" })}
        </Text>
        <Text variant="h1">{t("clubAdmin.courts")}</Text>
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {incoming.map((handover) => (
        <HandoverCard key={handover.id} handover={handover} onError={onError} />
      ))}
      {club.data ? (
        <Choice
          label={t("clubAdmin.currency")}
          value={club.data.currency}
          onChange={async (currency) => {
            try {
              await updateClub.mutateAsync({ id: clubId, data: { currency } });
              await invalidate("courts");
            } catch (e) {
              onError(e);
            }
          }}
          options={CURRENCIES.map((value) => ({ value, label: value }))}
        />
      ) : null}
      {courts.isLoading ? <LoadingState label={t("common.loading")} /> : null}
      <View style={{ gap: spacing.sm }}>
        {(courts.data?.items ?? []).map((court) => (
          <CourtRow key={court.id} court={court} clubId={clubId} onError={onError} />
        ))}
      </View>
      <Button
        title={t("clubAdmin.addCourt")}
        onPress={() => router.push(`/club-admin/${clubId}/court/new`)}
      />
    </Screen>
  );
}
