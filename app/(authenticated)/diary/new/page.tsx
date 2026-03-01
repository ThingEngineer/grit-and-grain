import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { DiaryEntryForm } from "./diary-entry-form";
import { PageHeader } from "@/components/page-header";

export default async function NewDiaryEntryPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch pastures and herd groups for dropdowns
  const [{ data: pastures }, { data: herdGroups }] = await Promise.all([
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

  return (
    <div>
      <PageHeader
        title="New diary entry"
        backHref="/diary"
        backLabel="All entries"
      />
      <DiaryEntryForm pastures={pastures ?? []} herdGroups={herdGroups ?? []} />
    </div>
  );
}
