import { config } from "@/config";

import { ApiError, toApiError } from "./errors";
import type { AuthResponse } from "./generated/model/authResponse";
import { tokens, type Session } from "./tokens";

// The only code in the app that talks to the backend. Every generated hook calls apiFetch.

/** Tells orval that failed calls reject with ApiError. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = ApiError;
export type BodyType<Body> = Body;

// Routes that must never carry or refresh a token.
const NO_AUTH = /^\/auth\/(login|register|refresh|forgot-password|reset-password|verify-email)\b/;

let refreshing: Promise<Session | null> | null = null;

async function send(url: string, init: RequestInit, accessToken: string | undefined): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (accessToken && !NO_AUTH.test(url)) headers.set("Authorization", `Bearer ${accessToken}`);
  try {
    return await fetch(`${config.apiUrl}${url}`, { ...init, headers });
  } catch (cause) {
    if ((cause as Error)?.name === "AbortError") throw cause;
    throw new ApiError(0, "NETWORK_ERROR", (cause as Error)?.message ?? "Network request failed");
  }
}

async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Swaps the refresh token for a new session. Concurrent callers share one request. */
function refreshSession(): Promise<Session | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const current = tokens.get();
      if (!current) return null;
      try {
        const res = await send(
          "/auth/refresh",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: current.refreshToken }),
          },
          undefined,
        );
        if (!res.ok) {
          // The refresh token is gone or revoked: the player has to sign in again.
          if (res.status === 401) await tokens.clear();
          return null;
        }
        const auth = (await readBody(res)) as AuthResponse;
        const next = { accessToken: auth.accessToken, refreshToken: auth.refreshToken };
        await tokens.set(next);
        return next;
      } catch {
        // Network trouble: keep the session so the next call can try again.
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const session = tokens.get();
  let res = await send(url, init, session?.accessToken);
  let body = await readBody(res);

  if (res.status === 401 && session && !NO_AUTH.test(url)) {
    const error = toApiError(res.status, body);
    if (error.code === "TOKEN_EXPIRED") {
      const next = await refreshSession();
      if (!next) throw error;
      res = await send(url, init, next.accessToken);
      body = await readBody(res);
    } else if (error.code === "UNAUTHENTICATED" || error.code === "TOKEN_INVALID") {
      await tokens.clear();
      throw error;
    }
  }

  if (!res.ok) throw toApiError(res.status, body);
  return body as T;
}
