import type { SupabaseClient } from "@supabase/supabase-js";
import { loadActiveModelProfilesBySlugs } from "@/lib/chat/runtime-turn-context";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-model-profile-seeds";
import { upsertSmokeModelProfiles } from "@/lib/testing/smoke-seed-persistence";

export async function ensureSmokeModelProfileState(admin: SupabaseClient) {
  const { error: upsertError } = await upsertSmokeModelProfiles(admin);

  if (upsertError) {
    throw new Error(
      `Failed to seed smoke model profiles: ${upsertError.message}`
    );
  }

  const { data: profiles, error: profilesError } = await loadActiveModelProfilesBySlugs({
    supabase: admin,
    slugs: getSmokeModelProfiles().map((profile) => profile.slug)
  });

  if (profilesError || !profiles) {
    throw new Error(
      profilesError?.message ?? "Failed to load smoke model profiles."
    );
  }

  return profiles;
}
