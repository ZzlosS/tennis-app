import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { useGetMatch } from "@/api";
import { MatchCard } from "@/components/MatchCard";
import { useErrorMessage } from "@/errors";
import { ErrorState, LoadingState, Screen, ScreenHeader } from "@/ui";

export default function MatchDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useGetMatch(id);
  const errorMessage = useErrorMessage();
  return (
    <Screen>
      <ScreenHeader title={t("matches.match")} />
      {match.data ? (
        <MatchCard match={match.data} linked={false} />
      ) : match.error ? (
        <ErrorState
          title={t("common.somethingWrong")}
          message={errorMessage(match.error)}
          retryLabel={t("common.retry")}
          onRetry={() => void match.refetch()}
        />
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
    </Screen>
  );
}
