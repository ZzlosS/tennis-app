import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getGetMyPartnerRequestsQueryKey,
  getGetPartnerRequestsQueryKey,
  getMyPartnerRequests,
  getPartnerRequests,
  usePagedList,
  type GetPartnerRequestsParams,
} from "@/api";
import { useAuth } from "@/auth";
import { PagedList } from "@/components/PagedList";
import { PartnerRow } from "@/components/PartnerRow";
import { addDays, localDate, useNow } from "@/format";
import { useTheme } from "@/theme";
import { Chip, Segmented, Text } from "@/ui";

type Tab = "open" | "mine";

export default function Partners() {
  const { t } = useTranslation();
  const { me } = useAuth();
  const { spacing } = useTheme();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("open");
  const [myLevel, setMyLevel] = useState(false);
  const [thisWeek, setThisWeek] = useState(false);
  const [doubles, setDoubles] = useState(false);

  // Hour-rounded so the query key stays put between renders.
  const fromHour = new Date(Math.floor(now / 3_600_000) * 3_600_000);
  const params: GetPartnerRequestsParams = {
    status: "OPEN",
    from: fromHour.toISOString(),
    ...(myLevel && me ? { level: me.level } : {}),
    ...(thisWeek ? { to: `${addDays(localDate(fromHour), 7)}T00:00:00Z` } : {}),
    ...(doubles ? { doubles: true } : {}),
  };
  const open = usePagedList(
    getGetPartnerRequestsQueryKey(params),
    (page, signal) => getPartnerRequests({ ...params, ...page }, { signal }),
    { enabled: tab === "open" },
  );
  const mine = usePagedList(
    getGetMyPartnerRequestsQueryKey({ when: "upcoming" }),
    (page, signal) => getMyPartnerRequests({ when: "upcoming", ...page }, { signal }),
    { enabled: tab === "mine" },
  );

  const header = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="h1">{t("tabs.partners")}</Text>
        <Text tone="muted">{t("partners.subtitle")}</Text>
      </View>
      <Segmented<Tab>
        label={t("partners.show")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "open", label: t("partners.openGames") },
          { value: "mine", label: t("partners.myGames") },
        ]}
      />
      {tab === "open" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Chip label={t("partners.myLevel")} selected={myLevel} onPress={() => setMyLevel((v) => !v)} />
          <Chip label={t("partners.thisWeek")} selected={thisWeek} onPress={() => setThisWeek((v) => !v)} />
          <Chip label={t("partners.doublesChip")} selected={doubles} onPress={() => setDoubles((v) => !v)} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <PagedList
        key={tab}
        list={tab === "open" ? open : mine}
        header={header}
        keyOf={(request) => request.id}
        renderItem={(request) => <PartnerRow request={request} />}
        emptyTitle={tab === "open" ? t("partners.noneOpen") : t("partners.noneMine")}
        emptyMessage={tab === "open" ? t("partners.noneOpenHint") : t("partners.noneMineHint")}
      />
    </SafeAreaView>
  );
}
