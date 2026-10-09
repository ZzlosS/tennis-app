import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { useTheme, type Theme } from "@/theme";

export type TextVariant = "title" | "h1" | "h2" | "body" | "bodyStrong" | "small" | "label";
export type TextTone = "default" | "muted" | "primary" | "accent" | "danger" | "onPrimary";

export type TextProps = RNTextProps & { variant?: TextVariant; tone?: TextTone };

function variantStyle(theme: Theme, variant: TextVariant): TextStyle {
  const { fonts, fontSize } = theme;
  switch (variant) {
    case "title":
      return { fontFamily: fonts.heading, fontSize: fontSize.title, letterSpacing: -0.5 };
    case "h1":
      return { fontFamily: fonts.heading, fontSize: fontSize.h1, letterSpacing: -0.3 };
    case "h2":
      return { fontFamily: fonts.bold, fontSize: fontSize.h2 };
    case "bodyStrong":
      return { fontFamily: fonts.semibold, fontSize: fontSize.body };
    case "small":
      return { fontFamily: fonts.regular, fontSize: fontSize.small };
    case "label":
      return { fontFamily: fonts.semibold, fontSize: fontSize.small };
    case "body":
    default:
      return { fontFamily: fonts.regular, fontSize: fontSize.body };
  }
}

function toneColor(theme: Theme, tone: TextTone): string {
  const { colors } = theme;
  return {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
  }[tone];
}

export function Text({ variant = "body", tone = "default", style, ...rest }: TextProps) {
  const theme = useTheme();
  const isHeading = variant === "title" || variant === "h1" || variant === "h2";
  return (
    <RNText
      accessibilityRole={isHeading ? "header" : undefined}
      style={[variantStyle(theme, variant), { color: toneColor(theme, tone) }, style]}
      {...rest}
    />
  );
}
