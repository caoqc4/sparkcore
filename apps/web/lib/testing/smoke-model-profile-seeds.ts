import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";
import { SMOKE_MODEL_PROFILE_SEED_DEFINITIONS } from "@/lib/testing/smoke-model-profile-seed-definitions";

function buildSmokeModelProfileSeedMetadata(args: {
  defaultProfile?: boolean;
  tier: string;
  tierLabel: string;
  usageNote: string;
}) {
  return buildSmokeSeedMetadata({
    seed: true,
    ...(args.defaultProfile ? { default: true } : {}),
    tier: args.tier,
    tier_label: args.tierLabel,
    usage_note: args.usageNote
  });
}

export function getSmokeModelProfiles() {
  return SMOKE_MODEL_PROFILE_SEED_DEFINITIONS.map((definition) => ({
    slug: definition.slug,
    name: definition.name,
    provider: definition.provider,
    model: definition.model,
    temperature: definition.temperature,
    max_output_tokens: definition.max_output_tokens,
    metadata: buildSmokeModelProfileSeedMetadata(definition.metadata)
  }));
}
