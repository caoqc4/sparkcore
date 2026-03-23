import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
import type {
  SmokeSeedPersonaPack,
  SmokeUserLike
} from "@/lib/testing/smoke-agent-seeding-types";

export function buildSmokeSeedAgentPayloads(args: {
  user: SmokeUserLike;
  sparkGuidePack: SmokeSeedPersonaPack;
  memoryCoachPack: SmokeSeedPersonaPack;
  defaultProfileId: string;
  altProfileId: string;
}) {
  return [
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
      status: "active" as const,
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
      status: "active" as const,
      metadata: buildAgentSourceMetadata({
        smokeSeed: true,
        sourceSlug: args.memoryCoachPack.slug,
        sourceDescription: args.memoryCoachPack.description
      })
    }
  ];
}
