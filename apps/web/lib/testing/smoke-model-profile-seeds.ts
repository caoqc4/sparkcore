import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";

const SMOKE_MODEL_PROFILES = [
  {
    slug: "spark-default",
    name: "Spark Default",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.7,
    max_output_tokens: null
  },
  {
    slug: "smoke-alt",
    name: "Smoke Alt",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.3,
    max_output_tokens: null
  }
] as const;

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
  return [
    {
      ...SMOKE_MODEL_PROFILES[0],
      metadata: buildSmokeModelProfileSeedMetadata({
        defaultProfile: true,
        tier: "stable-conversation",
        tierLabel: "Stable conversation",
        usageNote:
          "Balanced baseline for everyday chat and stage-1 comparison runs."
      })
    },
    {
      ...SMOKE_MODEL_PROFILES[1],
      metadata: buildSmokeModelProfileSeedMetadata({
        tier: "low-cost-testing",
        tierLabel: "Low-cost testing",
        usageNote:
          "Lighter comparison profile for smoke checks and quick runtime verification."
      })
    }
  ] as const;
}
