import { act, fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { http, HttpResponse } from "msw";

import { tokens } from "@/api";
import i18n from "@/i18n";
import { API, server } from "../msw";
import { secureStore as mockSecure } from "../secureStoreMock";
import { emptyLists } from "./signedIn";

const player = {
  id: "p1",
  firstName: "Ana",
  lastName: "Ivanović",
  nickname: "ana",
  email: "ana@example.rs",
  level: "ADVANCED",
  role: "PLAYER",
  address: "Knez Mihailova 1",
  city: "Beograd",
  country: "Srbija",
  emailVerified: true,
  language: "en",
};

function backend(me: Record<string, unknown> = player) {
  server.use(
    ...emptyLists(),
    http.post(`${API}/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string };
      if (body.password !== "right-password") {
        return HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Invalid" } },
          { status: 401 },
        );
      }
      return HttpResponse.json({ accessToken: "A1", refreshToken: "R1", expiresIn: 900, player: me });
    }),
    http.get(`${API}/me`, ({ request }) =>
      request.headers.get("authorization")
        ? HttpResponse.json(me)
        : HttpResponse.json({ error: { code: "UNAUTHENTICATED", message: "no" } }, { status: 401 }),
    ),
    http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  );
}

async function signIn(password = "right-password") {
  fireEvent.changeText(await screen.findByLabelText("Email"), "ana@example.rs");
  fireEvent.changeText(screen.getByLabelText("Password"), password);
  fireEvent.press(screen.getByText("Sign in"));
}

beforeEach(async () => {
  mockSecure.clear();
  await tokens.clear();
  await act(() => i18n.changeLanguage("en"));
});

test("a signed-out player lands on sign in", async () => {
  backend();
  renderRouter("./src/app", { initialUrl: "/" });
  expect(await screen.findByText("Welcome back")).toBeOnTheScreen();
  expect(screen).toHavePathname("/login");
});

test("a good login opens the tabs and loads the profile from GET /me", async () => {
  backend();
  renderRouter("./src/app", { initialUrl: "/" });
  await signIn();
  expect(await screen.findByText("Hi, Ana")).toBeOnTheScreen();
  expect(screen).toHavePathname("/home");
  expect(JSON.parse(mockSecure.get("rally.session")!)).toEqual({ accessToken: "A1", refreshToken: "R1" });

  fireEvent.press(screen.getByText("Profile"));
  expect(await screen.findByText("Ana Ivanović")).toBeOnTheScreen();
  expect(screen.getByText("@ana · Beograd · Advanced")).toBeOnTheScreen();
});

test("a wrong password shows the translated error, in English and Serbian", async () => {
  backend();
  renderRouter("./src/app", { initialUrl: "/login" });
  await signIn("wrong");
  expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();

  fireEvent.press(screen.getByLabelText("Srpski"));
  fireEvent.press(await screen.findByText("Prijavite se"));
  expect(await screen.findByText("Pogrešan imejl ili lozinka.")).toBeOnTheScreen();
});

test("empty fields are caught before calling the API", async () => {
  backend();
  renderRouter("./src/app", { initialUrl: "/login" });
  fireEvent.press(await screen.findByText("Sign in"));
  expect(screen.getAllByText("Fill this in.")).toHaveLength(2);
});

test("a saved session skips sign in", async () => {
  backend();
  mockSecure.set("rally.session", JSON.stringify({ accessToken: "A1", refreshToken: "R1" }));
  renderRouter("./src/app", { initialUrl: "/" });
  expect(await screen.findByText("Hi, Ana")).toBeOnTheScreen();
  expect(screen).toHavePathname("/home");
});

test("the player's saved language is used after sign in", async () => {
  backend({ ...player, language: "sr" });
  renderRouter("./src/app", { initialUrl: "/login" });
  await signIn();
  expect(await screen.findByText("Zdravo, Ana")).toBeOnTheScreen();
});

test("signing out clears the session and returns to sign in", async () => {
  backend();
  const logout = jest.fn();
  server.use(
    http.post(`${API}/auth/logout`, async ({ request }) => {
      logout(await request.json());
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderRouter("./src/app", { initialUrl: "/" });
  await signIn();
  fireEvent.press(await screen.findByText("Profile"));
  fireEvent.press(await screen.findByText("Sign out"));
  expect(await screen.findByText("Welcome back")).toBeOnTheScreen();
  expect(logout).toHaveBeenCalledWith({ refreshToken: "R1" });
  expect(mockSecure.has("rally.session")).toBe(false);
});

test("a reset link with a token opens the reset form and sends the token", async () => {
  backend();
  let sent: unknown;
  server.use(
    http.post(`${API}/auth/reset-password`, async ({ request }) => {
      sent = await request.json();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderRouter("./src/app", { initialUrl: "/reset-password?token=abc123" });
  fireEvent.changeText(await screen.findByLabelText("New password"), "new-password-1");
  fireEvent.press(screen.getByText("Save password"));
  expect(await screen.findByText("Your password is changed. Sign in with the new one.")).toBeOnTheScreen();
  expect(sent).toEqual({ token: "abc123", newPassword: "new-password-1" });
});

test("a reset link without a token says so", async () => {
  backend();
  renderRouter("./src/app", { initialUrl: "/reset-password" });
  expect(await screen.findByText("This link is incomplete. Ask for a new one.")).toBeOnTheScreen();
});

test("a used verify link shows TOKEN_INVALID in words", async () => {
  backend();
  server.use(
    http.post(`${API}/auth/verify-email`, () =>
      HttpResponse.json({ error: { code: "TOKEN_INVALID", message: "used" } }, { status: 400 }),
    ),
  );
  renderRouter("./src/app", { initialUrl: "/verify-email?token=old" });
  expect(await screen.findByText("This link no longer works. Ask for a new one.")).toBeOnTheScreen();
});
