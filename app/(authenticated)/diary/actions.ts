"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/login");
  }

  const pastureId = formData.get("pasture_id") as string;
  const herdGroupId = formData.get("herd_group_id") as string;
  const tags = formData.getAll("tags") as string[];

  const { error } = await supabase.from("diary_entries").insert({
    profile_id: user.id,
    pasture_id: pastureId || null,
    herd_group_id: herdGroupId || null,
    entry_date: formData.get("entry_date") as string,
    content: formData.get("content") as string,
    tags: tags.length > 0 ? tags : [],
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}
