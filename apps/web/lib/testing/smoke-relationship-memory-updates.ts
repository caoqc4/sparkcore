import {
  detectSmokeNicknameCandidate,
  detectSmokeUserAddressStyleCandidate,
  detectSmokeUserPreferredNameCandidate
} from "@/lib/testing/smoke-relationship-detection";
import { ensureSmokeRelationshipMemory } from "@/lib/testing/smoke-memory-seeding";
import { writeSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-write";

export async function applySmokeRelationshipMemoryUpdates(args: {
  supabase: Parameters<typeof ensureSmokeRelationshipMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
  relationshipSeedMetadataBuilder: (relationKind: string) => Record<string, unknown>;
}) {
  const createdTypes: Array<"relationship"> = [];
  const smokeNickname = detectSmokeNicknameCandidate(args.trimmedContent);
  const smokePreferredName = detectSmokeUserPreferredNameCandidate(
    args.trimmedContent
  );
  const smokeUserAddressStyle = detectSmokeUserAddressStyleCandidate(
    args.trimmedContent
  );

  if (smokeNickname) {
    const result = await writeSmokeRelationshipMemory({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      key: "agent_nickname",
      value: smokeNickname,
      confidence: 0.96,
      stability: "high",
      errorLabel: "nickname",
      metadataBuilder: args.relationshipSeedMetadataBuilder
    });

    if (result.created) {
      createdTypes.push("relationship");
    }
  }

  if (smokePreferredName) {
    const result = await writeSmokeRelationshipMemory({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      key: "user_preferred_name",
      value: smokePreferredName,
      confidence: 0.94,
      stability: "high",
      errorLabel: "preferred-name",
      metadataBuilder: args.relationshipSeedMetadataBuilder
    });

    if (result.created) {
      createdTypes.push("relationship");
    }
  }

  if (smokeUserAddressStyle) {
    const result = await writeSmokeRelationshipMemory({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      key: "user_address_style",
      value: smokeUserAddressStyle,
      confidence: 0.9,
      stability: "medium",
      errorLabel: "address-style",
      metadataBuilder: args.relationshipSeedMetadataBuilder
    });

    if (result.created) {
      createdTypes.push("relationship");
    }
  }

  return {
    createdTypes,
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  };
}
