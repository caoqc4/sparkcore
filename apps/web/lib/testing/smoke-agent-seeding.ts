import type { SupabaseClient } from "@supabase/supabase-js";
import { loadActivePersonaPacksBySlugs } from "@/lib/chat/runtime-turn-context";
import { resolveSmokeAgentSeedDependencies } from "@/lib/testing/smoke-agent-seed-dependencies";
import { buildSmokeSeedAgentPayloads } from "@/lib/testing/smoke-agent-seed-payload";

export type SmokeUserLike = {
  id: string;
  email: string;
  workspaceId: string;
};

export type SmokeModelProfile = {
  id: string;
  slug: string;
  name: string;
};

export type SmokeSeedPersonaPack = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  persona_summary: string;
  style_prompt: string;
  system_prompt: string;
};

async function insertSmokeSeedAgents(args: {
  admin: SupabaseClient;
  user: SmokeUserLike;
  sparkGuidePack: SmokeSeedPersonaPack;
  memoryCoachPack: SmokeSeedPersonaPack;
  defaultProfileId: string;
  altProfileId: string;
}) {
  return args.admin.from("agents").insert(buildSmokeSeedAgentPayloads(args));
}

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
