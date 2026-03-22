import type { BindingLookup } from "../../../../packages/integrations/im-adapter/contract";
import { createSupabaseBindingLookup } from "../../../../packages/integrations/im-adapter/supabase-repository";
import { createClient } from "@/lib/supabase/server";

export async function createWebBindingLookup(): Promise<BindingLookup> {
  const supabase = await createClient();
  return createSupabaseBindingLookup(supabase);
}
