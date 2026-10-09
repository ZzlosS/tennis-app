import MapView, { Marker } from "react-native-maps";

import { useTheme } from "@/theme";
import type { PlacesMapProps } from "./types";

// Android and iOS: Google Maps / Apple Maps through react-native-maps.
export function PlacesMap({ center, me, pins, selectedId, onSelect }: PlacesMapProps) {
  const { colors } = useTheme();
  const pinColor = {
    CLUB: colors.courtClub.text,
    PUBLIC: colors.courtPublic.text,
    PRIVATE: colors.courtPrivate.text,
  };
  return (
    <MapView
      style={{ flex: 1 }}
      showsUserLocation={me != null}
      initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
    >
      {pins.map((pin) => (
        <Marker
          key={`${pin.kind}-${pin.id}`}
          coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
          title={pin.name}
          pinColor={pinColor[pin.kind]}
          opacity={selectedId && selectedId !== pin.id ? 0.7 : 1}
          onPress={() => onSelect(pin.id)}
          accessibilityLabel={pin.name}
        />
      ))}
    </MapView>
  );
}
