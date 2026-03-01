import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { DiaryEntryEditForm } from "./diary-entry-edit-form";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";

export default async function EditDiaryEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  const supabase = await createClient();

  // Fetch entry, pastures, and herd groups in parallel
  const [entryResult, pasturesResult, herdsResult] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("*")
      .eq("id", id)
      .eq("profile_id", user!.id)
      .single(),
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
  ]);

  if (entryResult.error || !entryResult.data) {
    notFound();
  }

  const entry = entryResult.data;

  return (
    <div>
      <PageHeader
        title="Edit diary entry"
        backHref="/diary"
        backLabel="All entries"
      />
      <DiaryEntryEditForm
        entryId={entry.id}
        initialDate={entry.entry_date}
        initialContent={entry.content}
        initialPastureId={entry.pasture_id}
        initialHerdGroupId={entry.herd_group_id}
        initialTags={(entry.tags as string[]) ?? []}
        pastures={pasturesResult.data ?? []}
        herdGroups={herdsResult.data ?? []}
      />
    </div>
  );
}
