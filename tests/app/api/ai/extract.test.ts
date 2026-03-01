import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Top-level controllable mocks ──────────────────────────────────────────────
const mockCheckRateLimit = vi.fn().mockReturnValue({ allowed: true });
vi.mock("@/lib/ai/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit }));

const extractedObject = {
  pasture_name: "North Pasture",
  herd_group_name: "Angus Cows",
  tags: ["rotation", "hay"],
  entry_date: "2026-03-01",
};

const mockGenerateObject = vi
  .fn()
  .mockResolvedValue({ object: extractedObject });
vi.mock("ai", () => ({ generateObject: mockGenerateObject }));
vi.mock("@/lib/ai/gateway", () => ({ chatModel: "mock-chat-model" }));
vi.mock("@/lib/ai/prompts", () => ({
  NLP_ENTITY_EXTRACTION_PROMPT:
    "Extract from {{ today_date }} {{ pasture_list }} {{ herd_group_list }}",
}));

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-test-id", email: "test@example.com" } },
  error: null,
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({ ...makeMockSupabase(), auth: { getUser: mockGetUser } }),
}));

const { POST } = await import("@/app/api/ai/extract/route");

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/ai/extract", () => {
  beforeEach(() => {
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockGenerateObject.mockResolvedValue({ object: extractedObject });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-test-id", email: "test@example.com" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = new Request("http://localhost/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "Moved 80 head to north pasture." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 3600,
    });
    const req = new Request("http://localhost/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "Some transcript." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 400 when transcript is missing", async () => {
    const req = new Request("http://localhost/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when transcript exceeds 5000 chars", async () => {
    const req = new Request("http://localhost/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "a".repeat(5001) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too long/i);
  });

  it("returns 200 with extracted entity object on success", async () => {
    const req = new Request("http://localhost/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Moved 80 cattle to north pasture this morning.",
        pastures: [{ name: "North Pasture" }],
        herdGroups: [{ name: "Angus Cows" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(extractedObject);
  });
});
