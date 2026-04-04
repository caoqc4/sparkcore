import {
  resolveKnowledgeCandidateRejectReason,
  resolveKnowledgeSuppressionReason,
  type RuntimeKnowledgeGatingSummary,
  tokenizeKnowledgeQuery
} from "@/lib/chat/runtime-knowledge-sources";

import {
  KNOWLEDGE_SELECTION_EVAL_FIXTURES,
  type KnowledgeSelectionEvalFixture
} from "./memory-knowledge-selection-eval-fixtures";

type CandidateReport = {
  id: string;
  selected: boolean;
  rejectReason: "suppressed" | "zero_match" | "weak_match" | null;
};

type FixtureReport = {
  id: string;
  scenarioClass: KnowledgeSelectionEvalFixture["scenarioClass"];
  knowledgeRoute: KnowledgeSelectionEvalFixture["knowledgeRoute"];
  latestUserMessage: string;
  suppressionReason: string | null;
  queryTokenCount: number;
  selectedCandidateIds: string[];
  zeroMatchFilteredCount: number;
  weakMatchFilteredCount: number;
  candidates: CandidateReport[];
};

function evaluateFixture(fixture: KnowledgeSelectionEvalFixture): FixtureReport {
  const suppressionReason = resolveKnowledgeSuppressionReason({
    latestUserMessage: fixture.latestUserMessage,
    knowledgeRoute: fixture.knowledgeRoute
  });
  const queryTokens = tokenizeKnowledgeQuery(fixture.latestUserMessage);

  const candidates = fixture.candidates.map((candidate) => {
    if (suppressionReason) {
      return {
        id: candidate.id,
        selected: false,
        rejectReason: "suppressed" as const
      };
    }

    const rejectReason = resolveKnowledgeCandidateRejectReason({
      relevance: {
        score: 0,
        tokenMatchCount: candidate.tokenMatchCount,
        titleMatchCount: candidate.titleMatchCount,
        summaryMatchCount: candidate.summaryMatchCount,
        bodyMatchCount: candidate.bodyMatchCount
      },
      knowledgeRoute: fixture.knowledgeRoute
    });

    return {
      id: candidate.id,
      selected: rejectReason === null,
      rejectReason
    };
  });

  return {
    id: fixture.id,
    scenarioClass: fixture.scenarioClass,
    knowledgeRoute: fixture.knowledgeRoute,
    latestUserMessage: fixture.latestUserMessage,
    suppressionReason,
    queryTokenCount: queryTokens.length,
    selectedCandidateIds: candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.id),
    zeroMatchFilteredCount: candidates.filter(
      (candidate) => candidate.rejectReason === "zero_match"
    ).length,
    weakMatchFilteredCount: candidates.filter(
      (candidate) => candidate.rejectReason === "weak_match"
    ).length,
    candidates
  };
}

function buildGatingSummary(report: FixtureReport): RuntimeKnowledgeGatingSummary {
  const availableCount = report.selectedCandidateIds.length;
  const available = availableCount > 0;
  const suppressed = report.suppressionReason !== null;

  return {
    knowledge_route: report.knowledgeRoute,
    query_token_count: report.queryTokenCount,
    available,
    available_count: availableCount,
    should_inject: !suppressed && available,
    injection_gap_reason: null,
    retained_count: availableCount,
    suppressed,
    suppression_reason: report.suppressionReason,
    zero_match_filtered_count: report.zeroMatchFilteredCount,
    weak_match_filtered_count: report.weakMatchFilteredCount
  };
}

function renderMarkdown(reports: FixtureReport[]) {
  const lines: string[] = [
    "# Knowledge Selection Sampling Report",
    "",
    `Fixture count: ${reports.length}`,
    ""
  ];

  const grouped = new Map<
    KnowledgeSelectionEvalFixture["scenarioClass"],
    FixtureReport[]
  >();

  for (const report of reports) {
    const current = grouped.get(report.scenarioClass) ?? [];
    current.push(report);
    grouped.set(report.scenarioClass, current);
  }

  for (const [scenarioClass, scenarioReports] of grouped.entries()) {
    lines.push(`## ${scenarioClass}`);
    lines.push("");
    lines.push(
      `- Samples: ${scenarioReports.length}`
    );
    lines.push(
      `- Suppressed: ${scenarioReports.filter((item) => item.suppressionReason !== null).length}`
    );
    lines.push(
      `- Selected candidates: ${scenarioReports.reduce(
        (sum, item) => sum + item.selectedCandidateIds.length,
        0
      )}`
    );
    lines.push(
      `- Zero-match filtered: ${scenarioReports.reduce(
        (sum, item) => sum + item.zeroMatchFilteredCount,
        0
      )}`
    );
    lines.push(
      `- Weak-match filtered: ${scenarioReports.reduce(
        (sum, item) => sum + item.weakMatchFilteredCount,
        0
      )}`
    );
    lines.push("");

    for (const report of scenarioReports) {
      const gating = buildGatingSummary(report);
      lines.push(`### ${report.id}`);
      lines.push("");
      lines.push(`- Route: ${report.knowledgeRoute}`);
      lines.push(`- User message: ${report.latestUserMessage}`);
      lines.push(`- Query token count: ${gating.query_token_count}`);
      lines.push(
        `- Suppression reason: ${gating.suppression_reason ?? "none"}`
      );
      lines.push(
        `- Selected candidates: ${
          report.selectedCandidateIds.length > 0
            ? report.selectedCandidateIds.join(", ")
            : "none"
        }`
      );
      lines.push(
        `- Filtered counts: zero-match=${gating.zero_match_filtered_count}, weak-match=${gating.weak_match_filtered_count}`
      );
      lines.push("- Candidate outcomes:");
      lines.push(
        ...report.candidates.map(
          (candidate) =>
            `  - ${candidate.id}: ${
              candidate.selected ? "selected" : candidate.rejectReason ?? "kept"
            }`
        )
      );
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function main() {
  const reports = KNOWLEDGE_SELECTION_EVAL_FIXTURES.map(evaluateFixture);
  console.log(renderMarkdown(reports));
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown knowledge selection report failure."
  );
  process.exitCode = 1;
});
