import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ApiError } from "./errors";

/** Every list endpoint answers with one page of items and the cursor of the next page. */
export type Page<T> = { items: T[]; nextCursor: string | null };

type Options = { enabled?: boolean; pageSize?: number };

/**
 * One infinite list over a paged endpoint. `queryKey` is the generated key for the first page
 * (so area invalidation by path finds it); the hook adds a marker so it never shares a cache entry
 * with a plain query on the same key.
 */
export function usePagedList<T>(
  queryKey: QueryKey,
  fetchPage: (page: { cursor?: string; limit: number }, signal: AbortSignal) => Promise<Page<T>>,
  { enabled = true, pageSize = 20 }: Options = {},
) {
  const query = useInfiniteQuery<Page<T>, ApiError>({
    queryKey: [...queryKey, "paged"],
    queryFn: ({ pageParam, signal }) =>
      fetchPage({ cursor: (pageParam as string | null) ?? undefined, limit: pageSize }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    /** Safe to call from FlatList's onEndReached: does nothing while a page loads or at the end. */
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
