import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a new user who hasn't completed their profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        // New user — redirect to profile onboarding
        if (!profile?.full_name) {
          return NextResponse.redirect(
            new URL("/profile?onboarding=true", request.url),
          );
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return error response
  return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
}
