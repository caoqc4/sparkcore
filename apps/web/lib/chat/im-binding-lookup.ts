import {
  createSupabaseBindingLookup,
  type BindingLookup
} from "@/lib/integrations/im-adapter";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createWebBindingLookup(): Promise<BindingLookup> {
  const supabase = createAdminClient();
  return createSupabaseBindingLookup(supabase);
}
