"use client";

import { createEntry } from "../actions";
import { useState } from "react";

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

  const today = new Date().toISOString().split("T")[0];

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <form action={createEntry} className="max-w-2xl space-y-6">
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
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          placeholder="What happened on the ranch today?"
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
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Save entry
        </button>
      </div>
    </form>
  );
}
