import type {
  MemoryWriteOutcome,
  MemoryType,
  RecallOutcome,
  RecalledMemory,
  RecalledMemoryType
} from "@/lib/chat/memory-shared";
import type { RuntimeAssistantPayload } from "@/lib/chat/assistant-message-payload";
import type {
  PlannerCandidatePreview,
  PlannerCandidateSummary
} from "@/lib/chat/memory-planner-candidates";
import type {
  ThreadStateContinuityProjectionReason,
  ThreadStateFocusProjectionReason
} from "@/lib/chat/thread-state-writeback";
import type { BuildAssistantMessageMetadataInput } from "@/lib/chat/assistant-message-metadata";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
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
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";

export type RuntimeMetadataObject = Record<string, unknown>;

export type RuntimeAssistantMessage = {
  role: "assistant";
  content: string;
  language: string;
  message_type: "text";
  metadata?: RuntimeAssistantPayload["metadata"];
};

export type RuntimeRelationshipMemorySummary = {
  memory_id: string;
  memory_type: "relationship";
  content: string;
  confidence: number;
};

export type RuntimeGenericMemoryWriteRequest = {
  kind: "generic_memory";
  memory_type: MemoryType;
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id: string;
  dedupe_key?: string;
  write_mode?: "upsert" | "append";
};

export type RuntimeRelationshipMemoryWriteRequest = {
  kind: "relationship_memory";
  memory_type: "relationship";
  relationship_key:
    | "agent_nickname"
    | "user_preferred_name"
    | "user_address_style";
  relationship_scope: "user_agent";
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id: string;
  target_agent_id: string;
  target_thread_id?: string | null;
  dedupe_key?: string;
  write_mode?: "upsert";
};

export type RuntimeMemoryWriteRequest =
  | RuntimeGenericMemoryWriteRequest
  | RuntimeRelationshipMemoryWriteRequest;

export type RuntimeFollowUpRequest = {
  kind: "gentle_check_in";
  trigger_at: string;
  reason: string;
  payload: RuntimeMetadataObject;
};

export type RuntimeMemoryUsageUpdate = {
  memory_item_id: string;
  usage_kind: "relationship_recall";
};

export type RuntimeFollowUpExecutionStatus =
  | "accepted"
  | "skipped"
  | "unsupported"
  | "invalid";

export type RuntimeFollowUpExecutionResult = {
  request_index: number;
  kind: string;
  status: RuntimeFollowUpExecutionStatus;
  reason: string;
  trigger_at?: string;
  payload?: RuntimeMetadataObject;
};

export type PendingFollowUpStatus =
  | "pending"
  | "claimed"
  | "executed"
  | "failed"
  | "skipped";

export type PendingFollowUpRecord = {
  id: string;
  kind: string;
  status: PendingFollowUpStatus;
  trigger_at: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  request_payload: RuntimeMetadataObject;
  request_reason: string;
  source_message_id?: string | null;
  source_request_index: number;
  created_at: string;
  updated_at: string;
};

export type PendingFollowUpPreviewRecord = {
  id: PendingFollowUpRecord["id"];
  kind: PendingFollowUpRecord["kind"];
  status: PendingFollowUpRecord["status"];
  trigger_at: PendingFollowUpRecord["trigger_at"];
};

export type EnqueuePendingFollowUpsInput = {
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  accepted_requests: RuntimeFollowUpExecutionResult[];
  source_message_id?: string | null;
};

export type EnqueuePendingFollowUpsResult = {
  inserted_count: number;
  records: PendingFollowUpRecord[];
  skipped_count: number;
};

export type ClaimDuePendingFollowUpsInput = {
  now: string;
  limit: number;
  claimed_by: string;
  claim_token?: string;
};

export type ClaimDuePendingFollowUpsResult = {
  claimed_count: number;
  records: PendingFollowUpRecord[];
};

export type MarkFollowUpExecutedInput = {
  id: string;
  executed_at: string;
  execution_metadata?: RuntimeMetadataObject;
};

export type MarkFollowUpExecutedResult = {
  updated: boolean;
  record: PendingFollowUpRecord | null;
};

export type MarkFollowUpFailedInput = {
  id: string;
  failed_at: string;
  failure_reason: string;
  failure_metadata?: RuntimeMetadataObject;
};

export type MarkFollowUpFailedResult = {
  updated: boolean;
  record: PendingFollowUpRecord | null;
};

export type FollowUpRepository = {
  enqueuePendingFollowUps: (
    input: EnqueuePendingFollowUpsInput
  ) => Promise<EnqueuePendingFollowUpsResult>;
  claimDuePendingFollowUps: (
    input: ClaimDuePendingFollowUpsInput
  ) => Promise<ClaimDuePendingFollowUpsResult>;
  markFollowUpExecuted: (
    input: MarkFollowUpExecutedInput
  ) => Promise<MarkFollowUpExecutedResult>;
  markFollowUpFailed: (
    input: MarkFollowUpFailedInput
  ) => Promise<MarkFollowUpFailedResult>;
};

export type RuntimeMemoryRecalledEvent = {
  type: "memory_recalled";
  payload: {
    count: number;
    memory_types: RecalledMemoryType[];
    hidden_exclusion_count: number;
    incorrect_exclusion_count: number;
    memory_record_recall_preferred: boolean;
    profile_fallback_suppressed: boolean;
  };
};

export type RuntimeKnowledgeSelectedEvent = {
  type: "knowledge_selected";
  payload: {
    count: number;
    knowledge_route: string | null;
    available: boolean;
    available_count: number;
    should_inject: boolean;
    injection_gap_reason: string | null;
    suppressed: boolean;
    suppression_reason: string | null;
    query_token_count: number;
    zero_match_filtered_count: number;
    weak_match_filtered_count: number;
  };
};

export type RuntimeMemoryWritePlannedEvent = {
  type: "memory_write_planned";
  payload: {
    count: number;
    planner_candidate_count: number;
    rejected_candidate_count: number;
    downgraded_candidate_count: number;
    memory_types: RuntimeMemoryWriteRequest["memory_type"][];
    record_targets: Array<
      "static_profile" | "memory_record" | "thread_state_candidate"
    >;
    write_boundaries: Array<"default" | "thread" | "project" | "world">;
    decision_kind_counts: Record<string, number>;
    target_layer_counts: Record<string, number>;
    boundary_reason_counts: Record<string, number>;
    decision_reason_counts: Record<string, number>;
    downgrade_reason_counts: Record<string, number>;
    rejection_reason_counts: Record<string, number>;
  };
};

export type RuntimeFollowUpPlannedEvent = {
  type: "follow_up_planned";
  payload: {
    count: number;
    kinds: RuntimeFollowUpRequest["kind"][];
  };
};

export type RuntimeAnswerStrategySelectedEvent = {
  type: "answer_strategy_selected";
  payload: {
    question_type: string;
    strategy: string;
    reason_code: string | null;
    priority: string;
    carryover_policy: string;
    forbidden_moves: string[];
    scene_goal: string;
    continuation_reason_code: string | null;
    reply_language: string;
  };
};

export type RuntimeAssistantReplyCompletedEvent = {
  type: "assistant_reply_completed";
  payload: {
    thread_id: string;
    agent_id: string;
    recalled_count: number;
    message_type: RuntimeAssistantMessage["message_type"];
    language: string;
  };
};

export type RuntimeThreadStateWritebackCompletedEvent = {
  type: "thread_state_writeback_completed";
  payload: {
    status: "written" | "skipped" | "failed";
    repository: "supabase" | "in_memory" | "unknown";
    reason?: string | null;
    anchor_mode?: "current_assistant_message" | "previous_assistant_message" | null;
    focus_projection_reason?: ThreadStateFocusProjectionReason | null;
    continuity_projection_reason?: ThreadStateContinuityProjectionReason | null;
  };
};

export type RuntimeKnowledgeSelectedEventGatingSummary = {
  knowledge_route: RuntimeKnowledgeSelectedEvent["payload"]["knowledge_route"];
  available: RuntimeKnowledgeSelectedEvent["payload"]["available"];
  available_count: RuntimeKnowledgeSelectedEvent["payload"]["available_count"];
  should_inject: RuntimeKnowledgeSelectedEvent["payload"]["should_inject"];
  injection_gap_reason:
    RuntimeKnowledgeSelectedEvent["payload"]["injection_gap_reason"];
  suppressed: RuntimeKnowledgeSelectedEvent["payload"]["suppressed"];
  suppression_reason:
    RuntimeKnowledgeSelectedEvent["payload"]["suppression_reason"];
  query_token_count:
    RuntimeKnowledgeSelectedEvent["payload"]["query_token_count"];
  zero_match_filtered_count:
    RuntimeKnowledgeSelectedEvent["payload"]["zero_match_filtered_count"];
  weak_match_filtered_count:
    RuntimeKnowledgeSelectedEvent["payload"]["weak_match_filtered_count"];
};

export type BuildKnowledgeSelectedEventArgs = {
  applicableKnowledgeCount: number;
  knowledgeGating: RuntimeKnowledgeSelectedEventGatingSummary;
};

export type BuildMemoryRecalledEventArgs = {
  recalledCount: number;
  memoryTypes: RecalledMemoryType[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  memoryRecordRecallPreferred: boolean;
  profileFallbackSuppressed: boolean;
};

export type BuildMemoryWritePlannedEventArgs = {
  memoryWriteRequests: RuntimeMemoryWriteRequest[];
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null;
  memoryPlannerSummary: PlannerCandidateSummary;
};

export type BuildFollowUpPlannedEventArgs = {
  followUpRequests: RuntimeFollowUpRequest[];
};

export type BuildAnswerStrategySelectedEventArgs = {
  questionType: AnswerQuestionType;
  strategy: AnswerStrategy;
  reasonCode: AnswerStrategyReasonCode;
  priority: AnswerStrategyPriority;
  carryoverPolicy: AnswerCarryoverPolicy;
  forbiddenMoves: AnswerForbiddenMove[];
  sceneGoal: AnswerSceneGoal;
  continuationReasonCode: ContinuationReasonCode | null;
  replyLanguage: RuntimeReplyLanguage;
};

export type BuildAssistantReplyCompletedEventArgs = {
  threadId: string;
  agentId: string;
  recalledCount: number;
  replyLanguage: RuntimeReplyLanguage;
};

export type BuildThreadStateWritebackCompletedEventArgs = {
  status: RuntimeThreadStateWritebackCompletedEvent["payload"]["status"];
  repository: RuntimeThreadStateWritebackCompletedEvent["payload"]["repository"];
  anchorMode?: RuntimeThreadStateWritebackCompletedEvent["payload"]["anchor_mode"];
  focusProjectionReason?: ThreadStateFocusProjectionReason | null;
  continuityProjectionReason?: ThreadStateContinuityProjectionReason | null;
  reason?: string | null;
};

export type RuntimeEvent =
  | RuntimeMemoryRecalledEvent
  | RuntimeKnowledgeSelectedEvent
  | RuntimeMemoryWritePlannedEvent
  | RuntimeFollowUpPlannedEvent
  | RuntimeAnswerStrategySelectedEvent
  | RuntimeAssistantReplyCompletedEvent
  | RuntimeThreadStateWritebackCompletedEvent;

export type RuntimeTurnResult = {
  assistant_message: RuntimeAssistantMessage | null;
  memory_write_requests: RuntimeMemoryWriteRequest[];
  memory_planner_candidates?: PlannerCandidatePreview[];
  follow_up_requests: RuntimeFollowUpRequest[];
  memory_usage_updates: RuntimeMemoryUsageUpdate[];
  runtime_events: RuntimeEvent[];
  immediate_artifacts?: RuntimeMetadataObject[];
  debug_metadata?: RuntimeMetadataObject;
};

export type RuntimeRelationshipRecallUsageRecord = {
  memory_id: string;
  memory_type: "relationship";
  content: string;
  confidence: number;
};

export type BuildRuntimeTurnResultArtifactsArgs = {
  finalAssistantContent: string;
  assistantMetadata: BuildAssistantMessageMetadataInput;
  replyLanguage: RuntimeReplyLanguage;
  memoryWriteRequests: RuntimeMemoryWriteRequest[];
  memoryPlannerCandidates: PlannerCandidatePreview[] | undefined;
  followUpRequests: RuntimeFollowUpRequest[];
  relationshipMemories: RuntimeRelationshipRecallUsageRecord[];
  allRecalledMemories: RecalledMemory[];
  memoryRecall: RecallOutcome;
  applicableKnowledge: RuntimeKnowledgeSnippet[];
  knowledgeGatingWithOutcome: RuntimeKnowledgeGatingSummary;
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace;
  memoryPlannerSummary: PlannerCandidateSummary;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyReasonCode: AnswerStrategyReasonCode;
  answerStrategyPriority: AnswerStrategyPriority;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  continuationReasonCode: ContinuationReasonCode | null;
  threadId: string;
  agentId: string;
  debugMetadata: RuntimeMetadataObject | undefined;
};

export type RuntimeTurnResultArtifacts = {
  assistantPayload: RuntimeAssistantPayload;
  assistantPayloadContentBytes: number;
  assistantPayloadMetadataBytes: number;
  assistantPayloadTotalBytes: number;
  runtimeTurnResult: RuntimeTurnResult;
};

export type RuntimeTurnPlanningArgs = {
  latestUserMessageContent: string | null;
  currentSourceMessageId: string | null;
  recentRawTurns: Array<{ role: "user" | "assistant"; content: string }>;
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null;
  threadId: string;
  agentId: string;
  userId: string;
  continuationReasonCode: ContinuationReasonCode | null;
  replyLanguage: RuntimeReplyLanguage;
};

export type RuntimeTurnPlanningArtifacts = {
  memoryWriteRequests: RuntimeMemoryWriteRequest[];
  memoryPlannerCandidates: PlannerCandidatePreview[];
  runtimePlannedCandidates: PlannerCandidatePreview[];
  memoryPlannerSummary: PlannerCandidateSummary;
  followUpRequests: RuntimeFollowUpRequest[];
};

// Execution-layer subset consumed by internal post-processing. This is a
// downstream contract only; planning stays in the centralized runtime layer.
export type RuntimeExecutionPayload = {
  memory_write_requests: RuntimeTurnResult["memory_write_requests"];
  memory_planner_candidates: RuntimeTurnResult["memory_planner_candidates"];
  follow_up_requests: RuntimeTurnResult["follow_up_requests"];
  memory_usage_updates: RuntimeTurnResult["memory_usage_updates"];
};

export type RuntimeDeferredPostProcessingPayload = {
  memory_write_requests: RuntimeExecutionPayload["memory_write_requests"];
  follow_up_requests: RuntimeExecutionPayload["follow_up_requests"];
  memory_planner_candidates?: RuntimeExecutionPayload["memory_planner_candidates"];
  memory_usage_updates?: RuntimeExecutionPayload["memory_usage_updates"];
};

export type BuildRuntimeFollowUpExecutionMetadataArgs = {
  followUpExecutionResults: RuntimeFollowUpExecutionResult[];
  followUpEnqueueInsertedCount: number;
  followUpEnqueueRecords: PendingFollowUpPreviewRecord[];
};

export type BuildRuntimeMemoryUsageMetadataArgs = {
  updates: RuntimeMemoryUsageUpdate[];
  assistantMetadata?: RuntimePreviewAssistantMetadata | null;
};

export type BuildRuntimeMemoryWriteOutcomeMetadataArgs = {
  outcome: MemoryWriteOutcome;
  existingRuntimeMemoryWrites?: RuntimeMetadataObject | null;
};

export type RuntimePreviewRelationshipRecallMetadata = {
  update_count: number;
  memory_ids: string[];
  used: boolean;
  direct_naming_question: boolean;
  direct_preferred_name_question: boolean;
  relationship_style_prompt: boolean;
  same_thread_continuity: boolean;
  recalled_keys: string[];
  adopted_agent_nickname_target: string | null;
  adopted_user_preferred_name_target: string | null;
};

export type RuntimePreviewAssistantMetadata = {
  memory?: {
    relationship_recall?: Omit<
      RuntimePreviewRelationshipRecallMetadata,
      "update_count" | "memory_ids"
    > & {
      recalled_memory_ids?: string[];
    } | null;
  } | null;
};
