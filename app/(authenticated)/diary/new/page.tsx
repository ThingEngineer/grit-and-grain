import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { DiaryEntryForm } from "./diary-entry-form";

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
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
        New diary entry
      </h1>
      <DiaryEntryForm pastures={pastures ?? []} herdGroups={herdGroups ?? []} />
    </div>
  );
}
