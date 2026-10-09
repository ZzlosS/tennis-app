import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getClubs,
  getGetClubsQueryKey,
  useGetCourt,
  useInvalidate,
  usePagedList,
  useRequestHandover,
} from "@/api";
import { confirm } from "@/components/confirm";
import { Notice } from "@/components/Notice";
import { PagedList } from "@/components/PagedList";
import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { Card, IconButton, ListRow, ScreenHeader, Text } from "@/ui";

/** "Give to a club": the owner picks a club, and the club's admins accept or decline. */
export default function Handover() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const court = useGetCourt(id);
  const request = useRequestHandover();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const { colors, spacing } = useTheme();
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const city = court.data?.city;
  const clubs = usePagedList(
    getGetClubsQueryKey({ city }),
    (page, signal) => getClubs({ city, ...page }, { signal }),
    { enabled: court.data != null },
  );

  async function give(clubId: string, clubName: string) {
    const yes = await confirm({
      title: t("handover.confirmTitle", { club: clubName }),
      message: t("handover.confirmMessage"),
      confirmLabel: t("handover.send"),
      cancelLabel: t("common.cancel"),
    });
    if (!yes) return;
    setError(null);
    try {
      await request.mutateAsync({ id, data: { clubId } });
      await invalidate("courts");
      setSent(clubName);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <ScreenHeader
        title={t("court.giveToClub")}
        subtitle={court.data?.name}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack()} />}
      />
      <Text tone="muted">{t("handover.explain")}</Text>
      {sent ? <Notice>{t("handover.sent", { club: sent })}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {city ? (
        <Text variant="label" tone="muted">
          {t("handover.clubsIn", { city })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        list={clubs}
        header={header}
        keyOf={(club) => club.id}
        emptyTitle={t("handover.noClubs")}
        renderItem={(club) => (
          <Card>
            <ListRow
              title={club.name}
              subtitle={`${club.address}, ${club.city}`}
              accessibilityLabel={club.name}
              onPress={sent ? undefined : () => give(club.id, club.name)}
              right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
