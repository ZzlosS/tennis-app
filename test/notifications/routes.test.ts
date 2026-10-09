import { NotificationType } from "@/api";
import { routeFor } from "@/notifications";

test.each([
  ["BOOKING_REMINDER", { bookingId: "b1" }, "/bookings/b1"],
  ["BOOKING_CANCELLED", { bookingId: "b1" }, "/bookings/b1"],
  ["PARTNER_JOINED", { requestId: "r1" }, "/partners/r1"],
  ["MATCH_TO_CONFIRM", { matchId: "m1" }, "/matches/m1"],
  ["MATCH_CONFIRMED", { matchId: "m1" }, "/matches/m1"],
  ["MATCH_DISPUTED", { matchId: "m1" }, "/matches/m1"],
  ["HANDOVER_REQUESTED", { handoverId: "h1" }, "/handovers/h1"],
  ["HANDOVER_ANSWERED", { handoverId: "h1" }, "/handovers/h1"],
])("%s opens %s", (type, ids, href) => {
  expect(routeFor({ type, ...ids })).toBe(href);
});

test("every notification type the API sends has a route", () => {
  for (const type of Object.values(NotificationType)) expect(routeFor({ type })).not.toBeNull();
  expect(routeFor({ type: "SOMETHING_NEW" })).toBeNull();
  expect(routeFor(undefined)).toBeNull();
});
