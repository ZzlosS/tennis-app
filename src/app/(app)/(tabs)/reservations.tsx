import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getGetMyBookingsQueryKey, getMyBookings, usePagedList, type BookingWhen } from "@/api";
import { BookingCard } from "@/components/BookingCard";
import { PagedList } from "@/components/PagedList";
import { useTheme } from "@/theme";
import { Segmented, Text } from "@/ui";

export default function Reservations() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [when, setWhen] = useState<BookingWhen>("upcoming");
  const list = usePagedList(getGetMyBookingsQueryKey({ when }), (page, signal) =>
    getMyBookings({ when, ...page }, { signal }),
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        list={list}
        header={
          <View style={{ gap: spacing.lg }}>
            <Text variant="h1">{t("tabs.reservations")}</Text>
            <Segmented<BookingWhen>
              label={t("reservations.when")}
              value={when}
              onChange={setWhen}
              options={[
                { value: "upcoming", label: t("reservations.upcoming") },
                { value: "past", label: t("reservations.past") },
              ]}
            />
          </View>
        }
        keyOf={(booking) => booking.id}
        renderItem={(booking) => <BookingCard booking={booking} past={when === "past"} />}
        emptyTitle={when === "upcoming" ? t("reservations.noneUpcoming") : t("reservations.nonePast")}
        emptyMessage={when === "upcoming" ? t("reservations.noneUpcomingHint") : undefined}
      />
    </SafeAreaView>
  );
}
