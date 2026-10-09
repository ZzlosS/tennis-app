import { router } from "expo-router";
import { goBack } from "@/navigation";
import { useTranslation } from "react-i18next";

import { useCreateCourt, useInvalidate } from "@/api";
import { CourtForm } from "@/components/CourtForm";
import { useErrorMessage } from "@/errors";
import { useLocation } from "@/location";
import { IconButton, Screen, ScreenHeader } from "@/ui";

export default function AddCourt() {
  const { t } = useTranslation();
  const create = useCreateCourt();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  // The pin goes where the player stands, when they share it; otherwise the court has no pin yet.
  const location = useLocation();

  return (
    <Screen>
      <ScreenHeader
        title={t("courtForm.addTitle")}
        hideBack
        right={<IconButton icon="close" label={t("common.close")} onPress={() => goBack()} />}
      />
      <CourtForm
        submitLabel={t("courtForm.add")}
        describeError={errorMessage}
        onSubmit={async (values) => {
          const court = await create.mutateAsync({
            data: {
              kind: values.kind,
              name: values.name,
              address: values.address,
              city: values.city,
              country: values.country,
              surface: values.surface,
              roof: values.roof,
              double: values.double,
              stands: false,
              ...(values.pricePerHourMinor !== undefined
                ? { pricePerHourMinor: values.pricePerHourMinor, currency: values.currency }
                : {}),
              ...(location.source === "device"
                ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
                : {}),
            },
          });
          await invalidate("courts");
          router.replace(`/courts/${court.id}`);
        }}
      />
    </Screen>
  );
}
