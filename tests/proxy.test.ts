import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Controllable mock fns ─────────────────────────────────────────────────────
// Default: unauthenticated; per-test behaviour set via mockResolvedValueOnce
const mockGetUser = vi
  .fn()
  .mockResolvedValue({ data: { user: null }, error: null });
const mockSingle = vi
  .fn()
  .mockResolvedValue({ data: { full_name: null }, error: null });

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  }),
}));

// Import proxy once — stable across all tests
const { proxy } = await import("@/proxy");

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeNextRequest(path: string) {
  const baseUrl = `http://localhost`;
  return {
    headers: new Headers(),
    cookies: {
      getAll: () => [],
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    },
    nextUrl: {
      pathname: path,
      clone() {
        let _pathname = path;
        return {
          get pathname() {
            return _pathname;
          },
          set pathname(v: string) {
            _pathname = v;
          },
          searchParams: new URLSearchParams(),
          get href() {
            const qs = this.searchParams.toString();
            return `${baseUrl}${_pathname}${qs ? `?${qs}` : ""}`;
          },
          toString() {
            return this.href;
          },
        };
      },
    },
    url: `${baseUrl}${path}`,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("proxy middleware", () => {
  beforeEach(() => {
    // Reset to unauthenticated + no profile by default
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSingle.mockResolvedValue({ data: { full_name: null }, error: null });
  });

  it("redirects unauthenticated users from protected routes to /login", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/dashboard") as any);
    expect(response?.status).toBe(307);
    const location =
      response?.headers.get("Location") ?? response?.headers.get("location");
    expect(location).toContain("/login");
  });

  it("allows unauthenticated users to access /login without redirect", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/login") as any);
    expect(response?.status).not.toBe(307);
  });

  it("allows unauthenticated users to access the landing page /", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/") as any);
    expect(response?.status).not.toBe(307);
  });

  it("redirects authenticated users from /login to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/login") as any);
    expect(response?.status).toBe(307);
    const location =
      response?.headers.get("Location") ?? response?.headers.get("location");
    expect(location).toContain("/dashboard");
  });

  it("redirects authenticated users without full_name to /profile onboarding", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
      error: null,
    });
    // mockSingle defaults to { full_name: null } — no extra config needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/dashboard") as any);
    expect(response?.status).toBe(307);
    const location =
      response?.headers.get("Location") ?? response?.headers.get("location");
    expect(location).toContain("/profile");
    expect(location).toContain("onboarding");
  });

  it("does not redirect authenticated users with full_name visiting /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { full_name: "Josh Smith" },
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await proxy(makeNextRequest("/dashboard") as any);
    expect(response?.status).not.toBe(307);
  });
});
