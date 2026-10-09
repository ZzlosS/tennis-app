import { Switch, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

type Props = { label: string; description?: string; value: boolean; onChange: (value: boolean) => void };

/** A labelled on/off switch: "Look for a partner", "Covered", "Open for reservations". */
export function ToggleRow({ label, description, value, onChange }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {description ? (
          <Text variant="small" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.card}
      />
    </View>
  );
}
