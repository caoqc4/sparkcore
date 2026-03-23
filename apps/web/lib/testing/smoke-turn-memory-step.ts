import { applySmokeTurnMemoryUpdates } from "@/lib/testing/smoke-turn-memory-updates";
import { buildSmokeRelationshipSeedMetadata } from "@/lib/testing/smoke-relationship-seed-metadata";

export async function persistSmokeMemoryTurnStep(args: {
  supabase: Parameters<typeof applySmokeTurnMemoryUpdates>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
}) {
  return applySmokeTurnMemoryUpdates({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    sourceMessageId: args.sourceMessageId,
    trimmedContent: args.trimmedContent,
    relationshipSeedMetadataBuilder: buildSmokeRelationshipSeedMetadata
  });
}
