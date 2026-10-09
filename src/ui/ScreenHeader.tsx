import { router } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useTheme } from "@/theme";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

type Props = {
  title: string;
  subtitle?: string;
  /** Defaults to going back one screen. */
  onBack?: () => void;
  /** Hide the back button (a screen opened at the root). */
  hideBack?: boolean;
  right?: ReactNode;
};

/** Back button, title and an optional action on the right, for screens outside the tabs. */
export function ScreenHeader({ title, subtitle, onBack, hideBack = false, right }: Props) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/home")));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      {hideBack ? null : <IconButton icon="chevron-back" label={t("common.back")} onPress={back} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h2" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
