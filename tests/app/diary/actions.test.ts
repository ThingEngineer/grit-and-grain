import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const mockEmbed = vi.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
vi.mock("ai", () => ({ embed: mockEmbed }));

vi.mock("@/lib/ai/gateway", () => ({ embeddingModel: "mock-model" }));

const mockAdminSupabase = {
  from: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
};
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

const newEntryFixture = {
  id: "entry-uuid-001",
  profile_id: "user-test-id",
  entry_date: "2026-03-01",
  content: "Moved cattle to north pasture.",
  tags: [],
  pastures: { name: "North Pasture", acres: 120 },
  herd_groups: { name: "Angus Cows", head_count: 80 },
};

let mockSupabase = makeMockSupabase(undefined, {
  data: newEntryFixture,
  error: null,
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("createEntry", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockEmbed.mockClear();
    mockAdminSupabase.from.mockClear();
    mockSupabase = makeMockSupabase(undefined, {
      data: newEntryFixture,
      error: null,
    });
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { createEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Test note.");
    formData.set("entry_date", "2026-03-01");
    await createEntry(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("inserts the entry and calls redirect to /dashboard", async () => {
    const { createEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Moved cattle to north pasture.");
    formData.set("entry_date", "2026-03-01");
    formData.set("pasture_id", "pasture-uuid");
    formData.set("herd_group_id", "herd-uuid");
    await createEntry(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("diary_entries");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("triggers background embedding generation after insert", async () => {
    const { createEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Checked fence on west side.");
    formData.set("entry_date", "2026-03-01");
    await createEntry(formData);

    // Wait for the fire-and-forget embedding task
    await vi.waitFor(() => {
      expect(mockEmbed).toHaveBeenCalled();
    });
  });

  it("throws when database insert fails", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: singleMock }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ insert: insertMock })),
    };

    const { createEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Some content.");
    formData.set("entry_date", "2026-03-01");
    await expect(createEntry(formData)).rejects.toThrow(
      "Failed to save diary entry",
    );
  });
});
