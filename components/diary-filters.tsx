"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

type DiaryFiltersProps = Readonly<{
  pastures: { id: string; name: string }[];
  herdGroups: { id: string; name: string }[];
  allTags: string[];
  totalCount: number;
  filteredCount: number;
}>;

export function DiaryFilters({
  pastures,
  herdGroups,
  allTags,
  totalCount,
  filteredCount,
}: DiaryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      return params.toString();
    },
    [searchParams],
  );

  const push = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const qs = createQueryString(updates);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const q = searchParams.get("q") ?? "";
  const pastureId = searchParams.get("pasture") ?? "";
  const herdGroupId = searchParams.get("herd") ?? "";
  const activeTag = searchParams.get("tag") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  const hasFilters =
    q || pastureId || herdGroupId || activeTag || dateFrom || dateTo;

  const clearAll = () => {
    startTransition(() => router.push(pathname));
  };

  return (
    <div
      className={`space-y-3 ${isPending ? "opacity-60 transition-opacity" : ""}`}
    >
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search entries…"
          defaultValue={q}
          onChange={(e) => push({ q: e.target.value || null })}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-0"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Pasture filter */}
        <select
          value={pastureId}
          onChange={(e) => push({ pasture: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">All pastures</option>
          {pastures.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Herd group filter */}
        <select
          value={herdGroupId}
          onChange={(e) => push({ herd: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">All herds</option>
          {herdGroups.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => push({ from: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => push({ to: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
          title="To date"
        />

        {hasFilters && (
          <button
            onClick={clearAll}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground underline-offset-2 hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tag pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => push({ tag: isActive ? null : tag })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {tag.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          {filteredCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "entry" : "entries"}`
            : `${filteredCount} of ${totalCount} ${totalCount === 1 ? "entry" : "entries"}`}
        </p>
      )}
    </div>
  );
}
