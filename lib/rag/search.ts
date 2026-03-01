import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";

export async function searchDiaryEntries(
  question: string,
  topK = 8,
  threshold = 0.3,
  profileId?: string,
) {
  // Use admin client to bypass RLS — the caller (chat route) is responsible
  // for authenticating the user and passing the correct profileId.
  const supabase = createAdminClient();

  // Generate embedding for the question
  const { embedding } = await embed({
    model: embeddingModel,
    value: question,
  });

  // Call the match_diary_entries Postgres function with explicit profile_id
  // since the admin client doesn't have auth.uid() context.
  // NOTE: PostgREST requires the vector as a string "[0.1,0.2,...]" —
  // passing a JS array doesn't get cast to the pgvector type properly.
  const { data, error } = await supabase.rpc("match_diary_entries", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: threshold,
    match_count: topK,
    ...(profileId ? { p_profile_id: profileId } : {}),
  });

  if (error) throw error;
  return data ?? [];
}
