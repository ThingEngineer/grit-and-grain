import { generateObject } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { NLP_ENTITY_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const extractionSchema = z.object({
  pasture_name: z.nullable(z.string()),
  herd_group_name: z.nullable(z.string()),
  tags: z.array(z.string()),
  entry_date: z.nullable(z.string()),
});

export async function POST(request: Request) {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript, pastures, herdGroups } = await request.json();

  if (!transcript) {
    return Response.json({ error: "No transcript provided" }, { status: 400 });
  }

  // Reject oversized transcripts to prevent token abuse (max 5000 chars)
  if (typeof transcript !== "string" || transcript.length > 5000) {
    return Response.json(
      {
        error:
          "Transcript is too long. Please keep voice notes under 5000 characters.",
      },
      { status: 400 },
    );
  }

  const { object } = await generateObject({
    model: chatModel,
    schema: extractionSchema,
    system: NLP_ENTITY_EXTRACTION_PROMPT.replace(
      "{{ today_date }}",
      new Date().toISOString().split("T")[0],
    )
      .replace(
        "{{ pasture_list }}",
        (pastures || []).map((p: { name: string }) => p.name).join(", "),
      )
      .replace(
        "{{ herd_group_list }}",
        (herdGroups || []).map((h: { name: string }) => h.name).join(", "),
      ),
    prompt: transcript,
    temperature: 0,
  });

  return Response.json(object);
}
