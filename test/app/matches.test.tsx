import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import i18n from "@/i18n";
import { booking, match, page, partnerRequest } from "../fixtures";
import { API, server } from "../msw";
import { openSignedIn } from "./signedIn";

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

const me = { id: "p1", nickname: "ana", level: "ADVANCED" as const };
const marko = { id: "p2", nickname: "marko", level: "INTERMEDIATE" as const };

test("an impossible score shows the error on the sets", async () => {
  let sent: unknown;
  server.use(
    http.get(`${API}/bookings/b1`, () =>
      HttpResponse.json(
        booking({ partnerRequest: { id: "r1", playersNeeded: 1, spotsLeft: 0, status: "OPEN" } }),
      ),
    ),
    http.get(`${API}/partner-requests/r1`, () =>
      HttpResponse.json(partnerRequest({ createdBy: me, joined: [marko], playersNeeded: 1, spotsLeft: 0 })),
    ),
    http.post(`${API}/matches`, async ({ request }) => {
      sent = await request.json();
      return HttpResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "bad", fields: { sets: ["not finished"] } } },
        { status: 400 },
      );
    }),
  );
  await openSignedIn("/matches/new?bookingId=b1");
  fireEvent.press(await screen.findByLabelText("Opponent: Choose"));
  fireEvent.press(await screen.findByLabelText("Pick marko"));
  fireEvent.changeText(screen.getByLabelText("Set 1, your games"), "6");
  fireEvent.changeText(screen.getByLabelText("Set 1, their games"), "5");
  fireEvent.press(screen.getByText("Save result"));
  expect(await screen.findByText("That isn't a finished tennis score. Check the sets.")).toBeOnTheScreen();
  expect(sent).toMatchObject({
    firstTeam: ["p1"],
    secondTeam: ["p2"],
    sets: [{ firstTeam: 6, secondTeam: 5 }],
    courtId: "court1",
    playedAt: "2026-11-02T17:00:00Z",
  });
});

test("missing players and empty sets are caught before sending", async () => {
  server.use(http.get(`${API}/bookings/b1`, () => HttpResponse.json(booking())));
  await openSignedIn("/matches/new?bookingId=b1");
  fireEvent.press(await screen.findByText("Save result"));
  expect(await screen.findByText("Choose every player.")).toBeOnTheScreen();
  expect(screen.getByText("Fill in both scores for each set you played.")).toBeOnTheScreen();
});

test("Confirm shows only for the team that did not enter the score, and stats refresh after it", async () => {
  let confirmed = false;
  const mine = match({ id: "m1", status: "PENDING", createdBy: me, firstTeam: [me], secondTeam: [marko] });
  const theirs = () =>
    match({
      id: "m2",
      status: confirmed ? "CONFIRMED" : "PENDING",
      createdBy: marko,
      firstTeam: [marko],
      secondTeam: [me],
      sets: [
        { firstTeam: 3, secondTeam: 6 },
        { firstTeam: 2, secondTeam: 6 },
      ],
    });
  server.use(
    http.get(`${API}/me/matches`, () => HttpResponse.json(page([mine, theirs()]))),
    http.get(`${API}/me/stats`, () =>
      HttpResponse.json({
        matches: confirmed ? 1 : 0,
        wins: confirmed ? 1 : 0,
        losses: 0,
        winRate: confirmed ? 1 : null,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      }),
    ),
    http.post(`${API}/matches/m2/confirm`, () => {
      confirmed = true;
      return HttpResponse.json(theirs());
    }),
  );
  await openSignedIn("/matches");
  expect(await screen.findByText("marko entered this score. Is it right?")).toBeOnTheScreen();
  expect(screen.getAllByText("Confirm")).toHaveLength(1);
  fireEvent.press(screen.getByText("Confirm"));
  await waitFor(() => expect(screen.queryByText("Confirm")).toBeNull());
  expect(await screen.findByText("Won")).toBeOnTheScreen();
  await waitFor(() => expect(screen.getByLabelText("Won: 1")).toBeOnTheScreen());
});
