"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedButton(props: Readonly<{ hasEntries?: boolean }>) {
  const { hasEntries = false } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to seed demo data.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to remove demo data.");
        return;
      }

      setSuccess("Demo data removed.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {!hasEntries ? (
        <button
          type="button"
          onClick={handleSeed}
          disabled={loading}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Seeding…" : "🌾 Load Demo Farm (Dry Creek Ranch)"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
        >
          {loading ? "Removing…" : "🗑 Remove Demo Data"}
        </button>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
      )}
    </div>
  );
}
