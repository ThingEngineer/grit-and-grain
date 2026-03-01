export default function DiaryLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 rounded-md bg-muted" />
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>
      <div className="mb-6 h-12 w-full rounded-lg bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="h-3 w-3/5 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
