import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Call the SECURITY DEFINER RPC function which deletes auth.users
  // (cascades to wipe all user data) without needing the service-role JWT.
  const { error } = await supabase.rpc("delete_user_account");

  if (error) {
    console.error("delete_user_account RPC error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }

  // Sign out the current session
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
