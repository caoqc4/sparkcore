import {
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  summarizePlannerCandidates
} from "@/lib/chat/memory-planner-candidates";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { buildRuntimeDebugMetadata } from "@/lib/chat/runtime-debug-metadata";
import { buildRuntimeMemoryWriteRequestMetadata } from "@/lib/chat/runtime-preview-metadata";
import {
  getRuntimePlannerBoundaryReasonCounts,
  getRuntimePlannerCandidateCount,
  getRuntimePlannerRejectedCandidateCount
} from "@/lib/chat/runtime-event-read";
import type { RuntimeEvent, RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

async function main() {
  const threadPrimaryNamespace: ActiveRuntimeMemoryNamespace = {
    namespace_id: "user:user-1|thread:thread-1",
    primary_layer: "thread",
    active_layers: ["user", "thread"],
    refs: [
      { layer: "user", entity_id: "user-1" },
      { layer: "thread", entity_id: "thread-1" }
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
    }
  ];

  const extraPlannerCandidates = [
    {
      candidate_id: "generic-extraction:episode:msg-low-confidence",
      decision_kind: "reject_candidate" as const,
      source_kind: "generic_memory_extraction" as const,
      decision_reason: null,
      downgrade_reason: null,
      rejection_reason: "below_confidence_threshold",
      target_layer: "memory_record" as const,
      durability: "event_only" as const,
      canonical_memory_type: "episode",
      memory_type: "episode",
      content: "上周做过一次复盘",
      reason: "Possible episode.",
      confidence: 0.42,
      source_turn_id: "msg-low-confidence",
      record_target: null,
      write_boundary: null,
      boundary_reason: null,
      write_priority_layer: null,
      routed_scope: null,
      routed_target_agent_id: null,
      routed_target_thread_id: null,
      routed_project_id: null,
      routed_world_id: null,
      relationship_key: null,
      semantic_source: "extractor_confidence_gate",
      signal_category: null,
      assistant_message_id: null
    },
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
    })
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const preview = buildRuntimeMemoryWriteRequestMetadata(
    requests,
    threadPrimaryNamespace,
    extraPlannerCandidates
  );
  const previewSummary =
    preview.runtime_memory_candidates_summary &&
    typeof preview.runtime_memory_candidates_summary === "object"
      ? (preview.runtime_memory_candidates_summary as Record<string, unknown>)
      : null;

  const allCandidates = [
    ...(Array.isArray(preview.runtime_memory_candidates_preview)
      ? preview.runtime_memory_candidates_preview
      : [])
  ] as Parameters<typeof summarizePlannerCandidates>[0];
  const summary = summarizePlannerCandidates(allCandidates);

  const runtimeEvents: RuntimeEvent[] = [
    {
      type: "memory_write_planned",
      payload: {
        count: requests.length,
        planner_candidate_count: summary.candidate_count,
        rejected_candidate_count: summary.rejected_candidate_count,
        downgraded_candidate_count: summary.downgraded_candidate_count,
        memory_types: Array.from(new Set(requests.map((request) => request.memory_type))),
        record_targets: ["static_profile", "thread_state_candidate"],
        write_boundaries: ["thread"],
        decision_kind_counts: summary.decision_kind_counts,
        target_layer_counts: summary.target_layer_counts,
        boundary_reason_counts: summary.boundary_reason_counts,
        decision_reason_counts: summary.decision_reason_counts,
        downgrade_reason_counts: summary.downgrade_reason_counts,
        rejection_reason_counts: summary.rejection_reason_counts
      }
    }
  ];

  const debugMetadata = buildRuntimeDebugMetadata({
    model_profile_id: "profile-default",
    answer_strategy: "grounded_open_ended",
    answer_strategy_reason_code: "planner_observability_smoke",
    relationship_recall: null,
    recalled_memory_count: 0,
    memory_types_used: [],
    memory_recall_routes: [],
    profile_snapshot: [],
    memory_write_request_count: requests.length,
    memory_planner_summary: summary,
    follow_up_request_count: 0,
    continuation_reason_code: null,
    recent_turn_count: 1,
    context_pressure: "low",
    reply_language: "zh-Hans"
  });
  const debugSummary =
    debugMetadata.memory &&
    typeof debugMetadata.memory === "object" &&
    !Array.isArray(debugMetadata.memory)
      ? (debugMetadata.memory as Record<string, unknown>)
          .planner_candidates_summary as Record<string, unknown> | null
      : null;

  const results = [
    {
      id: "preview_event_and_debug_agree_on_candidate_counts",
      actual: {
        preview_candidate_count: previewSummary?.candidate_count ?? null,
        event_candidate_count: getRuntimePlannerCandidateCount(runtimeEvents),
        event_rejected_candidate_count:
          getRuntimePlannerRejectedCandidateCount(runtimeEvents),
        debug_candidate_count: debugSummary?.candidate_count ?? null,
        debug_rejected_candidate_count:
          debugSummary?.rejected_candidate_count ?? null
      },
      expected: {
        preview_candidate_count: 4,
        event_candidate_count: 4,
        event_rejected_candidate_count: 1,
        debug_candidate_count: 4,
        debug_rejected_candidate_count: 1
      }
    },
    {
      id: "preview_event_and_debug_agree_on_reason_distributions",
      actual: {
        preview_goal_routed_to_thread_state_candidate:
          (
            previewSummary?.downgrade_reason_counts as
              | Record<string, number>
              | undefined
          )?.goal_routed_to_thread_state_candidate ?? 0,
        event_thread_boundary_preserved_thread_state_candidate:
          getRuntimePlannerBoundaryReasonCounts(runtimeEvents)
            ?.thread_boundary_preserved_thread_state_candidate ?? 0,
        debug_below_confidence_threshold:
          (
            debugSummary?.rejection_reason_counts as
              | Record<string, number>
              | undefined
          )?.below_confidence_threshold ?? 0,
        debug_negative_product_feedback_event_only:
          (
            debugSummary?.decision_reason_counts as
              | Record<string, number>
              | undefined
          )?.negative_product_feedback_event_only ?? 0
      },
      expected: {
        preview_goal_routed_to_thread_state_candidate: 1,
        event_thread_boundary_preserved_thread_state_candidate: 1,
        debug_below_confidence_threshold: 1,
        debug_negative_product_feedback_event_only: 1
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
      : "Unknown planner runtime observability harness failure."
  );
  process.exitCode = 1;
});
