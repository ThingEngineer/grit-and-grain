import { generateText } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { WEEKLY_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 weekly reviews per user per hour
  const rateCheck = checkRateLimit(user.id, "weekly-review", 20);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: `Too many requests. Please wait ${rateCheck.retryAfter}s before trying again.` },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  const body = await request.json();
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const weekEnd: string =
    typeof body.weekEnd === "string" && ISO_DATE.test(body.weekEnd)
      ? body.weekEnd
      : new Date().toISOString().split("T")[0];
  const weekStart: string =
    typeof body.weekStart === "string" && ISO_DATE.test(body.weekStart)
      ? body.weekStart
      : new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // Cap date range to 14 days to prevent unbounded token consumption
  const startMs = new Date(weekStart).getTime();
  const endMs = new Date(weekEnd).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs - startMs > 14 * 86400000) {
    return Response.json(
      { error: "Date range must be valid and no longer than 14 days." },
      { status: 400 },
    );
  }

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
  let text: string;
  try {
    ({ text } = await generateText({
      model: chatModel,
      system: prompt,
      prompt: "Generate the weekly review now.",
    }));
  } catch (err) {
    console.error("[weekly-review route] AI generation error:", err);
    const message =
      err instanceof Error && err.message.toLowerCase().includes("rate")
        ? "Too many requests — please wait a moment and try again."
        : "The AI service is temporarily unavailable. Please try again in a moment.";
    return Response.json({ error: message }, { status: 503 });
  }

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
