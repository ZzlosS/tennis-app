import { useNetInfo } from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { Text } from "./Text";

/** A strip at the top of the screen while the device has no connection. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { isConnected } = useNetInfo();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  // null means "not known yet": only show the banner once we know we're offline.
  if (isConnected !== false) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors.text,
        paddingTop: insets.top + spacing.xs,
        paddingBottom: spacing.xs,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Text variant="small" style={{ color: colors.background, textAlign: "center" }}>
        {t("common.offline")}
      </Text>
    </View>
  );
}
