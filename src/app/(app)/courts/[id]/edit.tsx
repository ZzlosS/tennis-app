import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/navigation";
import { useTranslation } from "react-i18next";

import { useGetCourt, useInvalidate, useUpdateCourt } from "@/api";
import { CourtForm } from "@/components/CourtForm";
import { useErrorMessage } from "@/errors";
import { IconButton, LoadingState, Screen, ScreenHeader } from "@/ui";

export default function EditCourt() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const court = useGetCourt(id);
  const update = useUpdateCourt();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();

  return (
    <Screen>
      <ScreenHeader
        title={t("courtForm.editTitle")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack()} />}
      />
      {court.data ? (
        <CourtForm
          court={court.data}
          submitLabel={t("common.save")}
          describeError={errorMessage}
          onSubmit={async (values) => {
            await update.mutateAsync({
              id,
              data: {
                name: values.name,
                address: values.address,
                city: values.city,
                country: values.country,
                surface: values.surface,
                roof: values.roof,
                double: values.double,
                // A court made free again sends 0; the API stores that as no price.
                pricePerHourMinor: values.pricePerHourMinor ?? 0,
                ...(values.pricePerHourMinor !== undefined ? { currency: values.currency } : {}),
              },
            });
            await invalidate("courts");
            goBack();
          }}
        />
      ) : (
        <LoadingState label={t("common.loading")} />
      )}
    </Screen>
  );
}
