import { buildRuntimeMemoryWriteRequestMetadata } from "@/lib/chat/runtime-preview-metadata";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

async function main() {
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
    }
  ];

  const preview = buildRuntimeMemoryWriteRequestMetadata(requests, null, [
    {
      candidate_id: "generic-extraction:episode:msg-low-confidence",
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
    }
  ]);

  const summary =
    preview.runtime_memory_candidates_summary &&
    typeof preview.runtime_memory_candidates_summary === "object"
      ? (preview.runtime_memory_candidates_summary as Record<string, unknown>)
      : null;

  const results = [
    {
      id: "preview_summary_counts_candidates_rejects_and_downgrades",
      actual: {
        candidate_count: summary?.candidate_count ?? null,
        rejected_candidate_count: summary?.rejected_candidate_count ?? null,
        downgraded_candidate_count: summary?.downgraded_candidate_count ?? null
      },
      expected: {
        candidate_count: 2,
        rejected_candidate_count: 1,
        downgraded_candidate_count: 1
      }
    },
    {
      id: "preview_summary_tracks_reason_distributions",
      actual: {
        static_profile_preferred:
          (
            summary?.decision_reason_counts as Record<string, number> | undefined
          )?.static_profile_preferred ?? 0,
        profile_routed_to_static_profile:
          (
            summary?.downgrade_reason_counts as
              | Record<string, number>
              | undefined
          )?.profile_routed_to_static_profile ?? 0,
        below_confidence_threshold:
          (
            summary?.rejection_reason_counts as
              | Record<string, number>
              | undefined
          )?.below_confidence_threshold ?? 0
      },
      expected: {
        static_profile_preferred: 1,
        profile_routed_to_static_profile: 1,
        below_confidence_threshold: 1
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
      : "Unknown planner preview summary harness failure."
  );
  process.exitCode = 1;
});
