import { buildMemoryV2Fields } from "@/lib/chat/memory-v2";
import type { insertMemoryItem } from "@/lib/chat/memory-item-persistence";
import type { SmokeRelationshipMemoryKey } from "@/lib/testing/smoke-relationship-memory-types";

export function buildSmokeRelationshipMemorySeedPayload(args: {
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  key: SmokeRelationshipMemoryKey;
  value: string;
  confidence: number;
  stability: "high" | "medium";
  metadataBuilder: (key: string) => Record<string, unknown>;
}): Parameters<typeof insertMemoryItem>[0]["payload"] {
  return {
    workspace_id: args.workspaceId,
    user_id: args.userId,
    agent_id: null,
    source_message_id: args.sourceMessageId,
    memory_type: null,
    content: args.value,
    confidence: args.confidence,
    importance: 0.5,
    ...buildMemoryV2Fields({
      category: "relationship",
      key: args.key,
      value: args.value,
      scope: "user_agent",
      subjectUserId: args.userId,
      targetAgentId: args.agentId,
      stability: args.stability,
      status: "active",
      sourceRefs: [
        {
          kind: "message",
          source_message_id: args.sourceMessageId
        }
      ]
    }),
    metadata: args.metadataBuilder(args.key)
  };
}
