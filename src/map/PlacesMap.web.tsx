import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

import { useTheme } from "@/theme";
import type { PlacesMapProps } from "./types";

// Web: OpenStreetMap tiles through Leaflet. Circle markers need no image files.
export function PlacesMap({ center, me, pins, selectedId, onSelect }: PlacesMapProps) {
  const { colors } = useTheme();
  const pinColor = {
    CLUB: colors.courtClub.text,
    PUBLIC: colors.courtPublic.text,
    PRIVATE: colors.courtPrivate.text,
  };
  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={13}
      style={{ flex: 1, height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {me ? (
        <CircleMarker
          center={[me.latitude, me.longitude]}
          radius={7}
          pathOptions={{ color: "#FFFFFF", weight: 3, fillColor: "#1F5AD6", fillOpacity: 1 }}
        />
      ) : null}
      {pins.map((pin) => (
        <CircleMarker
          key={`${pin.kind}-${pin.id}`}
          center={[pin.latitude, pin.longitude]}
          radius={selectedId === pin.id ? 12 : 9}
          pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: pinColor[pin.kind], fillOpacity: 1 }}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        >
          <Tooltip>{pin.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
