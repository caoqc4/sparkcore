export type DirectRecallQuestionKind =
  | "none"
  | "generic-memory"
  | "profession"
  | "planning-style"
  | "reply-style";

export type AnswerQuestionType =
  | "direct-fact"
  | "direct-relationship-confirmation"
  | "role-self-introduction"
  | "role-capability"
  | "role-background"
  | "role-boundary"
  | "open-ended-advice"
  | "open-ended-summary"
  | "fuzzy-follow-up"
  | "other";

export type AnswerStrategy =
  | "structured-recall-first"
  | "relationship-recall-first"
  | "role-presence-first"
  | "grounded-open-ended-advice"
  | "grounded-open-ended-summary"
  | "same-thread-continuation"
  | "default-grounded";

export type AnswerStrategyReasonCode =
  | "direct-relationship-question"
  | "direct-memory-question"
  | "role-self-intro-prompt"
  | "role-capability-prompt"
  | "role-background-prompt"
  | "role-boundary-prompt"
  | "open-ended-advice-prompt"
  | "open-ended-summary-prompt"
  | "relationship-answer-shape-prompt"
  | "same-thread-edge-carryover"
  | "default-grounded-fallback";

export type ContinuationReasonCode =
  | "short-fuzzy-follow-up"
  | "brief-supportive-carryover"
  | "brief-summary-carryover";

export type AnswerStrategyPriority =
  | "high-deterministic"
  | "semi-constrained"
  | "low-deterministic";

export type AnswerCarryoverPolicy =
  | "blocked"
  | "style_only"
  | "allowed"
  | "preferred";

export type AnswerForbiddenMove =
  | "rewrite_into_same_thread_emotional_follow_up"
  | "repeat_self_intro_template"
  | "avoid_capability_limits"
  | "invent_missing_memory";

export type AnswerSceneGoal =
  | "answer_role_presence_question"
  | "answer_direct_fact"
  | "answer_relationship_confirmation"
  | "continue_same_thread"
  | "answer_open_ended_question"
  | "answer_grounded_default";

export type AnswerDecision = {
  questionType: AnswerQuestionType;
  strategy: AnswerStrategy;
  priority: AnswerStrategyPriority;
  reasonCode: AnswerStrategyReasonCode;
  continuationReasonCode: ContinuationReasonCode | null;
  carryoverPolicy: AnswerCarryoverPolicy;
  forbiddenMoves: AnswerForbiddenMove[];
  sceneGoal: AnswerSceneGoal;
};

const ANSWER_STRATEGY_MATRIX: Array<{
  questionType: AnswerQuestionType;
  strategy: AnswerStrategy;
  priority: AnswerStrategyPriority;
}> = [
  {
    questionType: "direct-fact",
    strategy: "structured-recall-first",
    priority: "high-deterministic"
  },
  {
    questionType: "direct-relationship-confirmation",
    strategy: "relationship-recall-first",
    priority: "high-deterministic"
  },
  {
    questionType: "role-self-introduction",
    strategy: "role-presence-first",
    priority: "high-deterministic"
  },
  {
    questionType: "role-capability",
    strategy: "role-presence-first",
    priority: "high-deterministic"
  },
  {
    questionType: "role-background",
    strategy: "role-presence-first",
    priority: "high-deterministic"
  },
  {
    questionType: "role-boundary",
    strategy: "role-presence-first",
    priority: "high-deterministic"
  },
  {
    questionType: "open-ended-advice",
    strategy: "grounded-open-ended-advice",
    priority: "low-deterministic"
  },
  {
    questionType: "open-ended-summary",
    strategy: "grounded-open-ended-summary",
    priority: "low-deterministic"
  },
  {
    questionType: "fuzzy-follow-up",
    strategy: "same-thread-continuation",
    priority: "semi-constrained"
  },
  {
    questionType: "other",
    strategy: "default-grounded",
    priority: "semi-constrained"
  }
];

function getAnswerStrategyRule(questionType: AnswerQuestionType) {
  return (
    ANSWER_STRATEGY_MATRIX.find((entry) => entry.questionType === questionType) ?? {
      questionType: "other" as const,
      strategy: "default-grounded" as const,
      priority: "semi-constrained" as const
    }
  );
}

function getAnswerCarryoverPolicy(
  questionType: AnswerQuestionType
): AnswerCarryoverPolicy {
  switch (questionType) {
    case "role-self-introduction":
    case "role-capability":
    case "role-background":
    case "role-boundary":
      return "style_only";
    case "direct-fact":
    case "direct-relationship-confirmation":
      return "blocked";
    case "fuzzy-follow-up":
      return "preferred";
    case "open-ended-advice":
    case "open-ended-summary":
    case "other":
    default:
      return "allowed";
  }
}

function getAnswerForbiddenMoves(
  questionType: AnswerQuestionType
): AnswerForbiddenMove[] {
  switch (questionType) {
    case "direct-fact":
      return ["invent_missing_memory"];
    case "role-capability":
      return ["rewrite_into_same_thread_emotional_follow_up"];
    case "role-background":
      return ["repeat_self_intro_template"];
    case "role-boundary":
      return ["avoid_capability_limits"];
    default:
      return [];
  }
}

function getAnswerSceneGoal(questionType: AnswerQuestionType): AnswerSceneGoal {
  switch (questionType) {
    case "role-self-introduction":
    case "role-capability":
    case "role-background":
    case "role-boundary":
      return "answer_role_presence_question";
    case "direct-fact":
      return "answer_direct_fact";
    case "direct-relationship-confirmation":
      return "answer_relationship_confirmation";
    case "fuzzy-follow-up":
      return "continue_same_thread";
    case "open-ended-advice":
    case "open-ended-summary":
      return "answer_open_ended_question";
    case "other":
    default:
      return "answer_grounded_default";
  }
}

export function resolveAnswerDecision(params: {
  directRecallQuestionKind: DirectRecallQuestionKind;
  directNamingQuestion: boolean;
  directPreferredNameQuestion: boolean;
  roleSelfIntroPrompt: boolean;
  roleCapabilityPrompt: boolean;
  roleBackgroundPrompt: boolean;
  roleBoundaryPrompt: boolean;
  relationshipContinuationEdgePrompt: boolean;
  relationshipStylePrompt: boolean;
  openEndedAdviceQuestion: boolean;
  openEndedSummaryQuestion: boolean;
  sameThreadContinuity: boolean;
  relationshipCarryoverAvailable: boolean;
  continuationReasonCode: ContinuationReasonCode | null;
}): AnswerDecision {
  let questionType: AnswerQuestionType = "other";
  let reasonCode: AnswerStrategyReasonCode = "default-grounded-fallback";
  let continuationReasonCode: ContinuationReasonCode | null = null;

  if (params.directNamingQuestion || params.directPreferredNameQuestion) {
    questionType = "direct-relationship-confirmation";
    reasonCode = "direct-relationship-question";
  } else if (params.directRecallQuestionKind !== "none") {
    questionType = "direct-fact";
    reasonCode = "direct-memory-question";
  } else if (params.roleSelfIntroPrompt) {
    questionType = "role-self-introduction";
    reasonCode = "role-self-intro-prompt";
  } else if (params.roleCapabilityPrompt) {
    questionType = "role-capability";
    reasonCode = "role-capability-prompt";
  } else if (params.roleBackgroundPrompt) {
    questionType = "role-background";
    reasonCode = "role-background-prompt";
  } else if (params.roleBoundaryPrompt) {
    questionType = "role-boundary";
    reasonCode = "role-boundary-prompt";
  } else if (
    params.relationshipContinuationEdgePrompt &&
    (params.sameThreadContinuity || params.relationshipCarryoverAvailable)
  ) {
    questionType = "fuzzy-follow-up";
    reasonCode = "same-thread-edge-carryover";
    continuationReasonCode = params.continuationReasonCode;
  } else if (params.relationshipStylePrompt) {
    questionType = "open-ended-summary";
    reasonCode = "relationship-answer-shape-prompt";
  } else if (params.openEndedAdviceQuestion) {
    questionType = "open-ended-advice";
    reasonCode = "open-ended-advice-prompt";
  } else if (params.openEndedSummaryQuestion) {
    questionType = "open-ended-summary";
    reasonCode = "open-ended-summary-prompt";
  }

  const strategyRule = getAnswerStrategyRule(questionType);

  return {
    questionType,
    strategy: strategyRule.strategy,
    priority: strategyRule.priority,
    reasonCode,
    continuationReasonCode,
    carryoverPolicy: getAnswerCarryoverPolicy(questionType),
    forbiddenMoves: getAnswerForbiddenMoves(questionType),
    sceneGoal: getAnswerSceneGoal(questionType)
  };
}

export function getAnswerStrategyPriorityLabel(
  priority: AnswerStrategyPriority,
  isZh: boolean
) {
  if (priority === "high-deterministic") {
    return isZh ? "高确定性" : "High deterministic";
  }

  if (priority === "semi-constrained") {
    return isZh ? "半约束" : "Semi-constrained";
  }

  return isZh ? "低确定性" : "Low deterministic";
}
