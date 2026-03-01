"use client";

import { useOffline } from "@/components/offline-provider";
import { WifiOff, Loader2, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, lastSyncResults, flush } =
    useOffline();

  const allSynced =
    lastSyncResults !== null &&
    lastSyncResults.length > 0 &&
    lastSyncResults.every((r) => r.success) &&
    pendingCount === 0;

  // Show nothing when online and nothing to report
  if (isOnline && pendingCount === 0 && !isSyncing && !allSynced) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Offline banner */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-950"
        >
          <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-amber-900 dark:text-amber-200">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              You&apos;re offline — changes will sync when you reconnect
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                  {pendingCount} pending
                </span>
              )}
            </span>
          </div>
          <p className="mt-1 text-center text-xs text-amber-700 dark:text-amber-400">
            Showing cached content from your last visit — new entries and
            changes made offline will appear after you reconnect and sync.
          </p>
        </motion.div>
      )}

      {/* Online with un-synced items (e.g. sync failed on reconnect) */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <motion.div
          key="pending"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-950"
        >
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {pendingCount} change{pendingCount !== 1 ? "s" : ""} waiting to sync
          </span>
          <button
            onClick={() => flush()}
            className="rounded bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
          >
            Sync now
          </button>
        </motion.div>
      )}

      {/* Syncing indicator */}
      {isOnline && isSyncing && (
        <motion.div
          key="syncing"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 bg-blue-100 px-4 py-2 text-center text-sm font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200"
        >
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
          <span>Syncing offline changes…</span>
        </motion.div>
      )}

      {/* Success flash */}
      {isOnline && allSynced && !isSyncing && (
        <motion.div
          key="synced"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 bg-green-100 px-4 py-2 text-center text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-200"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>All changes synced successfully</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
