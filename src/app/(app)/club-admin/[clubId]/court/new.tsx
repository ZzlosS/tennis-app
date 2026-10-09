import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useCreateClubCourt, useGetClub, useInvalidate, useUpdateCourt } from "@/api";
import { ClubCourtForm } from "@/components/ClubCourtForm";
import { useErrorMessage } from "@/errors";
import { goBack } from "@/navigation";
import { IconButton, LoadingState, Screen, ScreenHeader } from "@/ui";

export default function AddClubCourt() {
  const { t } = useTranslation();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useGetClub(clubId);
  const create = useCreateClubCourt();
  const update = useUpdateCourt();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const back = () => goBack(`/club-admin/${clubId}/courts`);

  return (
    <Screen>
      <ScreenHeader
        title={t("clubAdmin.addCourt")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={back} />}
      />
      {club.data ? (
        <ClubCourtForm
          currency={club.data.currency}
          clubHours={club.data.openingHours}
          submitLabel={t("clubAdmin.addCourt")}
          describeError={errorMessage}
          onSubmit={async ({ openingHours, ...values }) => {
            const court = await create.mutateAsync({ clubId, data: { ...values, stands: false } });
            // A new court takes the club's hours; different ones are a second step.
            if (openingHours) await update.mutateAsync({ id: court.id, data: { openingHours } });
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
