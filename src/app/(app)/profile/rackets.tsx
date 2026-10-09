import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getGetRacketsQueryKey,
  getRackets,
  useAddRacket,
  useGetPlayerRackets,
  useInvalidate,
  usePagedList,
  useRemoveRacket,
  type RacketResponse,
} from "@/api";
import { useAuth } from "@/auth";
import { Notice } from "@/components/Notice";
import { PagedList } from "@/components/PagedList";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Button, Card, IconButton, ListRow, ScreenHeader, Text } from "@/ui";

const describe = (racket: RacketResponse) => `${racket.brand} ${racket.model}`;

/** The player's rackets, picked from the shared list that admins keep. */
export default function Rackets() {
  const { t } = useTranslation();
  const { me } = useAuth();
  const playerId = me?.id ?? "";
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const mine = useGetPlayerRackets(playerId, { limit: 50 }, { query: { enabled: me != null } });
  const catalog = usePagedList(getGetRacketsQueryKey(), (page, signal) => getRackets(page, { signal }));
  const add = useAddRacket();
  const remove = useRemoveRacket();
  const [error, setError] = useState<string | null>(null);
  const owned = new Set((mine.data?.items ?? []).map((r) => r.id));

  async function toggle(racket: RacketResponse) {
    setError(null);
    try {
      if (owned.has(racket.id)) await remove.mutateAsync({ playerId, racketId: racket.id });
      else await add.mutateAsync({ playerId, racketId: racket.id });
      await invalidate("profile");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <ScreenHeader title={t("profile.rackets")} />
      <Text variant="label" tone="muted">
        {t("rackets.mine")}
      </Text>
      {mine.data && mine.data.items.length === 0 ? <Text tone="muted">{t("rackets.none")}</Text> : null}
      {(mine.data?.items ?? []).map((racket) => (
        <Card key={racket.id}>
          <ListRow
            title={describe(racket)}
            subtitle={t("rackets.details", {
              year: racket.year,
              weight: racket.weight,
              head: racket.headSizeInch,
            })}
            right={
              <IconButton
                icon="remove-circle-outline"
                label={t("rackets.remove", { racket: describe(racket) })}
                onPress={() => toggle(racket)}
              />
            }
          />
        </Card>
      ))}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Text variant="label" tone="muted">
        {t("rackets.all")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        list={catalog}
        header={header}
        keyOf={(racket) => racket.id}
        emptyTitle={t("rackets.catalogEmpty")}
        renderItem={(racket) => (
          <Card>
            <ListRow
              title={describe(racket)}
              subtitle={t("rackets.details", {
                year: racket.year,
                weight: racket.weight,
                head: racket.headSizeInch,
              })}
              right={
                owned.has(racket.id) ? (
                  <Text variant="label" tone="primary">
                    {t("rackets.yours")}
                  </Text>
                ) : (
                  <Button
                    title={t("profile.add")}
                    accessibilityLabel={t("rackets.add", { racket: describe(racket) })}
                    variant="secondary"
                    style={{ height: 36, paddingHorizontal: 14 }}
                    onPress={() => toggle(racket)}
                  />
                )
              }
            />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
