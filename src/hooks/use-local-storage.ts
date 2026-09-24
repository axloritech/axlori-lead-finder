"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseSnapshot, readSnapshot, serverSnapshot, subscribe, writeSnapshot } from "@/lib/local-store";

/**
 * Persistent state backed by localStorage.
 *
 * Built on `useSyncExternalStore`, so:
 *  - the server and the first client render use the same snapshot (no mismatch),
 *  - several components can read/write the same key and stay in sync,
 *  - there is no setState-in-effect cascade.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const raw = useSyncExternalStore(
    useCallback((listener) => subscribe(key, listener), [key]),
    useCallback(() => readSnapshot(key), [key]),
    serverSnapshot,
  );

  const value = useMemo(() => parseSnapshot<T>(raw, initialValue), [raw, initialValue]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = parseSnapshot<T>(readSnapshot(key), initialValue);
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      writeSnapshot(key, JSON.stringify(resolved));
    },
    [key, initialValue],
  );

  const reset = useCallback(() => writeSnapshot(key, null), [key]);

  return { value, setValue, hydrated: raw !== null, reset } as const;
}
