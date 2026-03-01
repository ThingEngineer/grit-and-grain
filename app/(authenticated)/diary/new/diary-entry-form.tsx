"use client";

import { createEntry } from "../actions";
import { useState, useTransition, useRef } from "react";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useOffline } from "@/components/offline-provider";

const AVAILABLE_TAGS = [
  "rainfall",
  "rotation",
  "hay",
  "herd_health",
  "supplement",
  "fencing",
  "water",
  "wildlife",
  "weather",
  "general",
];

type DiaryEntryFormProps = Readonly<{
  pastures: { id: string; name: string }[];
  herdGroups: { id: string; name: string }[];
}>;

export function DiaryEntryForm({ pastures, herdGroups }: DiaryEntryFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const { isOnline, enqueue } = useOffline();
  const [isPending, startTransition] = useTransition();
  const [offlineSaved, setOfflineSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().split("T")[0];

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (isOnline) {
      startTransition(async () => {
        await createEntry(formData);
      });
    } else {
      await enqueue({
        type: "create_entry",
        data: {
          entry_date: formData.get("entry_date") as string,
          content: formData.get("content") as string,
          pasture_id: (formData.get("pasture_id") as string) || undefined,
          herd_group_id: (formData.get("herd_group_id") as string) || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        },
      });
      setContent("");
      setSelectedTags([]);
      setOfflineSaved(true);
      formRef.current?.reset();
      setTimeout(() => setOfflineSaved(false), 4000);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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
          defaultValue={today}
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
          placeholder="What happened on the ranch today?"
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
                {tag}
              </button>
            );
          })}
        </div>
        {/* Hidden inputs for selected tags */}
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save entry"}
          </button>
        </div>
        {offlineSaved && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Saved locally — will sync when you reconnect
          </p>
        )}
      </div>
    </form>
  );
}
