import { useTranslation } from "react-i18next";

import type { Money } from "@/api";
import { formatMoney } from "@/format";
import { intlLocale } from "@/i18n";
import { Text, type TextProps } from "./Text";

type Props = Omit<TextProps, "children"> & { price: Money | null | undefined; perHour?: boolean };

/** A court's price in its club's currency, or "Free" when it has none. */
export function Price({ price, perHour = false, variant = "label", ...rest }: Props) {
  const { t, i18n } = useTranslation();
  const formatted = formatMoney(price, intlLocale(i18n.language));
  const label =
    formatted == null ? t("booking.free") : perHour ? t("booking.perHour", { price: formatted }) : formatted;
  return (
    <Text variant={variant} {...rest}>
      {label}
    </Text>
  );
}
