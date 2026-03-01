export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-36 rounded bg-muted" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
            <div className="h-8 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="mt-1 h-3 w-4/5 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
