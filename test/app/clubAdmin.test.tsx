import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import type { ClubScheduleResponse, ScheduleSlot } from "@/api";
import i18n from "@/i18n";
import { booking, clubDetail, court, handover, page } from "../fixtures";
import { API, server } from "../msw";
import { openSignedIn } from "./signedIn";

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

// 16:00 to 21:00 in Belgrade (UTC+1 in November), with Ana's booking from 18:00 to 20:00.
function slots(paidAt: string | null = null): ScheduleSlot[] {
  return [16, 17, 18, 19, 20].map((hour) => {
    const booked = hour === 18 || hour === 19;
    return {
      startsAt: `2026-11-02T${String(hour - 1).padStart(2, "0")}:00:00Z`,
      endsAt: `2026-11-02T${String(hour).padStart(2, "0")}:00:00Z`,
      localTime: `${hour}:00`,
      status: booked ? "BOOKED" : "FREE",
      booking: booked
        ? { id: "b1", player: { id: "p9", nickname: "marko", level: "PRO" }, paidAt, seriesId: null }
        : null,
      block: null,
    };
  });
}

function clubBackend() {
  let paidAt: string | null = null;
  let blocked: unknown;
  server.use(
    http.get(`${API}/clubs/club1`, () => HttpResponse.json(clubDetail())),
    http.get(`${API}/clubs/club1/schedule`, () => {
      const schedule: ClubScheduleResponse = {
        clubId: "club1",
        date: "2026-11-02",
        timeZone: "Europe/Belgrade",
        courts: [
          {
            court: { id: "court1", name: "Court 1", surface: "CLAY", clubId: "club1" },
            active: true,
            slots: slots(paidAt),
          },
        ],
      };
      return HttpResponse.json(schedule);
    }),
    http.get(`${API}/bookings/b1`, () => HttpResponse.json(booking({ paidAt }))),
    http.post(`${API}/bookings/b1/paid`, () => {
      paidAt = "2026-11-02T19:00:00Z";
      return HttpResponse.json(booking({ paidAt }));
    }),
    http.post(`${API}/courts/court1/blocks`, async ({ request }) => {
      blocked = await request.json();
      return HttpResponse.json({}, { status: 201 });
    }),
  );
  return { blocked: () => blocked };
}

test("a 2-hour booking spans two rows, and Mark as paid flips its badge", async () => {
  clubBackend();
  await openSignedIn("/club-admin/club1/today", { role: "CLUB_ADMIN" });
  fireEvent.press(await screen.findByLabelText("marko, Court 1, 18:00–20:00"));
  expect(await screen.findByText("Pay at the club")).toBeOnTheScreen();
  fireEvent.press(screen.getByText("Mark as paid"));
  expect(await screen.findByText("Paid")).toBeOnTheScreen();
  expect(screen.getByText("Mark as unpaid")).toBeOnTheScreen();
});

test("an empty hour can be blocked", async () => {
  const api = clubBackend();
  jest.spyOn(require("react-native").Alert, "alert").mockImplementation((...args: unknown[]) => {
    const buttons = args[2] as { onPress?: () => void }[];
    buttons[1]?.onPress?.();
  });
  await openSignedIn("/club-admin/club1/today", { role: "CLUB_ADMIN" });
  fireEvent.press(await screen.findByLabelText("Court 1, 16:00, free"));
  await waitFor(() =>
    expect(api.blocked()).toEqual({ startsAt: "2026-11-02T15:00:00Z", endsAt: "2026-11-02T16:00:00Z" }),
  );
});

test("accepting a handover moves the court into the club's list", async () => {
  let accepted = false;
  const park = court({ id: "park1", name: "Kalemegdan court", kind: "CLUB", surface: "HARD" });
  server.use(
    http.get(`${API}/clubs/club1`, () => HttpResponse.json(clubDetail())),
    http.get(`${API}/clubs/club1/courts`, () =>
      HttpResponse.json(page(accepted ? [court(), park] : [court()])),
    ),
    http.get(`${API}/me/court-handovers`, () => HttpResponse.json(page(accepted ? [] : [handover()]))),
    http.post(`${API}/court-handovers/h1/accept`, () => {
      accepted = true;
      return HttpResponse.json(handover({ status: "ACCEPTED" }));
    }),
  );
  await openSignedIn("/club-admin/club1/courts", { role: "CLUB_ADMIN" });
  expect(await screen.findByText("marko wants to give “Kalemegdan court” to your club")).toBeOnTheScreen();
  expect(screen.queryByText("Kalemegdan court")).toBeNull();
  fireEvent.press(screen.getByText("Accept"));
  expect(await screen.findByText("Kalemegdan court")).toBeOnTheScreen();
  expect(screen.queryByText(/wants to give/)).toBeNull();
});
