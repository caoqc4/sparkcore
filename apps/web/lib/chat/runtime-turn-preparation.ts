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
import {
  resolveAnswerDecision,
  type DirectRecallQuestionKind
} from "@/lib/chat/answer-decision";
import {
  buildAnswerDecisionSignals,
  getContinuationReasonCode,
  getDirectRecallQuestionKind,
  isBriefSteadyingPrompt,
  isCompanionStyleExplanationCarryoverPrompt,
  isFuzzyFollowUpQuestion,
  isGentleCarryForwardAfterSteadyingPrompt,
  isGuidedNextStepAfterSteadyingPrompt,
  isOneLineSoftCatchPrompt,
  isOpenEndedAdviceQuestion,
  isOpenEndedSummaryQuestion,
  isRelationshipAnswerShapePrompt,
  isRelationshipContinuationEdgePrompt,
  isRoleBackgroundPrompt,
  isRoleBoundaryPrompt,
  isRoleCapabilityPrompt,
  isRoleSelfIntroPrompt,
  isShortRelationshipSummaryFollowUpPrompt,
  isShortRelationshipSupportivePrompt
} from "@/lib/chat/answer-decision-signals";
import {
  buildThreadContinuityPrompt
} from "@/lib/chat/prompt-context-builders";
import {
  resolveActiveMemoryNamespace
} from "@/lib/chat/memory-namespace";
import {
  buildRecalledStaticProfileSnapshot
} from "@/lib/chat/memory-records";
import type { RuntimeRelationshipRecall } from "@/lib/chat/memory-recall";
import {
  resolveModelProfileForAgent,
  type RuntimeModelProfileRecord,
  type RuntimeModelProfileResolutionTimingMs
} from "@/lib/chat/runtime-model-profile-resolution";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import { buildInternalRuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  prepareRuntimeMemory,
  prepareRuntimeRole,
  prepareRuntimeSession,
  prepareRuntimeTurn,
  type PreparedRuntimeTurn
} from "@/lib/chat/runtime-prepared-turn";
import {
  detectReplyLanguageFromText,
  getImTemporalContinuityHints,
  isRuntimeReplyLanguage,
  resolveReplyLanguageForTurn
} from "@/lib/chat/runtime-composition-context";
import { elapsedMs, nowMs } from "@/lib/chat/runtime-core-helpers";
import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type {
  AgentRecord,
  ReplyLanguageSource,
  RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import type {
  MessageRecord,
  ThreadRecord,
  WorkspaceRecord
} from "@/lib/chat/runtime-chat-page-state";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { RuntimeRelationshipMemorySummary } from "@/lib/chat/runtime-contract";

export type RuntimeTurnPreparation = {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  latestUserMessageContent: string | null;
  allRecalledMemories: RecalledMemory[];
  relationshipMemories: RuntimeRelationshipMemorySummary[];
  modelProfile: RuntimeModelProfileRecord;
  modelProfileTimingMs: RuntimeModelProfileResolutionTimingMs;
  replyLanguage: RuntimeReplyLanguage;
  threadContinuityPrompt: string;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyReasonCode: AnswerStrategyReasonCode;
  answerStrategyPriority: AnswerStrategyPriority;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  continuationReasonCode: ContinuationReasonCode | null;
  recentRawTurnCount: number;
  approxContextPressure: ApproxContextPressure;
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  replyLanguageDecision: {
    replyLanguage: RuntimeReplyLanguage;
    source: ReplyLanguageSource;
  };
  prepareRuntimeMemoryDurationMs: number;
  runtimeMemoryTimingMs: PreparedRuntimeTurn["memory"]["runtime_memory_context"]["timing_ms"];
  modelProfileDurationMs: number;
  prepareRuntimeTurnDurationMs: number;
};

export async function buildRuntimeTurnPreparation(args: {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  runtimeTurnInput?: RuntimeTurnInput;
  supabase?: any;
}): Promise<RuntimeTurnPreparation> {
  const sessionContext = await prepareRuntimeSession({
    thread: args.thread,
    agent: args.agent,
    messages: args.messages,
    detectReplyLanguageFromText,
    isReplyLanguage: isRuntimeReplyLanguage
  });
  const latestUserMessageContent = sessionContext.current_user_message;
  const threadContinuity = sessionContext.continuity_signals;
  const sameThreadContinuationFuzzyFollowUp =
    latestUserMessageContent !== null &&
    isFuzzyFollowUpQuestion(latestUserMessageContent);
  const sameThreadContinuationShortRelationshipSupportive =
    latestUserMessageContent !== null &&
    isShortRelationshipSupportivePrompt(latestUserMessageContent);
  const sameThreadContinuationShortRelationshipSummary =
    latestUserMessageContent !== null &&
    isShortRelationshipSummaryFollowUpPrompt(latestUserMessageContent);
  const sameThreadContinuationCompanionCarryover =
    latestUserMessageContent !== null &&
    isCompanionStyleExplanationCarryoverPrompt(latestUserMessageContent);
  const sameThreadContinuationOneLineSoftCatch =
    latestUserMessageContent !== null &&
    isOneLineSoftCatchPrompt(latestUserMessageContent);
  const sameThreadContinuationBriefSteadying =
    latestUserMessageContent !== null &&
    isBriefSteadyingPrompt(latestUserMessageContent);
  const sameThreadContinuationGentleCarryForward =
    latestUserMessageContent !== null &&
    isGentleCarryForwardAfterSteadyingPrompt(latestUserMessageContent);
  const sameThreadContinuationGuidedNextStep =
    latestUserMessageContent !== null &&
    isGuidedNextStepAfterSteadyingPrompt(latestUserMessageContent);
  const sameThreadContinuationApplicable =
    latestUserMessageContent !== null &&
    threadContinuity.hasPriorAssistantTurn &&
    isRelationshipContinuationEdgePrompt({
      fuzzyFollowUpQuestion: sameThreadContinuationFuzzyFollowUp,
      shortRelationshipSupportivePrompt:
        sameThreadContinuationShortRelationshipSupportive,
      shortRelationshipSummaryFollowUpPrompt:
        sameThreadContinuationShortRelationshipSummary,
      companionStyleExplanationCarryoverPrompt:
        sameThreadContinuationCompanionCarryover,
      oneLineSoftCatchPrompt: sameThreadContinuationOneLineSoftCatch,
      briefSteadyingPrompt: sameThreadContinuationBriefSteadying,
      gentleCarryForwardAfterSteadyingPrompt:
        sameThreadContinuationGentleCarryForward,
      guidedNextStepAfterSteadyingPrompt:
        sameThreadContinuationGuidedNextStep
    });
  const preferSameThreadContinuation = sameThreadContinuationApplicable;
  const recentRawTurnCount = sessionContext.recent_raw_turn_count;
  const approxContextPressure = sessionContext.approx_context_pressure;
  const longChainPressureCandidate =
    sameThreadContinuationApplicable &&
    recentRawTurnCount >= 10 &&
    (approxContextPressure === "elevated" || approxContextPressure === "high");
  const replyLanguageDecision = resolveReplyLanguageForTurn({
    latestUserMessage: latestUserMessageContent,
    threadContinuity
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const relationshipStylePrompt =
    latestUserMessageContent !== null &&
    isRelationshipAnswerShapePrompt(latestUserMessageContent);
  const input =
    args.runtimeTurnInput ??
    buildInternalRuntimeTurnInput({
      userId: args.userId,
      agentId: args.agent.id,
      threadId: args.thread.id,
      workspaceId: args.workspace.id,
      content: latestUserMessageContent ?? "",
      messageId: sessionContext.current_message_id
    });
  const sameThreadContinuity = threadContinuity.hasPriorAssistantTurn;
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId: args.userId,
    agentId: args.agent.id,
    threadId: args.thread.id,
    relevantKnowledge: []
  });
  const prepareRuntimeMemoryStartedAt = nowMs();
  const runtimeMemoryContext = await prepareRuntimeMemory({
    workspaceId: args.workspace.id,
    userId: args.userId,
    agentId: args.agent.id,
    threadId: args.thread.id,
    latestUserMessage: latestUserMessageContent,
    preferSameThreadContinuation,
    sameThreadContinuity,
    relationshipStylePrompt,
    threadState: sessionContext.thread_state,
    activeNamespace: activeMemoryNamespace,
    supabase: args.supabase
  });
  const prepareRuntimeMemoryDurationMs = elapsedMs(prepareRuntimeMemoryStartedAt);
  const memoryRecall = runtimeMemoryContext.memoryRecall;
  let relationshipRecall: RuntimeRelationshipRecall = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  };
  let answerQuestionType: AnswerQuestionType = "other";
  let answerStrategy: AnswerStrategy = "default-grounded";
  let answerStrategyPriority: AnswerStrategyPriority = "semi-constrained";
  let answerStrategyReasonCode: AnswerStrategyReasonCode =
    "default-grounded-fallback";
  let continuationReasonCode: ContinuationReasonCode | null = null;
  let answerCarryoverPolicy: AnswerCarryoverPolicy = "allowed";
  let answerForbiddenMoves: AnswerForbiddenMove[] = [];
  let answerSceneGoal: AnswerSceneGoal = "answer_grounded_default";

  if (latestUserMessageContent) {
    relationshipRecall = runtimeMemoryContext.relationshipRecall;
    const relationshipStylePromptResolved =
      relationshipRecall.relationshipStylePrompt;
    const roleSelfIntroPrompt = isRoleSelfIntroPrompt({
      relationshipStylePrompt: relationshipStylePromptResolved
    });
    const roleCapabilityPrompt =
      isRoleCapabilityPrompt(latestUserMessageContent);
    const roleBackgroundPrompt =
      isRoleBackgroundPrompt(latestUserMessageContent);
    const roleBoundaryPrompt =
      isRoleBoundaryPrompt(latestUserMessageContent);
    const fuzzyFollowUpQuestion =
      isFuzzyFollowUpQuestion(latestUserMessageContent);
    const shortRelationshipSupportivePrompt =
      isShortRelationshipSupportivePrompt(latestUserMessageContent);
    const shortRelationshipSummaryFollowUpPrompt =
      isShortRelationshipSummaryFollowUpPrompt(latestUserMessageContent);
    const companionStyleExplanationCarryoverPrompt =
      isCompanionStyleExplanationCarryoverPrompt(latestUserMessageContent);
    const oneLineSoftCatchPrompt =
      isOneLineSoftCatchPrompt(latestUserMessageContent);
    const briefSteadyingPrompt =
      isBriefSteadyingPrompt(latestUserMessageContent);
    const gentleCarryForwardAfterSteadyingPrompt =
      isGentleCarryForwardAfterSteadyingPrompt(latestUserMessageContent);
    const guidedNextStepAfterSteadyingPrompt =
      isGuidedNextStepAfterSteadyingPrompt(latestUserMessageContent);

    const normalizedContent =
      latestUserMessageContent.normalize("NFKC").trim().toLowerCase();
    const directRecallQuestionKind: DirectRecallQuestionKind =
      getDirectRecallQuestionKind(normalizedContent);

    const answerDecision = resolveAnswerDecision(
      buildAnswerDecisionSignals({
        directRecallQuestionKind,
        directNamingQuestion: relationshipRecall.directNamingQuestion,
        directPreferredNameQuestion:
          relationshipRecall.directPreferredNameQuestion,
        roleSelfIntroPrompt,
        roleCapabilityPrompt,
        roleBackgroundPrompt,
        roleBoundaryPrompt,
        relationshipContinuationEdgePrompt:
          isRelationshipContinuationEdgePrompt({
            fuzzyFollowUpQuestion,
            shortRelationshipSupportivePrompt,
            shortRelationshipSummaryFollowUpPrompt,
            companionStyleExplanationCarryoverPrompt,
            oneLineSoftCatchPrompt,
            briefSteadyingPrompt,
            gentleCarryForwardAfterSteadyingPrompt,
            guidedNextStepAfterSteadyingPrompt
          }),
        relationshipStylePrompt: relationshipStylePromptResolved,
        openEndedAdviceQuestion:
          isOpenEndedAdviceQuestion(latestUserMessageContent),
        openEndedSummaryQuestion: isOpenEndedSummaryQuestion({
          content: latestUserMessageContent,
          relationshipStylePrompt: relationshipStylePromptResolved
        }),
        sameThreadContinuity: relationshipRecall.sameThreadContinuity,
        relationshipCarryoverAvailable: Boolean(
          relationshipRecall.addressStyleMemory ||
            relationshipRecall.nicknameMemory ||
            relationshipRecall.preferredNameMemory
        ),
        continuationReasonCode: getContinuationReasonCode({
          content: latestUserMessageContent,
          shortRelationshipSupportivePrompt,
          companionStyleExplanationCarryoverPrompt,
          briefSteadyingPrompt,
          gentleCarryForwardAfterSteadyingPrompt,
          guidedNextStepAfterSteadyingPrompt,
          shortRelationshipSummaryFollowUpPrompt,
          fuzzyFollowUpQuestion
        })
      })
    );
    answerQuestionType = answerDecision.questionType;
    answerStrategyReasonCode = answerDecision.reasonCode;
    continuationReasonCode = answerDecision.continuationReasonCode;
    answerStrategy = answerDecision.strategy;
    answerStrategyPriority = answerDecision.priority;
    answerCarryoverPolicy = answerDecision.carryoverPolicy;
    answerForbiddenMoves = answerDecision.forbiddenMoves;
    answerSceneGoal = answerDecision.sceneGoal;
  }

  const recalledMemories = memoryRecall.memories.filter(
    (memory): memory is RecalledMemory => memory.memory_type !== "goal"
  );
  const relationshipMemories = [
    relationshipRecall.addressStyleMemory,
    relationshipRecall.nicknameMemory,
    relationshipRecall.preferredNameMemory
  ].filter(Boolean) as RuntimeRelationshipMemorySummary[];
  const allRecalledMemories =
    relationshipMemories.length > 0
      ? [...recalledMemories, ...relationshipMemories]
      : recalledMemories;
  const modelProfileStartedAt = nowMs();
  const modelProfileResolution = await resolveModelProfileForAgent({
    agent: args.agent,
    workspaceId: args.workspace.id,
    userId: args.userId,
    supabase: args.supabase
  });
  const modelProfileDurationMs = elapsedMs(modelProfileStartedAt);
  const modelProfile = modelProfileResolution.profile;
  const modelProfileTimingMs = modelProfileResolution.timingMs;
  const threadContinuityPrompt = buildThreadContinuityPrompt({
    threadContinuity,
    replyLanguage,
    relationshipRecall,
    temporalHints: getImTemporalContinuityHints(sessionContext.recent_raw_turns)
  });
  const roleCorePacketForTurn = prepareRuntimeRole({
    agent: args.agent,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source,
    preferSameThreadContinuation,
    relationshipRecall
  });
  const prepareRuntimeTurnStartedAt = nowMs();
  const preparedRuntimeTurn = await prepareRuntimeTurn({
    input,
    agent: args.agent,
    roleCorePacket: roleCorePacketForTurn,
    session: sessionContext,
    runtimeMemoryContext,
    workspace: args.workspace,
    thread: args.thread,
    messages: args.messages,
    assistantMessageId: args.assistantMessageId,
    supabase: args.supabase
  });
  const prepareRuntimeTurnDurationMs = elapsedMs(prepareRuntimeTurnStartedAt);

  return {
    preparedRuntimeTurn,
    latestUserMessageContent,
    allRecalledMemories,
    relationshipMemories,
    modelProfile,
    modelProfileTimingMs,
    replyLanguage,
    threadContinuityPrompt,
    answerQuestionType,
    answerStrategy,
    answerStrategyReasonCode,
    answerStrategyPriority,
    answerCarryoverPolicy,
    answerForbiddenMoves,
    answerSceneGoal,
    continuationReasonCode,
    recentRawTurnCount,
    approxContextPressure,
    sameThreadContinuationApplicable,
    longChainPressureCandidate,
    preferSameThreadContinuation,
    replyLanguageDecision,
    prepareRuntimeMemoryDurationMs,
    runtimeMemoryTimingMs: runtimeMemoryContext.timing_ms,
    modelProfileDurationMs,
    prepareRuntimeTurnDurationMs
  };
}
