import { createClient } from "@/lib/supabase/server";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";

export async function searchDiaryEntries(
  question: string,
  topK = 8,
  threshold = 0.72,
) {
  const supabase = await createClient();

  // Generate embedding for the question
  const { embedding } = await embed({
    model: embeddingModel,
    value: question,
  });

  // Call the match_diary_entries Postgres function
  const { data, error } = await supabase.rpc("match_diary_entries", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) throw error;
  return data ?? [];
}
