import { View } from "react-native";

import { useTheme } from "@/theme";

type Surface = "CLAY" | "HARD" | "GRASS";

/** The coloured square that stands in for a court photo until the API has pictures. */
export function SurfaceTile({ surface, size = 48 }: { surface: Surface | undefined; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size > 56 ? 14 : 12,
        flexShrink: 0,
        backgroundColor: colors.surfaceTile[surface ?? "HARD"],
      }}
    />
  );
}
