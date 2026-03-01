"use client";

import { useState } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { IOSInstallModal } from "@/components/pwa-install-modal-ios";

type InstallAppMenuItemProps = Readonly<{
  onClose: () => void;
}>;

export function InstallAppMenuItem({ onClose }: InstallAppMenuItemProps) {
  const { canInstall, canInstallNatively, install } = usePwaInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    onClose();
    if (canInstallNatively) {
      await install();
    } else {
      // iOS — show manual instructions
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={handleClick}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
      >
        {/* Download / install icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-muted-foreground"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install App
      </button>

      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
}
