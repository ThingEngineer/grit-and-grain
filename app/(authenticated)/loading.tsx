export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>

      {/* Content card skeletons */}
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
              <div className="h-3 w-4/6 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
