import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Generated query keys start with the request path ("/me/bookings", "/courts/c1/availability"),
// so one area of the app is refreshed by path prefix after a change, and lists update without a reload.

function keyPath(key: readonly unknown[]): string {
  return typeof key[0] === "string" ? key[0] : "";
}

/** Marks every query whose path starts with one of the prefixes as stale, and refetches the visible ones. */
export function invalidatePaths(queryClient: QueryClient, prefixes: string[]): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const path = keyPath(query.queryKey);
      return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    },
  });
}

/** What each kind of change can make out of date. */
export const areas = {
  /** A booking made, moved, cancelled or marked paid. */
  bookings: ["/me/bookings", "/bookings", "/courts", "/clubs", "/partner-requests", "/me/partner-requests"],
  /** A court or club added, edited, deleted or handed over. */
  courts: ["/courts", "/places", "/clubs", "/me/courts", "/me/clubs", "/me/court-handovers"],
  /** A partner request created, joined, left or closed. */
  partners: ["/partner-requests", "/me/partner-requests", "/me/bookings", "/bookings"],
  /** A match recorded, confirmed or disputed. */
  matches: ["/matches", "/me/matches", "/me/stats", "/players"],
  /** The player's own details or rackets. */
  profile: ["/me", "/players", "/rackets"],
  notifications: ["/me/notifications"],
} as const;

export type Area = keyof typeof areas;

/** `const invalidate = useInvalidate(); await invalidate("bookings")` after a change. */
export function useInvalidate() {
  const queryClient = useQueryClient();
  return useMemo(
    () =>
      (...changed: Area[]) =>
        invalidatePaths(
          queryClient,
          changed.flatMap((area) => [...areas[area]]),
        ),
    [queryClient],
  );
}
