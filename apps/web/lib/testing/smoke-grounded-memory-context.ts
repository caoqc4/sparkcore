import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export function getSmokeGroundedMemoryContext(
  recalledMemories: SmokeRecallMemory[]
) {
  const rememberedProfession = recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  return {
    rememberedProfession: Boolean(rememberedProfession),
    rememberedPlanningPreference: Boolean(rememberedPlanningPreference)
  };
}
