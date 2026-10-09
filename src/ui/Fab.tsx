import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import { useTheme } from "@/theme";
import type { IconName } from "./IconButton";

type Props = { icon: IconName; label: string; onPress: () => void };

/** The round green button in the corner: "Add a court". */
export function Fab({ icon, label, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        boxShadow: "0 8px 20px rgba(11,122,79,0.35)",
      })}
    >
      <Ionicons name={icon} size={26} color={colors.onPrimary} />
    </Pressable>
  );
}
