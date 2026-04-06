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
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { RuntimeReplyLanguage, ReplyLanguageSource } from "@/lib/chat/role-core";
import type { PreparedRuntimeGenerationPostGenerationHandoff } from "@/lib/chat/runtime-generation-contracts";
import type { RuntimeModelProfileRecord } from "@/lib/chat/runtime-model-profile-resolution";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type {
  RuntimeTurnPlanningArtifacts,
  RuntimeTurnResultArtifacts
} from "@/lib/chat/runtime-contract";
import type { RuntimeObservabilityArtifacts } from "@/lib/chat/runtime-observability-contracts";

export type RuntimePostGenerationResolutionArgs = {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  result: { content: string; model?: string | null };
  latestUserMessageContent: string | null;
  humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  runtimeTemporalContext: { partOfDay: string | null };
  userId: string;
  threadId: string;
  agent: { id: string; name: string };
  replyLanguage: RuntimeReplyLanguage;
  replyLanguageSource: ReplyLanguageSource;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyReasonCode: AnswerStrategyReasonCode;
  answerStrategyPriority: AnswerStrategyPriority;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  continuationReasonCode: ContinuationReasonCode | null;
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  allRecalledMemories: RecalledMemory[];
  generationHandoff: PreparedRuntimeGenerationPostGenerationHandoff;
  recentRawTurnCount: number;
  approxContextPressure: PreparedRuntimeTurn["session"]["approx_context_pressure"];
  modelProfile: RuntimeModelProfileRecord;
};

export type BuildRuntimePostGenerationFinalAssistantContentArgs =
  RuntimePostGenerationResolutionArgs;

export type BuildRuntimePostGenerationArtifactsBundleArgs =
  RuntimePostGenerationResolutionArgs & {
    finalAssistantContent: string;
  };

export type RuntimePostGenerationArtifacts =
  RuntimeTurnPlanningArtifacts &
    RuntimeTurnResultArtifacts & {
      finalAssistantContent: string;
      runtimeObservabilityArtifacts: RuntimeObservabilityArtifacts;
    };

export type RuntimePostGenerationRunnerArtifacts = Pick<
  RuntimePostGenerationArtifacts,
  | "finalAssistantContent"
  | "memoryWriteRequests"
  | "memoryPlannerCandidates"
  | "memoryPlannerSummary"
  | "followUpRequests"
  | "runtimeObservabilityArtifacts"
  | "assistantPayload"
  | "assistantPayloadContentBytes"
  | "assistantPayloadMetadataBytes"
  | "assistantPayloadTotalBytes"
  | "runtimeTurnResult"
>;
