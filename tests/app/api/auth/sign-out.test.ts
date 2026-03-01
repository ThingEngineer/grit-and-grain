import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
let mockSupabase = makeMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    mockSupabase = makeMockSupabase();
    // Reset the module cache so the mock supabase is fresh
    vi.resetModules();
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(mockSupabase),
    }));
  });

  it("calls auth.signOut on the supabase client", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    const request = new Request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
    });
    await POST(request);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("returns a 302 redirect response", async () => {
    const { POST } = await import("@/app/api/auth/sign-out/route");
    const request = new Request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
    });
    const response = await POST(request);
    expect(response.status).toBe(302);
    const location =
      response.headers.get("Location") ?? response.headers.get("location");
    expect(location).toContain("/login");
  });
});
