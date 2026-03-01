import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMockSupabase } from "@/tests/helpers/supabase";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

let mockSupabase = makeMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// ── Tests: updateEmail ────────────────────────────────────────────────────────
describe("updateEmail", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockSupabase = makeMockSupabase();
  });

  it("redirects to /login when unauthenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { updateEmail } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("email", "new@example.com");
    await updateEmail(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects with error when email is empty", async () => {
    const { updateEmail } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    // No email field
    await updateEmail(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=Email is required"),
    );
  });

  it("calls auth.updateUser with the new email", async () => {
    const { updateEmail } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("email", "newemail@example.com");
    await updateEmail(formData);

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      email: "newemail@example.com",
    });
  });

  it("redirects with success message on success", async () => {
    const { updateEmail } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("email", "newemail@example.com");
    await updateEmail(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("success="),
    );
  });

  it("redirects with error when auth.updateUser fails", async () => {
    mockSupabase = makeMockSupabase(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        updateUser: vi
          .fn()
          .mockResolvedValue({ error: { message: "Email already taken" } }),
      },
    );
    const { updateEmail } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("email", "taken@example.com");
    await updateEmail(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error="),
    );
  });
});

// ── Tests: updatePassword ─────────────────────────────────────────────────────
describe("updatePassword", () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockSupabase = makeMockSupabase();
  });

  it("redirects to /login when unauthenticated", async () => {
    mockSupabase = makeMockSupabase(null);
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "old");
    formData.set("new_password", "newpass");
    formData.set("confirm_password", "newpass");
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects with error when any password field is missing", async () => {
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "old");
    // Missing new_password and confirm_password
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=All password fields are required"),
    );
  });

  it("redirects with error when new passwords do not match", async () => {
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "old");
    formData.set("new_password", "newpass1");
    formData.set("confirm_password", "newpass2");
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=New passwords do not match"),
    );
  });

  it("redirects with error when new password is shorter than 6 chars", async () => {
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "old");
    formData.set("new_password", "abc");
    formData.set("confirm_password", "abc");
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=Password must be at least 6 characters"),
    );
  });

  it("redirects with error when current password is incorrect", async () => {
    mockSupabase = makeMockSupabase(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ error: { message: "Invalid credentials" } }),
      },
    );
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "wrongpass");
    formData.set("new_password", "newpass1");
    formData.set("confirm_password", "newpass1");
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("error=Current password is incorrect"),
    );
  });

  it("redirects with success when password update succeeds", async () => {
    const { updatePassword } =
      await import("@/app/(authenticated)/account/actions");
    const formData = new FormData();
    formData.set("current_password", "currentpass");
    formData.set("new_password", "newpass123");
    formData.set("confirm_password", "newpass123");
    await updatePassword(formData);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("success="),
    );
  });
});
