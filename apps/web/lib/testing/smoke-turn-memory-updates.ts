import { applySmokeProfileMemoryUpdates } from "@/lib/testing/smoke-profile-memory-updates";
import { applySmokeRelationshipMemoryUpdates } from "@/lib/testing/smoke-relationship-memory-updates";

export async function applySmokeTurnMemoryUpdates({
  supabase,
  workspaceId,
  userId,
  agentId,
  sourceMessageId,
  trimmedContent,
  relationshipSeedMetadataBuilder
}: {
  supabase: Parameters<typeof applySmokeProfileMemoryUpdates>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
  relationshipSeedMetadataBuilder: (relationKind: string) => Record<string, unknown>;
}) {
  const createdTypes: Array<"profile" | "preference" | "relationship"> = [];
  const createdProfileTypes = await applySmokeProfileMemoryUpdates({
    supabase,
    workspaceId,
    userId,
    agentId,
    sourceMessageId,
    trimmedContent
  });
  createdTypes.push(...createdProfileTypes);

  const {
    createdTypes: createdRelationshipTypes,
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  } = await applySmokeRelationshipMemoryUpdates({
    supabase,
    workspaceId,
    userId,
    agentId,
    sourceMessageId,
    trimmedContent,
    relationshipSeedMetadataBuilder
  });
  createdTypes.push(...createdRelationshipTypes);

  return {
    createdTypes,
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  };
}
