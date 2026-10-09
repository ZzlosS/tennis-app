import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type Coords = { latitude: number; longitude: number };

/** Where the map opens when the player does not share their location. */
export const BELGRADE: Coords = { latitude: 44.8125, longitude: 20.4612 };

export type LocationState = {
  coords: Coords;
  /** "fallback" means the player said no (or the device could not tell): coords is Belgrade. */
  source: "loading" | "device" | "fallback";
};

/**
 * The player's position, asked for only when a screen that needs it opens. Saying no keeps the
 * app working: the screen gets Belgrade and the player can still search by city.
 */
export function useLocation(enabled = true): LocationState {
  const [state, setState] = useState<LocationState>({ coords: BELGRADE, source: "loading" });
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("denied");
        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (live) setState({ coords: position.coords, source: "device" });
      } catch {
        if (live) setState({ coords: BELGRADE, source: "fallback" });
      }
    })();
    return () => {
      live = false;
    };
  }, [enabled]);
  return state;
}
