import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser, getProfile } from "@/lib/supabase/queries";
import { DiaryEntryCard } from "@/components/diary-entry-card";
import { EmptyState } from "@/components/empty-state";
import { SeedButton } from "@/components/seed-button";
import Link from "next/link";

/**
 * Per-user cached dashboard queries — revalidated on-demand via the
 * "dashboard" tag (triggered by diary/pasture mutations) and time-based
 * every 60 seconds as a safety net.
 *
 * Uses the admin client so the cached function works outside request context
 * where cookies() is unavailable. The userId originates from a verified
 * getUser() call, so explicit profile_id filtering is safe.
 */
const getDashboardData = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminClient();
    const [
      { count: pastureCount },
      // count: "exact" on a .limit() call returns the total un-paged count
      { data: entries, count: entryCount },
    ] = await Promise.all([
      supabase
        .from("pastures")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", userId),
      supabase
        .from("diary_entries")
        .select("*, pastures(name), herd_groups(name)", { count: "exact" })
        .eq("profile_id", userId)
        .order("entry_date", { ascending: false })
        .limit(5),
    ]);
    return { pastureCount, entryCount, entries };
  },
  ["dashboard-data"],
  { revalidate: 60, tags: ["dashboard"] },
);

export default async function DashboardPage() {
  const user = await getUser();
  const profile = await getProfile(user!.id);

  // Auth is live — data comes from the per-user cache
  const { pastureCount, entryCount, entries } = await getDashboardData(
    user!.id,
  );

  const hasEntries = (entryCount ?? 0) > 0;

  return (
    <div>
      {/* Dashboard header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {profile?.ranch_name || "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your ranch at a glance.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-serif text-2xl font-bold text-foreground">
            {entryCount ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Diary entries</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-serif text-2xl font-bold text-foreground">
            {pastureCount ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Pastures</p>
        </div>
      </div>

      {/* Quick-add button */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/diary/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + New diary entry
        </Link>
        <SeedButton hasEntries={hasEntries} />
      </div>

      {/* Recent diary entries */}
      <div>
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
          Recent entries
        </h2>
        {hasEntries && entries && entries.length > 0 ? (
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
            <Link
              href="/diary"
              className="mt-2 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all entries →
            </Link>
          </div>
        ) : (
          <EmptyState
            message="No diary entries yet. Start recording your ranch observations."
            actionLabel="Create your first entry"
            actionHref="/diary/new"
          />
        )}
      </div>
    </div>
  );
}
