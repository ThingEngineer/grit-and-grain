import type { AuthError } from "@supabase/supabase-js";

export function getErrorMessage(error: AuthError | null | unknown): string {
  // Type guard for error message property (strict TypeScript compatible)
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;

    // Auth-specific errors
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password";
    }
    if (message.includes("User already registered")) {
      return "This email is already registered";
    }
    if (message.includes("Email not confirmed")) {
      return "Please confirm your email first";
    }
    if (message.includes("Token expired")) {
      return "Your session expired. Please log in again";
    }
  }

  // Generic fallback
  return "An unexpected error occurred. Please try again.";
}
