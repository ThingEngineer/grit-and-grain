/**
 * Shared test helpers for mocking Supabase clients and Next.js internals.
 */
import { vi } from "vitest";

/** Creates a chainable Supabase mock that can be configured per test */
export function makeMockSupabase(
  userOverride?: object | null,
  insertResult?: { data?: unknown; error?: { message: string } | null },
  updateResult?: { data?: unknown; error?: { message: string } | null },
  deleteResult?: { error?: { message: string } | null },
  selectResult?: { data?: unknown; error?: { message: string } | null },
  authOverride?: Partial<{
    getUser: () => Promise<{ data: { user: object | null }; error: unknown }>;
    updateUser: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  }>,
) {
  const user =
    userOverride !== undefined
      ? userOverride
      : { id: "user-test-id", email: "test@example.com" };

  const mockFrom = vi.fn(() => ({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue(
            insertResult ?? { data: { id: "entry-id" }, error: null },
          ),
      }),
      // Direct insert without select
      ...(insertResult ?? { data: null, error: null }),
      then: (_resolve: (v: unknown) => unknown) =>
        Promise.resolve(insertResult ?? { data: null, error: null }).then(
          _resolve,
        ),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(updateResult ?? { data: null, error: null }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(deleteResult ?? { error: null }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue(selectResult ?? { data: null, error: null }),
      }),
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }));

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...authOverride,
    },
    from: mockFrom,
  };
}
