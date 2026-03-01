import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { searchDiaryEntries } from "@/lib/rag/search";
import { FARM_MEMORY_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: UIMessage[] };

  const lastUserMessage = messages.filter((m) => m.role === "user").pop();

  if (!lastUserMessage) {
    return Response.json({ error: "No user message found" }, { status: 400 });
  }

  const lastUserMessageText = lastUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  if (!lastUserMessageText) {
    return Response.json(
      { error: "No user text content found" },
      { status: 400 },
    );
  }

  // Determine if this is a trend question (use more context)
  const trendKeywords = [
    "trend",
    "ever",
    "always",
    "history",
    "over time",
    "pattern",
    "compare",
  ];
  const isTrendQuestion = trendKeywords.some((kw) =>
    lastUserMessageText.toLowerCase().includes(kw),
  );
  const topK = isTrendQuestion ? 12 : 8;

  // Retrieve relevant diary entries via vector search
  let entries: { content_for_rag: string; similarity: number }[] = [];
  try {
    entries = await searchDiaryEntries(lastUserMessageText, topK);
  } catch (err) {
    console.error("[chat route] RAG search error:", err);
    // Continue with empty context so chat still works without embeddings
  }

  // Format context for the prompt
  const contextPassages =
    entries.length > 0
      ? entries
          .map(
            (e, i) =>
              `[Entry #${i + 1}]\n${e.content_for_rag}\n(Similarity: ${e.similarity.toFixed(2)})`,
          )
          .join("\n\n---\n\n")
      : "No relevant diary entries found.";

  const modelMessages = await convertToModelMessages(
    messages.map((message) => {
      return {
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      };
    }),
  );

  // Stream the response
  const result = streamText({
    model: chatModel,
    system: FARM_MEMORY_SYSTEM_PROMPT.replace(
      "{{ context_passages }}",
      contextPassages,
    ),
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
