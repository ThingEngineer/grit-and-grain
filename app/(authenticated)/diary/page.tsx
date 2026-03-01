import { createClient } from "@/lib/supabase/server";
import { DiaryEntryCard } from "@/components/diary-entry-card";
import { DiaryFilters } from "@/components/diary-filters";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { Suspense } from "react";

type SearchParams = Promise<{
  q?: string;
  pasture?: string;
  herd?: string;
  tag?: string;
  from?: string;
  to?: string;
}>;

export default async function DiaryListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { q, pasture, herd, tag, from, to } = await searchParams;

  // Fetch pastures, herd groups and all entries in parallel
  const [pasturesResult, herdsResult, allEntriesResult] = await Promise.all([
    supabase
      .from("pastures")
      .select("id, name")
      .eq("profile_id", user!.id)
      .order("name"),
    supabase
      .from("herd_groups")
      .select("id, name")
      .eq("profile_id", user!.id)
      .order("name"),
    supabase
      .from("diary_entries")
      .select("id, tags")
      .eq("profile_id", user!.id),
  ]);

  const pastures = pasturesResult.data ?? [];
  const herdGroups = herdsResult.data ?? [];

  // Collect all unique tags across all entries
  const allTags = Array.from(
    new Set((allEntriesResult.data ?? []).flatMap((e) => e.tags ?? [])),
  ).sort() as string[];

  const totalCount = allEntriesResult.data?.length ?? 0;

  // Build filtered query
  let query = supabase
    .from("diary_entries")
    .select("*, pastures(name), herd_groups(name)")
    .eq("profile_id", user!.id)
    .order("entry_date", { ascending: false });

  if (q) {
    query = query.ilike("content", `%${q}%`);
  }
  if (pasture) {
    query = query.eq("pasture_id", pasture);
  }
  if (herd) {
    query = query.eq("herd_group_id", herd);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (from) {
    query = query.gte("entry_date", from);
  }
  if (to) {
    query = query.lte("entry_date", to);
  }

  const { data: entries } = await query;
  const filteredCount = entries?.length ?? 0;

  const hasFilters = q || pasture || herd || tag || from || to;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Diary entries
        </h1>
        <Link
          href="/diary/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New entry
        </Link>
      </div>

      <div className="mb-6">
        <Suspense>
          <DiaryFilters
            pastures={pastures}
            herdGroups={herdGroups}
            allTags={allTags}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
        </Suspense>
      </div>

      {entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <DiaryEntryCard
              key={entry.id}
              id={entry.id}
              entryDate={entry.entry_date}
              pastureName={
                (entry.pastures as { name: string } | null)?.name ?? null
              }
              herdGroupName={
                (entry.herd_groups as { name: string } | null)?.name ?? null
              }
              content={entry.content}
              tags={entry.tags ?? []}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          message={
            hasFilters
              ? "No entries match your filters."
              : "No diary entries yet. Start recording your ranch observations."
          }
          actionLabel={hasFilters ? undefined : "Create your first entry"}
          actionHref={hasFilters ? undefined : "/diary/new"}
        />
      )}
    </div>
  );
}
