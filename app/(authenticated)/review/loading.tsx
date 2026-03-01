export default function ReviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-8 w-40 rounded-md bg-muted" />
      <div className="mb-6 h-4 w-96 rounded bg-muted" />
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 rounded bg-muted ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
