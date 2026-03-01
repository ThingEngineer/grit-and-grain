import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Controllable mock fns (declared before vi.mock so factories close over them) ──
const mockCheckRateLimit = vi.fn().mockReturnValue({ allowed: true });
vi.mock("@/lib/ai/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit }));

const mockGetUser = vi
  .fn()
  .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

// Controls what diary_entries query returns
const mockOrderResult = vi.fn().mockResolvedValue({
  data: [
    {
      entry_date: "2026-02-23",
      content: "Moved cattle.",
      pastures: { name: "North" },
      herd_groups: { name: "Angus" },
    },
    {
      entry_date: "2026-02-24",
      content: "Checked hay.",
      pastures: null,
      herd_groups: null,
    },
  ],
  error: null,
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === "diary_entries") {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lte: () => ({
                    order: mockOrderResult,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "weekly_reviews") {
          return {
            insert: () => ({
              select: () => ({
                single: vi
                  .fn()
                  .mockResolvedValue({
                    data: { id: "review-id" },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {};
      },
    }),
}));

const mockGenerateText = vi
  .fn()
  .mockResolvedValue({
    text: "## Week of 2026-02-23\n\n### Key Events\n- Moved cattle.",
  });
vi.mock("ai", () => ({ generateText: mockGenerateText }));
vi.mock("@/lib/ai/gateway", () => ({ chatModel: "mock-chat-model" }));
vi.mock("@/lib/ai/prompts", () => ({
  WEEKLY_REVIEW_SYSTEM_PROMPT:
    "Weekly review for {{ week_start_date }} with entries: {{ weekly_entries }}",
}));

// Import route once — no vi.resetModules() needed
const { POST } = await import("@/app/api/ai/weekly-review/route");

// ── Tests ────────────────────────────────────────────────────────────────────
describe("POST /api/ai/weekly-review", () => {
  const twoEntries = [
    {
      entry_date: "2026-02-23",
      content: "Moved cattle.",
      pastures: { name: "North" },
      herd_groups: { name: "Angus" },
    },
    {
      entry_date: "2026-02-24",
      content: "Checked hay.",
      pastures: null,
      herd_groups: null,
    },
  ];

  beforeEach(() => {
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOrderResult.mockResolvedValue({ data: twoEntries, error: null });
    mockGenerateText.mockResolvedValue({
      text: "## Week of 2026-02-23\n\n### Key Events\n- Moved cattle.",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = new Request("http://localhost/api/ai/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-02-23", weekEnd: "2026-03-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 3000,
    });
    const req = new Request("http://localhost/api/ai/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-02-23", weekEnd: "2026-03-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 400 when date range exceeds 14 days", async () => {
    const req = new Request("http://localhost/api/ai/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-01-01", weekEnd: "2026-03-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns summary_md with saved:false when fewer than 2 entries exist", async () => {
    mockOrderResult.mockResolvedValueOnce({
      data: [twoEntries[0]],
      error: null,
    });
    const req = new Request("http://localhost/api/ai/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-02-23", weekEnd: "2026-03-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(false);
    expect(body.summary_md).toContain("Not enough entries");
  });

  it("returns 200 with summary_md and saved:true on success", async () => {
    const req = new Request("http://localhost/api/ai/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: "2026-02-23", weekEnd: "2026-03-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(true);
    expect(typeof body.summary_md).toBe("string");
  });
});
