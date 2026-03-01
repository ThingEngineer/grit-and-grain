import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Admin client using the service-role key via the base @supabase/supabase-js
 * package. This bypasses RLS entirely and must only be used server-side.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
