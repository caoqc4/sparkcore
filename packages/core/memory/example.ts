import {
  buildMemoryV2Fields,
  type MemoryRecallQuery,
  type MemoryRecallResult,
  type MemoryRecord,
  type MemoryWriteRequest
} from "./contract";

export const exampleMemoryRecord: MemoryRecord = {
  category: "relationship",
  key: "agent_nickname",
  value: "小芳",
  scope: "user_agent",
  subject_user_id: "user_123",
  target_agent_id: "agent_123",
  status: "active",
  stability: "high",
  source_refs: [
    {
      kind: "message",
      source_message_id: "msg_123"
    }
  ]
};

export const exampleMemoryWriteRequest: MemoryWriteRequest = {
  category: "relationship",
  key: "agent_nickname",
  value: "小芳",
  scope: "user_agent",
  subject_user_id: "user_123",
  target_agent_id: "agent_123",
  stability: "high",
  status: "active",
  source_refs: [
    {
      kind: "message",
      source_message_id: "msg_123"
    }
  ],
  reason: "direct relationship rename confirmed by user"
};

export const exampleMemoryRecallQuery: MemoryRecallQuery = {
  subject_user_id: "user_123",
  agent_id: "agent_123",
  thread_id: "thread_123",
  current_message: "我以后怎么叫你？",
  message_type: "text",
  current_language: "zh-Hans",
  direct_question_hint: "agent_naming"
};

export const exampleMemoryRecallResult: MemoryRecallResult = {
  structured_hits: [
    {
      category: "relationship",
      key: "agent_nickname",
      value: "小芳",
      scope: "user_agent",
      status: "active",
      confidence: 0.98
    }
  ],
  semantic_hits: [],
  excluded_hidden: 0,
  excluded_incorrect: 0,
  applied_scope_summary: ["user_agent"],
  debug_notes: ["nickname hit for direct naming question"]
};

export const exampleMemoryFields = buildMemoryV2Fields({
  category: "relationship",
  key: "agent_nickname",
  value: "小芳",
  scope: "user_agent",
  subjectUserId: "user_123",
  targetAgentId: "agent_123",
  stability: "high",
  status: "active",
  sourceRefs: [
    {
      kind: "message",
      source_message_id: "msg_123"
    }
  ]
});

export function buildRuntimeMemoryConsumptionPreview(args: {
  query: MemoryRecallQuery;
  result: MemoryRecallResult;
}) {
  const relationshipNickname = args.result.structured_hits.find(
    (hit) =>
      hit.category === "relationship" &&
      hit.key === "agent_nickname" &&
      hit.status === "active"
  );

  return {
    subject_user_id: args.query.subject_user_id,
    current_message: args.query.current_message,
    assistant_context: relationshipNickname
      ? `remembered agent nickname: ${String(relationshipNickname.value)}`
      : "no relationship nickname hit",
    recall_scope_summary: args.result.applied_scope_summary ?? [],
    memory_debug_notes: args.result.debug_notes ?? []
  };
}

export const exampleRuntimeConsumption = buildRuntimeMemoryConsumptionPreview({
  query: exampleMemoryRecallQuery,
  result: exampleMemoryRecallResult
});
