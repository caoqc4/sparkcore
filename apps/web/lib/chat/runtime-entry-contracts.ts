import type { RecalledMemory } from "@/lib/chat/memory-shared";
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
import type {
  MessageRecord,
  ThreadRecord,
  WorkspaceRecord
} from "@/lib/chat/runtime-chat-page-state";
import type {
  RuntimeModelProfileRecord,
  RuntimeModelProfileResolutionTimingMs,
} from "@/lib/chat/runtime-model-profile-resolution";
import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type {
  AgentRecord,
  ReplyLanguageSource,
  RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";

export type RunAgentTurnArgs = {
  input: RuntimeTurnInput;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  supabase?: any;
};

export type GenerateAgentReplyArgs = {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  runtimeTurnInput?: RuntimeTurnInput;
  supabase?: any;
};

export type ValidatedRuntimeTurnEntry = {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  runtimeTurnInput: RuntimeTurnInput;
  supabase?: any;
};

export type PreparedRuntimeTurnRunnerArgs = {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  userId: string;
  latestUserMessageContent: string | null;
  allRecalledMemories: RecalledMemory[];
  relationshipMemories: Array<{
    memory_id: string;
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
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
};
