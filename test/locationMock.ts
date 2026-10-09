// expo-location for tests: granted at a spot in Novi Beograd unless a test says otherwise.
export const mockLocation = {
  status: "granted" as "granted" | "denied",
  coords: { latitude: 44.8, longitude: 20.4 },
};

export const Accuracy = { Balanced: 3 };
export const requestForegroundPermissionsAsync = async () => ({ status: mockLocation.status });
export const getLastKnownPositionAsync = async () => ({ coords: mockLocation.coords });
export const getCurrentPositionAsync = async () => ({ coords: mockLocation.coords });
