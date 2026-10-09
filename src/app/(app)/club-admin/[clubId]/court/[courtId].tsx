import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useGetClub, useGetCourt, useInvalidate, useUpdateCourt } from "@/api";
import { ClubCourtForm } from "@/components/ClubCourtForm";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { IconButton, LoadingState, Screen, ScreenHeader } from "@/ui";

export default function EditClubCourt() {
  const { t } = useTranslation();
  const { clubId, courtId } = useLocalSearchParams<{ clubId: string; courtId: string }>();
  const club = useGetClub(clubId);
  const court = useGetCourt(courtId);
  const update = useUpdateCourt();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const back = () => goBack(`/club-admin/${clubId}/courts`);

  return (
    <Screen>
      <ScreenHeader
        title={court.data?.name ?? t("court.title")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={back} />}
      />
      {club.data && court.data ? (
        <ClubCourtForm
          court={court.data}
          currency={club.data.currency}
          clubHours={club.data.openingHours}
          submitLabel={t("common.save")}
          describeError={errorMessage}
          onSubmit={async ({ openingHours, ...values }) => {
            await update.mutateAsync({
              id: courtId,
              data: openingHours ? { ...values, openingHours } : { ...values, followClubHours: true },
            });
            await invalidate("courts");
            back();
          }}
        />
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
    </Screen>
  );
}
