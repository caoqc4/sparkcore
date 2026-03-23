import { ensureSmokeRelationshipMemory } from "@/lib/testing/smoke-memory-seeding";
import type { SmokeRelationshipMemoryKey } from "@/lib/testing/smoke-relationship-memory-types";

export async function writeSmokeRelationshipMemory(args: {
  supabase: Parameters<typeof ensureSmokeRelationshipMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  key: SmokeRelationshipMemoryKey;
  value: string;
  confidence: number;
  stability: "high" | "medium";
  errorLabel: string;
  metadataBuilder: (relationKind: string) => Record<string, unknown>;
}) {
  return ensureSmokeRelationshipMemory({
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
    metadataBuilder: args.metadataBuilder
  });
}
