import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMemoryV2Fields } from "@/lib/chat/memory-v2";
import { loadOwnedRelationshipMemoryByValue } from "@/lib/chat/memory-item-read";
import { insertMemoryItem } from "@/lib/chat/memory-item-persistence";

export async function ensureSmokeRelationshipMemory(args: {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  key: "agent_nickname" | "user_preferred_name" | "user_address_style";
  value: string;
  confidence: number;
  stability: "high" | "medium";
  errorLabel: string;
  metadataBuilder: (key: string) => Record<string, unknown>;
}) {
  const { data: existingRelationship } = await loadOwnedRelationshipMemoryByValue({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    key: args.key,
    targetAgentId: args.agentId,
    value: args.value
  });

  if (existingRelationship) {
    return { created: false as const };
  }

  const { error } = await insertMemoryItem({
    supabase: args.supabase,
    payload: {
      workspace_id: args.workspaceId,
      user_id: args.userId,
      agent_id: args.agentId,
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
    }
  });

  if (error) {
    throw new Error(`Failed to seed ${args.errorLabel} memory: ${error.message}`);
  }

  return { created: true as const };
}
