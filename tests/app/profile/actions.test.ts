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
describe("updateProfile", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "Josh");
    await updateProfile(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("calls update on profiles table with correct fields", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ update: updateMock })),
    };
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "  Josh Smith  ");
    formData.set("ranch_name", "Bar S Ranch");
    await updateProfile(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Josh Smith",
        ranch_name: "Bar S Ranch",
      }),
    );
  });

  it("redirects to /dashboard after successful onboarding update", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ update: updateMock })),
    };
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "Josh");
    formData.set("onboarding", "true");
    await updateProfile(formData);

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to /profile?success after non-onboarding update", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ update: updateMock })),
    };
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "Josh");
    await updateProfile(formData);

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/profile?success="),
    );
  });

  it("redirects with error when database update fails", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ update: updateMock })),
    };
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "Josh");
    await updateProfile(formData);

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error="),
    );
  });

  it("trims whitespace from full_name and ranch_name", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockSupabase = {
      ...makeMockSupabase(),
      from: vi.fn(() => ({ update: updateMock })),
    };
    const { updateProfile } =
      await import("@/app/(authenticated)/profile/actions");
    const formData = new FormData();
    formData.set("full_name", "  Annie Oakley  ");
    formData.set("ranch_name", "  Oak Ranch  ");
    await updateProfile(formData);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Annie Oakley",
        ranch_name: "Oak Ranch",
      }),
    );
  });
});
