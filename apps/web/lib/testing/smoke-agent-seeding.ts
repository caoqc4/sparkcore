import type { SupabaseClient } from "@supabase/supabase-js";
import { loadActivePersonaPacksBySlugs } from "@/lib/chat/runtime-turn-context";
import { resolveSmokeAgentSeedDependencies } from "@/lib/testing/smoke-agent-seed-dependencies";
import { insertSmokeSeedAgents } from "@/lib/testing/smoke-seed-persistence";
import type {
  SmokeModelProfile,
  SmokeSeedPersonaPack,
  SmokeUserLike
} from "@/lib/testing/smoke-agent-seeding-types";

export async function seedSmokeAgentState(args: {
  admin: SupabaseClient;
  user: SmokeUserLike;
  modelProfiles: SmokeModelProfile[];
}) {
  const { data: personaPacks, error: personaPacksError } = await loadActivePersonaPacksBySlugs({
    supabase: args.admin,
    slugs: ["spark-guide", "memory-coach"]
  });

  if (personaPacksError || !personaPacks || personaPacks.length < 2) {
    throw new Error(
      personaPacksError?.message ??
        "Expected seeded persona packs for the smoke workspace."
    );
  }

  const activePersonaPacks = personaPacks as SmokeSeedPersonaPack[];
  const { sparkGuidePack, memoryCoachPack, defaultProfile, altProfile } =
    resolveSmokeAgentSeedDependencies({
      personaPacks: activePersonaPacks,
      modelProfiles: args.modelProfiles
    });

  const { error: insertAgentsError } = await insertSmokeSeedAgents({
    admin: args.admin,
    user: args.user,
    sparkGuidePack,
    memoryCoachPack,
    defaultProfileId: defaultProfile.id,
    altProfileId: altProfile.id
  });

  if (insertAgentsError) {
    throw new Error(`Failed to seed smoke agents: ${insertAgentsError.message}`);
  }
}
