// expo-notifications for tests: permission and taps are under the test's control.
export const mockPush = {
  status: "undetermined" as "granted" | "denied" | "undetermined",
  lastResponse: null as unknown,
  tapListeners: [] as ((response: unknown) => void)[],
};

export const AndroidImportance = { DEFAULT: 3 };
export const setNotificationHandler = () => {};
export const setNotificationChannelAsync = async () => null;
export const getPermissionsAsync = async () => ({ status: mockPush.status, canAskAgain: true });
export const requestPermissionsAsync = async () => {
  mockPush.status = "granted";
  return { status: mockPush.status };
};
export const getExpoPushTokenAsync = async () => ({ data: "ExponentPushToken[test-phone]", type: "expo" });
export const getLastNotificationResponseAsync = async () => mockPush.lastResponse;
export const addNotificationResponseReceivedListener = (listener: (response: unknown) => void) => {
  mockPush.tapListeners.push(listener);
  return { remove: () => (mockPush.tapListeners = mockPush.tapListeners.filter((l) => l !== listener)) };
};
export const addNotificationReceivedListener = () => ({ remove: () => {} });
