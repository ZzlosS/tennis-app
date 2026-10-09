import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getGetMyMatchesQueryKey, getMyMatches, useGetMyStats, usePagedList } from "@/api";
import { MatchCard } from "@/components/MatchCard";
import { PagedList } from "@/components/PagedList";
import { useTheme } from "@/theme";
import { Button, Card, ScreenHeader, Text } from "@/ui";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Card
      style={{ flex: 1, alignItems: "center", gap: 2 }}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="h1">{String(value)}</Text>
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </Card>
  );
}

export default function Matches() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const stats = useGetMyStats();
  const list = usePagedList(getGetMyMatchesQueryKey(), (page, signal) => getMyMatches(page, { signal }));

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        list={list}
        header={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader title={t("matches.title")} />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Stat value={stats.data?.matches ?? 0} label={t("matches.played")} />
              <Stat value={stats.data?.wins ?? 0} label={t("matches.won")} />
              <Stat value={stats.data?.losses ?? 0} label={t("matches.lost")} />
            </View>
            <Button title={t("matches.add")} onPress={() => router.push("/matches/new")} />
          </View>
        }
        keyOf={(match) => match.id}
        renderItem={(match) => <MatchCard match={match} />}
        emptyTitle={t("matches.none")}
        emptyMessage={t("matches.noneHint")}
      />
    </SafeAreaView>
  );
}
