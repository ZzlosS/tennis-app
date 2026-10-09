import { Redirect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useGetHandover } from "@/api";
import { useAuth } from "@/auth";
import { useErrorMessage } from "@/errors";
import { ErrorState, LoadingState, Screen, ScreenHeader } from "@/ui";

/** Handover notifications carry only the handover's id: club admins go to the club's courts, owners to the court. */
export default function HandoverLink() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const handover = useGetHandover(id);
  const errorMessage = useErrorMessage();
  if (handover.data && me) {
    const owner = handover.data.requestedBy.id === me.id;
    return (
      <Redirect
        href={owner ? `/courts/${handover.data.court.id}` : `/club-admin/${handover.data.club.id}/courts`}
      />
    );
  }
  return (
    <Screen scroll={false}>
      <ScreenHeader title={t("court.giveToClub")} />
      {handover.error ? (
        <ErrorState title={t("common.somethingWrong")} message={errorMessage(handover.error)} />
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
    </Screen>
  );
}
