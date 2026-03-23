import { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import { seedSmokeAgentState } from "@/lib/testing/smoke-agent-seeding";
import { ensureSmokeModelProfileState } from "@/lib/testing/smoke-model-profiles";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";
import { resetSmokeWorkspaceStateByUser } from "@/lib/testing/smoke-workspace-reset";

export async function resetSmokeState() {
  const config = requireSmokeConfig(
    "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
  );

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUserState(admin, config, {
    resetPassword: true
  });
  const modelProfiles = await ensureSmokeModelProfileState(admin);

  await resetSmokeWorkspaceStateByUser({
    admin,
    userId: smokeUser.id
  });
  await seedSmokeAgentState({
    admin,
    user: smokeUser,
    modelProfiles
  });

  return {
    workspaceId: smokeUser.workspaceId,
    smokeEmail: smokeUser.email
  };
}
