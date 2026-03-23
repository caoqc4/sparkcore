import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SmokeConfig } from "@/lib/testing/smoke-runtime-types";

export function getSmokeAdminClient(config: SmokeConfig) {
  return createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
