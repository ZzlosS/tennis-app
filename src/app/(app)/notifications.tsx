import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getGetMyNotificationsQueryKey,
  getMyNotifications,
  useInvalidate,
  useMarkMyNotificationsRead,
  usePagedList,
  type NotificationResponse,
} from "@/api";
import { PagedList } from "@/components/PagedList";
import { formatDate, formatTime } from "@/format";
import { intlLocale } from "@/i18n";
import { routeFor } from "@/notifications";
import { useTheme } from "@/theme";
import { Card, ScreenHeader, Text } from "@/ui";

function Row({ item }: { item: NotificationResponse }) {
  const { i18n } = useTranslation();
  const { colors, spacing } = useTheme();
  const locale = intlLocale(i18n.language);
  const href = routeFor(item.data);
  return (
    <Pressable accessibilityRole="button" disabled={!href} onPress={() => href && router.push(href)}>
      <Card style={{ flexDirection: "row", gap: spacing.md }}>
        <View
          accessibilityLabel={item.read ? undefined : "unread"}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginTop: 8,
            backgroundColor: item.read ? "transparent" : colors.primary,
          }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{item.title}</Text>
          <Text tone="muted">{item.body}</Text>
          <Text variant="small" tone="muted">
            {`${formatDate(item.createdAt, locale)}, ${formatTime(item.createdAt, locale)}`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

/** Everything the player was sent, newest first, so a missed push is not lost. */
export default function Notifications() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const markRead = useMarkMyNotificationsRead();
  const list = usePagedList(getGetMyNotificationsQueryKey(), (page, signal) =>
    getMyNotifications(page, { signal }),
  );
  const loaded = !list.isLoading;
  const { mutateAsync } = markRead;

  // Opening the inbox reads everything in it; the dots stay until the next visit.
  useEffect(() => {
    if (!loaded) return;
    void mutateAsync()
      .then(() => invalidate("notifications"))
      .catch(() => {});
  }, [loaded, mutateAsync, invalidate]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        list={list}
        header={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader title={t("notifications.title")} />
          </View>
        }
        keyOf={(item) => item.id}
        renderItem={(item) => <Row item={item} />}
        emptyTitle={t("notifications.empty")}
        emptyMessage={t("notifications.emptyHint")}
      />
    </SafeAreaView>
  );
}
