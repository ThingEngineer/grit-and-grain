"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const newEmail = (formData.get("email") as string)?.trim();
  if (!newEmail) {
    return redirect("/account?error=Email is required");
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    console.error("[updateEmail] Auth error:", error.message);
    return redirect("/account?error=Unable+to+update+email.+Please+try+again.");
  }

  return redirect(
    "/account?success=Confirmation email sent. Please check both your old and new email to confirm the change.",
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return redirect("/account?error=All password fields are required");
  }

  if (newPassword !== confirmPassword) {
    return redirect("/account?error=New passwords do not match");
  }

  if (newPassword.length < 6) {
    return redirect(
      "/account?error=Password must be at least 6 characters long",
    );
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return redirect("/account?error=Current password is incorrect");
  }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("[updatePassword] Auth error:", error.message);
    return redirect("/account?error=Unable+to+update+password.+Please+try+again.");
  }

  return redirect("/account?success=Password updated successfully");
}
