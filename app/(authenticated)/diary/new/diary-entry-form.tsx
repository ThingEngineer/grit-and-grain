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
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Date
        </label>
        <input
          type="date"
          id="entry_date"
          name="entry_date"
          defaultValue={today}
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      {/* Pasture */}
      <div>
        <label
          htmlFor="pasture_id"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Pasture
        </label>
        <select
          id="pasture_id"
          name="pasture_id"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
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
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Herd group
        </label>
        <select
          id="herd_group_id"
          name="herd_group_id"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
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
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Observation
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          placeholder="What happened on the ranch today?"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Tags */}
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
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
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save entry
        </button>
      </div>
    </form>
  );
}
