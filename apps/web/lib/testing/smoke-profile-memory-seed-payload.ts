import {
  buildMemoryV2Fields,
  inferLegacyMemoryStability,
  LEGACY_MEMORY_KEY
} from "@/lib/chat/memory-v2";
import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";
import type { SmokeProfileMemorySeedingInput } from "@/lib/testing/smoke-profile-memory-seeding";

export function buildSmokeProfileMemorySeedPayload(
  args: SmokeProfileMemorySeedingInput
) {
  return {
    workspace_id: args.workspaceId,
    user_id: args.userId,
    agent_id: args.agentId,
    memory_type: args.memoryType,
    content: args.value,
    confidence: args.confidence,
    source_message_id: args.sourceMessageId,
    ...buildMemoryV2Fields({
      category: args.memoryType,
      key: LEGACY_MEMORY_KEY,
      value: args.value,
      scope: "user_global",
      subjectUserId: args.userId,
      stability: inferLegacyMemoryStability(args.memoryType),
      status: "active",
      sourceRefs: [
        {
          kind: "message",
          source_message_id: args.sourceMessageId
        }
      ]
    }),
    metadata: buildSmokeSeedMetadata()
  };
}
