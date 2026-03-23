import { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import {
  ensureSmokeModelProfiles,
  ensureSmokeUser,
  resetSmokeWorkspaceState,
  seedSmokeAgents
} from "@/lib/testing/smoke-runtime-state";

export async function resetSmokeState() {
  const config = requireSmokeConfig(
    "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
  );

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config, {
    resetPassword: true
  });
  const modelProfiles = await ensureSmokeModelProfiles(admin);

  await resetSmokeWorkspaceState(admin, smokeUser);
  await seedSmokeAgents(admin, smokeUser, modelProfiles);

  return {
    workspaceId: smokeUser.workspaceId,
    smokeEmail: smokeUser.email
  };
}
