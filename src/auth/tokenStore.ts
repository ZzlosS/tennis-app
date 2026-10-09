import type { TokenStorage } from "@/api";

// Web: the access token lives only in memory; the refresh token is kept in localStorage so a
// reload stays signed in. The first API call after a reload swaps it for a new access token.
// Moving the refresh token to an httpOnly cookie needs a backend change (open question in the plan).
const KEY = "rally.refreshToken";

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const tokenStorage: TokenStorage = {
  async load() {
    const refreshToken = storage()?.getItem(KEY);
    return refreshToken ? { accessToken: "", refreshToken } : null;
  },
  async save(session) {
    storage()?.setItem(KEY, session.refreshToken);
  },
  async clear() {
    storage()?.removeItem(KEY);
  },
};
