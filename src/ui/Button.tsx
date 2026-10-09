import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { colors, radius, button, fonts } = theme;
  const isDisabled = disabled || loading;

  const background = (pressed: boolean) => {
    if (variant === "primary") return pressed ? colors.primaryPressed : colors.primary;
    if (variant === "danger") return colors.danger;
    if (variant === "secondary") return colors.surface;
    return "transparent";
  };
  const textColor =
    variant === "primary" ? colors.onPrimary : variant === "danger" ? colors.onDanger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          height: button.height,
          borderRadius: radius.control,
          backgroundColor: background(state.pressed),
          borderColor: variant === "secondary" ? colors.border : "transparent",
          opacity: isDisabled && !loading ? 0.5 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontFamily: button.uppercase ? fonts.bold : fonts.semibold,
            textTransform: button.uppercase ? "uppercase" : "none",
            letterSpacing: button.letterSpacing,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
  },
});
