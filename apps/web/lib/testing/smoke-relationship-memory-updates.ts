import {
  detectSmokeNicknameCandidate,
  detectSmokeUserPreferredNameCandidate
} from "@/lib/testing/smoke-relationship-name-detection";
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-address-style-detection";
import { buildSmokeRelationshipMemoryUpdateDefinitions } from "@/lib/testing/smoke-relationship-memory-update-definitions";
import { applySmokeRelationshipMemoryUpdate } from "@/lib/testing/smoke-relationship-memory-update-step";
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

export async function applySmokeRelationshipMemoryUpdates(
  args: SmokeRelationshipMemoryUpdatesInput
) {
  const createdTypes: Array<"relationship"> = [];
  const smokeNickname = detectSmokeNicknameCandidate(args.trimmedContent);
  const smokePreferredName = detectSmokeUserPreferredNameCandidate(
    args.trimmedContent
  );
  const smokeUserAddressStyle = detectSmokeUserAddressStyleCandidate(
    args.trimmedContent
  );
  const updateDefinitions = buildSmokeRelationshipMemoryUpdateDefinitions({
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  });

  for (const updateDefinition of updateDefinitions) {
    await applySmokeRelationshipMemoryUpdate({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      key: updateDefinition.key,
      value: updateDefinition.value,
      confidence: updateDefinition.confidence,
      stability: updateDefinition.stability,
      errorLabel: updateDefinition.errorLabel,
      relationshipSeedMetadataBuilder: args.relationshipSeedMetadataBuilder,
      createdTypes
    });
  }

  return {
    createdTypes,
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  };
}
