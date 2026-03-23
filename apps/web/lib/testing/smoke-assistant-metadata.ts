import { buildSmokeAssistantMetadataSummary } from "@/lib/testing/smoke-assistant-metadata-summary";
import { buildSmokeAssistantMetadataBase } from "@/lib/testing/smoke-assistant-metadata-base";
import { buildSmokeAssistantMemoryOutcome } from "@/lib/testing/smoke-assistant-memory-outcome";
import { buildSmokeAssistantMemorySummary } from "@/lib/testing/smoke-assistant-memory-summary";
import { buildSmokeAssistantMetadataSharedInput } from "@/lib/testing/smoke-assistant-metadata-shared-input";
import type { SmokeAssistantMetadataInput } from "@/lib/testing/smoke-assistant-metadata-types";

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
