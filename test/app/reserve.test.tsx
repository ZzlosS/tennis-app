import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { Alert } from "react-native";

import type { AvailabilityResponse } from "@/api";
import i18n from "@/i18n";
import { booking, club, court, page } from "../fixtures";
import { API, server } from "../msw";
import { openSignedIn } from "./signedIn";

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

// 16:00–20:00 Belgrade on a far-off day; 17:00 is taken.
function availability(taken: string[] = ["17:00"]): AvailabilityResponse {
  return {
    courtId: "court1",
    date: "2030-01-07",
    timeZone: "Europe/Belgrade",
    pricePerHour: { amountMinor: 180000, currency: "RSD" },
    slots: [16, 17, 18, 19].map((hour) => ({
      startsAt: `2030-01-07T${hour - 1}:00:00Z`,
      endsAt: `2030-01-07T${hour}:00:00Z`,
      localTime: `${hour}:00`,
      status: taken.includes(`${hour}:00`) ? "BOOKED" : "FREE",
    })),
  };
}

function reserveBackend(createAnswer?: () => Response) {
  let calls = 0;
  let sent: unknown;
  server.use(
    http.get(`${API}/courts/court1`, () => HttpResponse.json(court())),
    http.get(`${API}/courts/court1/availability`, () => {
      calls++;
      return HttpResponse.json(availability(calls > 1 ? ["17:00", "18:00"] : ["17:00"]));
    }),
    http.post(`${API}/bookings`, async ({ request }) => {
      sent = await request.json();
      return createAnswer?.() ?? HttpResponse.json(booking({ id: "new1" }), { status: 201 });
    }),
    http.get(`${API}/bookings/new1`, () => HttpResponse.json(booking({ id: "new1" }))),
  );
  return { calls: () => calls, sent: () => sent };
}

test("taken hours cannot be picked, and a 2-hour booking with a partner request is sent", async () => {
  const api = reserveBackend();
  await openSignedIn("/courts/court1/reserve");
  expect(await screen.findByLabelText("17:00, taken")).toBeDisabled();

  fireEvent.press(screen.getByLabelText("18:00"));
  fireEvent.press(screen.getByText("2 h"));
  expect(screen.getByText("RSD 1,800 × 2 h · Pay at the club")).toBeOnTheScreen();
  fireEvent(screen.getByLabelText("Look for a partner"), "valueChange", true);
  fireEvent.press(screen.getByText("3 (doubles)"));
  fireEvent.press(screen.getByText("Reserve"));

  expect(await screen.findByText("Reservation")).toBeOnTheScreen();
  expect(api.sent()).toEqual({
    courtId: "court1",
    startsAt: "2030-01-07T17:00:00Z",
    endsAt: "2030-01-07T19:00:00Z",
    bookingType: "ONE_TIME",
    partnerRequest: { playersNeeded: 3 },
  });
});

test("a 2-hour booking cannot start right before a taken hour", async () => {
  reserveBackend();
  await openSignedIn("/courts/court1/reserve");
  fireEvent.press(await screen.findByLabelText("16:00"));
  expect(screen.getByText("2 h")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "2 h" })).toBeDisabled();
});

test("a clash says the hour was taken and refetches the grid", async () => {
  const api = reserveBackend(() =>
    HttpResponse.json({ error: { code: "SLOT_TAKEN", message: "taken" } }, { status: 409 }),
  );
  await openSignedIn("/courts/court1/reserve");
  fireEvent.press(await screen.findByLabelText("18:00"));
  fireEvent.press(screen.getByText("Reserve"));
  expect(await screen.findByText("Someone just booked that time. Pick another slot.")).toBeOnTheScreen();
  expect(await screen.findByLabelText("18:00, taken")).toBeDisabled();
  expect(api.calls()).toBe(2);
});

test("a booking near midnight UTC shows the Belgrade day", async () => {
  server.use(
    http.get(`${API}/me/bookings`, () =>
      HttpResponse.json(
        page([booking({ startsAt: "2030-01-07T23:30:00Z", endsAt: "2030-01-08T00:30:00Z" })]),
      ),
    ),
  );
  await openSignedIn("/reservations");
  expect(await screen.findByText("Tue 8 Jan")).toBeOnTheScreen();
  expect(screen.getByText("00:30–01:30")).toBeOnTheScreen();
});

test("cancelling too late shows CANCEL_TOO_LATE, and a weekly booking cancels as a series", async () => {
  const cancels: string[] = [];
  server.use(
    http.get(`${API}/me/bookings`, () =>
      HttpResponse.json(
        page([
          booking({ id: "late", startsAt: "2030-01-07T10:00:00Z", endsAt: "2030-01-07T11:00:00Z" }),
          booking({ id: "weekly", seriesId: "s1", bookingType: "MONTH" }),
        ]),
      ),
    ),
    http.get(`${API}/clubs/club1`, () => HttpResponse.json(club({ cancelCutoffHours: 24 }))),
    http.post(`${API}/bookings/:id/cancel`, ({ params, request }) => {
      cancels.push(`${params.id}?${new URL(request.url).searchParams}`);
      return params.id === "late"
        ? HttpResponse.json({ error: { code: "CANCEL_TOO_LATE", message: "late" } }, { status: 409 })
        : HttpResponse.json(booking({ status: "CANCELLED" }));
    }),
  );
  const alert = jest.spyOn(Alert, "alert");
  // First the plain "Cancel this reservation?" (confirm), then the series choice (this one / whole series).
  alert.mockImplementationOnce((_t, message, buttons) => {
    expect(message).toBe("This club allows cancelling up to 24 h before the start.");
    buttons?.[1]?.onPress?.();
  });
  alert.mockImplementationOnce((_t, _m, buttons) => buttons?.[1]?.onPress?.());

  await openSignedIn("/reservations");
  await screen.findAllByText("Cancel");
  fireEvent.press(screen.getAllByText("Cancel")[0]!);
  expect(await screen.findByText("It's too late to cancel this reservation.")).toBeOnTheScreen();

  fireEvent.press(screen.getAllByText("Cancel")[1]!);
  await waitFor(() => expect(cancels).toEqual(["late?", "weekly?series=true"]));
});
