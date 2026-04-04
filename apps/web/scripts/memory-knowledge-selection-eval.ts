import {
  resolveKnowledgeSuppressionReason,
  shouldKeepKnowledgeCandidate,
  tokenizeKnowledgeQuery
} from "@/lib/chat/runtime-knowledge-sources";

import {
  KNOWLEDGE_SELECTION_EVAL_FIXTURES,
  type KnowledgeSelectionEvalFixture,
  type KnowledgeSelectionEvalRoute
} from "./memory-knowledge-selection-eval-fixtures";

type CandidateOutcome = {
  id: string;
  selected: boolean;
  token_match_count: number;
  title_match_count: number;
  summary_match_count: number;
  body_match_count: number;
  reject_reason: "suppressed" | "zero_match" | "weak_match" | null;
};

type FixtureOutcome = {
  id: string;
  knowledge_route: KnowledgeSelectionEvalRoute;
  query_token_count: number;
  suppression_reason: string | null;
  selected_candidate_ids: string[];
  candidates: CandidateOutcome[];
};

function evaluateFixture(fixture: KnowledgeSelectionEvalFixture): FixtureOutcome {
  const suppressionReason = resolveKnowledgeSuppressionReason({
    latestUserMessage: fixture.latestUserMessage,
    knowledgeRoute: fixture.knowledgeRoute
  });
  const queryTokens = tokenizeKnowledgeQuery(fixture.latestUserMessage);

  const candidates = fixture.candidates.map((candidate) => {
    const selected =
      suppressionReason === null
        ? shouldKeepKnowledgeCandidate({
            relevance: {
              score: 0,
              tokenMatchCount: candidate.tokenMatchCount,
              titleMatchCount: candidate.titleMatchCount,
              summaryMatchCount: candidate.summaryMatchCount,
              bodyMatchCount: candidate.bodyMatchCount
            },
            knowledgeRoute: fixture.knowledgeRoute
          })
        : false;

    let rejectReason: CandidateOutcome["reject_reason"] = null;
    if (!selected) {
      if (suppressionReason) {
        rejectReason = "suppressed";
      } else if (candidate.tokenMatchCount <= 0) {
        rejectReason = "zero_match";
      } else {
        rejectReason = "weak_match";
      }
    }

    return {
      id: candidate.id,
      selected,
      token_match_count: candidate.tokenMatchCount,
      title_match_count: candidate.titleMatchCount,
      summary_match_count: candidate.summaryMatchCount,
      body_match_count: candidate.bodyMatchCount,
      reject_reason: rejectReason
    };
  });

  return {
    id: fixture.id,
    knowledge_route: fixture.knowledgeRoute,
    query_token_count: queryTokens.length,
    suppression_reason: suppressionReason,
    selected_candidate_ids: candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.id),
    candidates
  };
}

function buildRouteSummary(
  outcomes: FixtureOutcome[],
  route: KnowledgeSelectionEvalRoute
) {
  const routeOutcomes = outcomes.filter((outcome) => outcome.knowledge_route === route);
  const candidateOutcomes = routeOutcomes.flatMap((outcome) => outcome.candidates);

  return {
    sample_count: routeOutcomes.length,
    suppressed_sample_count: routeOutcomes.filter(
      (outcome) => outcome.suppression_reason !== null
    ).length,
    sample_with_selection_count: routeOutcomes.filter(
      (outcome) => outcome.selected_candidate_ids.length > 0
    ).length,
    selected_candidate_count: candidateOutcomes.filter((candidate) => candidate.selected)
      .length,
    zero_match_rejected_count: candidateOutcomes.filter(
      (candidate) => candidate.reject_reason === "zero_match"
    ).length,
    weak_match_rejected_count: candidateOutcomes.filter(
      (candidate) => candidate.reject_reason === "weak_match"
    ).length
  };
}

function assertFixtureExpectations(
  fixtures: KnowledgeSelectionEvalFixture[],
  outcomes: FixtureOutcome[]
) {
  const failures: string[] = [];

  for (const fixture of fixtures) {
    const outcome = outcomes.find((item) => item.id === fixture.id);

    if (!outcome) {
      failures.push(`Missing eval outcome for fixture "${fixture.id}".`);
      continue;
    }

    const actuallySuppressed = outcome.suppression_reason !== null;
    if (actuallySuppressed !== fixture.expected.suppressed) {
      failures.push(
        `Fixture "${fixture.id}" suppression mismatch: expected ${fixture.expected.suppressed}, received ${actuallySuppressed}.`
      );
    }

    const expectedIds = [...fixture.expected.selectedCandidateIds].sort();
    const actualIds = [...outcome.selected_candidate_ids].sort();
    if (expectedIds.join("|") !== actualIds.join("|")) {
      failures.push(
        `Fixture "${fixture.id}" selected candidates mismatch: expected [${expectedIds.join(
          ", "
        )}], received [${actualIds.join(", ")}].`
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

async function main() {
  const outcomes = KNOWLEDGE_SELECTION_EVAL_FIXTURES.map(evaluateFixture);
  assertFixtureExpectations(KNOWLEDGE_SELECTION_EVAL_FIXTURES, outcomes);

  const allCandidates = outcomes.flatMap((outcome) => outcome.candidates);
  const summary = {
    total_samples: outcomes.length,
    suppressed_samples: outcomes.filter((outcome) => outcome.suppression_reason !== null)
      .length,
    samples_with_selection: outcomes.filter(
      (outcome) => outcome.selected_candidate_ids.length > 0
    ).length,
    total_candidates: allCandidates.length,
    selected_candidates: allCandidates.filter((candidate) => candidate.selected).length,
    zero_match_rejected_candidates: allCandidates.filter(
      (candidate) => candidate.reject_reason === "zero_match"
    ).length,
    weak_match_rejected_candidates: allCandidates.filter(
      (candidate) => candidate.reject_reason === "weak_match"
    ).length,
    by_route: {
      light_knowledge: buildRouteSummary(outcomes, "light_knowledge"),
      domain_knowledge: buildRouteSummary(outcomes, "domain_knowledge"),
      artifact_knowledge: buildRouteSummary(outcomes, "artifact_knowledge"),
      no_knowledge: buildRouteSummary(outcomes, "no_knowledge")
    }
  };

  console.log(
    JSON.stringify(
      {
        status: "ok",
        fixture_count: KNOWLEDGE_SELECTION_EVAL_FIXTURES.length,
        summary,
        outcomes
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown knowledge selection eval failure."
  );
  process.exitCode = 1;
});
