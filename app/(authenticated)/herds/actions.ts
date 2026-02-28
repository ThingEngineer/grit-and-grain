"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createHerdGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/login");
  }

  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const headCountStr = formData.get("head_count") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("herd_groups").insert({
    profile_id: user.id,
    name,
    species: species || null,
    head_count: headCountStr ? parseInt(headCountStr, 10) : null,
    notes: notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/herds");
}

export async function deleteHerdGroup(formData: FormData) {
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
    .from("herd_groups")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  revalidatePath("/herds");
}
