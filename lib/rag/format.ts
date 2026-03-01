interface FormatEntryInput {
  entry_date: string;
  content: string;
  pasture_name?: string | null;
  acres?: number | null;
  herd_group_name?: string | null;
  head_count?: number | null;
  tags?: string[];
}

export function formatEntryForRag(entry: FormatEntryInput): string {
  const lines: string[] = [];

  lines.push(`Date: ${entry.entry_date}`);

  if (entry.pasture_name) {
    const acresPart = entry.acres ? ` (${entry.acres} acres)` : "";
    lines.push(`Pasture: ${entry.pasture_name}${acresPart}`);
  }

  if (entry.herd_group_name) {
    const headPart = entry.head_count ? ` (${entry.head_count} head)` : "";
    lines.push(`Herd: ${entry.herd_group_name}${headPart}`);
  }

  if (entry.tags?.length) {
    lines.push(`Tags: ${entry.tags.join(", ")}`);
  }

  lines.push(`Notes: ${entry.content}`);

  return lines.join("\n");
}
