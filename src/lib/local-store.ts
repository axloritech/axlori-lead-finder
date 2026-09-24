/**
 * Tiny localStorage-backed store.
 *
 * Used with `useSyncExternalStore` so persisted state is read as an external
 * source: no setState-in-effect, no hydration mismatch, and every component that
 * subscribes to a key stays in sync automatically (including across tabs).
 *
 * The store is deliberately small and dependency-free; swapping it for a server
 * API later means reimplementing these four functions.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const snapshotCache = new Map<string, string | null>();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function subscribe(key: string, listener: Listener): () => void {
  if (!isBrowser()) return () => {};

  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);

  // Keep other tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      snapshotCache.delete(key);
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set?.delete(listener);
    if (set && set.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns a stable snapshot for `useSyncExternalStore` (server: null). */
export function readSnapshot(key: string): string | null {
  if (!isBrowser()) return null;
  if (!snapshotCache.has(key)) {
    try {
      snapshotCache.set(key, window.localStorage.getItem(key));
    } catch {
      snapshotCache.set(key, null);
    }
  }
  return snapshotCache.get(key) ?? null;
}

export function writeSnapshot(key: string, raw: string | null) {
  if (!isBrowser()) return;
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
  } catch {
    // Quota exceeded or storage disabled — state stays in memory for this session.
  }
  snapshotCache.set(key, raw);
  notify(key);
}

export function parseSnapshot<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const serverSnapshot = () => null;
