import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
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

type SmokeUser = {
  id: string;
  workspaceId: string;
};

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

export async function upsertSmokeWorkspace(args: {
  admin: SupabaseClient;
  userId: string;
  workspaceName: string;
  workspaceSlug: string;
}) {
  return args.admin.from("workspaces").upsert(
    {
      owner_user_id: args.userId,
      name: args.workspaceName,
      slug: args.workspaceSlug,
      kind: "personal"
    },
    {
      onConflict: "slug"
    }
  );
}

export async function upsertSmokeModelProfiles(admin: SupabaseClient) {
  return admin.from("model_profiles").upsert([...getSmokeModelProfiles()], {
    onConflict: "slug"
  });
}

export async function insertSmokeSeedAgents(args: {
  admin: SupabaseClient;
  user: SmokeUser;
  sparkGuidePack: {
    id: string;
    slug: string;
    description: string | null;
    persona_summary: string;
    style_prompt: string;
    system_prompt: string;
  };
  memoryCoachPack: {
    id: string;
    slug: string;
    description: string | null;
    persona_summary: string;
    style_prompt: string;
    system_prompt: string;
  };
  defaultProfileId: string;
  altProfileId: string;
}) {
  return args.admin.from("agents").insert([
    {
      workspace_id: args.user.workspaceId,
      owner_user_id: args.user.id,
      source_persona_pack_id: args.sparkGuidePack.id,
      name: "Smoke Guide",
      persona_summary: args.sparkGuidePack.persona_summary,
      style_prompt: args.sparkGuidePack.style_prompt,
      system_prompt: args.sparkGuidePack.system_prompt,
      default_model_profile_id: args.defaultProfileId,
      is_custom: false,
      status: "active",
      metadata: buildAgentSourceMetadata({
        smokeSeed: true,
        sourceSlug: args.sparkGuidePack.slug,
        sourceDescription: args.sparkGuidePack.description,
        isDefaultForWorkspace: true
      })
    },
    {
      workspace_id: args.user.workspaceId,
      owner_user_id: args.user.id,
      source_persona_pack_id: args.memoryCoachPack.id,
      name: "Smoke Memory Coach",
      persona_summary: args.memoryCoachPack.persona_summary,
      style_prompt: args.memoryCoachPack.style_prompt,
      system_prompt: args.memoryCoachPack.system_prompt,
      default_model_profile_id: args.altProfileId,
      is_custom: false,
      status: "active",
      metadata: buildAgentSourceMetadata({
        smokeSeed: true,
        sourceSlug: args.memoryCoachPack.slug,
        sourceDescription: args.memoryCoachPack.description
      })
    }
  ]);
}
