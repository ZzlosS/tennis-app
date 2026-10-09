import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import i18n from "@/i18n";
import { askForPushAfterBooking, registerIfAllowed } from "@/notifications";
import { readSetting, writeSetting } from "@/settings";
import { notification, page } from "../fixtures";
import { API, server } from "../msw";
import { mockPush } from "../notificationsMock";
import { openSignedIn } from "../app/signedIn";

// A real phone with the Expo project id set.
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: "development", eas: { projectId: "test-project" } } } },
}));

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

function devicesApi() {
  const calls: string[] = [];
  server.use(
    http.post(`${API}/me/devices`, async ({ request }) => {
      calls.push(`add ${((await request.json()) as { token: string }).token}`);
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${API}/me/devices`, async ({ request }) => {
      calls.push(`remove ${((await request.json()) as { token: string }).token}`);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return calls;
}

test("permission is asked once after a booking and the token is sent", async () => {
  const calls = devicesApi();
  await askForPushAfterBooking();
  expect(calls).toEqual(["add ExponentPushToken[test-phone]"]);
  expect(await readSetting("pushToken")).toBe("ExponentPushToken[test-phone]");

  mockPush.status = "undetermined";
  await askForPushAfterBooking();
  expect(calls).toHaveLength(1);
});

test("a denied permission sends nothing and the app keeps working", async () => {
  const calls = devicesApi();
  mockPush.status = "denied";
  await registerIfAllowed();
  expect(calls).toEqual([]);
});

test("signing out removes this phone's token", async () => {
  const calls = devicesApi();
  await writeSetting("pushToken", "ExponentPushToken[test-phone]");
  await openSignedIn("/profile");
  fireEvent.press(await screen.findByText("Sign out"));
  expect(await screen.findByText("Welcome back")).toBeOnTheScreen();
  expect(calls).toContain("remove ExponentPushToken[test-phone]");
});

test("tapping a push opens its screen", async () => {
  server.use(http.get(`${API}/partner-requests/r1`, () => HttpResponse.json({}, { status: 404 })));
  mockPush.lastResponse = {
    notification: { request: { content: { data: { type: "PARTNER_JOINED", requestId: "r1" } } } },
  };
  await openSignedIn("/home");
  await waitFor(() => expect(screen).toHavePathname("/partners/r1"));
});

test("the bell shows unread notifications and the inbox marks them read", async () => {
  let unread = 2;
  server.use(
    http.get(`${API}/me/notifications/unread`, () => HttpResponse.json({ count: unread })),
    http.get(`${API}/me/notifications`, () => HttpResponse.json(page([notification()]))),
    http.post(`${API}/me/notifications/read`, () => {
      unread = 0;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  await openSignedIn("/home");
  fireEvent.press(await screen.findByLabelText("Notifications, 2 unread"));
  expect(await screen.findByText("Booking cancelled")).toBeOnTheScreen();
  await waitFor(() => expect(unread).toBe(0));
});
