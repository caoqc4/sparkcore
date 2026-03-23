import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureSmokeAuthUser,
  type SmokeConfigLike
} from "@/lib/testing/smoke-auth-user";
import { ensureSmokeUserWorkspace } from "@/lib/testing/smoke-user-workspace";

export async function ensureSmokeUserState(
  admin: SupabaseClient,
  config: SmokeConfigLike,
  options?: {
    resetPassword?: boolean;
  }
) {
  const ensuredUser = await ensureSmokeAuthUser(admin, config, options);
  const workspace = await ensureSmokeUserWorkspace({
    admin,
    userId: ensuredUser.id,
    email: config.email
  });

  return {
    id: ensuredUser.id,
    email: config.email,
    workspaceId: workspace.id
  };
}
