import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { ActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import type { AnswerCompositionTemporalContext } from "@/lib/chat/runtime-composition-contracts";
import type { RuntimeCloseNoteArtifacts } from "@/lib/chat/runtime-close-note-contracts";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
import type { RuntimePromptPreparation } from "@/lib/chat/runtime-prompt-contracts";
import type { RuntimeRelationshipMemorySummary } from "@/lib/chat/runtime-contract";
import type { CompactedThreadSummary } from "@sparkcore/core-memory";

export type PreparedRuntimeGenerationExecutionContext =
  RuntimePromptPreparation & {
    knowledgeRoute: string | null;
    knowledgeLoadLimit: number;
    knowledgeLoadDurationMs: number;
    runtimeTemporalContext: AnswerCompositionTemporalContext;
    humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  };

export type PreparedRuntimeGenerationGovernanceHandoff = {
  compactedThreadSummary: CompactedThreadSummary | null;
  applicableKnowledge: RuntimeKnowledgeSnippet[];
  knowledgeGatingWithOutcome: RuntimeKnowledgeGatingSummary;
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace;
  activeScenarioMemoryPack: ActiveScenarioMemoryPack | null;
};

export type PreparedRuntimeGenerationCloseNoteHandoff =
  RuntimeCloseNoteArtifacts;

export type PreparedRuntimeGenerationRelationshipRecallHandoff = {
  relationshipRecallKeys: string[];
  relationshipRecallMemoryIds: string[];
  relationshipMemories: RuntimeRelationshipMemorySummary[];
};

export type PreparedRuntimeGenerationPostGenerationHandoff = {
  relationshipRecallHandoff: PreparedRuntimeGenerationRelationshipRecallHandoff;
  governanceHandoff: PreparedRuntimeGenerationGovernanceHandoff;
  closeNoteHandoff: PreparedRuntimeGenerationCloseNoteHandoff;
};

export type PreparedRuntimeGenerationRunnerArtifacts = {
  executionContext: PreparedRuntimeGenerationExecutionContext;
  postGenerationHandoff: PreparedRuntimeGenerationPostGenerationHandoff;
};
