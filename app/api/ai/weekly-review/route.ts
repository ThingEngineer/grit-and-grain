import { generateText } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { WEEKLY_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const weekEnd = body.weekEnd || new Date().toISOString().split("T")[0];
  const weekStart =
    body.weekStart ||
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // Fetch entries in range
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*, pastures(name), herd_groups(name)")
    .gte("entry_date", weekStart)
    .lte("entry_date", weekEnd)
    .order("entry_date", { ascending: true });

  if (!entries || entries.length < 2) {
    return Response.json({
      summary_md:
        "Not enough entries this week to generate a review. Keep logging!",
      saved: false,
    });
  }

  // Format entries for the prompt
  const weeklyEntries = entries
    .map(
      (e) => `[${e.entry_date}] ${e.pastures?.name || "General"}: ${e.content}`,
    )
    .join("\n\n");

  const prompt = WEEKLY_REVIEW_SYSTEM_PROMPT.replace(
    "{{ week_start_date }}",
    weekStart,
  ).replace("{{ weekly_entries }}", weeklyEntries);

  // Generate the review
  const { text } = await generateText({
    model: chatModel,
    system: prompt,
    prompt: "Generate the weekly review now.",
  });

  // Save to database
  const { data: review } = await supabase
    .from("weekly_reviews")
    .insert({
      profile_id: user.id,
      week_start: weekStart,
      week_end: weekEnd,
      summary_md: text,
    })
    .select()
    .single();

  return Response.json({ summary_md: text, review, saved: true });
}
