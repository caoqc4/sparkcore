import { writeSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-write";

export async function applySmokeRelationshipMemoryUpdate(args: {
  supabase: Parameters<typeof writeSmokeRelationshipMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  key: Parameters<typeof writeSmokeRelationshipMemory>[0]["key"];
  value: string | null;
  confidence: number;
  stability: Parameters<typeof writeSmokeRelationshipMemory>[0]["stability"];
  errorLabel: string;
  relationshipSeedMetadataBuilder: (relationKind: string) => Record<string, unknown>;
  createdTypes: Array<"relationship">;
}) {
  if (!args.value) {
    return;
  }

  const result = await writeSmokeRelationshipMemory({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    sourceMessageId: args.sourceMessageId,
    key: args.key,
    value: args.value,
    confidence: args.confidence,
    stability: args.stability,
    errorLabel: args.errorLabel,
    metadataBuilder: args.relationshipSeedMetadataBuilder
  });

  if (result.created) {
    args.createdTypes.push("relationship");
  }
}
