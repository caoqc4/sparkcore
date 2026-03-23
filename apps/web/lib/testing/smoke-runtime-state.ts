import type { SupabaseClient } from "@supabase/supabase-js";
export { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import { seedSmokeAgentState } from "@/lib/testing/smoke-agent-seeding";
import { ensureSmokeModelProfileState } from "@/lib/testing/smoke-model-profiles";
import type { SmokeConfig, SmokeUser } from "@/lib/testing/smoke-runtime-types";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";
import { resetSmokeWorkspaceStateByUser } from "@/lib/testing/smoke-workspace-reset";

export async function ensureSmokeUser(
  admin: SupabaseClient,
  config: SmokeConfig,
  options?: {
    resetPassword?: boolean;
  }
): Promise<SmokeUser> {
  return ensureSmokeUserState(admin, config, options);
}

export async function ensureSmokeModelProfiles(admin: SupabaseClient) {
  return ensureSmokeModelProfileState(admin);
}

export async function resetSmokeWorkspaceState(
  admin: SupabaseClient,
  user: SmokeUser
) {
  await resetSmokeWorkspaceStateByUser({
    admin,
    userId: user.id
  });
}

export async function seedSmokeAgents(
  admin: SupabaseClient,
  user: SmokeUser,
  modelProfiles: Array<{ id: string; slug: string; name: string }>
) {
  await seedSmokeAgentState({
    admin,
    user,
    modelProfiles
  });
}
