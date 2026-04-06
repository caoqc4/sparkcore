import type { RecalledMemory } from "@/lib/chat/memory-shared";
import { type OutputGovernancePacketV1 } from "@/lib/chat/output-governance";
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
import { runPreparedRuntimeTurn as runPreparedRuntimeTurnExternal } from "@/lib/chat/runtime-prepared-turn-runner";
import {
  type MessageRecord,
  type ThreadRecord,
  type WorkspaceRecord
} from "@/lib/chat/runtime-chat-page-state";
import {
  type RuntimeModelProfileRecord,
  type RuntimeModelProfileResolutionTimingMs,
} from "@/lib/chat/runtime-model-profile-resolution";
import { validateRuntimeTurnEntry } from "@/lib/chat/runtime-turn-input-validation";
import { generateAgentReplyRuntime } from "@/lib/chat/runtime-generate-agent-reply";
import {
  type ApproxContextPressure,
} from "@/lib/chat/session-context";
import {
  type AgentRecord,
  type ReplyLanguageSource,
  type RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import {
  prepareRuntimeTurn
} from "@/lib/chat/runtime-prepared-turn";
import {
  type RuntimeTurnInput,
} from "@/lib/chat/runtime-input";
import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type {
  GenerateAgentReplyArgs,
  PreparedRuntimeTurnRunnerArgs,
  RunAgentTurnArgs
} from "@/lib/chat/runtime-entry-contracts";

export async function generateAgentReply({
  userId,
  workspace,
  thread,
  agent,
  messages,
  assistantMessageId,
  runtimeTurnInput,
  supabase: providedSupabase
}: GenerateAgentReplyArgs): Promise<RuntimeTurnResult> {
  return generateAgentReplyRuntime({
    userId,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId,
    runtimeTurnInput,
    supabase: providedSupabase
  });
}

export async function runPreparedRuntimeTurn({
  preparedRuntimeTurn,
  userId,
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
  replyLanguageDecision
}: PreparedRuntimeTurnRunnerArgs): Promise<RuntimeTurnResult> {
  return runPreparedRuntimeTurnExternal({
    preparedRuntimeTurn,
    userId,
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
    replyLanguageDecision
  });
}

export async function runAgentTurn({
  input,
  workspace,
  thread,
  agent,
  messages,
  assistantMessageId,
  supabase
}: RunAgentTurnArgs): Promise<RuntimeTurnResult> {
  return generateAgentReply(
    validateRuntimeTurnEntry({
      input,
      workspace,
      thread,
      agent,
      messages,
      assistantMessageId,
      supabase
    })
  );
}
