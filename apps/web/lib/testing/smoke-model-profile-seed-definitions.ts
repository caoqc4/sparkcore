export const SMOKE_MODEL_PROFILE_SEED_DEFINITIONS = [
  {
    slug: "spark-default",
    name: "Spark Default",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.7,
    max_output_tokens: null,
    metadata: {
      defaultProfile: true,
      tier: "stable-conversation",
      tierLabel: "Stable conversation",
      usageNote:
        "Balanced baseline for everyday chat and stage-1 comparison runs."
    }
  },
  {
    slug: "smoke-alt",
    name: "Smoke Alt",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.3,
    max_output_tokens: null,
    metadata: {
      defaultProfile: false,
      tier: "low-cost-testing",
      tierLabel: "Low-cost testing",
      usageNote:
        "Lighter comparison profile for smoke checks and quick runtime verification."
    }
  }
] as const;
