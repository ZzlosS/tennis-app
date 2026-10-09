import { Pressable, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "@/ui";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
};

/** A row of chips where exactly one is picked (level, look, light or dark). */
export function Choice<T extends string>({ label, options, value, onChange, error }: Props<T>) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={{
                height: 38,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.pill,
                justifyContent: "center",
                backgroundColor: selected ? colors.text : colors.surface,
              }}
            >
              <Text
                variant="label"
                style={{ color: selected ? colors.background : colors.text, fontSize: 14 }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
