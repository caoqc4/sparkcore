import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { loadActiveModelProfilesBySlugs } from "@/lib/chat/runtime-turn-context";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import { seedSmokeAgentState } from "@/lib/testing/smoke-agent-seeding";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-model-profile-seeds";
import { upsertSmokeModelProfiles } from "@/lib/testing/smoke-seed-persistence";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";
import { resetSmokeWorkspaceStateByUser } from "@/lib/testing/smoke-workspace-reset";

export async function resetSmokeState() {
  const config = requireSmokeConfig(
    "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
  );

  const admin = createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const smokeUser = await ensureSmokeUserState(admin, config, {
    resetPassword: true
  });
  const { error: upsertError } = await upsertSmokeModelProfiles(admin);

  if (upsertError) {
    throw new Error(
      `Failed to seed smoke model profiles: ${upsertError.message}`
    );
  }

  const { data: modelProfiles, error: profilesError } =
    await loadActiveModelProfilesBySlugs({
      supabase: admin,
      slugs: getSmokeModelProfiles().map((profile) => profile.slug)
    });

  if (profilesError || !modelProfiles) {
    throw new Error(
      profilesError?.message ?? "Failed to load smoke model profiles."
    );
  }

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
