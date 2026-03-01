"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { deleteEntry } from "@/app/(authenticated)/diary/actions";
import { tagLabel } from "@/lib/diary/tags";

type DiaryEntryCardProps = Readonly<{
  id: string;
  entryDate: string;
  pastureName?: string | null;
  herdGroupName?: string | null;
  content: string;
  tags: string[];
}>;

export function DiaryEntryCard({
  id,
  entryDate,
  pastureName,
  herdGroupName,
  content,
  tags,
}: DiaryEntryCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const truncated =
    content.length > 180 ? content.slice(0, 180) + "…" : content;

  function handleDeleteConfirmed() {
    setShowConfirm(false);
    startTransition(async () => {
      await deleteEntry(id);
    });
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time
              dateTime={entryDate}
              className="font-medium text-card-foreground"
            >
              {new Date(entryDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {pastureName && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {pastureName}
              </span>
            )}
            {herdGroupName && (
              <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {herdGroupName}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/diary/${id}/edit`}
              prefetch={false}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="text-xs font-medium text-destructive/70 transition-colors hover:text-destructive disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
        <p className="mb-2 text-sm text-card-foreground">{truncated}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom delete confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2
              id="confirm-dialog-title"
              className="mb-2 font-serif text-lg font-semibold text-card-foreground"
            >
              Delete entry?
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              This diary entry will be permanently deleted and cannot be
              recovered.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
