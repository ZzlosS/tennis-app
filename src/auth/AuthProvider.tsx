import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getGetMeQueryKey,
  login,
  logout,
  register,
  tokens,
  useGetMe,
  type MeResponse,
  type RegisterRequest,
  type Role,
  type Session,
} from "@/api";
import i18n, { isLanguage } from "@/i18n";
import { forgetPushToken } from "@/notifications";
import { tokenStorage } from "./tokenStore";

export type AuthStatus = "restoring" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  /** The signed-in player, once GET /me has answered. */
  me: MeResponse | undefined;
  /** The error from GET /me, if it failed for a reason other than being signed out. */
  meError: unknown;
  refetchMe: () => void;
  role: Role | undefined;
  isClubAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (details: Omit<RegisterRequest, "language">) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(auth: { accessToken: string; refreshToken: string }): Session {
  return { accessToken: auth.accessToken, refreshToken: auth.refreshToken };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(tokens.get());
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const stop = tokens.subscribe(setSession);
    tokens.useStorage(tokenStorage);
    tokens.restore().finally(() => setRestored(true));
    return stop;
  }, []);

  const signedIn = session != null;
  const meQuery = useGetMe({ query: { enabled: signedIn } });
  const me = signedIn ? meQuery.data : undefined;

  // Once signed in, the app speaks the player's saved language (it also decides email and push language).
  useEffect(() => {
    if (me && isLanguage(me.language) && me.language !== i18n.language) {
      void i18n.changeLanguage(me.language);
    }
  }, [me]);

  // Signing out anywhere (including a refused refresh) drops every cached answer.
  useEffect(() => {
    if (restored && !signedIn) queryClient.clear();
  }, [restored, signedIn, queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const auth = await login({ email: email.trim(), password });
      await tokens.set(toSession(auth));
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    },
    [queryClient],
  );

  const registerAccount = useCallback(
    async (details: Omit<RegisterRequest, "language">) => {
      const language = isLanguage(i18n.language) ? i18n.language : "en";
      const auth = await register({ ...details, email: details.email.trim(), language });
      await tokens.set(toSession(auth));
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    const current = tokens.get();
    // Stop pushes to this phone while the session can still say so.
    if (current) await forgetPushToken();
    if (current) await logout({ refreshToken: current.refreshToken }).catch(() => {});
    await tokens.clear();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = me?.role;
    return {
      status: !restored ? "restoring" : signedIn ? "signedIn" : "signedOut",
      me,
      meError: signedIn ? meQuery.error : null,
      refetchMe: () => void meQuery.refetch(),
      role,
      isClubAdmin: role === "CLUB_ADMIN" || role === "ADMIN",
      signIn,
      register: registerAccount,
      signOut,
    };
  }, [restored, signedIn, me, meQuery, signIn, registerAccount, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
