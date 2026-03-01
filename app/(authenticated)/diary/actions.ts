"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";
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

  const { data: newEntry, error } = await supabase
    .from("diary_entries")
    .insert({
      profile_id: user.id,
      pasture_id: pastureId || null,
      herd_group_id: herdGroupId || null,
      entry_date: formData.get("entry_date") as string,
      content: formData.get("content") as string,
      tags: tags.length > 0 ? tags : [],
    })
    .select("*, pastures(name, acres), herd_groups(name, head_count)")
    .single();

  if (error) {
    console.error("[createEntry] Database error:", error.message);
    throw new Error("Failed to save diary entry. Please try again.");
  }

  // Generate embedding for the new entry (fire-and-forget, don't block redirect)
  if (newEntry) {
    generateEmbedding(newEntry).catch(console.error);
  }

  redirect("/dashboard");
}

export async function updateEntry(entryId: string, formData: FormData) {
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

  const { data: updatedEntry, error } = await supabase
    .from("diary_entries")
    .update({
      pasture_id: pastureId || null,
      herd_group_id: herdGroupId || null,
      entry_date: formData.get("entry_date") as string,
      content: formData.get("content") as string,
      tags: tags.length > 0 ? tags : [],
    })
    .eq("id", entryId)
    .eq("profile_id", user.id)
    .select("*, pastures(name, acres), herd_groups(name, head_count)")
    .single();

  if (error) {
    console.error("[updateEntry] Database error:", error.message);
    throw new Error("Failed to update diary entry. Please try again.");
  }

  // Regenerate embedding for updated entry (fire-and-forget)
  if (updatedEntry) {
    generateEmbedding(updatedEntry).catch(console.error);
  }

  redirect("/diary");
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/login");
  }

  // Embedding is removed automatically via CASCADE on diary_entries.id
  const { error } = await supabase
    .from("diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("[deleteEntry] Database error:", error.message);
    throw new Error("Failed to delete diary entry. Please try again.");
  }

  redirect("/diary");
}

async function generateEmbedding(entry: {
  id: string;
  profile_id: string;
  entry_date: string;
  content: string;
  tags: string[] | null;
  pastures: { name: string; acres: number | null } | null;
  herd_groups: { name: string; head_count: number | null } | null;
}) {
  const contentForRag = formatEntryForRag({
    entry_date: entry.entry_date,
    content: entry.content,
    pasture_name: entry.pastures?.name,
    acres: entry.pastures?.acres,
    herd_group_name: entry.herd_groups?.name,
    head_count: entry.herd_groups?.head_count,
    tags: entry.tags ?? undefined,
  });

  const { embedding } = await embed({
    model: embeddingModel,
    value: contentForRag,
  });

  // Use admin client to bypass RLS for background embedding insert
  const adminSupabase = createAdminClient();
  await adminSupabase.from("entry_embeddings").upsert(
    {
      entry_id: entry.id,
      profile_id: entry.profile_id,
      content_for_rag: contentForRag,
      embedding: embedding as unknown as string,
    },
    { onConflict: "entry_id" },
  );
}
