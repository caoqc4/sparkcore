import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseThreadStateRepository } from "@/lib/chat/thread-state-supabase-repository";

export function createAdminThreadStateRepository() {
  return new SupabaseThreadStateRepository(createAdminClient());
}
