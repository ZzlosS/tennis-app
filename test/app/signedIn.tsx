import { screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { http, HttpResponse, type RequestHandler } from "msw";

import type { MeResponse } from "@/api";
import { me as buildMe, page } from "../fixtures";
import { API, server } from "../msw";
import { secureStore } from "../secureStoreMock";

/** Answers every list the tabs load with an empty page, so a test only adds what it checks. */
export function emptyLists(): RequestHandler[] {
  const empty = () => HttpResponse.json(page([]));
  return [
    http.get(`${API}/me/bookings`, empty),
    http.get(`${API}/me/partner-requests`, empty),
    http.get(`${API}/me/courts`, empty),
    http.get(`${API}/me/clubs`, empty),
    http.get(`${API}/me/matches`, empty),
    http.get(`${API}/me/court-handovers`, empty),
    http.get(`${API}/me/notifications`, empty),
    http.get(`${API}/me/notifications/unread`, () => HttpResponse.json({ count: 0 })),
    http.get(`${API}/partner-requests`, empty),
    http.get(`${API}/places`, empty),
    http.get(`${API}/rackets`, empty),
    http.get(`${API}/players/:id/rackets`, empty),
  ];
}

/** Opens the app at `url` with a saved session for `me`. Later server.use() handlers win. */
export async function openSignedIn(url: string, me: Partial<MeResponse> = {}) {
  const player = buildMe(me);
  server.use(
    ...emptyLists(),
    http.get(`${API}/me`, () => HttpResponse.json(player)),
    http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  );
  secureStore.set("rally.session", JSON.stringify({ accessToken: "A1", refreshToken: "R1" }));
  const view = renderRouter("./src/app", { initialUrl: url });
  return { view, player, screen };
}
