import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockEmbed = vi
  .fn()
  .mockResolvedValue({ embedding: Array(1536).fill(0.01) });
vi.mock("ai", () => ({ embed: mockEmbed }));
vi.mock("@/lib/ai/gateway", () => ({ embeddingModel: "mock-model" }));

const TEST_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const entryFixture = {
  id: TEST_UUID,
  profile_id: "user-test-id",
  entry_date: "2026-03-01",
  content: "Cattle moved to north pasture.",
  tags: ["rotation"],
  pastures: { name: "North Pasture", acres: 120 },
  herd_groups: { name: "Angus Cows", head_count: 80 },
};

function makeSupabaseWithEntry(entry: typeof entryFixture | null) {
  const single = vi.fn().mockResolvedValue({ data: entry, error: null });
  const eqChain = { single };
  const eq = vi.fn().mockReturnValue(eqChain);
  const selectChain = { eq };
  const select = vi.fn().mockReturnValue(selectChain);
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return {
    ...makeMockSupabase({ id: "user-test-id", email: "test@example.com" }),
    from: vi.fn((table: string) => {
      if (table === "diary_entries") return { select };
      if (table === "entry_embeddings") return { upsert };
      return { select, upsert };
    }),
  };
}

let mockSupabase = makeSupabaseWithEntry(entryFixture);
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("POST /api/ai/embed", () => {
  beforeEach(() => {
    vi.resetModules();
    mockEmbed.mockClear();
    mockSupabase = makeSupabaseWithEntry(entryFixture);
    vi.mock("ai", () => ({ embed: mockEmbed }));
    vi.mock("@/lib/ai/gateway", () => ({ embeddingModel: "mock-model" }));
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabase = makeSupabaseWithEntry(null);
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
    const { POST } = await import("@/app/api/ai/embed/route");
    const req = new Request("http://localhost/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: TEST_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when entryId is missing", async () => {
    const { POST } = await import("@/app/api/ai/embed/route");
    const req = new Request("http://localhost/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid entry id/i);
  });

  it("returns 400 when entryId is not a valid UUID", async () => {
    const { POST } = await import("@/app/api/ai/embed/route");
    const req = new Request("http://localhost/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: "not-a-uuid" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when the diary entry is not found", async () => {
    mockSupabase = makeSupabaseWithEntry(null);
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
    const { POST } = await import("@/app/api/ai/embed/route");
    const req = new Request("http://localhost/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: TEST_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 200 with success:true on happy path", async () => {
    const { POST } = await import("@/app/api/ai/embed/route");
    const req = new Request("http://localhost/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: TEST_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
