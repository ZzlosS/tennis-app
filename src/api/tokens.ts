// The signed-in session, held in memory for every request and persisted through a
// platform-specific storage (secure store on phones, localStorage on web; see src/auth).

export type Session = { accessToken: string; refreshToken: string };

export interface TokenStorage {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}

const memoryOnly: TokenStorage = {
  load: async () => null,
  save: async () => {},
  clear: async () => {},
};

type Listener = (session: Session | null) => void;

let session: Session | null = null;
let storage: TokenStorage = memoryOnly;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(session);
}

export const tokens = {
  get(): Session | null {
    return session;
  },
  useStorage(next: TokenStorage) {
    storage = next;
  },
  /** Loads a saved session at start-up. */
  async restore(): Promise<Session | null> {
    session = await storage.load().catch(() => null);
    emit();
    return session;
  },
  async set(next: Session): Promise<void> {
    session = next;
    emit();
    await storage.save(next);
  },
  async clear(): Promise<void> {
    session = null;
    emit();
    await storage.clear();
  },
  /** Called with the new session (or null) whenever it changes. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
