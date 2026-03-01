import { describe, it, expect } from "vitest";

describe("GET /api/health", () => {
  it("HEAD returns 200 with no body", async () => {
    const { HEAD } = await import("@/app/api/health/route");
    const res = await HEAD();
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("GET returns 200 with { ok: true }", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});
