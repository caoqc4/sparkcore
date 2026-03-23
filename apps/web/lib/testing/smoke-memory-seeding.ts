import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMemoryV2Fields, inferLegacyMemoryStability, LEGACY_MEMORY_KEY } from "@/lib/chat/memory-v2";
import {
  loadOwnedMemoryItemByTypeAndContent,
  loadOwnedRelationshipMemoryByValue
} from "@/lib/chat/memory-item-read";
import {
  insertMemoryItem,
  updateMemoryItem
} from "@/lib/chat/memory-item-persistence";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";

export async function upsertSmokeProfileMemory(args: {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  memoryType: "profile" | "preference";
  value: string;
  confidence: number;
}) {
  const { data: existingMemory } = await loadOwnedMemoryItemByTypeAndContent({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    memoryType: args.memoryType,
    content: args.value,
    select: "id, metadata"
  });

  if (existingMemory) {
    await updateMemoryItem({
      supabase: args.supabase,
      memoryItemId: existingMemory.id,
      patch: {
        status: "active",
        metadata: mergeSmokeSeedMetadata(
          (existingMemory.metadata ?? {}) as Record<string, unknown>
        ),
        updated_at: new Date().toISOString()
      }
    }).eq("user_id", args.userId);

    return { created: false as const };
  }

  const { error } = await insertMemoryItem({
    supabase: args.supabase,
    payload: {
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
    }
  });

  if (error) {
    throw new Error(`Failed to seed smoke memory: ${error.message}`);
  }

  return { created: true as const };
}

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
