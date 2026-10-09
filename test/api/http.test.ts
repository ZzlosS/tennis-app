import { http, HttpResponse } from "msw";

import { ApiError, getMe, logout, tokens } from "@/api";
import { API, server } from "../msw";

const me = { id: "p1", firstName: "Ana", lastName: "I", nickname: "ana", email: "a@x.rs", role: "PLAYER" };

beforeEach(async () => {
  await tokens.clear();
});

test("sends the access token", async () => {
  await tokens.set({ accessToken: "A1", refreshToken: "R1" });
  let auth: string | null = null;
  server.use(
    http.get(`${API}/me`, ({ request }) => {
      auth = request.headers.get("authorization");
      return HttpResponse.json(me);
    }),
  );
  await expect(getMe()).resolves.toMatchObject({ id: "p1" });
  expect(auth).toBe("Bearer A1");
});

test("three calls with an expired token share one refresh, then retry", async () => {
  await tokens.set({ accessToken: "OLD", refreshToken: "R1" });
  let refreshes = 0;
  server.use(
    http.get(`${API}/me`, ({ request }) =>
      request.headers.get("authorization") === "Bearer NEW"
        ? HttpResponse.json(me)
        : HttpResponse.json({ error: { code: "TOKEN_EXPIRED", message: "Token expired" } }, { status: 401 }),
    ),
    http.post(`${API}/auth/refresh`, async ({ request }) => {
      refreshes += 1;
      expect(await request.json()).toEqual({ refreshToken: "R1" });
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({ accessToken: "NEW", refreshToken: "R2", expiresIn: 900, player: me });
    }),
  );
  const results = await Promise.all([getMe(), getMe(), getMe()]);
  expect(results.map((r) => r.id)).toEqual(["p1", "p1", "p1"]);
  expect(refreshes).toBe(1);
  expect(tokens.get()).toEqual({ accessToken: "NEW", refreshToken: "R2" });
});

test("a refused refresh signs the player out", async () => {
  await tokens.set({ accessToken: "OLD", refreshToken: "GONE" });
  const seen: (unknown | null)[] = [];
  const stop = tokens.subscribe((s) => seen.push(s));
  server.use(
    http.get(`${API}/me`, () =>
      HttpResponse.json({ error: { code: "TOKEN_EXPIRED", message: "expired" } }, { status: 401 }),
    ),
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "Invalid refresh token" } },
        { status: 401 },
      ),
    ),
  );
  await expect(getMe()).rejects.toMatchObject({ code: "TOKEN_EXPIRED", status: 401 });
  expect(tokens.get()).toBeNull();
  expect(seen).toContain(null);
  stop();
});

test("an invalid token clears the session without refreshing", async () => {
  await tokens.set({ accessToken: "BAD", refreshToken: "R1" });
  const refresh = jest.fn();
  server.use(
    http.get(`${API}/me`, () =>
      HttpResponse.json({ error: { code: "UNAUTHENTICATED", message: "no" } }, { status: 401 }),
    ),
    http.post(`${API}/auth/refresh`, () => {
      refresh();
      return HttpResponse.json({});
    }),
  );
  await expect(getMe()).rejects.toBeInstanceOf(ApiError);
  expect(refresh).not.toHaveBeenCalled();
  expect(tokens.get()).toBeNull();
});

test("error bodies become ApiError with code and fields", async () => {
  server.use(
    http.get(`${API}/me`, () =>
      HttpResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "bad", fields: { email: ["invalid"] } } },
        { status: 400 },
      ),
    ),
  );
  const error = await getMe().catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status: 400, code: "VALIDATION_FAILED", fields: { email: ["invalid"] } });
});

test("rate limits and unknown bodies keep a code the app can translate", async () => {
  server.use(
    http.get(`${API}/me`, () =>
      HttpResponse.json({ error: { code: "RATE_LIMITED", message: "slow down" } }, { status: 429 }),
    ),
  );
  await expect(getMe()).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });

  server.use(http.get(`${API}/me`, () => new HttpResponse("Bad gateway", { status: 502 })));
  await expect(getMe()).rejects.toMatchObject({ code: "INTERNAL", status: 502 });
});

test("a network failure becomes NETWORK_ERROR", async () => {
  server.use(http.get(`${API}/me`, () => HttpResponse.error()));
  await expect(getMe()).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
});

test("a 204 answer resolves with no body", async () => {
  server.use(http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })));
  await expect(logout({ refreshToken: "R1" })).resolves.toBeUndefined();
});
