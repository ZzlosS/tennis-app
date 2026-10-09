import type { Href } from "expo-router";

/** Where a tap on a notification goes, from the `data` the backend sends with each push. */
export function routeFor(data: Record<string, unknown> | undefined | null): Href | null {
  if (!data) return null;
  const id = (key: string) => (typeof data[key] === "string" && data[key] ? (data[key] as string) : null);
  switch (data.type) {
    case "BOOKING_REMINDER":
    case "BOOKING_CANCELLED":
      return id("bookingId") ? `/bookings/${id("bookingId")}` : "/reservations";
    case "PARTNER_JOINED":
      return id("requestId") ? `/partners/${id("requestId")}` : "/partners";
    case "MATCH_TO_CONFIRM":
    case "MATCH_CONFIRMED":
    case "MATCH_DISPUTED":
      return id("matchId") ? `/matches/${id("matchId")}` : "/matches";
    case "HANDOVER_REQUESTED":
    case "HANDOVER_ANSWERED":
      return id("handoverId") ? `/handovers/${id("handoverId")}` : "/profile";
    default:
      return null;
  }
}
