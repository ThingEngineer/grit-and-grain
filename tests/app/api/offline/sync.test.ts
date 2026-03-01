import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

// Prevent triggerEmbedding from making real network calls
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
);

let mockSupabase = makeMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(body: unknown) {
  return new Request("http://localhost/api/offline/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function op(type: string, data: Record<string, unknown> = {}, id = "op-1") {
  return { id, type, data, timestamp: Date.now() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/offline/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSupabase = makeMockSupabase();
    mockRevalidatePath.mockReset();
    vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Auth / validation ──────────────────────────────────────────────────────
  it("returns 401 when unauthenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({ operations: [op("create_pasture", { name: "Field" })] }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty operations array", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(makeRequest({ operations: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when more than 50 operations are submitted", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const operations = Array.from({ length: 51 }, (_, i) =>
      op("create_pasture", { name: `Pasture ${i}` }, `op-${i}`),
    );
    const res = await POST(makeRequest({ operations }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/50/);
  });

  // ── Operations ─────────────────────────────────────────────────────────────
  it("processes create_entry and revalidates diary/dashboard", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [
          op("create_entry", {
            entry_date: "2026-03-01",
            content: "Fed hay and checked water.",
            tags: ["hay"],
          }),
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/diary");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("processes create_pasture and revalidates /pastures", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [op("create_pasture", { name: "North Field", acres: 40 })],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pastures");
  });

  it("processes delete_pasture and revalidates /pastures", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [op("delete_pasture", { id: "pasture-uuid" })],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pastures");
  });

  it("processes create_herd and revalidates /herds", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [
          op("create_herd", {
            name: "Angus Cows",
            species: "Cattle",
            head_count: 50,
          }),
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/herds");
  });

  it("processes delete_herd and revalidates /herds", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({ operations: [op("delete_herd", { id: "herd-uuid" })] }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/herds");
  });

  it("processes update_profile and revalidates /profile", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [
          op("update_profile", {
            full_name: "Jane Smith",
            ranch_name: "Dry Creek Ranch",
          }),
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0]).toEqual({ id: "op-1", success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("processes a mixed batch and returns one result per operation", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [
          op("create_pasture", { name: "East Field" }, "op-1"),
          op("create_herd", { name: "Yearling Steers" }, "op-2"),
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(2);
    expect(json.results.every((r: { success: boolean }) => r.success)).toBe(
      true,
    );
  });

  // ── Error handling ─────────────────────────────────────────────────────────
  it("returns success:false with DB error message", async () => {
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          // Simulate awaitable error response
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({
              error: { message: "unique constraint violation" },
            }).then(resolve),
        }),
      })),
    };
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({
        operations: [op("create_pasture", { name: "Duplicate Field" })],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].success).toBe(false);
    expect(json.results[0].error).toBe("unique constraint violation");
  });

  it("returns success:false for an unknown operation type", async () => {
    const { POST } = await import("@/app/api/offline/sync/route");
    const res = await POST(
      makeRequest({ operations: [op("delete_everything")] }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].success).toBe(false);
    expect(json.results[0].error).toMatch(/Unknown operation type/);
  });
});
