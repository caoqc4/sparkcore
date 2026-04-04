import {
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  summarizePlannerCandidates
} from "@/lib/chat/memory-planner-candidates";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { buildRuntimeMemoryWriteRequestMetadata } from "@/lib/chat/runtime-preview-metadata";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

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

  const previewCandidates = Array.isArray(preview.runtime_memory_candidates_preview)
    ? preview.runtime_memory_candidates_preview
    : [];
  const previewSummary =
    preview.runtime_memory_candidates_summary &&
    typeof preview.runtime_memory_candidates_summary === "object"
      ? (preview.runtime_memory_candidates_summary as Record<string, unknown>)
      : null;
  const directSummary = summarizePlannerCandidates(
    previewCandidates as Parameters<typeof summarizePlannerCandidates>[0]
  );

  const results = [
    {
      id: "runtime_smoke_summary_matches_preview_candidate_count",
      actual: {
        preview_count: preview.runtime_memory_candidate_count ?? null,
        summary_count: previewSummary?.candidate_count ?? null,
        direct_count: directSummary.candidate_count
      },
      expected: {
        preview_count: 5,
        summary_count: 5,
        direct_count: 5
      }
    },
    {
      id: "runtime_smoke_summary_tracks_rejects_downgrades_and_layers",
      actual: {
        rejected_candidate_count:
          previewSummary?.rejected_candidate_count ?? null,
        downgraded_candidate_count:
          previewSummary?.downgraded_candidate_count ?? null,
        static_profile:
          (
            previewSummary?.target_layer_counts as
              | Record<string, number>
              | undefined
          )?.static_profile ?? 0,
        thread_state_candidate:
          (
            previewSummary?.target_layer_counts as
              | Record<string, number>
              | undefined
          )?.thread_state_candidate ?? 0,
        memory_record:
          (
            previewSummary?.target_layer_counts as
              | Record<string, number>
              | undefined
          )?.memory_record ?? 0,
        event_archive:
          (
            previewSummary?.target_layer_counts as
              | Record<string, number>
              | undefined
          )?.event_archive ?? 0
      },
      expected: {
        rejected_candidate_count: 1,
        downgraded_candidate_count: 2,
        static_profile: 1,
        thread_state_candidate: 1,
        memory_record: 2,
        event_archive: 1
      }
    },
    {
      id: "runtime_smoke_summary_tracks_boundary_and_reason_distribution",
      actual: {
        thread_boundary_localized_static_profile:
          (
            previewSummary?.boundary_reason_counts as
              | Record<string, number>
              | undefined
          )?.thread_boundary_localized_static_profile ?? 0,
        thread_boundary_preserved_thread_state_candidate:
          (
            previewSummary?.boundary_reason_counts as
              | Record<string, number>
              | undefined
          )?.thread_boundary_preserved_thread_state_candidate ?? 0,
        profile_routed_to_static_profile:
          (
            previewSummary?.downgrade_reason_counts as
              | Record<string, number>
              | undefined
          )?.profile_routed_to_static_profile ?? 0,
        goal_routed_to_thread_state_candidate:
          (
            previewSummary?.downgrade_reason_counts as
              | Record<string, number>
              | undefined
          )?.goal_routed_to_thread_state_candidate ?? 0,
        below_confidence_threshold:
          (
            previewSummary?.rejection_reason_counts as
              | Record<string, number>
              | undefined
          )?.below_confidence_threshold ?? 0,
        negative_product_feedback_event_only:
          (
            previewSummary?.decision_reason_counts as
              | Record<string, number>
              | undefined
          )?.negative_product_feedback_event_only ?? 0
      },
      expected: {
        thread_boundary_localized_static_profile: 1,
        thread_boundary_preserved_thread_state_candidate: 1,
        profile_routed_to_static_profile: 1,
        goal_routed_to_thread_state_candidate: 1,
        below_confidence_threshold: 1,
        negative_product_feedback_event_only: 1
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
      : "Unknown planner runtime smoke harness failure."
  );
  process.exitCode = 1;
});
