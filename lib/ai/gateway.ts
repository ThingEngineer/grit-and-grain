import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
const baseURL =
  process.env.VERCEL_AI_GATEWAY_BASE_URL || "https://api.vercel.ai";

// Route all models through Vercel AI Gateway
export const openai = createOpenAI({
  apiKey,
  baseURL,
});

export const anthropic = createAnthropic({
  apiKey,
  baseURL,
});

// Model references (read from environment variables for easy switching)
export const embeddingModel = openai.embedding(
  process.env.NEXT_PUBLIC_AI_EMBEDDING_MODEL || "openai/text-embedding-3-small",
);

export const chatModel = anthropic(
  process.env.NEXT_PUBLIC_AI_CHAT_MODEL || "anthropic/claude-4.6-sonnet",
);
