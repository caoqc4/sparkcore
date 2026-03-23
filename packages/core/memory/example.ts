import {
  buildMemoryV2Fields,
  type MemoryRecallQuery,
  type MemoryRecallResult,
  type MemoryRecord as LegacyMemoryRecord,
  type MemoryWriteRequest
} from "./contract";
import {
  buildMemoryRecordFromLegacy,
  type DynamicProfileRecord,
  type MemoryRecord,
  type MemoryRelationRecord,
  type StaticProfileRecord
} from "./records";

export const exampleLegacyMemoryRecord: LegacyMemoryRecord = {
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

export const exampleMemoryRecord: MemoryRecord = buildMemoryRecordFromLegacy({
  id: "mem_rel_001",
  workspace_id: "ws_001",
  user_id: "user_123",
  category: "relationship",
  key: "agent_nickname",
  value: "小芳",
  scope: "user_agent",
  subject_user_id: "user_123",
  target_agent_id: "agent_123",
  confidence: 0.98,
  stability: "high",
  source_refs: [
    {
      kind: "message",
      source_message_id: "msg_123"
    }
  ],
  created_at: "2026-03-23T08:00:00Z",
  updated_at: "2026-03-23T08:00:00Z"
});

export const exampleStaticProfileRecord: StaticProfileRecord = {
  profile_id: "prof_static_user_123",
  subject_type: "user",
  subject_id: "user_123",
  scope: {
    user_id: "user_123",
    workspace_id: "ws_001"
  },
  key: "response_style",
  value: "structured_and_executable",
  confidence: 0.93,
  source_refs: [],
  updated_at: "2026-03-23T08:00:00Z"
};

export const exampleDynamicProfileRecord: DynamicProfileRecord = {
  profile_id: "prof_dynamic_user_123",
  subject_type: "user",
  subject_id: "user_123",
  scope: {
    user_id: "user_123",
    workspace_id: "ws_001",
    project_id: "proj_memory_upgrade"
  },
  key: "current_focus",
  value: "memory_upgrade_execution",
  confidence: 0.9,
  effective_at: "2026-03-23T08:00:00Z",
  expires_at: null,
  source_refs: [],
  updated_at: "2026-03-23T08:00:00Z"
};

export const exampleMemoryRelationRecord: MemoryRelationRecord = {
  relation_id: "rel_001",
  relation_type: "extends",
  from_memory_id: "mem_rel_001",
  to_memory_id: "mem_rel_002",
  scope: {
    user_id: "user_123",
    workspace_id: "ws_001"
  },
  created_at: "2026-03-23T08:00:00Z",
  metadata: {
    reason: "second memory refines the first one"
  }
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
