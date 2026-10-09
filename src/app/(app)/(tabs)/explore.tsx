import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput as RNTextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPlaces, getGetPlacesQueryKey, usePagedList, type CourtKind, type PlaceResponse } from "@/api";
import { PagedList } from "@/components/PagedList";
import { PlaceCard, placeHref, useDistance } from "@/components/PlaceCard";
import { useLocation } from "@/location";
import { PlacesMap } from "@/map";
import { useTheme } from "@/theme";
import { Button, Card, Chip, CourtKindTag, Fab, IconButton, Segmented, Text } from "@/ui";

type Mode = "list" | "map";
type KindFilter = "ALL" | CourtKind;

const LIST_RADIUS_KM = 50;
const SEARCH_RADIUS_KM = 200;
const MAP_RADII_KM = [5, 25];

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function SearchBox({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const { t } = useTranslation();
  const { colors, fonts, fontSize, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        height: 50,
        borderRadius: 14,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
      }}
    >
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <RNTextInput
        accessibilityLabel={t("explore.search")}
        placeholder={t("explore.search")}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        returnKeyType="search"
        style={{ flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: fontSize.body }}
      />
    </View>
  );
}

function PlacesMapView({ kind, onList }: { kind?: CourtKind; onList: () => void }) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const distance = useDistance();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string>();
  const { latitude: lat, longitude: lng } = location.coords;
  // Nothing within 5 km: look a little further before showing an empty map.
  const places = useQuery({
    queryKey: [...getGetPlacesQueryKey({ lat, lng, kind }), "nearest"],
    enabled: location.source !== "loading",
    queryFn: async ({ signal }) => {
      let result = { radiusKm: MAP_RADII_KM[0]!, items: [] as PlaceResponse[] };
      for (const radiusKm of MAP_RADII_KM) {
        const page = await getPlaces({ lat, lng, kind, radiusKm, limit: 100 }, { signal });
        result = { radiusKm, items: page.items };
        if (page.items.length > 0) break;
      }
      return result;
    },
  });
  const items = places.data?.items ?? [];
  const radiusKm = places.data?.radiusKm ?? MAP_RADII_KM[0]!;

  const selected: PlaceResponse | undefined = items.find((p) => p.id === selectedId) ?? items[0];

  return (
    <View style={{ flex: 1 }}>
      <PlacesMap
        center={location.coords}
        me={location.source === "device" ? location.coords : undefined}
        pins={items}
        selectedId={selected?.id}
        onSelect={setSelectedId}
      />
      <View
        style={{
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          top: spacing.lg,
          flexDirection: "row",
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 50,
            borderRadius: radius.pill,
            backgroundColor: colors.card,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            boxShadow: "0 4px 16px rgba(17,20,24,0.10)",
          }}
        >
          <Text variant="bodyStrong">
            {location.source === "device" ? t("explore.nearYou") : t("explore.nearBelgrade")}
          </Text>
          <Text variant="small" tone="muted">
            {t("explore.within", { km: radiusKm })}
          </Text>
        </View>
        <IconButton icon="list" label={t("explore.showList")} tone="card" size={50} onPress={onList} />
      </View>
      {selected ? (
        <Card
          style={{
            position: "absolute",
            left: spacing.md,
            right: spacing.md,
            bottom: spacing.md,
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="h2">{selected.name}</Text>
              <Text variant="small" tone="muted">
                {`${selected.address}, ${selected.city}`}
              </Text>
            </View>
            <Text variant="small" tone="muted">
              {distance(selected.distanceKm)}
            </Text>
          </View>
          <CourtKindTag kind={selected.kind} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button
              style={{ flex: 1 }}
              variant="secondary"
              title={selected.kind === "CLUB" ? t("explore.viewCourts") : t("explore.viewCourt")}
              onPress={() => router.push(placeHref(selected))}
            />
            <Button
              style={{ flex: 1 }}
              title={t("explore.reserve")}
              onPress={() =>
                router.push(
                  selected.kind === "CLUB" ? `/clubs/${selected.id}` : `/courts/${selected.id}/reserve`,
                )
              }
            />
          </View>
        </Card>
      ) : places.isSuccess ? (
        <Card style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md }}>
          <Text tone="muted">{t("explore.nothingNear")}</Text>
        </Card>
      ) : null}
    </View>
  );
}

export default function Explore() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const params = useLocalSearchParams<{ view?: string }>();
  // The view lives in the URL, so Home's "Map" link opens the map.
  const view: Mode = params.view === "map" ? "map" : "list";
  const setView = (next: Mode) => router.setParams({ view: next });
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim());
  const location = useLocation(view === "list");

  const placesParams = {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    radiusKm: q ? SEARCH_RADIUS_KM : LIST_RADIUS_KM,
    kind: kind === "ALL" ? undefined : kind,
    q: q || undefined,
  };
  const list = usePagedList(
    getGetPlacesQueryKey(placesParams),
    (page, signal) => getPlaces({ ...placesParams, ...page }, { signal }),
    { enabled: view === "list" && location.source !== "loading" },
  );

  const chips: { value: KindFilter; label: string }[] = [
    { value: "ALL", label: t("explore.all") },
    { value: "CLUB", label: t("explore.clubs") },
    { value: "PUBLIC", label: t("courtKind.PUBLIC") },
    { value: "PRIVATE", label: t("courtKind.PRIVATE") },
  ];

  const header = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Text variant="h1" style={{ flex: 1 }}>
          {t("tabs.explore")}
        </Text>
        <View style={{ width: 160 }}>
          <Segmented<Mode>
            label={t("explore.view")}
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: t("explore.list") },
              { value: "map", label: t("explore.map") },
            ]}
          />
        </View>
      </View>
      {view === "list" ? <SearchBox value={query} onChange={setQuery} /> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {chips.map((chip) => (
          <Chip
            key={chip.value}
            label={chip.label}
            selected={kind === chip.value}
            onPress={() => setKind(chip.value)}
          />
        ))}
      </View>
      {view === "list" && location.source === "fallback" ? (
        <Text variant="small" tone="muted">
          {t("explore.noLocation")}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      {view === "list" ? (
        <>
          <PagedList
            list={list}
            header={header}
            keyOf={(place) => `${place.kind}-${place.id}`}
            renderItem={(place) => <PlaceCard place={place} onPress={() => router.push(placeHref(place))} />}
            emptyTitle={q ? t("explore.noMatches") : t("explore.nothingNear")}
            emptyMessage={t("explore.addHint")}
            contentStyle={{ paddingBottom: 96 }}
          />
          <Fab icon="add" label={t("explore.addCourt")} onPress={() => router.push("/courts/new")} />
        </>
      ) : (
        <>
          <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>{header}</View>
          <PlacesMapView kind={kind === "ALL" ? undefined : kind} onList={() => setView("list")} />
        </>
      )}
    </SafeAreaView>
  );
}
