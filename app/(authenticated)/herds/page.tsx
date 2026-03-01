import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { HerdForm } from "@/components/herd-form";
import { PageHeader } from "@/components/page-header";

export default async function HerdsPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: herdGroups } = await supabase
    .from("herd_groups")
    .select("*")
    .eq("profile_id", user!.id)
    .order("name");

  return (
    <div>
      <PageHeader title="Herd groups" />
      <HerdForm herdGroups={herdGroups ?? []} />
    </div>
  );
}
