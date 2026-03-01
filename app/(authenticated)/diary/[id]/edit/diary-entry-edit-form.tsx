"use client";

import { updateEntry } from "../../actions";
import { useState, useTransition } from "react";
import { VoiceRecorder } from "@/components/voice-recorder";
import Link from "next/link";
import { AVAILABLE_TAGS, tagLabel } from "@/lib/diary/tags";

type DiaryEntryEditFormProps = Readonly<{
  entryId: string;
  initialDate: string;
  initialContent: string;
  initialPastureId: string | null;
  initialHerdGroupId: string | null;
  initialTags: string[];
  pastures: { id: string; name: string }[];
  herdGroups: { id: string; name: string }[];
}>;

export function DiaryEntryEditForm({
  entryId,
  initialDate,
  initialContent,
  initialPastureId,
  initialHerdGroupId,
  initialTags,
  pastures,
  herdGroups,
}: DiaryEntryEditFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateEntry(entryId, formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Date */}
      <div>
        <label
          htmlFor="entry_date"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Date
        </label>
        <input
          type="date"
          id="entry_date"
          name="entry_date"
          defaultValue={initialDate}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Pasture */}
      <div>
        <label
          htmlFor="pasture_id"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Pasture
        </label>
        <select
          id="pasture_id"
          name="pasture_id"
          defaultValue={initialPastureId ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— None —</option>
          {pastures.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Herd group */}
      <div>
        <label
          htmlFor="herd_group_id"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Herd group
        </label>
        <select
          id="herd_group_id"
          name="herd_group_id"
          defaultValue={initialHerdGroupId ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— None —</option>
          {herdGroups.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Observation
        </label>
        <div className="mb-2">
          <VoiceRecorder
            onTranscript={(text) =>
              setContent((prev) => (prev ? prev + " " + text : text))
            }
          />
        </div>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Tags */}
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Tags
        </span>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-ring"
                }`}
              >
                {tagLabel(tag)}
              </button>
            );
          })}
        </div>
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/diary"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
