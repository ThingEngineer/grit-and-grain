import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Rate limit: 200 embeddings per user per hour (generous for seeding/testing)
  const rateCheck = checkRateLimit(user.id, "embed", 200);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: `Too many requests. Please wait ${rateCheck.retryAfter}s before trying again.` },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  // Validate entryId is a well-formed UUID before touching the database
  if (!entryId || !UUID_REGEX.test(entryId)) {
    return Response.json({ error: "Invalid entry ID" }, { status: 400 });
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

  // Defense-in-depth: confirm entry belongs to the authenticated user
  if (entry.profile_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
    console.error("[embed route] Failed to upsert embedding:", error.message);
    return Response.json({ error: "Failed to save embedding. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true });
}
