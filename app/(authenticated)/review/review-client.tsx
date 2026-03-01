"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { stripMarkdown } from "@/lib/utils/strip-markdown";
import { ReadAloudButton } from "@/components/read-aloud-button";

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

      const data = (await res.json().catch(() => ({}))) as {
        summary_md?: string;
        error?: string;
        saved?: boolean;
      };

      if (!res.ok) {
        setError(
          data.error ??
            "Something went wrong generating the review. Please try again.",
        );
        return;
      }

      setSummaryMd(data.summary_md ?? null);
    } catch {
      // Network-level failure (no response received)
      setError(
        "Unable to reach the server. Check your connection and try again.",
      );
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
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
          <div>
            <label
              htmlFor="week-start"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Start date
            </label>
            <input
              type="date"
              id="week-start"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="week-end"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              End date
            </label>
            <input
              type="date"
              id="week-end"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={generateReview}
            disabled={isLoading}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Generating…" : "Generate Review"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="animate-pulse text-sm text-muted-foreground">
              Analyzing diary entries and generating your weekly review…
            </div>
          </div>
        )}

        {/* Review content */}
        {displayMd && !isLoading && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex justify-end">
              <ReadAloudButton text={displayMd} />
            </div>
            <div className="prose max-w-none dark:prose-invert">
              <Markdown>{displayMd}</Markdown>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!displayMd && !isLoading && !error && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mb-2 text-4xl">📋</div>
            <p className="text-sm text-muted-foreground">
              Select a date range and click &ldquo;Generate Review&rdquo; to get
              an AI summary of your ranch week.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              In production, reviews can be scheduled (e.g. every Sunday 6pm)
              via Vercel Cron.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar — Previous Reviews */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Previous Reviews
        </h2>
        {previousReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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
                    ? "border-muted-foreground bg-muted"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <div className="font-medium text-foreground">
                  {review.week_start} — {review.week_end}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
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
