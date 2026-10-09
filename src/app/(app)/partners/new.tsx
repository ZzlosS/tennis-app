import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PlayerLevel, useCreatePartnerRequest, useGetBooking, useInvalidate } from "@/api";
import { Choice } from "@/components/Choice";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { formatSlot } from "@/format";
import { intlLocale } from "@/i18n";
import { goBack } from "@/navigation";
import { Button, Card, IconButton, LoadingState, Screen, ScreenHeader, Text } from "@/ui";

/** "Find partner" on an upcoming reservation. */
export default function NewPartnerRequest() {
  const { t, i18n } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useGetBooking(bookingId);
  const create = useCreatePartnerRequest();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const [playersNeeded, setPlayersNeeded] = useState<"1" | "3">("1");
  const [level, setLevel] = useState<PlayerLevel | "ANY">("ANY");

  async function submit() {
    try {
      const request = await create.mutateAsync({
        data: { bookingId, playersNeeded: Number(playersNeeded), ...(level !== "ANY" ? { level } : {}) },
      });
      await invalidate("partners");
      router.replace(`/partners/${request.id}`);
    } catch {
      // Shown below from create.error.
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("partners.newTitle")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack("/reservations")} />}
      />
      {booking.data ? (
        <Card>
          <Text variant="bodyStrong">
            {formatSlot(booking.data.startsAt, booking.data.endsAt, intlLocale(i18n.language))}
          </Text>
          <Text variant="small" tone="muted">
            {[booking.data.club?.name, booking.data.court.name].filter(Boolean).join(" · ")}
          </Text>
        </Card>
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
      <Choice<"1" | "3">
        label={t("partners.playersNeeded")}
        value={playersNeeded}
        onChange={setPlayersNeeded}
        options={[
          { value: "1", label: t("partners.singles") },
          { value: "3", label: t("partners.doubles") },
        ]}
      />
      <Choice<PlayerLevel | "ANY">
        label={t("partners.level")}
        value={level}
        onChange={setLevel}
        options={[
          { value: "ANY", label: t("partners.anyLevel") },
          ...Object.values(PlayerLevel).map((value) => ({ value, label: t(`level.${value}`) })),
        ]}
      />
      {create.isError ? <Notice tone="error">{errorMessage(create.error)}</Notice> : null}
      <Button
        title={t("partners.post")}
        onPress={submit}
        loading={create.isPending}
        disabled={!booking.data}
      />
    </Screen>
  );
}
