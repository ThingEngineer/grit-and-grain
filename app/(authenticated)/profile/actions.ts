"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const ranchName = (formData.get("ranch_name") as string)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      ranch_name: ranchName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    const onboarding = formData.get("onboarding") === "true";
    const errorRedirect = onboarding
      ? "/profile?onboarding=true&error=Failed to update profile"
      : "/profile?error=Failed to update profile";
    return redirect(errorRedirect);
  }

  revalidatePath("/", "layout");

  // Keep the onboarding_complete cookie in sync with whether full_name is set.
  // Middleware reads this cookie to skip a DB round-trip on every request.
  const cookieStore = await cookies();
  if (fullName) {
    cookieStore.set("onboarding_complete", "1", {
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete("onboarding_complete");
  }

  const isOnboarding = formData.get("onboarding") === "true";
  if (isOnboarding) {
    return redirect("/dashboard");
  }
  return redirect("/profile?success=Profile updated successfully");
}
