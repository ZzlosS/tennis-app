import { forwardRef, useId } from "react";
import { TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export type TextInputProps = RNTextInputProps & {
  label: string;
  /** Shown under the field and announced to screen readers. */
  error?: string;
};

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { label, error, style, ...rest },
  ref,
) {
  const { colors, radius, fonts, fontSize, spacing } = useTheme();
  const id = useId();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" tone="muted" nativeID={id}>
        {label}
      </Text>
      <RNTextInput
        ref={ref}
        accessibilityLabel={label}
        aria-labelledby={id}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            height: 52,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.control,
            backgroundColor: colors.surface,
            color: colors.text,
            paddingHorizontal: spacing.lg,
            fontFamily: fonts.medium,
            fontSize: fontSize.body,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
