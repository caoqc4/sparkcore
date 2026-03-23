export type ScenarioMemoryLayer =
  | "thread_state"
  | "dynamic_profile"
  | "static_profile"
  | "memory_record"
  | "knowledge";

export type ScenarioMemoryRoute =
  | "profile"
  | "episode"
  | "timeline"
  | "thread_state"
  | "knowledge";

export type ScenarioMemoryPackId = "companion";

export type ScenarioMemoryPack = {
  pack_id: ScenarioMemoryPackId;
  label: string;
  description: string;
  schema_extensions: string[];
  extraction_hints: string[];
  preferred_routes: ScenarioMemoryRoute[];
  assembly_order: ScenarioMemoryLayer[];
  eval_hooks: string[];
};

export const COMPANION_SCENARIO_MEMORY_PACK: ScenarioMemoryPack = {
  pack_id: "companion",
  label: "Companion",
  description:
    "Optimize memory behavior for long-running companion interaction with stronger continuity, preference carryover, and relationship-aware grounding.",
  schema_extensions: [
    "relationship stance",
    "reply preference drift",
    "phase-level working mode"
  ],
  extraction_hints: [
    "Prefer stable relationship cues before broad factual notes.",
    "Promote short-to-medium horizon preference shifts into dynamic profile.",
    "Keep immediate task focus inside thread_state."
  ],
  preferred_routes: ["thread_state", "profile", "episode", "timeline"],
  assembly_order: [
    "thread_state",
    "dynamic_profile",
    "static_profile",
    "memory_record"
  ],
  eval_hooks: [
    "continuity_preservation",
    "relationship_grounding",
    "preference_carryover"
  ]
};

export function resolveBuiltInScenarioMemoryPack(
  packId: ScenarioMemoryPackId = "companion"
): ScenarioMemoryPack {
  switch (packId) {
    case "companion":
    default:
      return COMPANION_SCENARIO_MEMORY_PACK;
  }
}
