import { View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export type BadgeTone = "neutral" | "positive" | "warning";

/** A small status label: Won, Lost, Paid, Pending, Weekly. */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const { colors, radius } = useTheme();
  const pick = { neutral: colors.courtClub, positive: colors.courtPublic, warning: colors.courtPrivate }[
    tone
  ];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: pick.background,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text variant="label" style={{ color: pick.text, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
