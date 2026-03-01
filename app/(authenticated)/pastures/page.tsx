import { createClient } from "@/lib/supabase/server";
import { PastureForm } from "@/components/pasture-form";

export default async function PasturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pastures } = await supabase
    .from("pastures")
    .select("*")
    .eq("profile_id", user!.id)
    .order("name");

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
        Pastures
      </h1>
      <PastureForm pastures={pastures ?? []} />
    </div>
  );
}
