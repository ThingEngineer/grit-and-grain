/**
 * Canonical list of available diary entry tags.
 * Keep in sync with seed data and displayed in the UI as human-readable labels.
 */
export const AVAILABLE_TAGS = [
  "breeding",
  "calving",
  "fencing",
  "fertilizer",
  "general",
  "hay",
  "herd_health",
  "maintenance",
  "pasture_check",
  "rainfall",
  "rotation",
  "supplement",
  "vaccination",
  "water",
  "weather",
  "wildlife",
] as const;

export type DiaryTag = (typeof AVAILABLE_TAGS)[number];

/** Convert a snake_case tag value to a human-readable label. */
export function tagLabel(tag: string): string {
  return tag
    .split("_")
    .map((word, i) =>
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}
