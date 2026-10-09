import { server } from "./msw";

process.env.EXPO_PUBLIC_API_URL = "http://api.test/v1";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock.js"),
);

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-secure-store", () => require("./secureStoreMock"));

// Every test starts signed out, with no saved session or settings.
beforeEach(async () => {
  const { secureStore } = require("./secureStoreMock");
  const { tokens } = require("@/api");
  const storage = require("@react-native-async-storage/async-storage");
  const AsyncStorage = storage.default ?? storage;
  secureStore.clear();
  await tokens.clear();
  await AsyncStorage.clear();
});

jest.mock("expo-location", () => require("./locationMock"));
jest.mock("react-native-maps", () => require("./mapsMock"));

beforeEach(() => {
  const { mockLocation } = require("./locationMock");
  mockLocation.status = "granted";
  mockLocation.coords = { latitude: 44.8, longitude: 20.4 };
});
