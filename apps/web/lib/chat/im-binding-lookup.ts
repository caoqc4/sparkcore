import type { BindingLookup } from "../../../../packages/integrations/im-adapter/contract";
import { createSupabaseBindingLookup } from "../../../../packages/integrations/im-adapter/supabase-repository";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createWebBindingLookup(): Promise<BindingLookup> {
  const supabase = createAdminClient();
  return createSupabaseBindingLookup(supabase);
}
