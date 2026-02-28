import { createClient } from "@/lib/supabase/server";
import { DiaryEntryForm } from "./diary-entry-form";

export default async function NewDiaryEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        New diary entry
      </h1>
      <DiaryEntryForm pastures={pastures ?? []} herdGroups={herdGroups ?? []} />
    </div>
  );
}
