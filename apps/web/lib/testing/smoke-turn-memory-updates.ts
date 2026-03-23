import {
  detectSmokeNicknameCandidate,
  detectSmokeUserAddressStyleCandidate,
  detectSmokeUserPreferredNameCandidate
} from "@/lib/testing/smoke-relationship-detection";
import {
  ensureSmokeRelationshipMemory,
  upsertSmokeProfileMemory
} from "@/lib/testing/smoke-memory-seeding";

export async function applySmokeTurnMemoryUpdates({
  supabase,
  workspaceId,
  userId,
  agentId,
  sourceMessageId,
  trimmedContent,
  relationshipSeedMetadataBuilder
}: {
  supabase: Parameters<typeof upsertSmokeProfileMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
  relationshipSeedMetadataBuilder: (relationKind: string) => Record<string, unknown>;
}) {
  const createdTypes: Array<"profile" | "preference" | "relationship"> = [];
  const loweredContent = trimmedContent.toLowerCase();

  if (loweredContent.includes("product designer")) {
    const result = await upsertSmokeProfileMemory({
      supabase,
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      memoryType: "profile",
      value: "product designer",
      confidence: 0.95
    });

    if (result.created) {
      createdTypes.push("profile");
    }
  }

  if (loweredContent.includes("concise weekly planning")) {
    const result = await upsertSmokeProfileMemory({
      supabase,
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      memoryType: "preference",
      value: "concise weekly planning",
      confidence: 0.93
    });

    if (result.created) {
      createdTypes.push("preference");
    }
  }

  const smokeNickname = detectSmokeNicknameCandidate(trimmedContent);
  const smokePreferredName = detectSmokeUserPreferredNameCandidate(trimmedContent);
  const smokeUserAddressStyle =
    detectSmokeUserAddressStyleCandidate(trimmedContent);

  if (smokeNickname) {
    const result = await ensureSmokeRelationshipMemory({
      supabase,
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      key: "agent_nickname",
      value: smokeNickname,
      confidence: 0.96,
      stability: "high",
      errorLabel: "nickname",
      metadataBuilder: relationshipSeedMetadataBuilder
    });

    if (result.created) {
      createdTypes.push("relationship");
    }
  }

  if (smokePreferredName) {
    const result = await ensureSmokeRelationshipMemory({
      supabase,
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      key: "user_preferred_name",
      value: smokePreferredName,
      confidence: 0.94,
      stability: "high",
      errorLabel: "preferred-name",
      metadataBuilder: relationshipSeedMetadataBuilder
    });

    if (result.created) {
      createdTypes.push("relationship");
    }
  }

  if (smokeUserAddressStyle) {
    const result = await ensureSmokeRelationshipMemory({
      supabase,
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      key: "user_address_style",
      value: smokeUserAddressStyle,
      confidence: 0.9,
      stability: "medium",
      errorLabel: "address-style",
      metadataBuilder: relationshipSeedMetadataBuilder
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
