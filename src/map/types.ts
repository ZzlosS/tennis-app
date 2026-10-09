import type { CourtKind } from "@/api";
import type { Coords } from "@/location";

export type MapPin = { id: string; kind: CourtKind; name: string; latitude: number; longitude: number };

export type PlacesMapProps = {
  center: Coords;
  /** Shows a dot for the player when their real position is known. */
  me?: Coords;
  pins: MapPin[];
  selectedId?: string;
  onSelect: (id: string) => void;
};
