import type {
  AnswerCarryoverPolicy,
  AnswerForbiddenMove,
  AnswerQuestionType,
  AnswerSceneGoal,
  AnswerStrategy,
  AnswerStrategyPriority,
  AnswerStrategyReasonCode,
  ContinuationReasonCode
} from "@/lib/chat/answer-decision";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { ActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import type { PlannerCandidateSummary } from "@/lib/chat/memory-planner-candidates";
import type { RuntimeRelationshipRecall } from "@/lib/chat/memory-recall";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type {
  ReplyLanguageSource,
  RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
import type { RuntimeModelProfileRecord } from "@/lib/chat/runtime-model-profile-resolution";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { RuntimeCloseNoteArtifacts } from "@/lib/chat/runtime-close-note-contracts";
import type { CompactedThreadSummary } from "@sparkcore/core-memory";
import type { RuntimeRelationshipMemorySummary } from "@/lib/chat/runtime-contract";

export type RuntimeObservabilityRelationshipRecallMetadata = {
  used: boolean;
  direct_naming_question: boolean;
  direct_preferred_name_question: boolean;
  relationship_style_prompt: boolean;
  same_thread_continuity: boolean;
  recalled_keys: string[];
  recalled_memory_ids: string[];
  adopted_agent_nickname_target: string | null;
  adopted_user_preferred_name_target: string | null;
};

export type BuildRuntimeRelationshipRecallMetadataArgs = {
  relationshipRecall: RuntimeRelationshipRecall;
  relationshipMemories: RuntimeRelationshipMemorySummary[];
  relationshipRecallKeys: string[];
};

export type BuildObservedMemoryTypesArgs = {
  relationshipMemories: RuntimeRelationshipMemorySummary[];
  memoryRecall: PreparedRuntimeTurn["memory"]["runtime_memory_context"]["memoryRecall"];
};

export type BuildRuntimeObservabilityInputsArgs = RuntimeCloseNoteArtifacts & {
  agent: {
    id: string;
    name: string;
  };
  modelProfile: RuntimeModelProfileRecord;
  resultModel: string | null;
  preparedRuntimeTurn: PreparedRuntimeTurn;
  finalAssistantContent: string;
  replyLanguage: RuntimeReplyLanguage;
  replyLanguageSource: ReplyLanguageSource;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyReasonCode: AnswerStrategyReasonCode;
  answerStrategyPriority: AnswerStrategyPriority;
  answerStrategyPriorityLabel: string;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  relationshipRecall: RuntimeRelationshipRecall;
  relationshipMemories: RuntimeRelationshipMemorySummary[];
  relationshipRecallKeys: string[];
  relationshipRecallMemoryIds: string[];
  continuationReasonCode: ContinuationReasonCode | null;
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  allRecalledMemories: RecalledMemory[];
  memoryRecall: PreparedRuntimeTurn["memory"]["runtime_memory_context"]["memoryRecall"];
  recalledProfileSnapshot: string[];
  activeScenarioMemoryPack: ActiveScenarioMemoryPack | null;
  applicableKnowledge: RuntimeKnowledgeSnippet[];
  knowledgeGatingWithOutcome: RuntimeKnowledgeGatingSummary | null;
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null;
  compactedThreadSummary: CompactedThreadSummary | null;
  followUpRequestCount: number;
  memoryWriteRequestCount: number;
  memoryPlannerSummary: PlannerCandidateSummary | null;
  recentRawTurnCount: number;
  approxContextPressure: PreparedRuntimeTurn["session"]["approx_context_pressure"];
};

export type RuntimeObservabilityArtifacts = {
  assistantMetadataInput: import("@/lib/chat/runtime-assistant-metadata").BuildRuntimeAssistantMetadataInput;
  assistantMetadata: ReturnType<
    typeof import("@/lib/chat/runtime-assistant-metadata").buildRuntimeAssistantMetadataInput
  >;
  debugMetadataInput: import("@/lib/chat/runtime-debug-metadata").BuildRuntimeDebugMetadataInput;
  debugMetadata: ReturnType<
    typeof import("@/lib/chat/runtime-debug-metadata").buildRuntimeDebugMetadata
  >;
};
