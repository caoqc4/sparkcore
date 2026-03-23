import {
  detectSmokeNicknameCandidate,
  detectSmokeUserAddressStyleCandidate,
  detectSmokeUserPreferredNameCandidate
} from "@/lib/testing/smoke-relationship-detection";
import { buildSmokeRelationshipMemoryUpdateDefinitions } from "@/lib/testing/smoke-relationship-memory-update-definitions";
import { applySmokeRelationshipMemoryUpdate } from "@/lib/testing/smoke-relationship-memory-update-step";
import type { SmokeRelationshipMemoryUpdatesInput } from "@/lib/testing/smoke-relationship-memory-update-types";

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
