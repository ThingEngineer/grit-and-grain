// lib/supabase/queries.ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated Supabase user, or null.
 *
 * Wrapped in React.cache() so it executes at most once per server render tree
 * (layout + page share the result at zero extra cost).
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
});

/**
 * Returns full_name and ranch_name for the given profile_id.
 *
 * Fetches both columns in one query so layout (needs full_name) and
 * dashboard (needs ranch_name) share a single round-trip via React.cache().
 */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, ranch_name")
    .eq("id", userId)
    .single();
  return data;
});
