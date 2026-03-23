import type { SupabaseClient } from "@supabase/supabase-js";
import { loadOwnedRelationshipMemoryByValue } from "@/lib/chat/memory-item-read";
import { insertMemoryItem } from "@/lib/chat/memory-item-persistence";
import { buildSmokeRelationshipMemorySeedPayload } from "@/lib/testing/smoke-relationship-memory-seed-payload";
import type { SmokeRelationshipMemoryKey } from "@/lib/testing/smoke-relationship-memory-types";

export async function ensureSmokeRelationshipMemory(args: {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  key: SmokeRelationshipMemoryKey;
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
    payload: buildSmokeRelationshipMemorySeedPayload(args)
  });

  if (error) {
    throw new Error(`Failed to seed ${args.errorLabel} memory: ${error.message}`);
  }

  return { created: true as const };
}
