import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, router } from "expo-router";
import { useTranslation } from "react-i18next";

import { getGetMyClubsQueryKey, useGetMyClubs } from "@/api";
import { useTheme } from "@/theme";
import { Card, EmptyState, ListRow, LoadingState, Screen, ScreenHeader } from "@/ui";

/** A club admin with several clubs picks one; with one club it opens straight away. */
export default function PickClub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = { limit: 50 };
  const clubs = useGetMyClubs(params, { query: { queryKey: getGetMyClubsQueryKey(params) } });
  const items = clubs.data?.items ?? [];
  if (items.length === 1) return <Redirect href={`/club-admin/${items[0]!.id}/today`} />;
  return (
    <Screen>
      <ScreenHeader title={t("clubAdmin.pickClub")} />
      {clubs.isLoading ? <LoadingState label={t("common.loading")} /> : null}
      {clubs.isSuccess && items.length === 0 ? <EmptyState title={t("clubAdmin.noClubs")} /> : null}
      {items.map((club) => (
        <Card key={club.id}>
          <ListRow
            title={club.name}
            subtitle={`${club.address}, ${club.city}`}
            onPress={() => router.push(`/club-admin/${club.id}/today`)}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
        </Card>
      ))}
    </Screen>
  );
}
