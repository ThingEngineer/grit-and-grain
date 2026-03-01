import { createClient } from "@/lib/supabase/server";
import { HerdForm } from "@/components/herd-form";

export default async function HerdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: herdGroups } = await supabase
    .from("herd_groups")
    .select("*")
    .eq("profile_id", user!.id)
    .order("name");

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
        Herd groups
      </h1>
      <HerdForm herdGroups={herdGroups ?? []} />
    </div>
  );
}
