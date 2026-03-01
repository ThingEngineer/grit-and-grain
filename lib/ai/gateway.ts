import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
const baseURL =
  process.env.VERCEL_AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh";

// Route all models through Vercel AI Gateway using the OpenAI-compatible endpoint.
// This endpoint accepts Authorization: Bearer auth (unlike @ai-sdk/anthropic which
// uses x-api-key) and supports all providers including Anthropic.
export const openai = createOpenAI({
  apiKey,
  baseURL: `${baseURL}/v1`,
});

// Model references (read from environment variables for easy switching)
export const embeddingModel = openai.embedding(
  process.env.NEXT_PUBLIC_AI_EMBEDDING_MODEL || "openai/text-embedding-3-small",
);

export const chatModel = openai(
  process.env.NEXT_PUBLIC_AI_CHAT_MODEL || "anthropic/claude-sonnet-4.6",
);
