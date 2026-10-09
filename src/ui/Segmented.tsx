import { Pressable, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the control for screen readers. */
  label: string;
};

/** Two or three choices in one pill: List or Map, Upcoming or Past, 1h 2h 3h. */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const { colors, radius, cardShadow } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              height: 38,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? colors.card : "transparent",
              ...(selected && cardShadow ? { boxShadow: "0 1px 3px rgba(17,20,24,0.12)" } : null),
            }}
          >
            <Text variant="label" style={{ fontSize: 14 }} tone={selected ? "default" : "muted"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
