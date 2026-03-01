import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}));

let mockSupabase = makeMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("createPasture", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { createPasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("name", "North Field");
    await createPasture(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("inserts pasture with correct payload for authenticated user", async () => {
    mockSupabase = makeMockSupabase(undefined, { data: null, error: null });
    const { createPasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("name", "South 40");
    formData.set("acres", "40");
    formData.set("notes", "Good grass coverage.");
    await createPasture(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("pastures");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pastures");
  });

  it("handles empty optional fields gracefully", async () => {
    mockSupabase = makeMockSupabase(undefined, { data: null, error: null });
    const { createPasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("name", "Back Range");
    // No acres or notes
    await createPasture(formData);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pastures");
  });

  it("throws when the database returns an error", async () => {
    const insertMock = vi.fn().mockReturnValue({
      error: { message: "duplicate key value violates unique constraint" },
      data: null,
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ insert: insertMock })),
    };
    const { createPasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("name", "Duplicate");
    await expect(createPasture(formData)).rejects.toThrow();
  });
});

describe("deletePasture", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { deletePasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("id", "pasture-uuid");
    await deletePasture(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("calls delete with the provided id and revalidates path", async () => {
    mockSupabase = makeMockSupabase();
    const { deletePasture } =
      await import("@/app/(authenticated)/pastures/actions");
    const formData = new FormData();
    formData.set("id", "pasture-uuid-456");
    await deletePasture(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("pastures");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pastures");
  });
});
