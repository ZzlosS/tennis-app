import { Pressable } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

type Props = { label: string; selected: boolean; onPress: () => void };

/** A filter that is on or off: All, Clubs, My level, This week. */
export function Chip({ label, selected, onPress }: Props) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        height: 38,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        justifyContent: "center",
        backgroundColor: selected ? colors.text : colors.surface,
      }}
    >
      <Text variant="label" style={{ fontSize: 14, color: selected ? colors.background : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
