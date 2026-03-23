import { loadOwnedMemoryItemByTypeAndContent } from "@/lib/chat/memory-item-read";
import { insertMemoryItem, updateMemoryItem } from "@/lib/chat/memory-item-persistence";
import { buildSmokeProfileMemorySeedPayload } from "@/lib/testing/smoke-profile-memory-seed-payload";
import {
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
    payload: buildSmokeProfileMemorySeedPayload(args)
  });

  if (error) {
    throw new Error(`Failed to seed smoke memory: ${error.message}`);
  }

  return { created: true as const };
}
