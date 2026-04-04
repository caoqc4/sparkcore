import {
  buildPlannerCandidatePreviewFromGenericExtraction,
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  buildPlannerCandidatePreviewsFromWriteRequests
} from "@/lib/chat/memory-planner-candidates";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

async function main() {
  const threadPrimaryNamespace: ActiveRuntimeMemoryNamespace = {
    namespace_id: "user:user-1|thread:thread-1",
    primary_layer: "thread",
    active_layers: ["user", "thread"],
    refs: [
      {
        layer: "user",
        entity_id: "user-1"
      },
      {
        layer: "thread",
        entity_id: "thread-1"
      }
    ],
    selection_reason: "session_and_knowledge_scope"
  };
  const projectPrimaryNamespace: ActiveRuntimeMemoryNamespace = {
    namespace_id: "user:user-1|project:project-1|world:world-1",
    primary_layer: "project",
    active_layers: ["user", "project", "world"],
    refs: [
      {
        layer: "user",
        entity_id: "user-1"
      },
      {
        layer: "project",
        entity_id: "project-1"
      },
      {
        layer: "world",
        entity_id: "world-1"
      }
    ],
    selection_reason: "session_and_knowledge_scope"
  };
  const requests: RuntimeMemoryWriteRequest[] = [
    {
      kind: "generic_memory",
      memory_type: "profile",
      candidate_content: "我是自由职业设计师",
      reason: "The user explicitly stated a durable identity fact.",
      confidence: 0.95,
      source_turn_id: "msg-profile",
      dedupe_key: "profile:freelance-designer",
      write_mode: "upsert"
    },
    {
      kind: "generic_memory",
      memory_type: "goal",
      candidate_content: "帮我规划一版用户访谈方案",
      reason: "The user explicitly stated an active planning goal.",
      confidence: 0.91,
      source_turn_id: "msg-goal",
      dedupe_key: "goal:user-interview-plan",
      write_mode: "upsert"
    },
    {
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "user_preferred_name",
      relationship_scope: "user_agent",
      candidate_content: "阿强",
      reason: "The user explicitly stated how the agent should address them.",
      confidence: 0.94,
      source_turn_id: "msg-name",
      target_agent_id: "agent-1",
      target_thread_id: null,
      dedupe_key: "relationship.user_preferred_name:aqiang",
      write_mode: "upsert"
    }
  ];

  const candidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests
  });
  const threadBoundCandidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests: [
      requests[0]!,
      {
        kind: "generic_memory",
        memory_type: "episode",
        candidate_content: "上周和设计团队一起做了复盘",
        reason: "The user stated a concrete experience that may matter later.",
        confidence: 0.9,
        source_turn_id: "msg-episode-thread",
        dedupe_key: "episode:team-retro",
        write_mode: "append"
      }
    ],
    activeNamespace: threadPrimaryNamespace
  });
  const projectBoundGoalCandidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests: [requests[1]!],
    activeNamespace: projectPrimaryNamespace
  });
  const productFeedbackCandidate =
    buildPlannerCandidatePreviewFromProductFeedbackSignal({
      signal: {
        detected: true,
        category: "memory_capability_mocking",
        confidence: "high",
        reason: "User complained about memory quality."
      },
      latestUserMessage: "你怎么又忘了，记忆也太差了",
      sourceMessageId: "msg-feedback",
      assistantMessageId: "assistant-1"
    });
  const transientMoodCandidate = buildPlannerCandidatePreviewFromGenericExtraction({
    candidate: {
      memory_type: "mood",
      content: "今天有点难过",
      should_store: true,
      confidence: 0.92,
      reason: "用户表达了当前情绪"
    },
    latestUserMessage: "我今天有点难过。",
    recentContext: [],
    sourceTurnId: "msg-mood"
  });
  const lowConfidenceCandidate = buildPlannerCandidatePreviewFromGenericExtraction({
    candidate: {
      memory_type: "episode",
      content: "上周和团队开了一次复盘会",
      should_store: true,
      confidence: 0.42,
      reason: "提到了一个可能相关的经历"
    },
    latestUserMessage: "上周和团队开了一次复盘会。",
    recentContext: [],
    sourceTurnId: "msg-episode"
  });
  const extractorRejectedCandidate =
    buildPlannerCandidatePreviewFromGenericExtraction({
      candidate: {
        memory_type: "preference",
        content: "喜欢今天这个例子",
        should_store: false,
        confidence: 0.9,
        reason: "可能只是当下反馈，不建议长期存储"
      },
      latestUserMessage: "我还挺喜欢你今天举的这个例子。",
      recentContext: [],
      sourceTurnId: "msg-pref"
    });

  const results = [
    {
      id: "profile_request_normalizes_to_static_profile",
      actual: {
        decision_reason: candidates[0]?.decision_reason ?? null,
        downgrade_reason: candidates[0]?.downgrade_reason ?? null,
        target_layer: candidates[0]?.target_layer ?? null,
        durability: candidates[0]?.durability ?? null,
        semantic_source: candidates[0]?.semantic_source ?? null
      },
      expected: {
        decision_reason: "static_profile_preferred",
        downgrade_reason: "profile_routed_to_static_profile",
        target_layer: "static_profile",
        durability: "durable",
        semantic_source: null
      }
    },
    {
      id: "goal_request_normalizes_to_thread_state_candidate",
      actual: {
        decision_reason: candidates[1]?.decision_reason ?? null,
        downgrade_reason: candidates[1]?.downgrade_reason ?? null,
        target_layer: candidates[1]?.target_layer ?? null,
        durability: candidates[1]?.durability ?? null,
        semantic_source: candidates[1]?.semantic_source ?? null
      },
      expected: {
        decision_reason: "goal_focus_projection",
        downgrade_reason: "goal_routed_to_thread_state_candidate",
        target_layer: "thread_state_candidate",
        durability: "session_or_thread_scoped",
        semantic_source: "goal_memory_candidate"
      }
    },
    {
      id: "relationship_request_normalizes_to_memory_record",
      actual: {
        source_kind: candidates[2]?.source_kind ?? null,
        decision_reason: candidates[2]?.decision_reason ?? null,
        downgrade_reason: candidates[2]?.downgrade_reason ?? null,
        target_layer: candidates[2]?.target_layer ?? null,
        relationship_key: candidates[2]?.relationship_key ?? null,
        durability: candidates[2]?.durability ?? null
      },
      expected: {
        source_kind: "relationship_memory_request",
        decision_reason: "explicit_relationship_contract",
        downgrade_reason: null,
        target_layer: "memory_record",
        relationship_key: "user_preferred_name",
        durability: "durable"
      }
    },
    {
      id: "thread_boundary_localizes_static_profile_candidate",
      actual: {
        boundary_reason: threadBoundCandidates[0]?.boundary_reason ?? null,
        write_boundary: threadBoundCandidates[0]?.write_boundary ?? null,
        routed_scope: threadBoundCandidates[0]?.routed_scope ?? null,
        target_layer: threadBoundCandidates[0]?.target_layer ?? null
      },
      expected: {
        boundary_reason: "thread_boundary_localized_static_profile",
        write_boundary: "thread",
        routed_scope: "thread_local",
        target_layer: "static_profile"
      }
    },
    {
      id: "thread_boundary_localizes_memory_record_candidate",
      actual: {
        boundary_reason: threadBoundCandidates[1]?.boundary_reason ?? null,
        write_boundary: threadBoundCandidates[1]?.write_boundary ?? null,
        routed_scope: threadBoundCandidates[1]?.routed_scope ?? null,
        target_layer: threadBoundCandidates[1]?.target_layer ?? null
      },
      expected: {
        boundary_reason: "thread_boundary_localized_memory_record",
        write_boundary: "thread",
        routed_scope: "thread_local",
        target_layer: "memory_record"
      }
    },
    {
      id: "project_boundary_preserves_thread_state_candidate",
      actual: {
        boundary_reason:
          projectBoundGoalCandidates[0]?.boundary_reason ?? null,
        write_boundary: projectBoundGoalCandidates[0]?.write_boundary ?? null,
        routed_scope: projectBoundGoalCandidates[0]?.routed_scope ?? null,
        target_layer: projectBoundGoalCandidates[0]?.target_layer ?? null
      },
      expected: {
        boundary_reason: "project_boundary_preserved_thread_state_candidate",
        write_boundary: "project",
        routed_scope: "thread_local",
        target_layer: "thread_state_candidate"
      }
    },
    {
      id: "negative_feedback_signal_normalizes_to_event_archive",
      actual: {
        decision_kind: productFeedbackCandidate?.decision_kind ?? null,
        source_kind: productFeedbackCandidate?.source_kind ?? null,
        decision_reason: productFeedbackCandidate?.decision_reason ?? null,
        downgrade_reason: productFeedbackCandidate?.downgrade_reason ?? null,
        target_layer: productFeedbackCandidate?.target_layer ?? null,
        durability: productFeedbackCandidate?.durability ?? null,
        signal_category: productFeedbackCandidate?.signal_category ?? null
      },
      expected: {
        decision_kind: "capture_event",
        source_kind: "negative_product_feedback_signal",
        decision_reason: "negative_product_feedback_event_only",
        downgrade_reason: null,
        target_layer: "event_archive",
        durability: "event_only",
        signal_category: "memory_capability_mocking"
      }
    },
    {
      id: "transient_mood_candidate_normalizes_to_reject_candidate",
      actual: {
        decision_kind: transientMoodCandidate?.decision_kind ?? null,
        source_kind: transientMoodCandidate?.source_kind ?? null,
        rejection_reason: transientMoodCandidate?.rejection_reason ?? null,
        durability: transientMoodCandidate?.durability ?? null,
        semantic_source: transientMoodCandidate?.semantic_source ?? null
      },
      expected: {
        decision_kind: "reject_candidate",
        source_kind: "generic_memory_extraction",
        rejection_reason: "transient_mood_rejected",
        durability: "event_only",
        semantic_source: "mood_durability_gate"
      }
    },
    {
      id: "low_confidence_candidate_normalizes_to_confidence_reject",
      actual: {
        decision_kind: lowConfidenceCandidate?.decision_kind ?? null,
        source_kind: lowConfidenceCandidate?.source_kind ?? null,
        rejection_reason: lowConfidenceCandidate?.rejection_reason ?? null,
        durability: lowConfidenceCandidate?.durability ?? null,
        semantic_source: lowConfidenceCandidate?.semantic_source ?? null
      },
      expected: {
        decision_kind: "reject_candidate",
        source_kind: "generic_memory_extraction",
        rejection_reason: "below_confidence_threshold",
        durability: "event_only",
        semantic_source: "extractor_confidence_gate"
      }
    },
    {
      id: "extractor_should_store_false_normalizes_to_reject_candidate",
      actual: {
        decision_kind: extractorRejectedCandidate?.decision_kind ?? null,
        source_kind: extractorRejectedCandidate?.source_kind ?? null,
        rejection_reason: extractorRejectedCandidate?.rejection_reason ?? null,
        durability: extractorRejectedCandidate?.durability ?? null,
        semantic_source: extractorRejectedCandidate?.semantic_source ?? null
      },
      expected: {
        decision_kind: "reject_candidate",
        source_kind: "generic_memory_extraction",
        rejection_reason: "extractor_marked_not_storable",
        durability: "event_only",
        semantic_source: "extractor_should_store_false"
      }
    }
  ].map((result) => ({
    ...result,
    pass: JSON.stringify(result.actual) === JSON.stringify(result.expected)
  }));

  const failed = results.filter((result) => !result.pass);

  console.log(
    JSON.stringify(
      {
        status: failed.length === 0 ? "ok" : "failed",
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        candidate_count:
          candidates.length +
          threadBoundCandidates.length +
          projectBoundGoalCandidates.length +
          (productFeedbackCandidate ? 1 : 0) +
          (transientMoodCandidate ? 1 : 0) +
          (lowConfidenceCandidate ? 1 : 0) +
          (extractorRejectedCandidate ? 1 : 0),
        results
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown planner candidate harness failure."
  );
  process.exitCode = 1;
});
