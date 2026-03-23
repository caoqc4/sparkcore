import type { SmokeAssistantMetadataInput } from "@/lib/testing/smoke-assistant-metadata-types";

export function buildSmokeAssistantMemorySummary(
  args: Pick<SmokeAssistantMetadataInput, "recalledMemories">
) {
  const recalledMemoryCount = args.recalledMemories.length;

  return {
    recalledMemoryCount,
    memoryUsed: recalledMemoryCount > 0
  };
}
