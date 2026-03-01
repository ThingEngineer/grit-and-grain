"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { deleteEntry } from "@/app/(authenticated)/diary/actions";
import { tagLabel } from "@/lib/diary/tags";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";

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

  function handleDeleteConfirmed() {
    setShowConfirm(false);
    startTransition(async () => {
      await deleteEntry(id);
    });
  }

  return (
    <>
      <div className="rounded-lg border border-l-2 border-border border-l-primary/20 bg-card p-4 hover:border-l-primary/60 hover:shadow-md transition-all">
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
              <Badge variant="primary">{pastureName}</Badge>
            )}
            {herdGroupName && (
              <Badge variant="accent">{herdGroupName}</Badge>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/diary/${id}/edit`}
              prefetch={false}
              aria-label="Edit entry"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Edit</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              aria-label="Delete entry"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{isPending ? "Deleting…" : "Delete"}</span>
            </button>
          </div>
        </div>
        <p className="mb-2 line-clamp-3 overflow-hidden break-words text-sm text-card-foreground">
          {content}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tagLabel(tag)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Custom delete confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
