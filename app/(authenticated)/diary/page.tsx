import { createClient } from "@/lib/supabase/server";
import { DiaryEntryCard } from "@/components/diary-entry-card";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default async function DiaryListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*, pastures(name), herd_groups(name)")
    .eq("profile_id", user!.id)
    .order("entry_date", { ascending: false });

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
          message="No diary entries yet. Start recording your ranch observations."
          actionLabel="Create your first entry"
          actionHref="/diary/new"
        />
      )}
    </div>
  );
}
