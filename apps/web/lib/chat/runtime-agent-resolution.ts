import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
import { getDefaultModelProfile, getDefaultPersonaPack } from "@/lib/chat/runtime-model-profile-resolution";
import {
  createOwnedAgent
} from "@/lib/chat/runtime-turn-context";
import type { AgentRecord } from "@/lib/chat/role-core";
import { ROLE_PROFILE_SELECT, SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import { createClient } from "@/lib/supabase/server";

export async function resolveAgentForWorkspace({
  workspaceId,
  userId,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  supabase?: any;
}) {
  const supabase = providedSupabase ?? (await createClient());
  const roleResolution = await resolveRoleProfile({
    repository: new SupabaseRoleRepository(supabase),
    workspaceId,
    userId
  });

  if (roleResolution.status === "resolved") {
    return roleResolution.role;
  }

  const personaPack = await getDefaultPersonaPack(supabase);
  const defaultModelProfile = await getDefaultModelProfile(supabase);

  const { data: createdAgent, error } = await createOwnedAgent({
    supabase,
    workspaceId,
    userId,
    sourcePersonaPackId: personaPack.id,
    name: personaPack.name,
    personaSummary: personaPack.persona_summary,
    stylePrompt: personaPack.style_prompt,
    systemPrompt: personaPack.system_prompt,
    defaultModelProfileId: defaultModelProfile.id,
    isCustom: false,
    metadata: buildAgentSourceMetadata({
      autoCreated: true,
      sourceSlug: personaPack.slug
    }),
    select: ROLE_PROFILE_SELECT
  });

  if (error || !createdAgent) {
    throw new Error(
      `Failed to create a default agent for this workspace: ${error?.message ?? "unknown error"}`
    );
  }

  return createdAgent as AgentRecord;
}
