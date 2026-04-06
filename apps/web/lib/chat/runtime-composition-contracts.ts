import type {
  AnswerCarryoverPolicy,
  AnswerForbiddenMove,
  AnswerQuestionType,
  AnswerSceneGoal,
  AnswerStrategy,
  AnswerStrategyPriority,
  DirectRecallQuestionKind
} from "@/lib/chat/answer-decision";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { buildRuntimeMemoryGovernanceContext } from "@/lib/chat/runtime-memory-governance-context";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { buildRuntimeRoleCoreCloseNoteArtifacts } from "@/lib/chat/runtime-role-core-close-note";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RecentRawTurn } from "@/lib/chat/session-context";
import type {
  HumanizedDeliveryPacket,
  HumanizedProductFeedbackCategory
} from "@/lib/chat/humanized-delivery-contracts";
import type { RuntimePromptSectionsResult } from "@/lib/chat/runtime-system-prompt-contracts";

export type AnswerCompositionRuntimeSurface = "im_summary" | "full";

export type AnswerCompositionTemporalHints = {
  recentSameSession: boolean;
  sameDayContinuation: boolean;
  consecutiveUserMessages: number;
  minutesSinceLastAssistant: number | null;
};

export type AnswerCompositionTemporalContext = {
  timezone: string;
  localDate: string;
  localTime: string;
  partOfDay: "late_night" | "morning" | "noon" | "afternoon" | "evening";
};

export type AnswerCompositionSpec = {
  runtimeSurface: AnswerCompositionRuntimeSurface;
  replyLanguage: RuntimeReplyLanguage;
  latestUserMessage: string | null;
  temporalContext: AnswerCompositionTemporalContext;
  temporalHints: AnswerCompositionTemporalHints;
  recentRawTurns: RecentRawTurn[];
  answer: {
    questionType: AnswerQuestionType;
    strategy: AnswerStrategy;
    carryoverPolicy: AnswerCarryoverPolicy;
    forbiddenMoves: AnswerForbiddenMove[];
    sceneGoal: AnswerSceneGoal;
  };
};

export type AnswerStrategyRelationshipRecallSpec = {
  sameThreadContinuity: boolean;
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  nicknameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  preferredNameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
};

export type AnswerStrategyAddressStyleRecallSpec = Pick<
  AnswerStrategyRelationshipRecallSpec,
  "addressStyleMemory"
>;

export type AnswerStrategyNamingRecallSpec = Pick<
  AnswerStrategyRelationshipRecallSpec,
  "nicknameMemory" | "preferredNameMemory"
>;

export type AnswerInstructionCompositionSpec = {
  latestUserMessage: string;
  isZh: boolean;
  recalledMemories: RecalledMemory[];
  directRecallQuestionKind: DirectRecallQuestionKind;
  answer: {
    questionType: AnswerQuestionType;
    strategy: AnswerStrategy;
    priority: AnswerStrategyPriority;
  };
  relationshipRecall: AnswerStrategyRelationshipRecallSpec;
};

export type RuntimeCompositionArtifacts = {
  runtimeSurface: AnswerCompositionSpec["runtimeSurface"];
  imTemporalContinuityHints: AnswerCompositionSpec["temporalHints"];
  runtimeTemporalContext: AnswerCompositionSpec["temporalContext"];
  answerCompositionSpec: AnswerCompositionSpec;
  humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  systemPromptSections: RuntimePromptSectionsResult["systemPromptSections"];
};

export type BuildRuntimeCompositionArtifactsArgs = {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  latestUserMessageContent: string | null;
  allRecalledMemories: RecalledMemory[];
  replyLanguage: RuntimeReplyLanguage;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  threadContinuityPrompt: string;
  compactedThreadSummary: import("@sparkcore/core-memory").CompactedThreadSummary | null;
  memoryGovernanceContext: ReturnType<typeof buildRuntimeMemoryGovernanceContext>;
  roleCoreCloseNoteArtifacts: ReturnType<
    typeof buildRuntimeRoleCoreCloseNoteArtifacts
  >;
  detectNegativeProductFeedbackSignal: (latestUserMessage: string) => {
    detected: boolean;
    category: HumanizedProductFeedbackCategory | null;
  };
  hashString: (input: string) => number;
};
