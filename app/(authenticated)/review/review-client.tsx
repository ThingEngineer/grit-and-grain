"use client";

import { useState } from "react";
import Markdown from "react-markdown";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "") // headings
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[\s]*[-*+]\s/gm, "") // list markers
    .replace(/^>\s?/gm, "") // blockquotes
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code
    .replace(/\n{2,}/g, " ") // collapse newlines
    .replace(/\n/g, " ")
    .trim();
}

type WeeklyReview = {
  id: string;
  week_start: string;
  week_end: string;
  summary_md: string;
  created_at: string;
};

type ReviewClientProps = Readonly<{
  previousReviews: WeeklyReview[];
}>;

export function ReviewClient({ previousReviews }: ReviewClientProps) {
  const [summaryMd, setSummaryMd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const [weekStart, setWeekStart] = useState(lastWeek);
  const [weekEnd, setWeekEnd] = useState(today);

  async function generateReview() {
    setIsLoading(true);
    setError(null);
    setSummaryMd(null);
    setSelectedReview(null);

    try {
      const res = await fetch("/api/ai/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, weekEnd }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate review");
      }

      const data = await res.json();
      setSummaryMd(data.summary_md);
    } catch {
      setError("Something went wrong generating the review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function viewPreviousReview(review: WeeklyReview) {
    setSummaryMd(review.summary_md);
    setSelectedReview(review.id);
    setWeekStart(review.week_start);
    setWeekEnd(review.week_end);
  }

  const displayMd = summaryMd;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main column */}
      <div className="lg:col-span-2">
        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <label
              htmlFor="week-start"
              className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Start date
            </label>
            <input
              type="date"
              id="week-start"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label
              htmlFor="week-end"
              className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              End date
            </label>
            <input
              type="date"
              id="week-end"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <button
            onClick={generateReview}
            disabled={isLoading}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading ? "Generating…" : "Generate Review"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
              Analyzing diary entries and generating your weekly review…
            </div>
          </div>
        )}

        {/* Review content */}
        {displayMd && !isLoading && (
          <div className="prose prose-zinc max-w-none rounded-lg border border-zinc-200 bg-white p-6 dark:prose-invert dark:border-zinc-800 dark:bg-zinc-950">
            <Markdown>{displayMd}</Markdown>
          </div>
        )}

        {/* Empty state */}
        {!displayMd && !isLoading && !error && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 text-4xl">📋</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select a date range and click &ldquo;Generate Review&rdquo; to get
              an AI summary of your ranch week.
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              In production, reviews can be scheduled (e.g. every Sunday 6pm)
              via Vercel Cron.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar — Previous Reviews */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Previous Reviews
        </h2>
        {previousReviews.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No reviews generated yet.
          </p>
        ) : (
          <div className="space-y-2">
            {previousReviews.map((review) => (
              <button
                key={review.id}
                onClick={() => viewPreviousReview(review)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  selectedReview === review.id
                    ? "border-zinc-500 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                }`}
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {review.week_start} — {review.week_end}
                </div>
                <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {stripMarkdown(review.summary_md).slice(0, 80)}…
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
