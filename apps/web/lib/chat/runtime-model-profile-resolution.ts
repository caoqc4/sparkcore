import {
  FIXED_TEXT_MODEL_ID,
  FIXED_TEXT_MODEL_NAME,
  FIXED_TEXT_MODEL_PROVIDER,
  FIXED_TEXT_MODEL_SLUG
} from "@/lib/ai/fixed-models";
import {
  bindOwnedAgentModelProfile,
  loadActiveModelProfileById,
  loadActiveModelProfileBySlug,
  loadActivePersonaPackBySlug,
  loadFirstActiveModelProfile,
  loadFirstActivePersonaPack,
} from "@/lib/chat/runtime-turn-context";
import type { AgentRecord } from "@/lib/chat/role-core";
import { elapsedMs, nowMs } from "@/lib/chat/runtime-core-helpers";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PERSONA_SLUGS = ["companion_default", "spark-guide"];
const DEFAULT_MODEL_PROFILE_SLUG = "spark-default";

export type RuntimeModelProfileRecord = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  metadata: Record<string, unknown>;
};

export type RuntimeModelProfileResolutionTimingMs = {
  total: number;
  account_level_lookup: number;
  bound_profile_lookup: number;
  default_profile_lookup: number;
  bind_default_profile: number;
};

export async function getDefaultPersonaPack(providedSupabase?: any) {
  const supabase = providedSupabase ?? (await createClient());

  for (const slug of DEFAULT_PERSONA_SLUGS) {
    const { data: personaPack } = await loadActivePersonaPackBySlug({
      supabase,
      slug
    });

    if (personaPack) {
      return personaPack;
    }
  }

  const { data: personaPack } = await loadFirstActivePersonaPack({
    supabase
  });

  if (!personaPack) {
    throw new Error(
      "No active persona pack is available. Apply the persona pack migration first."
    );
  }

  return personaPack;
}

export async function getDefaultModelProfile(providedSupabase?: any) {
  const supabase = providedSupabase ?? (await createClient());

  const { data: defaultProfile } = await loadActiveModelProfileBySlug({
    supabase,
    slug: DEFAULT_MODEL_PROFILE_SLUG
  });

  if (defaultProfile) {
    return defaultProfile as RuntimeModelProfileRecord;
  }

  const { data: fallbackProfile } = await loadFirstActiveModelProfile({
    supabase
  });

  if (!fallbackProfile) {
    throw new Error(
      "No active model profile is available. Apply the model profile migration first."
    );
  }

  return fallbackProfile as RuntimeModelProfileRecord;
}

function normalizeToFixedTextModelProfile(
  profile: RuntimeModelProfileRecord
): RuntimeModelProfileRecord {
  return {
    ...profile,
    slug: FIXED_TEXT_MODEL_SLUG,
    name: FIXED_TEXT_MODEL_NAME,
    provider: FIXED_TEXT_MODEL_PROVIDER,
    model: FIXED_TEXT_MODEL_ID,
    metadata: {
      ...(profile.metadata ?? {}),
      underlying_model: FIXED_TEXT_MODEL_ID,
      fixed_model_slug: FIXED_TEXT_MODEL_SLUG,
      fixed_provider: FIXED_TEXT_MODEL_PROVIDER
    }
  };
}

export async function resolveModelProfileForAgent({
  agent,
  workspaceId,
  userId,
  supabase: providedSupabase
}: {
  agent: AgentRecord;
  workspaceId: string;
  userId: string;
  supabase?: any;
}) {
  const supabase = providedSupabase ?? (await createClient());
  const totalStartedAt = nowMs();

  const accountLevelDurationMs = 0;

  if (agent.default_model_profile_id) {
    const boundProfileStartedAt = nowMs();
    const { data: boundProfile } = await loadActiveModelProfileById({
      supabase,
      modelProfileId: agent.default_model_profile_id
    });
    const boundProfileDurationMs = elapsedMs(boundProfileStartedAt);

    if (boundProfile) {
      return {
        profile: normalizeToFixedTextModelProfile(
          boundProfile as RuntimeModelProfileRecord
        ),
        timingMs: {
          total: elapsedMs(totalStartedAt),
          account_level_lookup: accountLevelDurationMs,
          bound_profile_lookup: boundProfileDurationMs,
          default_profile_lookup: 0,
          bind_default_profile: 0
        } satisfies RuntimeModelProfileResolutionTimingMs
      };
    }
  }

  const defaultProfileStartedAt = nowMs();
  const defaultProfile = await getDefaultModelProfile(supabase);
  const defaultProfileDurationMs = elapsedMs(defaultProfileStartedAt);

  const bindDefaultStartedAt = nowMs();
  const { error } = await bindOwnedAgentModelProfile({
    supabase,
    agentId: agent.id,
    workspaceId,
    userId,
    modelProfileId: defaultProfile.id
  });
  const bindDefaultDurationMs = elapsedMs(bindDefaultStartedAt);

  if (error) {
    throw new Error(
      `Failed to bind a default model profile to the active agent: ${error.message}`
    );
  }

  agent.default_model_profile_id = defaultProfile.id;

  return {
    profile: normalizeToFixedTextModelProfile(defaultProfile),
    timingMs: {
      total: elapsedMs(totalStartedAt),
      account_level_lookup: accountLevelDurationMs,
      bound_profile_lookup: 0,
      default_profile_lookup: defaultProfileDurationMs,
      bind_default_profile: bindDefaultDurationMs
    } satisfies RuntimeModelProfileResolutionTimingMs
  };
}
