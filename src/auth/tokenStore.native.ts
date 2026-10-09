import * as SecureStore from "expo-secure-store";

import type { Session, TokenStorage } from "@/api";

// Android and iOS: both tokens in the Keychain / Keystore.
const KEY = "rally.session";

export const tokenStorage: TokenStorage = {
  async load() {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Session;
      return parsed.refreshToken ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(session) {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY);
  },
};
