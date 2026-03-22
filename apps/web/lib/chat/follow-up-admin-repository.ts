import { createAdminClient } from "@/lib/supabase/admin";
import { SupabaseFollowUpRepository } from "@/lib/chat/follow-up-supabase-repository";

export function createAdminFollowUpRepository() {
  return new SupabaseFollowUpRepository(createAdminClient());
}
