import { buildAgentSystemPromptSections } from "@/lib/chat/agent-system-prompt-builders";
import { buildResponseSurfacePrompts } from "@/lib/chat/response-surface-prompts";
import type {
  RuntimePromptSectionsArgs,
  RuntimePromptSectionsResult
} from "@/lib/chat/runtime-system-prompt-contracts";

export type {
  RuntimePromptSectionsArgs,
  RuntimePromptSectionsResult
} from "@/lib/chat/runtime-system-prompt-contracts";

export function buildRuntimePromptSections(
  args: RuntimePromptSectionsArgs
): RuntimePromptSectionsResult {
  const {
    outputGovernancePrompt,
    rolePresenceAnchorPrompt,
    humanizedDeliveryPrompt
  } = buildResponseSurfacePrompts({
    runtimeSurface: args.runtimeSurface,
    governance: args.governance,
    roleExpression: args.roleExpression,
    humanizedDeliveryPacket: args.humanizedDeliveryPacket,
    replyLanguage: args.replyLanguage
  });

  const systemPromptSections = buildAgentSystemPromptSections({
    ...args.systemPromptArgs,
    rolePresenceAnchorPrompt,
    outputGovernancePrompt,
    humanizedDeliveryPrompt
  });

  return {
    outputGovernancePrompt,
    rolePresenceAnchorPrompt,
    humanizedDeliveryPrompt,
    systemPromptSections
  };
}
