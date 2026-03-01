import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRpc = vi.fn();
const mockAdminClient = { rpc: mockRpc };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

// Minimal fake embedding vector (3 dims for simplicity; real is 1536)
const FAKE_EMBEDDING = [0.1, 0.2, 0.3];

vi.mock("ai", () => ({
  embed: vi.fn().mockResolvedValue({ embedding: FAKE_EMBEDDING }),
}));

vi.mock("@/lib/ai/gateway", () => ({
  embeddingModel: "mock-embedding-model",
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("searchDiaryEntries", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns an empty array when rpc returns no data", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    const results = await searchDiaryEntries("how are the cattle");
    expect(results).toEqual([]);
  });

  it("returns rpc data as-is when the call succeeds", async () => {
    const fixtures = [
      {
        content_for_rag: "Date: 2026-03-01\nNotes: Moved cattle.",
        similarity: 0.91,
      },
      {
        content_for_rag: "Date: 2026-02-28\nNotes: Checked hay.",
        similarity: 0.8,
      },
    ];
    mockRpc.mockResolvedValue({ data: fixtures, error: null });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    const results = await searchDiaryEntries("cattle hay");
    expect(results).toEqual(fixtures);
  });

  it("throws when rpc returns an error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "function does not exist" },
    });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    await expect(searchDiaryEntries("question")).rejects.toMatchObject({
      message: "function does not exist",
    });
  });

  it("calls rpc with the correct function name and embedding", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    await searchDiaryEntries("rainfall this month", 8, 0.3, "user-uuid-123");

    expect(mockRpc).toHaveBeenCalledWith(
      "match_diary_entries",
      expect.objectContaining({
        query_embedding: JSON.stringify(FAKE_EMBEDDING),
        match_threshold: 0.3,
        match_count: 8,
        p_profile_id: "user-uuid-123",
      }),
    );
  });

  it("omits p_profile_id when profileId is not provided", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    await searchDiaryEntries("rainfall", 8, 0.3);

    const callArgs = mockRpc.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty("p_profile_id");
  });

  it("uses custom topK and threshold when provided", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { searchDiaryEntries } = await import("@/lib/rag/search");
    await searchDiaryEntries("trend question", 12, 0.5);

    expect(mockRpc).toHaveBeenCalledWith(
      "match_diary_entries",
      expect.objectContaining({ match_count: 12, match_threshold: 0.5 }),
    );
  });
});
