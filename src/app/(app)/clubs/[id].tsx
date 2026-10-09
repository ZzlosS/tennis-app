import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useGetClub } from "@/api";
import { useCourtMeta } from "@/components/courtText";
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

export default function ClubScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useGetClub(id);
  const errorMessage = useErrorMessage();
  const courtMeta = useCourtMeta();
  const { colors, spacing, radius } = useTheme();

  if (!club.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t("club.title")} />
        {club.error ? (
          <ErrorState
            title={t("common.somethingWrong")}
            message={errorMessage(club.error)}
            retryLabel={t("common.retry")}
            onRetry={() => void club.refetch()}
          />
        ) : (
          <LoadingState label={t("common.loading")} />
        )}
      </Screen>
    );
  }

  const data = club.data;
  const courts = data.courts.filter((court) => court.active);
  return (
    <Screen>
      <ScreenHeader title={data.name} subtitle={`${data.address}, ${data.city}`} />
      <CourtKindTag kind="CLUB" />
      {data.description ? <Text tone="muted">{data.description}</Text> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: colors.courtPublic.background,
          borderRadius: radius.control,
          padding: spacing.md,
        }}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.courtPublic.text} />
        <Text variant="small" style={{ color: colors.courtPublic.text, flex: 1 }}>
          {t("club.payHere", { currency: data.currency })}
        </Text>
      </View>
      <Text variant="h2">{t("club.courts")}</Text>
      {courts.length === 0 ? <Text tone="muted">{t("club.noCourts")}</Text> : null}
      {courts.map((court) => (
        <Card key={court.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <SurfaceTile surface={court.surface} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{court.name}</Text>
            <Text variant="small" tone="muted">
              {courtMeta(court)}
            </Text>
            <Price price={court.pricePerHour} perHour />
          </View>
          <Button
            title={t("explore.reserve")}
            accessibilityLabel={t("club.reserveCourt", { court: court.name })}
            onPress={() => router.push(`/courts/${court.id}/reserve`)}
            style={{ height: 42, borderRadius: 21, paddingHorizontal: 18 }}
          />
        </Card>
      ))}
    </Screen>
  );
}
