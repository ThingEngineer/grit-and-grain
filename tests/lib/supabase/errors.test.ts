import { describe, it, expect } from "vitest";
import { getErrorMessage } from "@/lib/supabase/errors";

describe("getErrorMessage", () => {
  it("returns user-friendly message for invalid credentials", () => {
    expect(getErrorMessage({ message: "Invalid login credentials" })).toBe(
      "Invalid email or password",
    );
  });

  it("returns user-friendly message for already-registered email", () => {
    expect(getErrorMessage({ message: "User already registered" })).toBe(
      "This email is already registered",
    );
  });

  it("returns user-friendly message for unconfirmed email", () => {
    expect(getErrorMessage({ message: "Email not confirmed" })).toBe(
      "Please confirm your email first",
    );
  });

  it("returns user-friendly message for expired token", () => {
    expect(getErrorMessage({ message: "Token expired" })).toBe(
      "Your session expired. Please log in again",
    );
  });

  it("matches substrings within longer messages", () => {
    expect(
      getErrorMessage({
        message: "AuthApiError: Invalid login credentials for user@example.com",
      }),
    ).toBe("Invalid email or password");
  });

  it("returns generic fallback for unknown error messages", () => {
    expect(
      getErrorMessage({ message: "Something entirely unexpected happened" }),
    ).toBe("An unexpected error occurred. Please try again.");
  });

  it("returns generic fallback for null", () => {
    expect(getErrorMessage(null)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic fallback for undefined", () => {
    expect(getErrorMessage(undefined)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic fallback for plain string (no message property)", () => {
    expect(getErrorMessage("some string error")).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic fallback for empty object", () => {
    expect(getErrorMessage({})).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic fallback when message property is not a string", () => {
    expect(getErrorMessage({ message: 42 })).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });
});
