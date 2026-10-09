import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import i18n from "@/i18n";
import { booking, page, partnerRequest, playerSummary } from "../fixtures";
import { API, server } from "../msw";
import { openSignedIn } from "./signedIn";

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

const future = {
  id: "b9",
  startsAt: "2030-01-05T09:00:00Z",
  endsAt: "2030-01-05T10:00:00Z",
  court: { id: "court1", name: "Court 1", surface: "HARD" as const, clubId: "club1" },
  club: { id: "club1", name: "TK Banjica", city: "Beograd" },
};

test("Join turns into Leave and the spots drop by one", async () => {
  let joined = false;
  const current = () =>
    partnerRequest({
      booking: future,
      playersNeeded: 3,
      spotsLeft: joined ? 2 : 3,
      joined: joined ? [{ id: "p1", nickname: "ana", level: "ADVANCED" }] : [],
    });
  server.use(
    http.get(`${API}/partner-requests`, () => HttpResponse.json(page([current()]))),
    http.post(`${API}/partner-requests/r1/join`, () => {
      joined = true;
      return HttpResponse.json(current());
    }),
  );
  await openSignedIn("/partners");
  expect(await screen.findByText("Needs 3 of 3")).toBeOnTheScreen();
  fireEvent.press(screen.getByText("Join"));
  expect(await screen.findByText("Leave")).toBeOnTheScreen();
  expect(screen.getByText("Needs 2 of 3")).toBeOnTheScreen();
});

test("a full request and my own request have no Join", async () => {
  server.use(
    http.get(`${API}/partner-requests`, () =>
      HttpResponse.json(
        page([
          partnerRequest({
            id: "full",
            booking: future,
            spotsLeft: 0,
            joined: [playerSummary({ id: "p7" })],
          }),
          partnerRequest({
            id: "mine",
            booking: future,
            createdBy: { id: "p1", nickname: "ana", level: "ADVANCED" },
          }),
        ]),
      ),
    ),
  );
  await openSignedIn("/partners");
  expect(await screen.findByText("Full")).toBeOnTheScreen();
  expect(screen.getByText("Yours")).toBeOnTheScreen();
  expect(screen.queryByText("Join")).toBeNull();
});

test("the filters map to query parameters", async () => {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/partner-requests`, ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json(page([]));
    }),
  );
  await openSignedIn("/partners");
  await screen.findByText("No open games right now");
  fireEvent.press(screen.getByText("My level"));
  fireEvent.press(screen.getByText("This week"));
  fireEvent.press(screen.getByText("Doubles"));
  await waitFor(() => expect(seen.at(-1)!.get("doubles")).toBe("true"));
  const last = seen.at(-1)!;
  expect(last.get("status")).toBe("OPEN");
  expect(last.get("level")).toBe("ADVANCED");
  expect(last.get("from")).toBeTruthy();
  expect(last.get("to")).toMatch(/T00:00:00Z$/);
});

test("Find partner on a reservation posts a request for that booking", async () => {
  let sent: unknown;
  server.use(
    http.get(`${API}/bookings/b1`, () => HttpResponse.json(booking())),
    http.post(`${API}/partner-requests`, async ({ request }) => {
      sent = await request.json();
      return HttpResponse.json(partnerRequest({ id: "r5", booking: future }), { status: 201 });
    }),
    http.get(`${API}/partner-requests/r5`, () =>
      HttpResponse.json(partnerRequest({ id: "r5", booking: future })),
    ),
  );
  await openSignedIn("/partners/new?bookingId=b1");
  await screen.findByText("TK Banjica · Court 1");
  fireEvent.press(screen.getByText("3 (doubles)"));
  fireEvent.press(screen.getByText("Post the request"));
  expect(await screen.findByText("Joined")).toBeOnTheScreen();
  expect(sent).toEqual({ bookingId: "b1", playersNeeded: 3 });
});
