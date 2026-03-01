import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { entryId } = await request.json();
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch entry with related data
  const { data: entry } = await supabase
    .from("diary_entries")
    .select("*, pastures(name, acres), herd_groups(name, head_count)")
    .eq("id", entryId)
    .single();

  if (!entry) {
    return Response.json({ error: "Entry not found" }, { status: 404 });
  }

  // Build canonical text
  const contentForRag = formatEntryForRag({
    entry_date: entry.entry_date,
    content: entry.content,
    pasture_name: entry.pastures?.name,
    acres: entry.pastures?.acres,
    herd_group_name: entry.herd_groups?.name,
    head_count: entry.herd_groups?.head_count,
    tags: entry.tags,
  });

  // Generate embedding
  const { embedding } = await embed({
    model: embeddingModel,
    value: contentForRag,
  });

  // Upsert into entry_embeddings
  const { error } = await supabase.from("entry_embeddings").upsert(
    {
      entry_id: entryId,
      profile_id: entry.profile_id,
      content_for_rag: contentForRag,
      embedding: embedding,
    },
    { onConflict: "entry_id" },
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
