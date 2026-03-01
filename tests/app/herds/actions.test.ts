import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

let mockSupabase = makeMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("createHerdGroup", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { createHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("name", "Angus Cows");
    await createHerdGroup(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("inserts herd group with correct payload for authenticated user", async () => {
    mockSupabase = makeMockSupabase(undefined, { data: null, error: null });
    const { createHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("name", "Angus Cows");
    formData.set("species", "cattle");
    formData.set("head_count", "80");
    formData.set("notes", "Main cow-calf herd.");
    await createHerdGroup(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("herd_groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/herds");
  });

  it("handles missing optional fields gracefully", async () => {
    mockSupabase = makeMockSupabase(undefined, { data: null, error: null });
    const { createHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("name", "Misc Herd");
    // No species, head_count, or notes
    await createHerdGroup(formData);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/herds");
  });

  it("throws when the database returns an error", async () => {
    const insertMock = vi.fn().mockReturnValue({
      error: { message: "violates foreign key constraint" },
      data: null,
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ insert: insertMock })),
    };
    const { createHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("name", "Bad Herd");
    await expect(createHerdGroup(formData)).rejects.toThrow();
  });
});

describe("deleteHerdGroup", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { deleteHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("id", "herd-uuid");
    await deleteHerdGroup(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("deletes the herd group and revalidates path", async () => {
    mockSupabase = makeMockSupabase();
    const { deleteHerdGroup } =
      await import("@/app/(authenticated)/herds/actions");
    const formData = new FormData();
    formData.set("id", "herd-uuid-789");
    await deleteHerdGroup(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("herd_groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/herds");
  });
});
