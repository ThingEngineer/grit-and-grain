"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPasture(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/login");
  }

  const name = formData.get("name") as string;
  const acresStr = formData.get("acres") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("pastures").insert({
    profile_id: user.id,
    name,
    acres: acresStr ? parseFloat(acresStr) : null,
    notes: notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pastures");
}

export async function deletePasture(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/login");
  }

  const id = formData.get("id") as string;

  await supabase
    .from("pastures")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  revalidatePath("/pastures");
}
