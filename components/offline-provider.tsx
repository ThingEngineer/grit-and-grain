"use client";

import { createContext, useContext } from "react";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { useOnlineStatus } from "@/hooks/use-online-status";

type OfflineContextValue = ReturnType<typeof useOfflineQueue> &
  ReturnType<typeof useOnlineStatus>;

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const onlineStatus = useOnlineStatus();
  const offlineQueue = useOfflineQueue();

  return (
    <OfflineContext.Provider value={{ ...onlineStatus, ...offlineQueue }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return ctx;
}
