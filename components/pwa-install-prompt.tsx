"use client";

import { useState } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { IOSInstallModal } from "@/components/pwa-install-modal-ios";

const DISMISSED_KEY = "pwa-prompt-dismissed";

export function PwaInstallPrompt() {
  const { canInstall, canInstallNatively, install } = usePwaInstall();

  // Lazy initialisers — read window/localStorage only on the client
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISSED_KEY) === "true";
  });
  const [isMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleInstall = async () => {
    dismiss();
    if (canInstallNatively) {
      await install();
    } else {
      setShowIOSModal(true);
    }
  };

  if (!canInstall || dismissed || !isMobile) return null;

  return (
    <>
      <div
        role="banner"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-popover px-4 py-3 shadow-lg"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {/* App icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/icon-192.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="shrink-0 rounded-xl"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-popover-foreground">
              Install Grit &amp; Grain
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Add to your Home Screen for offline field use
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {canInstallNatively ? "Install" : "How to install"}
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
}
