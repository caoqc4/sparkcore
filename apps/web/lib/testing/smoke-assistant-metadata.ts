import { buildSmokeAssistantMetadataSummary } from "@/lib/testing/smoke-assistant-metadata-summary";
import { buildSmokeAssistantMetadataBase } from "@/lib/testing/smoke-assistant-metadata-base";
import { buildSmokeAssistantMetadataSharedInput } from "@/lib/testing/smoke-assistant-metadata-shared-input";
import type { SmokeAssistantMetadataInput } from "@/lib/testing/smoke-assistant-metadata-types";

function buildSmokeAssistantMemorySummary(
  args: Pick<SmokeAssistantMetadataInput, "recalledMemories">
) {
  const recalledMemoryCount = args.recalledMemories.length;

  return {
    recalledMemoryCount,
    memoryUsed: recalledMemoryCount > 0
  };
}

function buildSmokeAssistantMemoryOutcome(args: {
  recalledMemories: Array<{
    memory_type: string | null;
    content: string;
    confidence: number | null;
  }>;
  createdTypes: string[];
}) {
  return {
    recalled_memories: args.recalledMemories.map((memory) => ({
      memory_type: memory.memory_type,
      content: memory.content,
      confidence: memory.confidence
    })),
    memory_write_count: args.createdTypes.length,
    memory_write_types: args.createdTypes,
    new_memory_count: args.createdTypes.length,
    updated_memory_count: 0
  };
}

export function buildSmokeAssistantMetadata(args: SmokeAssistantMetadataInput) {
  const { recalledMemoryCount, memoryUsed } = buildSmokeAssistantMemorySummary({
    recalledMemories: args.recalledMemories
  });
  const sharedInput = buildSmokeAssistantMetadataSharedInput({
    metadata: args,
    recalledMemoryCount,
    memoryUsed
  });

  return {
    ...buildSmokeAssistantMetadataBase({
      agentId: args.agentId,
      agentName: args.agentName,
      roleCorePacket: args.roleCorePacket,
      ...sharedInput
    }),
    ...buildSmokeAssistantMetadataSummary(sharedInput),
    ...buildSmokeAssistantMemoryOutcome({
      recalledMemories: args.recalledMemories,
      createdTypes: args.createdTypes
    })
  };
}
