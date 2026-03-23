import {
  buildMemoryV2Fields,
  inferLegacyMemoryStability,
  LEGACY_MEMORY_KEY
} from "@/lib/chat/memory-v2";
import { loadOwnedMemoryItemByTypeAndContent } from "@/lib/chat/memory-item-read";
import { insertMemoryItem, updateMemoryItem } from "@/lib/chat/memory-item-persistence";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";
import type { SmokeProfileMemorySeedingInput } from "@/lib/testing/smoke-profile-memory-seeding-types";

export async function upsertSmokeProfileMemory(args: SmokeProfileMemorySeedingInput) {
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
