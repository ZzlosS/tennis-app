import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import i18n from "@/i18n";
import { club, court, me, page } from "../fixtures";
import { API, server } from "../msw";
import { secureStore } from "../secureStoreMock";
import { openSignedIn } from "./signedIn";

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

test("the profile shows the player's courts and, for club admins, their clubs", async () => {
  server.use(
    http.get(`${API}/me/courts`, () =>
      HttpResponse.json(
        page([
          court({ id: "park1", name: "Backyard court", kind: "PRIVATE", club: null, pricePerHour: null }),
        ]),
      ),
    ),
    http.get(`${API}/me/clubs`, () => HttpResponse.json(page([club()]))),
  );
  await openSignedIn("/profile", { role: "CLUB_ADMIN" });
  expect(await screen.findByText("Backyard court")).toBeOnTheScreen();
  expect(screen.getByText("Free")).toBeOnTheScreen();
  expect(await screen.findByText("Manage TK Banjica")).toBeOnTheScreen();
  expect(screen.getByText("@ana · Beograd · Advanced")).toBeOnTheScreen();
});

test("editing the profile refreshes the header", async () => {
  let sent: unknown;
  let current = me();
  server.use(
    http.get(`${API}/me`, () => HttpResponse.json(current)),
    http.patch(`${API}/me`, async ({ request }) => {
      sent = await request.json();
      current = me({ firstName: "Ana Marija" });
      return HttpResponse.json(current);
    }),
  );
  await openSignedIn("/profile");
  fireEvent.press(await screen.findByText("Edit profile"));
  fireEvent.changeText(await screen.findByLabelText("First name"), "Ana Marija");
  fireEvent.press(screen.getByText("Save"));
  expect(await screen.findByText("Ana Marija Ivanović")).toBeOnTheScreen();
  expect(sent).toMatchObject({ firstName: "Ana Marija", lastName: "Ivanović", level: "ADVANCED" });
});

test("a wrong password on delete shows the error, the right one signs out", async () => {
  server.use(
    http.delete(`${API}/me`, async ({ request }) => {
      const { password } = (await request.json()) as { password: string };
      return password === "right-password"
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "no" } }, { status: 401 });
    }),
  );
  await openSignedIn("/profile/delete-account");
  fireEvent.changeText(await screen.findByLabelText("Password"), "wrong");
  fireEvent.press(screen.getByText("Delete my account"));
  expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();

  fireEvent.changeText(screen.getByLabelText("Password"), "right-password");
  fireEvent.press(screen.getByText("Delete my account"));
  expect(await screen.findByText("Welcome back")).toBeOnTheScreen();
  expect(secureStore.has("rally.session")).toBe(false);
});

test("changing the password keeps this device signed in with the new tokens", async () => {
  server.use(
    http.post(`${API}/me/password`, () =>
      HttpResponse.json({ accessToken: "A2", refreshToken: "R2", expiresIn: 900, player: me() }),
    ),
  );
  await openSignedIn("/profile/password");
  fireEvent.changeText(await screen.findByLabelText("Current password"), "old-password");
  fireEvent.changeText(screen.getByLabelText("New password"), "new-password-1");
  fireEvent.press(screen.getByText("Save password"));
  expect(await screen.findByText(/Your password is changed/)).toBeOnTheScreen();
  await waitFor(() =>
    expect(JSON.parse(secureStore.get("rally.session")!)).toEqual({ accessToken: "A2", refreshToken: "R2" }),
  );
});

test("an unconfirmed email can ask for the link again", async () => {
  let language: string | null = null;
  server.use(
    http.post(`${API}/me/verify-email`, ({ request }) => {
      language = new URL(request.url).searchParams.get("language");
      return new HttpResponse(null, { status: 204 });
    }),
  );
  await openSignedIn("/profile", { emailVerified: false });
  fireEvent.press(await screen.findByText("Send the email again"));
  expect(await screen.findByText(/We sent a new confirmation link/)).toBeOnTheScreen();
  expect(language).toBe("en");
});
