"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { get, set, del } from "idb-keyval";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "./use-online-status";

const QUEUE_KEY = "grit-offline-queue";

export type OfflineOperation = {
  id: string;
  type:
    | "create_entry"
    | "create_pasture"
    | "delete_pasture"
    | "create_herd"
    | "delete_herd"
    | "update_profile";
  data: Record<string, unknown>;
  timestamp: number;
};

type SyncResult = {
  id: string;
  success: boolean;
  error?: string;
};

async function loadQueue(): Promise<OfflineOperation[]> {
  try {
    return (await get<OfflineOperation[]>(QUEUE_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: OfflineOperation[]): Promise<void> {
  if (queue.length === 0) {
    await del(QUEUE_KEY);
  } else {
    await set(QUEUE_KEY, queue);
  }
}

/**
 * Manages an offline operation queue backed by IndexedDB.
 *
 * - `enqueue()` — adds an operation to the queue
 * - `queue` — reactive array of pending operations
 * - `pendingCount` — number of queued items
 * - `isSyncing` — true while flushing the queue
 * - `lastSyncResults` — results from the most recent sync attempt
 *
 * Auto-flushes when the browser transitions from offline → online.
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResults, setLastSyncResults] = useState<SyncResult[] | null>(
    null,
  );
  const { isOnline } = useOnlineStatus();
  const wasOnlineRef = useRef(isOnline);
  const syncingRef = useRef(false);
  const router = useRouter();

  // Load queue from IndexedDB on mount; flush immediately if already online
  useEffect(() => {
    loadQueue().then((q) => {
      setQueue(q);
      // Covers the page-refresh case: wasOnlineRef starts true so the
      // offline→online transition effect never fires — flush here instead.
      if (navigator.onLine && q.length > 0) {
        flush();
      }
    });
    // flush is stable (empty useCallback deps), safe to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enqueue = useCallback(
    async (op: Omit<OfflineOperation, "id" | "timestamp">) => {
      const entry: OfflineOperation = {
        ...op,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setQueue((prev) => {
        const next = [...prev, entry];
        saveQueue(next);
        return next;
      });
      return entry.id;
    },
    [],
  );

  const flush = useCallback(async () => {
    if (syncingRef.current) return;
    const currentQueue = await loadQueue();
    if (currentQueue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const res = await fetch("/api/offline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: currentQueue }),
      });

      if (!res.ok) {
        console.error("[offline-queue] Sync failed:", res.status);
        return;
      }

      const { results } = (await res.json()) as { results: SyncResult[] };
      setLastSyncResults(results);

      // Remove successfully synced operations from the queue
      const failedIds = new Set(
        results.filter((r) => !r.success).map((r) => r.id),
      );
      const remaining = currentQueue.filter((op) => failedIds.has(op.id));
      await saveQueue(remaining);
      setQueue(remaining);

      // Refresh server components so newly synced entries appear immediately
      if (remaining.length < currentQueue.length) {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      console.error("[offline-queue] Sync error:", err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [router]);

  // Auto-clear the success banner after 4 s
  useEffect(() => {
    if (
      lastSyncResults !== null &&
      lastSyncResults.every((r) => r.success)
    ) {
      const t = setTimeout(() => setLastSyncResults(null), 4000);
      return () => clearTimeout(t);
    }
  }, [lastSyncResults]);

  // Auto-flush when transitioning from offline → online
  useEffect(() => {
    if (!wasOnlineRef.current && isOnline && queue.length > 0) {
      flush();
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, queue.length, flush]);

  return {
    queue,
    pendingCount: queue.length,
    isSyncing,
    lastSyncResults,
    enqueue,
    flush,
  };
}
