import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";

type SmokeUser = {
  id: string;
  workspaceId: string;
};

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
