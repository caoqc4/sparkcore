import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeBriefSteadyingPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeShortRelationshipSupportivePrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-follow-up-prompts";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeBriefSteadyingPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeShortRelationshipSupportivePrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-follow-up-prompts";

export function isSmokeLightStyleSofteningPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    (normalized.includes("别太正式") &&
      (normalized.includes("轻一点和我说") || normalized.includes("轻一点和我讲"))) ||
    normalized.includes("轻松点和我说就好") ||
    normalized.includes("轻松点和我讲就好")
  );
}

export function isSmokeDirectNamingQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("你叫什么") ||
    normalized.includes("我以后怎么叫你") ||
    normalized.includes("你不是叫") ||
    normalized.includes("what should i call you") ||
    normalized.includes("what do i call you") ||
    normalized.includes("what is your name") ||
    normalized.includes("aren't you called")
  );
}

export function isSmokeDirectUserPreferredNameQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("你该怎么叫我") ||
    normalized.includes("你以后怎么叫我") ||
    normalized.includes("你接下来会怎么叫我") ||
    normalized.includes("你会怎么叫我") ||
    normalized.includes("你接下来会怎么称呼我") ||
    normalized.includes("你会怎么称呼我") ||
    normalized.includes("你应该叫我什么") ||
    normalized.includes("你叫我什么") ||
    normalized.includes("what should you call me") ||
    normalized.includes("what do you call me") ||
    normalized.includes("how should you address me")
  );
}

export function isSmokeBriefGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单和我打个招呼") ||
    normalized.includes("简单和我打个招呼") ||
    normalized.includes("简短和我打个招呼") ||
    normalized.includes("greet me briefly") ||
    normalized.includes("say a quick hello")
  );
}

export function isSmokeSelfIntroGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单介绍一下你自己") ||
    normalized.includes("简单介绍一下你自己") ||
    normalized.includes("先简单介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己吧") ||
    normalized.includes("你先介绍下你自己吧") ||
    normalized.includes("先和我介绍一下你自己") ||
    normalized.includes("简单说说你自己") ||
    normalized.includes("introduce yourself briefly") ||
    normalized.includes("briefly introduce yourself") ||
    normalized.includes("introduce yourself first") ||
    normalized.includes("tell me who you are first")
  );
}

export function isSmokeRelationshipExplanatoryPrompt(content: string) {
  return (
    isSmokeRelationshipHelpNextPrompt(content) ||
    isSmokeRelationshipRoughDayPrompt(content)
  );
}

export function isSmokeRelationshipHelpNextPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("接下来你会怎么帮助我") ||
    normalized.includes("接下来你会怎么帮我继续") ||
    normalized.includes("接下来你会怎么陪我继续") ||
    normalized.includes("你会怎么帮助我") ||
    normalized.includes("那你会怎么帮我继续") ||
    normalized.includes("你会怎么帮我往前推进") ||
    normalized.includes("你会怎么陪我往前走") ||
    normalized.includes("how would you help me continue") ||
    normalized.includes("how would you help me next") ||
    normalized.includes("what will you do next to help me")
  );
}

export function isSmokeRelationshipRoughDayPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("如果我今天状态不太好") ||
    normalized.includes("你会怎么和我说") ||
    normalized.includes("你会怎么解释") ||
    normalized.includes("你会怎么安慰我") ||
    normalized.includes("how would you explain that") ||
    normalized.includes("how would you say that to me") ||
    normalized.includes("if i was having a rough day")
  );
}

export function isSmokeRelationshipSupportivePrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("鼓励我一句") ||
    normalized.includes("安慰我一句") ||
    normalized.includes("安慰我一下") ||
    normalized.includes("轻轻接我一下") ||
    normalized.includes("接住我一下") ||
    normalized.includes("陪陪我") ||
    normalized.includes("支持我一下") ||
    normalized.includes("给我一点鼓励") ||
    normalized.includes("如果我有点慌") ||
    normalized.includes("如果我有点没底") ||
    normalized.includes("give me a little encouragement") ||
    normalized.includes("encourage me a bit") ||
    normalized.includes("comfort me a little") ||
    normalized.includes("if i feel a bit overwhelmed") ||
    normalized.includes("if i am feeling unsure")
  );
}

export function isSmokeRelationshipClosingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}

export function isSmokeShortRelationshipSummaryFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("收一句就行") ||
    normalized.includes("帮我收一句") ||
    normalized.includes("简单收一下") ||
    normalized.includes("收个尾") ||
    normalized.includes("收住就行") ||
    normalized.includes("把这段收一下") ||
    normalized.includes("把这段先收一下") ||
    normalized.includes("再简单介绍一下你自己") ||
    normalized.includes("再简单说一下你自己") ||
    normalized.includes("最后再简单介绍一下你自己") ||
    normalized.includes("最后简单总结一下") ||
    normalized.includes("用两句话总结一下") ||
    normalized.includes("简单说说你会怎么陪我") ||
    normalized.includes("briefly say who you are again") ||
    normalized.includes("give me a short recap") ||
    normalized.includes("wrap this up in one short paragraph")
  );
}

export function isSmokeCompanionStyleExplanationCarryoverPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("简单陪我理一下") ||
    normalized.includes("陪我理一下就行") ||
    normalized.includes("先陪我理一下")
  );
}

export function isSmokeRelationshipAnswerShapePrompt(content: string) {
  return (
    isSmokeSelfIntroGreetingRequest(content) ||
    isSmokeRelationshipSupportivePrompt(content) ||
    isSmokeRelationshipExplanatoryPrompt(content) ||
    isSmokeRelationshipClosingPrompt(content)
  );
}

export function isSmokeDirectPlanningPreferenceQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what planning style do i prefer") ||
    normalized.includes("what kind of planning style do i prefer") ||
    normalized.includes("what kind of weekly planning style would fit me best") ||
    normalized.includes("我喜欢什么样的规划方式") ||
    normalized.includes("我偏好什么样的规划方式")
  );
}

export function isSmokeDirectProfessionQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what profession do you remember") ||
    normalized.includes("what work do you remember") ||
    normalized.includes("what kind of work do i do") ||
    normalized.includes("what do you remember about my work") ||
    normalized.includes("你记得我做什么") ||
    normalized.includes("你记得我的职业") ||
    normalized.includes("你记得我从事什么")
  );
}

export function isSmokeDirectReplyStyleQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what kind of reply style do i prefer") ||
    normalized.includes("what reply style do i prefer") ||
    normalized.includes("what kind of tone do i prefer") ||
    normalized.includes("我喜欢什么样的回复方式") ||
    normalized.includes("我偏好什么样的回复方式") ||
    normalized.includes("我喜欢什么语气") ||
    normalized.includes("我偏好什么语气")
  );
}

export function isSmokeOpenEndedPlanningHelpQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("how should we plan my week") ||
    normalized.includes("how should you help me plan my week") ||
    normalized.includes("given what you know about me") ||
    normalized.includes("结合你记得的内容，怎么帮我规划这周") ||
    normalized.includes("结合你对我的了解") ||
    normalized.includes("你会怎么帮我规划这周") ||
    normalized.includes("给我一个小建议") ||
    normalized.includes("带我往下走吧") ||
    normalized.includes("陪我理一步") ||
    normalized.includes("陪我理一下") ||
    normalized.includes("陪我顺一下")
  );
}

export function isSmokeOpenEndedSummaryQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("summarize what you know about me") ||
    normalized.includes("briefly summarize what you remember") ||
    normalized.includes("简单总结一下你记得的内容") ||
    normalized.includes("简单总结一下你对我的了解")
  );
}

export function isSmokeFuzzyFollowUpQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);
  const normalizedWithoutSpaces = normalized.replace(/\s+/g, "");
  const isShortKeepGoingPrompt = /^好[,，]?继续[。.!！?？]*$/u.test(
    normalizedWithoutSpaces
  );
  const isNaturalKeepTalkingPrompt =
    /^(那|那你|你|嗯|嗯，|嗯,)?继续(说说|讲讲|吧)[。.!！?？]*$/u.test(
      normalizedWithoutSpaces
    );

  return (
    normalized === "那接下来呢？" ||
    normalized === "那接下来呢?" ||
    normalized === "然后呢？" ||
    normalized === "然后呢?" ||
    normalized === "还有呢？" ||
    normalized === "还有呢?" ||
    normalized === "再说一遍。" ||
    normalized === "再说一遍" ||
    normalized === "再确认一次？" ||
    normalized === "再确认一次?" ||
    isShortKeepGoingPrompt ||
    isNaturalKeepTalkingPrompt ||
    normalized === "继续说说。" ||
    normalized === "继续说说" ||
    normalized === "继续讲讲。" ||
    normalized === "继续讲讲" ||
    normalized === "继续吧。" ||
    normalized === "继续吧" ||
    normalized === "ok, then what?" ||
    normalized === "then what?" ||
    normalized === "what next?" ||
    normalized === "and then?" ||
    normalized === "say it again in one short sentence." ||
    normalized === "👍"
  );
}

export function isSmokeRelationshipContinuationEdgePrompt(content: string) {
  return (
    isSmokeFuzzyFollowUpQuestion(content) ||
    isSmokeShortRelationshipSupportivePrompt(content) ||
    isSmokeShortRelationshipSummaryFollowUpPrompt(content) ||
    isSmokeCompanionStyleExplanationCarryoverPrompt(content) ||
    isSmokeOneLineSoftCatchPrompt(content) ||
    isSmokeBriefSteadyingPrompt(content) ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeGuidedNextStepAfterSteadyingPrompt(content)
  );
}

export function getSmokeContinuationReasonCode(
  content: string
): SmokeContinuationReasonCode | null {
  if (
    isSmokeShortRelationshipSupportivePrompt(content) ||
    isSmokeCompanionStyleExplanationCarryoverPrompt(content) ||
    isSmokeBriefSteadyingPrompt(content) ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeGuidedNextStepAfterSteadyingPrompt(content)
  ) {
    return "brief-supportive-carryover";
  }

  if (isSmokeShortRelationshipSummaryFollowUpPrompt(content)) {
    return "brief-summary-carryover";
  }

  if (isSmokeFuzzyFollowUpQuestion(content)) {
    return "short-fuzzy-follow-up";
  }

  return null;
}

export function getSmokeAnswerStrategy({
  content,
  sameThreadContinuity,
  relationshipStylePrompt,
  relationshipCarryoverAvailable
}: {
  content: string;
  sameThreadContinuity: boolean;
  relationshipStylePrompt: boolean;
  relationshipCarryoverAvailable: boolean;
}) {
  const directNamingQuestion = isSmokeDirectNamingQuestion(content);
  const directPreferredNameQuestion =
    isSmokeDirectUserPreferredNameQuestion(content);
  const directFactQuestion =
    isSmokeDirectProfessionQuestion(content) ||
    isSmokeDirectPlanningPreferenceQuestion(content) ||
    isSmokeDirectReplyStyleQuestion(content);

  if (directNamingQuestion || directPreferredNameQuestion) {
    return {
      questionType: "direct-relationship-confirmation" as SmokeAnswerQuestionType,
      answerStrategy: "relationship-recall-first" as SmokeAnswerStrategy,
      reasonCode: "direct-relationship-question" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (directFactQuestion) {
    return {
      questionType: "direct-fact" as SmokeAnswerQuestionType,
      answerStrategy: "structured-recall-first" as SmokeAnswerStrategy,
      reasonCode: "direct-memory-question" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (
    isSmokeRelationshipContinuationEdgePrompt(content) &&
    (sameThreadContinuity || relationshipCarryoverAvailable)
  ) {
    return {
      questionType: "fuzzy-follow-up" as SmokeAnswerQuestionType,
      answerStrategy: "same-thread-continuation" as SmokeAnswerStrategy,
      reasonCode: "same-thread-edge-carryover" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: getSmokeContinuationReasonCode(content)
    };
  }

  if (relationshipStylePrompt) {
    return {
      questionType: "open-ended-summary" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-summary" as SmokeAnswerStrategy,
      reasonCode: "relationship-answer-shape-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (isSmokeOpenEndedPlanningHelpQuestion(content)) {
    return {
      questionType: "open-ended-advice" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-advice" as SmokeAnswerStrategy,
      reasonCode: "open-ended-advice-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (isSmokeOpenEndedSummaryQuestion(content)) {
    return {
      questionType: "open-ended-summary" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-summary" as SmokeAnswerStrategy,
      reasonCode: "open-ended-summary-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  return {
    questionType: "other" as SmokeAnswerQuestionType,
    answerStrategy: "default-grounded" as SmokeAnswerStrategy,
    reasonCode: "default-grounded-fallback" as SmokeAnswerStrategyReasonCode,
    continuationReasonCode: null as SmokeContinuationReasonCode | null
  };
}
