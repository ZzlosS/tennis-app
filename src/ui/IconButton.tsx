import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, type PressableProps } from "react-native";

import { useTheme } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = Omit<PressableProps, "children"> & {
  icon: IconName;
  /** Read out by screen readers; icon-only buttons have no other text. */
  label: string;
  size?: number;
  tone?: "surface" | "card";
};

/** A round 44pt button with one icon: back, close, list/map, bell. */
export function IconButton({ icon, label, size = 44, tone = "surface", style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={(state) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tone === "card" ? colors.card : colors.surface,
          opacity: state.pressed ? 0.7 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
