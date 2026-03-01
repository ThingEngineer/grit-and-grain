## Embeddings Architecture: A Technical Explanation

---

### **What Embeddings Are**

An embedding is a **high-dimensional vector** (1536 numbers) that captures the semantic meaning of text. Words/phrases with similar meanings have vectors that point in similar directions in vector space. You compare embeddings using **cosine similarity**—a measure of how aligned two vectors are (0 = opposite, 1 = identical).

---

### **Our Embedding Pipeline**

**1. Entry Creation & Formatting**

- User records a voice note → transcribed → stored in `diary_entries` table
- System asynchronously calls `POST /api/ai/embed` with the entry ID
- Route handler fetches the full entry (including linked pasture name, acreage, herd group, head count, tags)
- Uses `formatEntryForRag()` to create a **canonical text format**:
  ```
  Date: 2026-03-01
  Pasture: South Paddock (45 acres)
  Herd: Angus Pairs (12 head)
  Tags: rotation, rainfall
  Notes: [cleaned entry text]
  ```

**2. Embedding Generation**

- Formatted text is sent to **Vercel AI Gateway** → **OpenAI `text-embedding-3-small`**
- Model outputs a 1536-dimensional vector
- Vector + metadata (entry_id, profile_id, original formatted text) upserted into `entry_embeddings` table
- An HNSW index accelerates nearest-neighbor queries

**3. RAG Search at Query Time**

- User asks a question in Farm Memory chat
- Question is **embedded using the same model** (text-embedding-3-small)
- Call Postgres function `match_diary_entries()`:
  - Computes cosine distance: `1 - (query_vector <=> stored_vector)`
  - Filters results with **similarity threshold = 0.72** (discard weak matches)
  - Returns **top-k = 8** most similar entries (12 for trends)
- Retrieved `content_for_rag` text sent to Claude as context

**4. AI Answer Generation**

- Claude (via Vercel AI Gateway) receives:
  - **System prompt** with rules (cite sources, don't hallucinate, synthesize trends)
  - **Retrieved context** (relevant diary entries ranked by relevance)
  - **User question**
- Claude synthesizes an answer grounded only in the retrieved entries

---

### **Key Technical Decisions**

| Component             | Choice                        | Why                                                                                    |
| --------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| **Embedding Model**   | OpenAI text-embedding-3-small | Efficient (1536-dim), excellent semantic quality, fine-tuned for instructions          |
| **Similarity Metric** | Cosine distance               | Standard for semantic search, scale-invariant                                          |
| **Vector Index**      | HNSW (pgvector)               | O(log N) approximate nearest-neighbor search vs O(N) brute force                       |
| **Threshold**         | 0.72                          | Empirically balances recall (catching relevant entries) vs precision (filtering noise) |
| **Top-k**             | 8–12                          | Bounded context window; 8 for facts, 12 for trend analysis                             |
| **Unified Gateway**   | Vercel AI Gateway             | Single auth point (one API key) for OpenAI embeddings + Anthropic chat                 |

---

### **Why This Works**

1. **Semantic relevance**: "Did it rain on the south pasture?" matches diary entries about "rainfall" + "South Paddock" even if word-for-word text differs
2. **RLS-safe**: Postgres function filters by `profile_id` at the database layer—no cross-user data leakage
3. **No hallucination**: Claude only sees real retrieved entries; system prompt forbids invention
4. **Historical context**: Years of diary entries become a searchable knowledge base without manual tagging

This is **RAG (Retrieval-Augmented Generation)**: you augment the LLM's reasoning with specific, factual documents, then let it synthesize answers from only those documents.
