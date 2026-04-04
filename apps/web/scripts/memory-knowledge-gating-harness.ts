import {
  resolveKnowledgeSuppressionReason,
  shouldKeepKnowledgeCandidate,
  shouldSuppressKnowledgeInjection,
  tokenizeKnowledgeQuery
} from "@/lib/chat/runtime-knowledge-sources";

type KnowledgeGatingCase = {
  id: string;
  actual: () => boolean;
};

const CASES: KnowledgeGatingCase[] = [
  {
    id: "tokenize_zh_domain_terms",
    actual: () => {
      const tokens = tokenizeKnowledgeQuery("帮我整理产品反馈事故复盘");
      return (
        tokens.includes("产品") &&
        tokens.includes("反馈") &&
        tokens.includes("事故")
      );
    }
  },
  {
    id: "tokenize_en_domain_terms",
    actual: () => {
      const tokens = tokenizeKnowledgeQuery(
        "Help me summarize the product feedback incident plan"
      );
      return tokens.includes("product") && tokens.includes("feedback");
    }
  },
  {
    id: "suppress_relationship_naming_turn",
    actual: () =>
      shouldSuppressKnowledgeInjection({
        latestUserMessage: "我该怎么称呼你？",
        knowledgeRoute: "light_knowledge"
      })
  },
  {
    id: "relationship_naming_turn_reason_is_relational",
    actual: () =>
      resolveKnowledgeSuppressionReason({
        latestUserMessage: "我该怎么称呼你？",
        knowledgeRoute: "light_knowledge"
      }) === "relational_turn"
  },
  {
    id: "suppress_supportive_turn",
    actual: () =>
      shouldSuppressKnowledgeInjection({
        latestUserMessage: "你先陪陪我，别急着分析。",
        knowledgeRoute: "light_knowledge"
      })
  },
  {
    id: "supportive_turn_reason_is_relational",
    actual: () =>
      resolveKnowledgeSuppressionReason({
        latestUserMessage: "你先陪陪我，别急着分析。",
        knowledgeRoute: "light_knowledge"
      }) === "relational_turn"
  },
  {
    id: "short_light_turn_reason_stays_short",
    actual: () =>
      resolveKnowledgeSuppressionReason({
        latestUserMessage: "简短总结下",
        knowledgeRoute: "light_knowledge"
      }) === "short_light_turn"
  },
  {
    id: "keep_domain_turn_open",
    actual: () =>
      !shouldSuppressKnowledgeInjection({
        latestUserMessage: "帮我整理一下产品反馈事故的复盘方案",
        knowledgeRoute: "domain_knowledge"
      })
  },
  {
    id: "reject_zero_match_candidate",
    actual: () =>
      !shouldKeepKnowledgeCandidate({
        relevance: {
          score: 26,
          tokenMatchCount: 0,
          titleMatchCount: 0,
          summaryMatchCount: 0,
          bodyMatchCount: 0
        },
        knowledgeRoute: "light_knowledge"
      })
  },
  {
    id: "keep_matched_candidate",
    actual: () =>
      shouldKeepKnowledgeCandidate({
        relevance: {
          score: 31,
          tokenMatchCount: 2,
          titleMatchCount: 1,
          summaryMatchCount: 1,
          bodyMatchCount: 0
        },
        knowledgeRoute: "light_knowledge"
      })
  },
  {
    id: "reject_weak_body_only_match_for_light_route",
    actual: () =>
      !shouldKeepKnowledgeCandidate({
        relevance: {
          score: 29,
          tokenMatchCount: 1,
          titleMatchCount: 0,
          summaryMatchCount: 0,
          bodyMatchCount: 1
        },
        knowledgeRoute: "light_knowledge"
      })
  },
  {
    id: "keep_multi_token_domain_candidate_without_surface_match",
    actual: () =>
      shouldKeepKnowledgeCandidate({
        relevance: {
          score: 34,
          tokenMatchCount: 2,
          titleMatchCount: 0,
          summaryMatchCount: 0,
          bodyMatchCount: 2
        },
        knowledgeRoute: "domain_knowledge"
      })
  }
];

async function main() {
  const results = CASES.map((testCase) => {
    const pass = testCase.actual();

    return {
      id: testCase.id,
      pass
    };
  });

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
      : "Unknown knowledge gating harness failure."
  );
  process.exitCode = 1;
});
