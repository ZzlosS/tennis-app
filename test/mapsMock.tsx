import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

// react-native-maps for tests: the map is a plain View and each marker a button named after its place.
export default function MapView({ children }: { children?: ReactNode }) {
  return <View testID="map">{children}</View>;
}

export function Marker({ title, onPress }: { title?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`pin ${title}`} onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
}
