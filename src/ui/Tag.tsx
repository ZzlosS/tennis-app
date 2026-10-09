import { View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

export type CourtKind = "CLUB" | "PUBLIC" | "PRIVATE";

type Props = { kind: CourtKind; label: string };

/** The Club / Public / Private label on court cards and map pins. */
export function Tag({ kind, label }: Props) {
  const { colors, radius } = useTheme();
  const tone = { CLUB: colors.courtClub, PUBLIC: colors.courtPublic, PRIVATE: colors.courtPrivate }[kind];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: tone.background,
        borderRadius: radius.pill,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text variant="label" style={{ color: tone.text, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
