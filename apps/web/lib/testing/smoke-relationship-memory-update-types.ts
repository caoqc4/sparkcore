import { ensureSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-seeding";

export type SmokeRelationshipMemoryUpdatesInput = {
  supabase: Parameters<typeof ensureSmokeRelationshipMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
  relationshipSeedMetadataBuilder: (relationKind: string) => Record<string, unknown>;
};
