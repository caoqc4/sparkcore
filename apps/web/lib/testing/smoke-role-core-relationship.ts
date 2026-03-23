import type { SmokeRoleCorePacket } from "@/lib/testing/smoke-role-core-packet";

export function getSmokeRoleCoreRelationshipStance(
  styleValue: string | null
): SmokeRoleCorePacket["relationship_stance"] {
  if (
    styleValue === "formal" ||
    styleValue === "friendly" ||
    styleValue === "casual" ||
    styleValue === "no_full_name"
  ) {
    return {
      effective: styleValue,
      source: "relationship_memory"
    };
  }

  return {
    effective: "default-agent-profile",
    source: "agent_profile_default"
  };
}
