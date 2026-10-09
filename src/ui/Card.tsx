import { View, type ViewProps } from "react-native";

import { useTheme } from "@/theme";

export function Card({ style, ...rest }: ViewProps) {
  const { colors, radius, spacing, cardShadow } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: spacing.md,
        },
        cardShadow
          ? { boxShadow: "0 1px 2px rgba(17,20,24,0.06), 0 6px 18px rgba(17,20,24,0.06)" }
          : { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
      {...rest}
    />
  );
}
