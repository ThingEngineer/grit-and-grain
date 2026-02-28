type DiaryEntryCardProps = Readonly<{
  id: string;
  entryDate: string;
  pastureName?: string | null;
  herdGroupName?: string | null;
  content: string;
  tags: string[];
}>;

export function DiaryEntryCard({
  entryDate,
  pastureName,
  herdGroupName,
  content,
  tags,
}: DiaryEntryCardProps) {
  const truncated =
    content.length > 180 ? content.slice(0, 180) + "…" : content;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <time
          dateTime={entryDate}
          className="font-medium text-zinc-700 dark:text-zinc-300"
        >
          {new Date(entryDate + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        {pastureName && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {pastureName}
          </span>
        )}
        {herdGroupName && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            {herdGroupName}
          </span>
        )}
      </div>
      <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
        {truncated}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
