import { summarizePlannerCandidates } from "@/lib/chat/memory-planner-candidates";
import {
  getRuntimePlannerBoundaryReasonCounts,
  getRuntimePlannerCandidateCount,
  getRuntimePlannerRejectedCandidateCount
} from "@/lib/chat/runtime-event-read";
import type { RuntimeEvent } from "@/lib/chat/runtime-contract";

async function main() {
  const summary = summarizePlannerCandidates([
    {
      candidate_id: "cand-1",
      decision_kind: "create_or_update_memory",
      source_kind: "generic_memory_request",
      decision_reason: "static_profile_preferred",
      downgrade_reason: "profile_routed_to_static_profile",
      rejection_reason: null,
      target_layer: "static_profile",
      durability: "durable",
      canonical_memory_type: "profile",
      memory_type: "profile",
      content: "我是自由职业设计师",
      reason: "Explicit profile fact.",
      confidence: 0.95,
      source_turn_id: "msg-1",
      record_target: "static_profile",
      write_boundary: "thread",
      boundary_reason: "thread_boundary_localized_static_profile",
      write_priority_layer: "thread",
      routed_scope: "thread_local",
      routed_target_agent_id: null,
      routed_target_thread_id: "thread-1",
      routed_project_id: null,
      routed_world_id: null,
      relationship_key: null,
      semantic_source: null,
      signal_category: null,
      assistant_message_id: null
    },
    {
      candidate_id: "cand-2",
      decision_kind: "reject_candidate",
      source_kind: "generic_memory_extraction",
      decision_reason: null,
      downgrade_reason: null,
      rejection_reason: "below_confidence_threshold",
      target_layer: "memory_record",
      durability: "event_only",
      canonical_memory_type: "episode",
      memory_type: "episode",
      content: "上周做过一次复盘",
      reason: "Possible episode.",
      confidence: 0.42,
      source_turn_id: "msg-2",
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
    }
  ]);

  const events: RuntimeEvent[] = [
    {
      type: "memory_write_planned",
      payload: {
        count: 1,
        planner_candidate_count: summary.candidate_count,
        rejected_candidate_count: summary.rejected_candidate_count,
        downgraded_candidate_count: summary.downgraded_candidate_count,
        memory_types: ["profile"],
        record_targets: ["static_profile"],
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

  const results = [
    {
      id: "planner_summary_counts_candidates_and_rejections",
      actual: {
        candidate_count: summary.candidate_count,
        rejected_candidate_count: summary.rejected_candidate_count,
        downgraded_candidate_count: summary.downgraded_candidate_count
      },
      expected: {
        candidate_count: 2,
        rejected_candidate_count: 1,
        downgraded_candidate_count: 1
      }
    },
    {
      id: "planner_summary_tracks_boundary_reason_distribution",
      actual: {
        thread_boundary_localized_static_profile:
          summary.boundary_reason_counts.thread_boundary_localized_static_profile ??
          0
      },
      expected: {
        thread_boundary_localized_static_profile: 1
      }
    },
    {
      id: "runtime_event_reader_exposes_planner_summary_fields",
      actual: {
        planner_candidate_count: getRuntimePlannerCandidateCount(events),
        rejected_candidate_count:
          getRuntimePlannerRejectedCandidateCount(events),
        thread_boundary_localized_static_profile:
          getRuntimePlannerBoundaryReasonCounts(events)
            ?.thread_boundary_localized_static_profile ?? 0
      },
      expected: {
        planner_candidate_count: 2,
        rejected_candidate_count: 1,
        thread_boundary_localized_static_profile: 1
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
      : "Unknown planner summary harness failure."
  );
  process.exitCode = 1;
});
