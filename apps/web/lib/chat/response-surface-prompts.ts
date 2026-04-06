import { type OutputGovernancePacketV1, buildOutputGovernancePromptSection } from "@/lib/chat/output-governance";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RoleExpressionPacketV1 } from "@/lib/chat/output-governance";
import { buildHumanizedDeliveryPromptSection } from "@/lib/chat/humanized-delivery-prompt";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import { buildRolePresenceAnchorPrompt } from "@/lib/chat/memory-prompt-builders";
import { buildOutputGovernancePromptSectionCompact } from "@/lib/chat/layer-prompt-builders";
import type {
  ResponseSurfacePromptsArgs,
  ResponseSurfacePromptsResult
} from "@/lib/chat/runtime-prompt-contracts";

export type { ResponseSurfacePromptsArgs, ResponseSurfacePromptsResult } from "@/lib/chat/runtime-prompt-contracts";

export function buildResponseSurfacePrompts(
  args: ResponseSurfacePromptsArgs
): ResponseSurfacePromptsResult {
  const outputGovernancePrompt =
    args.runtimeSurface === "im_summary"
      ? buildOutputGovernancePromptSectionCompact(
          args.governance,
          args.replyLanguage
        )
      : buildOutputGovernancePromptSection(
          args.governance,
          args.replyLanguage
        );

  const rolePresenceAnchorPrompt = buildRolePresenceAnchorPrompt({
    roleExpression: args.roleExpression,
    replyLanguage: args.replyLanguage
  });

  const humanizedDeliveryPrompt =
    args.runtimeSurface === "im_summary"
      ? buildHumanizedDeliveryPromptSection({
          packet: args.humanizedDeliveryPacket,
          replyLanguage: args.replyLanguage
        })
      : "";

  return {
    outputGovernancePrompt,
    rolePresenceAnchorPrompt,
    humanizedDeliveryPrompt
  };
}
