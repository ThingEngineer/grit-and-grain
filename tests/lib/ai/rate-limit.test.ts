import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// The rate-limit module keeps state in a module-level Map.
// Re-import a fresh module for each test to avoid state bleed.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  // Reset module registry so each test gets a fresh requestLog Map
  vi.resetModules();
});

describe("checkRateLimit", () => {
  it("allows requests up to the limit", async () => {
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      expect(check("user-1", "chat", limit).allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      check("user-2", "chat", limit);
    }
    const result = check("user-2", "chat", limit);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks users independently per userId", async () => {
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");
    check("user-a", "embed", 1);
    // user-a now exhausted ...
    const resultA = check("user-a", "embed", 1);
    expect(resultA.allowed).toBe(false);
    // user-b is a fresh slate
    const resultB = check("user-b", "embed", 1);
    expect(resultB.allowed).toBe(true);
  });

  it("tracks endpoints independently per endpoint key", async () => {
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");
    check("user-3", "chat", 1);
    // chat exhausted
    expect(check("user-3", "chat", 1).allowed).toBe(false);
    // embed is a fresh endpoint for the same user
    expect(check("user-3", "embed", 1).allowed).toBe(true);
  });

  it("resets after the window expires", async () => {
    const windowMs = 5000; // 5-second custom window
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");

    check("user-4", "chat", 1, windowMs);
    expect(check("user-4", "chat", 1, windowMs).allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 100);

    expect(check("user-4", "chat", 1, windowMs).allowed).toBe(true);
  });

  it("sets retryAfter to a positive integer with correct window remaining", async () => {
    const windowMs = 60_000;
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");

    check("user-5", "weekly-review", 1, windowMs);
    const result = check("user-5", "weekly-review", 1, windowMs);

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
    // retryAfter should not exceed the window in seconds
    expect(result.retryAfter!).toBeLessThanOrEqual(windowMs / 1000);
  });

  it("does not set retryAfter when request is allowed", async () => {
    const { checkRateLimit: check } = await import("@/lib/ai/rate-limit");
    const result = check("user-6", "extract", 5);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeUndefined();
  });
});
