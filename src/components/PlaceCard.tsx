import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { PlaceResponse } from "@/api";
import { useTheme } from "@/theme";
import { Card, CourtKindTag, Text } from "@/ui";

/** "1.2 km" or "850 m". */
export function useDistance() {
  const { i18n } = useTranslation();
  return (km: number) =>
    km < 1
      ? `${Math.round(km * 1000)} m`
      : `${new Intl.NumberFormat(i18n.language === "sr" ? "sr-Latn-RS" : "en-GB", { maximumFractionDigits: 1 }).format(km)} km`;
}

/** One club or court in the Explore list. */
export function PlaceCard({ place, onPress }: { place: PlaceResponse; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const distance = useDistance();
  const meta =
    place.kind === "CLUB"
      ? `${place.address}, ${place.city} · ${t("explore.courts", { count: place.courtCount })}`
      : `${place.address}, ${place.city}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={place.name} onPress={onPress}>
      {({ pressed }) => (
        <Card
          style={{ flexDirection: "row", gap: spacing.md, alignItems: "center", opacity: pressed ? 0.7 : 1 }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              backgroundColor: {
                CLUB: colors.courtClub,
                PUBLIC: colors.courtPublic,
                PRIVATE: colors.courtPrivate,
              }[place.kind].background,
            }}
          />
          <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {place.name}
            </Text>
            <Text variant="small" tone="muted" numberOfLines={2}>
              {meta}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <CourtKindTag kind={place.kind} />
              <Text variant="small" tone="muted" style={{ marginLeft: "auto" }}>
                {distance(place.distanceKm)}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

/** Where a place opens: a club page, or the court itself. */
export function placeHref(place: Pick<PlaceResponse, "id" | "kind">) {
  return place.kind === "CLUB" ? (`/clubs/${place.id}` as const) : (`/courts/${place.id}` as const);
}
