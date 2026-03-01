import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import { PastureForm } from "@/components/pasture-form";
import { PageHeader } from "@/components/page-header";

export default async function PasturesPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: pastures } = await supabase
    .from("pastures")
    .select("*")
    .eq("profile_id", user!.id)
    .order("name");

  return (
    <div>
      <PageHeader title="Pastures" />
      <PastureForm pastures={pastures ?? []} />
    </div>
  );
}
