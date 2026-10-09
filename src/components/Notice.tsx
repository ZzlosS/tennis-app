import { View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "@/ui";

/** A short message in a tinted box: a form error, a "link sent" note, an unconfirmed email. */
export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: string }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "error" ? "alert" : undefined}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.control,
        borderLeftWidth: 4,
        borderLeftColor: tone === "error" ? colors.danger : colors.primary,
        padding: spacing.md,
      }}
    >
      <Text tone={tone === "error" ? "danger" : "default"}>{children}</Text>
    </View>
  );
}
