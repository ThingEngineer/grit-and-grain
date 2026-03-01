"use client";

import { useState } from "react";

export function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch {
      alert("Failed to delete account");
      setIsDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-destructive">
        Type <span className="font-bold">DELETE</span> to confirm:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="w-full rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || isDeleting}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Permanently delete my account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
          }}
          className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
