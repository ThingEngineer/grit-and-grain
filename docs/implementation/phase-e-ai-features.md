# Phase E — AI Features (Vercel AI Gateway + RAG)

> **Estimated time:** 3–4 hours
> **Prerequisite:** Phase B (database), Phase D (seed data for testing)
> **Reference:** [prompts.md](../prompts.md), [schema-draft.md](../schema-draft.md)

---

## Overview

This is the **highest-impact phase for the judges**. Implement:

1. Vercel AI SDK setup with AI Gateway
2. Embedding generation pipeline
3. Farm Memory chat (RAG over diary entries)
4. Weekly Review generator
5. NLP entity extraction for auto-tagging

---

## Tasks

### E.1 — Install AI SDK packages

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/react
```

Verify in `package.json` that these are added:

- `ai` — Vercel AI SDK core
- `@ai-sdk/openai` — OpenAI-compatible provider (embeddings + all chat models via Vercel AI Gateway)
- `@ai-sdk/react` — React hooks (`useChat`)

---

### E.2 — Set up environment variables

Add to `.env.local`:

```env
# Vercel AI Gateway
VERCEL_AI_GATEWAY_API_KEY=<your-gateway-api-key>
VERCEL_AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh

# AI Model choices (easily changed per environment)
NEXT_PUBLIC_AI_CHAT_MODEL=anthropic/claude-sonnet-4.6
NEXT_PUBLIC_AI_EMBEDDING_MODEL=openai/text-embedding-3-small
```

Get your Vercel AI Gateway API key from [Vercel Dashboard → Settings → AI Gateway](https://vercel.com/docs/ai-gateway).

**Model choices explained:**

- **Chat model:** `anthropic/claude-sonnet-4.6` — latest Sonnet model, excellent for RAG and summaries
- **Embedding model:** `openai/text-embedding-3-small` — industry-standard embeddings, low cost

To switch models (e.g., for production), just change the values without touching code.

---

### E.3 — Create AI utility files

**Note:** All models are accessed through Vercel AI Gateway using unified authentication. Available models include:

**Anthropic models:** `anthropic/claude-opus-4.5`, `anthropic/claude-opus-4`, `anthropic/claude-3.5-sonnet`, `anthropic/claude-3.5-haiku`, and more.

**OpenAI models:** `openai/gpt-5`, `openai/gpt-4o`, `openai/gpt-3.5-turbo`, `openai/text-embedding-3-small`, and more.

For the full list of available models, see [Vercel AI Gateway Models](https://vercel.com/docs/ai-gateway/available-models).

#### `lib/ai/gateway.ts` — Provider instances via Vercel AI Gateway

> **Important:** Route everything through `createOpenAI` using the `/v1` OpenAI-compatible endpoint. This endpoint accepts `Authorization: Bearer` auth and supports all providers, including Anthropic models — do **not** use `createAnthropic` directly, as that SDK sends `x-api-key` which the Vercel AI Gateway rejects.

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
const baseURL =
  process.env.VERCEL_AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh";

// Route all models through Vercel AI Gateway using the OpenAI-compatible endpoint.
// This endpoint accepts Authorization: Bearer auth and supports all providers
// including Anthropic.
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
```

#### `lib/ai/prompts.ts` — System prompt constants

Export the system prompts from `docs/prompts.md` as TypeScript constants:

```typescript
export const FARM_MEMORY_SYSTEM_PROMPT = `You are Grit & Grain, an AI ranch assistant...`;
export const WEEKLY_REVIEW_SYSTEM_PROMPT = `You are the Grit & Grain Weekly Review engine...`;
export const NLP_ENTITY_EXTRACTION_PROMPT = `You are a farm diary tagger for Grit & Grain...`;
```

Copy the full prompt text from [prompts.md](../prompts.md) sections 1, 2, and 4.

---

### E.4 — Create RAG utility files

#### `lib/rag/format.ts` — Build canonical `content_for_rag` text

```typescript
interface FormatEntryInput {
  entry_date: string;
  content: string;
  pasture_name?: string | null;
  acres?: number | null;
  herd_group_name?: string | null;
  head_count?: number | null;
  tags?: string[];
}

export function formatEntryForRag(entry: FormatEntryInput): string {
  const lines: string[] = [];

  lines.push(`Date: ${entry.entry_date}`);

  if (entry.pasture_name) {
    const acresPart = entry.acres ? ` (${entry.acres} acres)` : "";
    lines.push(`Pasture: ${entry.pasture_name}${acresPart}`);
  }

  if (entry.herd_group_name) {
    const headPart = entry.head_count ? ` (${entry.head_count} head)` : "";
    lines.push(`Herd: ${entry.herd_group_name}${headPart}`);
  }

  if (entry.tags?.length) {
    lines.push(`Tags: ${entry.tags.join(", ")}`);
  }

  lines.push(`Notes: ${entry.content}`);

  return lines.join("\n");
}
```

#### `lib/rag/search.ts` — Vector search wrapper

```typescript
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
  return data;
}
```

---

### E.5 — Create embedding endpoint

Create `app/api/ai/embed/route.ts`:

**Flow:**

1. Receive `{ entryId }` in request body
2. Fetch the diary entry + joined pasture/herd data
3. Build the `content_for_rag` string using `formatEntryForRag()`
4. Generate embedding via AI SDK: `embed({ model: embeddingModel, value: contentForRag })`
5. Upsert into `entry_embeddings` table

```typescript
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { entryId } = await request.json();
  const supabase = await createClient();

  // Fetch entry with related data
  const { data: entry } = await supabase
    .from("diary_entries")
    .select("*, pastures(name, acres), herd_groups(name, head_count)")
    .eq("id", entryId)
    .single();

  if (!entry)
    return Response.json({ error: "Entry not found" }, { status: 404 });

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

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
```

---

### E.6 — Create Farm Memory chat endpoint

Create `app/api/ai/chat/route.ts`:

**Flow:**

1. Receive `{ messages }` (chat history) in request body
2. Extract the latest user message
3. Call `searchDiaryEntries()` to get relevant context
4. Format context passages for the prompt
5. Stream response from Anthropic Claude with the RAG system prompt

```typescript
import { streamText } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { searchDiaryEntries } from "@/lib/rag/search";
import { FARM_MEMORY_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();

  // Retrieve relevant diary entries
  const entries = await searchDiaryEntries(lastUserMessage.content);

  // Format context for the prompt
  const contextPassages = entries
    .map(
      (e: any, i: number) =>
        `[Entry #${i + 1}]\n${e.content_for_rag}\n(Similarity: ${e.similarity.toFixed(2)})`,
    )
    .join("\n\n---\n\n");

  // Stream the response
  const result = streamText({
    model: chatModel,
    system: FARM_MEMORY_SYSTEM_PROMPT.replace(
      "{{ context_passages }}",
      contextPassages,
    ),
    messages,
  });

  return result.toUIMessageStreamResponse();
}
```

> **Note:** In AI SDK v6, `DefaultChatTransport` (used by `useChat`) requires `toUIMessageStreamResponse()`. The older `toDataStreamResponse()` method does not exist on `StreamTextResult` in v6.

---

### E.7 — Create Farm Memory chat UI

Create `app/(authenticated)/chat/page.tsx`:

Use the Vercel AI SDK's `useChat` hook for a streaming chat experience:

```typescript
'use client';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
  });

  return (
    <div>
      <h1>Farm Memory</h1>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'user' : 'assistant'}>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Ask about your ranch history..." />
        <button type="submit" disabled={isLoading}>Ask</button>
      </form>
    </div>
  );
}
```

**Key UX elements:**

- Show "Sources used" section after AI response (display the retrieved entry dates/pasture names)
- Loading state while AI is streaming
- Placeholder suggestions: "When did we last rest the south pasture?"

---

### E.8 — Create Weekly Review endpoint

Create `app/api/ai/weekly-review/route.ts`:

**Note:** The `chatModel` exported from `lib/ai/gateway.ts` automatically routes through Vercel AI Gateway to `anthropic/claude-opus-4.5` (or your chosen model).

**Flow:**

1. Receive `{ weekStart?, weekEnd? }` — default to rolling last 7 days
2. Fetch all diary entries in the date range for the authenticated user
3. Format entries for the prompt
4. Generate review via Anthropic Claude (non-streaming, full response)
5. Save the review to `weekly_reviews` table
6. Return the generated review

```typescript
import { generateText } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { WEEKLY_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      profile_id: user!.id,
      week_start: weekStart,
      week_end: weekEnd,
      summary_md: text,
    })
    .select()
    .single();

  return Response.json({ summary_md: text, review, saved: true });
}
```

---

### E.9 — Create Weekly Review UI

Create `app/(authenticated)/review/page.tsx`:

**Elements:**

1. **Date range selector** — default "Last 7 days", option to pick custom start/end
2. **"Generate Review" button** — calls `POST /api/ai/weekly-review`
3. **Review display** — renders the returned Markdown as HTML
4. **Review history** — list of previously generated reviews (from `weekly_reviews` table)
5. **Note:** "In production, reviews can be scheduled (e.g. every Sunday 6pm) via Vercel Cron."

```tsx
// Fetch previous reviews on page load (server component part)
const { data: previousReviews } = await supabase
  .from("weekly_reviews")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(10);
```

For Markdown rendering, use a simple approach:

```bash
pnpm add react-markdown
```

---

### E.10 — Create NLP entity extraction endpoint (optional but impressive)

Create `app/api/ai/extract/route.ts`:

Used when creating a diary entry from voice input — automatically tags the entry with recognised pasture names, herd groups, and categories.

```typescript
import { generateObject } from "ai";
import { chatModel } from "@/lib/ai/gateway";
import { z } from "zod";

const extractionSchema = z.object({
  pasture_name: z.string().nullable(),
  herd_group_name: z.string().nullable(),
  tags: z.array(z.string()),
  entry_date: z.string().nullable(),
});

export async function POST(request: Request) {
  const { transcript, pastures, herdGroups } = await request.json();

  const { object } = await generateObject({
    model: chatModel,
    schema: extractionSchema,
    system: NLP_ENTITY_EXTRACTION_PROMPT.replace(
      "{{ today_date }}",
      new Date().toISOString().split("T")[0],
    )
      .replace(
        "{{ pasture_list }}",
        pastures.map((p: any) => p.name).join(", "),
      )
      .replace(
        "{{ herd_group_list }}",
        herdGroups.map((h: any) => h.name).join(", "),
      ),
    prompt: transcript,
  });

  return Response.json(object);
}
```

**Note:** This requires `zod` for schema validation:

```bash
pnpm add zod
```

---

### E.11 — Wire embedding generation into diary entry creation

After a diary entry is created (in Phase C's server action or form handler), trigger embedding generation:

```typescript
// After successful insert of diary entry
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/embed`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ entryId: newEntry.id }),
});
```

Alternatively, call the embedding logic directly (no HTTP round-trip):

```typescript
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/gateway";
import { formatEntryForRag } from "@/lib/rag/format";

// ... after inserting the entry, generate embedding inline
```

---

## Checklist

- [ ] AI SDK packages installed (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- [ ] Environment variables set (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- [ ] `lib/ai/gateway.ts` — provider instances + model references
- [ ] `lib/ai/prompts.ts` — system prompt constants
- [ ] `lib/rag/format.ts` — `formatEntryForRag()` function
- [ ] `lib/rag/search.ts` — `searchDiaryEntries()` vector search wrapper
- [ ] Embedding endpoint (`/api/ai/embed`) — generates + stores embeddings
- [ ] Farm Memory chat endpoint (`/api/ai/chat`) — RAG retrieval + streaming response
- [ ] Farm Memory chat UI (`/chat`) — `useChat` hook, messages, sources display
- [ ] Weekly Review endpoint (`/api/ai/weekly-review`) — generates + saves review
- [ ] Weekly Review UI (`/review`) — date range, generate button, Markdown display, history
- [ ] NLP entity extraction endpoint (`/api/ai/extract`) — auto-tagging (optional)
- [ ] Embedding generation wired into diary entry creation flow
- [ ] Tested: create entry → embedding generated → chat can find it
