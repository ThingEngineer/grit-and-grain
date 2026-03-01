import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();
const mockRevalidateTag = vi.fn();
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));

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

// ── updateEntry ───────────────────────────────────────────────────────────────
describe("updateEntry", () => {
  const updatedEntryFixture = {
    ...newEntryFixture,
    id: "entry-uuid-002",
    content: "Updated observation.",
  };

  function makeUpdateMock(result: {
    data?: unknown;
    error: { message: string } | null;
  }) {
    const singleMock = vi.fn().mockResolvedValue(result);
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const secondEqMock = vi.fn().mockReturnValue({ select: selectMock });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });
    const updateMock = vi.fn().mockReturnValue({ eq: firstEqMock });
    return {
      from: vi.fn(() => ({ update: updateMock })),
      updateMock,
      firstEqMock,
      secondEqMock,
    };
  }

  beforeEach(() => {
    mockRedirect.mockReset();
    mockEmbed.mockClear();
    mockAdminSupabase.from.mockClear();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { updateEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Updated note.");
    formData.set("entry_date", "2026-03-01");
    await updateEntry("entry-uuid-002", formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("updates the entry and redirects to /diary", async () => {
    const { from, ...mocks } = makeUpdateMock({
      data: updatedEntryFixture,
      error: null,
    });
    mockSupabase = { ...makeMockSupabase(), from };

    const { updateEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Updated observation.");
    formData.set("entry_date", "2026-03-01");
    formData.set("pasture_id", "pasture-uuid");
    formData.set("herd_group_id", "herd-uuid");
    await updateEntry("entry-uuid-002", formData);

    expect(mocks.updateMock).toHaveBeenCalled();
    expect(mocks.firstEqMock).toHaveBeenCalledWith("id", "entry-uuid-002");
    expect(mocks.secondEqMock).toHaveBeenCalledWith(
      "profile_id",
      "user-test-id",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/diary");
  });

  it("triggers background embedding regeneration after update", async () => {
    const { from } = makeUpdateMock({ data: updatedEntryFixture, error: null });
    mockSupabase = { ...makeMockSupabase(), from };

    const { updateEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Updated observation.");
    formData.set("entry_date", "2026-03-01");
    await updateEntry("entry-uuid-002", formData);

    await vi.waitFor(() => {
      expect(mockEmbed).toHaveBeenCalled();
    });
  });

  it("throws when database update fails", async () => {
    const { from } = makeUpdateMock({
      data: null,
      error: { message: "update failed" },
    });
    mockSupabase = { ...makeMockSupabase(), from };

    const { updateEntry } = await import("@/app/(authenticated)/diary/actions");
    const formData = new FormData();
    formData.set("content", "Updated observation.");
    formData.set("entry_date", "2026-03-01");
    await expect(updateEntry("entry-uuid-002", formData)).rejects.toThrow(
      "Failed to update diary entry",
    );
  });
});

// ── deleteEntry ───────────────────────────────────────────────────────────────
describe("deleteEntry", () => {
  function makeDeleteMock(result: { error: { message: string } | null }) {
    const secondEqMock = vi.fn().mockResolvedValue(result);
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });
    const deleteMock = vi.fn().mockReturnValue({ eq: firstEqMock });
    return {
      from: vi.fn(() => ({ delete: deleteMock })),
      deleteMock,
      firstEqMock,
      secondEqMock,
    };
  }

  beforeEach(() => {
    mockRedirect.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { deleteEntry } = await import("@/app/(authenticated)/diary/actions");
    await deleteEntry("entry-uuid-003");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("deletes the entry and redirects to /diary", async () => {
    const { from, deleteMock, firstEqMock, secondEqMock } = makeDeleteMock({
      error: null,
    });
    mockSupabase = { ...makeMockSupabase(), from };

    const { deleteEntry } = await import("@/app/(authenticated)/diary/actions");
    await deleteEntry("entry-uuid-003");

    expect(deleteMock).toHaveBeenCalled();
    expect(firstEqMock).toHaveBeenCalledWith("id", "entry-uuid-003");
    expect(secondEqMock).toHaveBeenCalledWith("profile_id", "user-test-id");
    expect(mockRedirect).toHaveBeenCalledWith("/diary");
  });

  it("throws when database delete fails", async () => {
    const { from } = makeDeleteMock({ error: { message: "delete failed" } });
    mockSupabase = { ...makeMockSupabase(), from };

    const { deleteEntry } = await import("@/app/(authenticated)/diary/actions");
    await expect(deleteEntry("entry-uuid-003")).rejects.toThrow(
      "Failed to delete diary entry",
    );
  });
});
