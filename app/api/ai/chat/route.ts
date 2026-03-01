import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { searchDiaryEntries } from "@/lib/rag/search";
import { FARM_MEMORY_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return Response.json(
      { error: "Invalid request. Please refresh and try again." },
      { status: 400 },
    );
  }

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

  // Strip providerMetadata from parts before converting to model messages.
  // When using the OpenAI-compatible gateway to reach Anthropic, the SDK stores
  // an `openai.itemId` on each assistant turn (Responses API). On the next request
  // convertToModelMessages would emit an item-reference instead of the full text,
  // which the gateway/Anthropic doesn't understand, causing ERR_ABORTED.
  const cleanedMessages = messages.map((message) => ({
    role: message.role,
    parts: message.parts.map((part) => {
      const cleaned = { ...part };
      delete (cleaned as Record<string, unknown>).providerMetadata;
      return cleaned;
    }),
  }));

  const modelMessages = await convertToModelMessages(cleanedMessages);

  // Stream the response
  try {
    const result = streamText({
      model: chatModel,
      system: FARM_MEMORY_SYSTEM_PROMPT.replace(
        "{{ context_passages }}",
        contextPassages,
      ),
      messages: modelMessages,
      onError: (event) => {
        console.error("[chat route] streamText error:", event.error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[chat route] Unexpected error:", err);
    return Response.json(
      { error: "The AI service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
