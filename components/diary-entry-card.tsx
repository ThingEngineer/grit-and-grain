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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-3 text-sm text-muted-foreground">
        <time dateTime={entryDate} className="font-medium text-card-foreground">
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
      <p className="mb-2 text-sm text-card-foreground">{truncated}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
