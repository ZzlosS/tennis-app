import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

import { createQueryClient, getMyBookings, invalidatePaths, usePagedList } from "@/api";
import { booking, page } from "../fixtures";
import { API, server } from "../msw";

test("loads the next page on demand and stops at nextCursor: null", async () => {
  const cursors: (string | null)[] = [];
  server.use(
    http.get(`${API}/me/bookings`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get("cursor");
      cursors.push(cursor);
      return HttpResponse.json(
        cursor ? page([booking({ id: "b2" })], null) : page([booking({ id: "b1" })], "next-1"),
      );
    }),
  );
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      usePagedList(["/me/bookings", { when: "upcoming" }], (p, signal) =>
        getMyBookings({ when: "upcoming", ...p }, { signal }),
      ),
    { wrapper },
  );
  await waitFor(() => expect(result.current.items.map((b) => b.id)).toEqual(["b1"]));
  expect(result.current.hasNextPage).toBe(true);

  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.items.map((b) => b.id)).toEqual(["b1", "b2"]));
  expect(result.current.hasNextPage).toBe(false);

  act(() => result.current.loadMore());
  expect(cursors).toEqual([null, "next-1"]);

  // Invalidating the area by path refetches the list.
  await act(() => invalidatePaths(client, ["/me/bookings"]));
  await waitFor(() => expect(cursors.length).toBeGreaterThan(2));
});
