import type { SupabaseClient } from "@supabase/supabase-js";
import { loadActivePersonaPacksBySlugs } from "@/lib/chat/runtime-turn-context";
import { insertSmokeSeedAgents } from "@/lib/testing/smoke-seed-persistence";

type SmokeUserLike = {
  id: string;
  email: string;
  workspaceId: string;
};

type SmokeModelProfile = {
  id: string;
  slug: string;
  name: string;
};

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

  const activePersonaPacks = personaPacks as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    persona_summary: string;
    style_prompt: string;
    system_prompt: string;
  }>;

  const sparkGuidePack = activePersonaPacks.find(
    (pack) => pack.slug === "spark-guide"
  );
  const memoryCoachPack = activePersonaPacks.find(
    (pack) => pack.slug === "memory-coach"
  );
  const defaultProfile = args.modelProfiles.find(
    (profile) => profile.slug === "spark-default"
  );
  const altProfile = args.modelProfiles.find(
    (profile) => profile.slug === "smoke-alt"
  );

  if (!sparkGuidePack || !memoryCoachPack || !defaultProfile || !altProfile) {
    throw new Error("Smoke seed dependencies are incomplete.");
  }

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
