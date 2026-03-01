"use client";

import { useSyncExternalStore, useCallback } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // Assume online during SSR
  return true;
}

/**
 * Tracks browser connectivity via `navigator.onLine` + online/offline events.
 * SSR-safe (defaults to `true` on the server).
 */
export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      // Ping a tiny resource to verify true connectivity
      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return { isOnline, checkConnection };
}
