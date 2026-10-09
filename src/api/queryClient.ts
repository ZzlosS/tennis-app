import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { isApiError } from "./errors";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 4xx will not change on retry; network errors and 5xx get two more tries.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

/** Refetches stale queries when the app comes back to the foreground on phones. Returns a cleanup. */
export function refetchOnAppFocus(): () => void {
  if (Platform.OS === "web") return () => {};
  const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
    focusManager.setFocused(status === "active");
  });
  return () => sub.remove();
}
