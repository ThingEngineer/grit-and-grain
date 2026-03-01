"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type PwaInstallState = {
  /** True if a native deferred install prompt is available (Chrome / Edge / Android) */
  canInstallNatively: boolean;
  /** True if running in iOS Safari — must show manual Add-to-Home-Screen instructions */
  isIOS: boolean;
  /** True if already running in standalone / installed PWA mode */
  isStandalone: boolean;
  /** Convenience flag: something actionable can be shown to the user */
  canInstall: boolean;
  /** Trigger the deferred native browser install prompt */
  install: () => Promise<void>;
};

export function usePwaInstall(): PwaInstallState {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Lazy initialisers so we read window only on the client (SSR returns false)
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    );
  });
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    // Capture the deferred install prompt on Chrome / Edge / Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // prevent the mini-infobar from showing automatically
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Mark as installed after a successful install flow
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsStandalone(true);
    }
  }, [installPrompt]);

  const canInstallNatively = !!installPrompt && !isStandalone;
  const canInstall = canInstallNatively || (isIOS && !isStandalone);

  return { canInstallNatively, isIOS, isStandalone, canInstall, install };
}
