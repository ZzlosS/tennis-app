import type { ReactNode } from "react";
import { ScrollView, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type Props = {
  children: ReactNode;
  /** Scroll the content when it is taller than the screen (default true). */
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = true, edges = ["top", "left", "right"], contentStyle }: Props) {
  const { colors, spacing } = useTheme();
  const inner: ViewStyle = { padding: spacing.xl, gap: spacing.lg, ...contentStyle };
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[inner, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
