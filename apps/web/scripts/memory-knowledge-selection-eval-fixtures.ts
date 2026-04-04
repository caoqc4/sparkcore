export type KnowledgeSelectionEvalRoute =
  | "light_knowledge"
  | "domain_knowledge"
  | "artifact_knowledge"
  | "no_knowledge";

export type KnowledgeSelectionEvalCandidate = {
  id: string;
  tokenMatchCount: number;
  titleMatchCount: number;
  summaryMatchCount: number;
  bodyMatchCount: number;
};

export type KnowledgeSelectionEvalFixture = {
  id: string;
  scenarioClass:
    | "relational"
    | "light_task"
    | "domain_task"
    | "artifact_lookup"
    | "route_suppressed";
  knowledgeRoute: KnowledgeSelectionEvalRoute;
  latestUserMessage: string;
  candidates: KnowledgeSelectionEvalCandidate[];
  expected: {
    suppressed: boolean;
    selectedCandidateIds: string[];
  };
};

export const KNOWLEDGE_SELECTION_EVAL_FIXTURES: KnowledgeSelectionEvalFixture[] = [
  {
    id: "relational_naming_turn",
    scenarioClass: "relational",
    knowledgeRoute: "light_knowledge",
    latestUserMessage: "我该怎么称呼你？",
    candidates: [
      {
        id: "naming_profile_doc",
        tokenMatchCount: 2,
        titleMatchCount: 1,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: true,
      selectedCandidateIds: []
    }
  },
  {
    id: "companionship_checkin_turn",
    scenarioClass: "relational",
    knowledgeRoute: "light_knowledge",
    latestUserMessage: "你还在吗，先陪我待一会儿",
    candidates: [
      {
        id: "comforting_note",
        tokenMatchCount: 1,
        titleMatchCount: 0,
        summaryMatchCount: 1,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: true,
      selectedCandidateIds: []
    }
  },
  {
    id: "light_incident_recap_request",
    scenarioClass: "light_task",
    knowledgeRoute: "light_knowledge",
    latestUserMessage: "帮我回顾这次产品反馈事故里最关键的结论和后续安排，简短一点。",
    candidates: [
      {
        id: "incident_surface_match",
        tokenMatchCount: 2,
        titleMatchCount: 1,
        summaryMatchCount: 1,
        bodyMatchCount: 0
      },
      {
        id: "incident_body_only_match",
        tokenMatchCount: 1,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 1
      },
      {
        id: "unrelated_noise",
        tokenMatchCount: 0,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: false,
      selectedCandidateIds: ["incident_surface_match"]
    }
  },
  {
    id: "domain_incident_retrospective",
    scenarioClass: "domain_task",
    knowledgeRoute: "domain_knowledge",
    latestUserMessage: "帮我整理产品反馈事故复盘方案，重点放在分层记忆和误召回治理。",
    candidates: [
      {
        id: "incident_domain_body_support",
        tokenMatchCount: 3,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 3
      },
      {
        id: "memory_governance_surface_match",
        tokenMatchCount: 2,
        titleMatchCount: 1,
        summaryMatchCount: 0,
        bodyMatchCount: 1
      },
      {
        id: "single_body_weak_match",
        tokenMatchCount: 1,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 1
      }
    ],
    expected: {
      suppressed: false,
      selectedCandidateIds: [
        "incident_domain_body_support",
        "memory_governance_surface_match"
      ]
    }
  },
  {
    id: "domain_user_interview_plan",
    scenarioClass: "domain_task",
    knowledgeRoute: "domain_knowledge",
    latestUserMessage: "帮我规划一版用户访谈方案，覆盖目标、招募和访谈提纲。",
    candidates: [
      {
        id: "interview_plan_summary_match",
        tokenMatchCount: 2,
        titleMatchCount: 0,
        summaryMatchCount: 1,
        bodyMatchCount: 1
      },
      {
        id: "recruiting_body_support",
        tokenMatchCount: 2,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 2
      },
      {
        id: "random_workspace_note",
        tokenMatchCount: 0,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: false,
      selectedCandidateIds: [
        "interview_plan_summary_match",
        "recruiting_body_support"
      ]
    }
  },
  {
    id: "artifact_release_lookup",
    scenarioClass: "artifact_lookup",
    knowledgeRoute: "artifact_knowledge",
    latestUserMessage: "把版本发布说明里和 memory recall 相关的改动摘给我。",
    candidates: [
      {
        id: "release_note_body_support",
        tokenMatchCount: 2,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 2
      },
      {
        id: "artifact_surface_match",
        tokenMatchCount: 1,
        titleMatchCount: 1,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      },
      {
        id: "artifact_weak_body_only",
        tokenMatchCount: 1,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 1
      }
    ],
    expected: {
      suppressed: false,
      selectedCandidateIds: [
        "release_note_body_support",
        "artifact_surface_match"
      ]
    }
  },
  {
    id: "no_knowledge_route_case",
    scenarioClass: "route_suppressed",
    knowledgeRoute: "no_knowledge",
    latestUserMessage: "继续陪我聊聊就好，不用查资料。",
    candidates: [
      {
        id: "would_have_matched",
        tokenMatchCount: 2,
        titleMatchCount: 1,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: true,
      selectedCandidateIds: []
    }
  },
  {
    id: "domain_zero_match_noise",
    scenarioClass: "domain_task",
    knowledgeRoute: "domain_knowledge",
    latestUserMessage: "帮我写一个 onboarding checklist 给新同事。",
    candidates: [
      {
        id: "totally_unrelated_doc",
        tokenMatchCount: 0,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      },
      {
        id: "another_unrelated_doc",
        tokenMatchCount: 0,
        titleMatchCount: 0,
        summaryMatchCount: 0,
        bodyMatchCount: 0
      }
    ],
    expected: {
      suppressed: false,
      selectedCandidateIds: []
    }
  }
];
