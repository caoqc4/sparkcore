import {
  buildPlannerCandidatePreviewFromGenericExtraction,
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  buildPlannerCandidatePreviewsFromWriteRequests,
  summarizePlannerCandidates,
  type PlannerCandidatePreview
} from "@/lib/chat/memory-planner-candidates";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

type PlannerScenarioClass =
  | "profile_and_relationship"
  | "thread_boundary"
  | "project_boundary"
  | "event_only"
  | "generic_rejects";

type PlannerScenarioReport = {
  id: string;
  scenarioClass: PlannerScenarioClass;
  summary: ReturnType<typeof summarizePlannerCandidates>;
  candidates: PlannerCandidatePreview[];
};

const THREAD_PRIMARY_NAMESPACE: ActiveRuntimeMemoryNamespace = {
  namespace_id: "user:user-1|thread:thread-1",
  primary_layer: "thread",
  active_layers: ["user", "thread"],
  refs: [
    { layer: "user", entity_id: "user-1" },
    { layer: "thread", entity_id: "thread-1" }
  ],
  selection_reason: "session_and_knowledge_scope"
};

const PROJECT_PRIMARY_NAMESPACE: ActiveRuntimeMemoryNamespace = {
  namespace_id: "user:user-1|project:project-1|world:world-1",
  primary_layer: "project",
  active_layers: ["user", "project", "world"],
  refs: [
    { layer: "user", entity_id: "user-1" },
    { layer: "project", entity_id: "project-1" },
    { layer: "world", entity_id: "world-1" }
  ],
  selection_reason: "session_and_knowledge_scope"
};

function buildScenarioReports(): PlannerScenarioReport[] {
  const profileAndRelationshipRequests: RuntimeMemoryWriteRequest[] = [
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

  const threadBoundaryRequests: RuntimeMemoryWriteRequest[] = [
    {
      kind: "generic_memory",
      memory_type: "profile",
      candidate_content: "我是自由职业设计师",
      reason: "The user explicitly stated a durable identity fact.",
      confidence: 0.95,
      source_turn_id: "msg-profile-thread",
      dedupe_key: "profile:freelance-designer",
      write_mode: "upsert"
    },
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
  ];

  const projectBoundaryRequests: RuntimeMemoryWriteRequest[] = [
    {
      kind: "generic_memory",
      memory_type: "goal",
      candidate_content: "帮我规划一版用户访谈方案",
      reason: "The user explicitly stated an active planning goal.",
      confidence: 0.91,
      source_turn_id: "msg-goal-project",
      dedupe_key: "goal:user-interview-plan",
      write_mode: "upsert"
    }
  ];

  const eventOnlyCandidate = buildPlannerCandidatePreviewFromProductFeedbackSignal(
    {
      signal: {
        detected: true,
        category: "memory_capability_mocking",
        confidence: "high",
        reason: "User complained about memory quality."
      },
      latestUserMessage: "你怎么又忘了，记忆也太差了",
      sourceMessageId: "msg-feedback",
      assistantMessageId: "assistant-1"
    }
  );

  const genericRejectCandidates = [
    buildPlannerCandidatePreviewFromGenericExtraction({
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
    }),
    buildPlannerCandidatePreviewFromGenericExtraction({
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
    }),
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
    })
  ];

  const reports: PlannerScenarioReport[] = [
    {
      id: "profile_and_relationship_baseline",
      scenarioClass: "profile_and_relationship",
      candidates: buildPlannerCandidatePreviewsFromWriteRequests({
        requests: profileAndRelationshipRequests
      }),
      summary: summarizePlannerCandidates(
        buildPlannerCandidatePreviewsFromWriteRequests({
          requests: profileAndRelationshipRequests
        })
      )
    },
    {
      id: "thread_boundary_localization",
      scenarioClass: "thread_boundary",
      candidates: buildPlannerCandidatePreviewsFromWriteRequests({
        requests: threadBoundaryRequests,
        activeNamespace: THREAD_PRIMARY_NAMESPACE
      }),
      summary: summarizePlannerCandidates(
        buildPlannerCandidatePreviewsFromWriteRequests({
          requests: threadBoundaryRequests,
          activeNamespace: THREAD_PRIMARY_NAMESPACE
        })
      )
    },
    {
      id: "project_boundary_goal_preservation",
      scenarioClass: "project_boundary",
      candidates: buildPlannerCandidatePreviewsFromWriteRequests({
        requests: projectBoundaryRequests,
        activeNamespace: PROJECT_PRIMARY_NAMESPACE
      }),
      summary: summarizePlannerCandidates(
        buildPlannerCandidatePreviewsFromWriteRequests({
          requests: projectBoundaryRequests,
          activeNamespace: PROJECT_PRIMARY_NAMESPACE
        })
      )
    },
    {
      id: "event_only_negative_feedback",
      scenarioClass: "event_only",
      candidates: eventOnlyCandidate ? [eventOnlyCandidate] : [],
      summary: summarizePlannerCandidates(
        eventOnlyCandidate ? [eventOnlyCandidate] : []
      )
    },
    {
      id: "generic_reject_paths",
      scenarioClass: "generic_rejects",
      candidates: genericRejectCandidates,
      summary: summarizePlannerCandidates(genericRejectCandidates)
    }
  ];

  return reports;
}

function renderCountMap(title: string, counts: Record<string, number>) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return [`- ${title}: none`];
  }

  return [`- ${title}: ${entries.map(([key, value]) => `${key}=${value}`).join(", ")}`];
}

function renderMarkdown(reports: PlannerScenarioReport[]) {
  const lines: string[] = [
    "# Planner Candidate Summary Report",
    "",
    `Scenario count: ${reports.length}`,
    ""
  ];

  const grouped = new Map<PlannerScenarioClass, PlannerScenarioReport[]>();

  for (const report of reports) {
    const current = grouped.get(report.scenarioClass) ?? [];
    current.push(report);
    grouped.set(report.scenarioClass, current);
  }

  for (const [scenarioClass, scenarioReports] of grouped.entries()) {
    lines.push(`## ${scenarioClass}`);
    lines.push("");
    lines.push(`- Samples: ${scenarioReports.length}`);
    lines.push(
      `- Candidate count: ${scenarioReports.reduce(
        (sum, item) => sum + item.summary.candidate_count,
        0
      )}`
    );
    lines.push(
      `- Rejected candidates: ${scenarioReports.reduce(
        (sum, item) => sum + item.summary.rejected_candidate_count,
        0
      )}`
    );
    lines.push(
      `- Downgraded candidates: ${scenarioReports.reduce(
        (sum, item) => sum + item.summary.downgraded_candidate_count,
        0
      )}`
    );
    lines.push("");

    for (const report of scenarioReports) {
      lines.push(`### ${report.id}`);
      lines.push("");
      lines.push(`- Candidate count: ${report.summary.candidate_count}`);
      lines.push(
        `- Rejected candidates: ${report.summary.rejected_candidate_count}`
      );
      lines.push(
        `- Downgraded candidates: ${report.summary.downgraded_candidate_count}`
      );
      lines.push(...renderCountMap("Decision kinds", report.summary.decision_kind_counts));
      lines.push(...renderCountMap("Target layers", report.summary.target_layer_counts));
      lines.push(...renderCountMap("Boundary reasons", report.summary.boundary_reason_counts));
      lines.push(...renderCountMap("Decision reasons", report.summary.decision_reason_counts));
      lines.push(...renderCountMap("Downgrade reasons", report.summary.downgrade_reason_counts));
      lines.push(...renderCountMap("Rejection reasons", report.summary.rejection_reason_counts));
      lines.push("- Candidate outcomes:");
      lines.push(
        ...report.candidates.map(
          (candidate) =>
            `  - ${candidate.candidate_id}: decision=${candidate.decision_kind}, target=${candidate.target_layer}, boundary=${candidate.boundary_reason ?? "none"}, downgrade=${candidate.downgrade_reason ?? "none"}, rejection=${candidate.rejection_reason ?? "none"}`
        )
      );
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function main() {
  const reports = buildScenarioReports();
  console.log(renderMarkdown(reports));
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown planner summary report failure."
  );
  process.exitCode = 1;
});
