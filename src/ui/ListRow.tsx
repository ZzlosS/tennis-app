import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/theme";
import { Text } from "./Text";

type Props = {
  title: string;
  subtitle?: string;
  /** A third, bolder line: a price, a status. */
  detail?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** One line of a list: a tile or avatar, two or three lines of text, an action on the right. */
export function ListRow({ title, subtitle, detail, left, right, onPress, accessibilityLabel }: Props) {
  const { spacing } = useTheme();
  const content = (
    <>
      {left}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {detail ? <Text variant="label">{detail}</Text> : null}
      </View>
      {right}
    </>
  );
  const style = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    paddingVertical: 10,
  };
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}
