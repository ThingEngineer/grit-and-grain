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
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {loading ? "Seeding…" : "🌾 Load Demo Farm (Dry Creek Ranch)"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950"
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
