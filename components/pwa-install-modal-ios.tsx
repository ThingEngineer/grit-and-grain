"use client";

type IOSInstallModalProps = Readonly<{
  onClose: () => void;
}>;

export function IOSInstallModal({ onClose }: IOSInstallModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-popover p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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

        {/* App icon + title */}
        <div className="mb-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/icon-192.png"
            alt=""
            aria-hidden="true"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div>
            <h2
              id="ios-install-title"
              className="text-base font-semibold text-popover-foreground"
            >
              Install Grit &amp; Grain
            </h2>
            <p className="text-xs text-muted-foreground">
              Add to your Home Screen for the best experience
            </p>
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-4 text-sm text-popover-foreground">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span>
              Tap the <strong>Share</strong> button {/* iOS share icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="inline align-text-bottom"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>{" "}
              in Safari&apos;s toolbar at the bottom of the screen.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span>
              Scroll down in the share sheet and tap{" "}
              <strong>Add to Home Screen</strong>{" "}
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
                className="inline align-text-bottom"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span>
              Tap <strong>Add</strong> in the top-right corner to confirm.
            </span>
          </li>
        </ol>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Open Safari to use this feature — other iOS browsers don&apos;t
          support Add to Home Screen.
        </p>
      </div>
    </div>
  );
}
