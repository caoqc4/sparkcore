import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/env";

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
