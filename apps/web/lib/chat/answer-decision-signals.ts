import type {
  ContinuationReasonCode,
  DirectRecallQuestionKind
} from "@/lib/chat/answer-decision";

export type AnswerDecisionSignals = {
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
};

export function isRelationshipStylePrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("请简单介绍一下你自己") ||
    normalized.includes("简单介绍一下你自己") ||
    normalized.includes("先简单介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己吧") ||
    normalized.includes("你先介绍下你自己") ||
    normalized.includes("你先介绍下你自己吧") ||
    normalized.includes("先和我介绍一下你自己") ||
    normalized.includes("简单说说你自己") ||
    normalized.includes("请简单和我打个招呼") ||
    normalized.includes("简单和我打个招呼") ||
    normalized.includes("简短和我打个招呼") ||
    normalized.includes("introduce yourself briefly") ||
    normalized.includes("briefly introduce yourself") ||
    normalized.includes("introduce yourself first") ||
    normalized.includes("tell me who you are first") ||
    normalized.includes("greet me briefly") ||
    normalized.includes("say a quick hello")
  );
}

export function isRelationshipHelpNextPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

export function isRelationshipRoughDayPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

export function isRelationshipExplanatoryPrompt(content: string) {
  return (
    isRelationshipHelpNextPrompt(content) ||
    isRelationshipRoughDayPrompt(content)
  );
}

export function isRelationshipClosingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}

export function isRelationshipAnswerShapePrompt(content: string) {
  return (
    isRelationshipStylePrompt(content) ||
    isRelationshipSupportivePrompt(content) ||
    isRelationshipExplanatoryPrompt(content) ||
    isRelationshipClosingPrompt(content)
  );
}

export function isLightStyleSofteningPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    (normalized.includes("别太正式") &&
      (normalized.includes("轻一点和我说") ||
        normalized.includes("轻一点和我讲"))) ||
    normalized.includes("轻松点和我说就好") ||
    normalized.includes("轻松点和我讲就好")
  );
}

export function isRoleSelfIntroPrompt(args: {
  relationshipStylePrompt: boolean;
}) {
  return args.relationshipStylePrompt;
}

export function isRoleCapabilityPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  if (
    normalized.includes("接下来") ||
    normalized.includes("下一步") ||
    normalized.includes("继续") ||
    normalized.includes("推进") ||
    normalized.includes("往前") ||
    normalized.includes("今天状态不太好") ||
    normalized.includes("rough day")
  ) {
    return false;
  }

  return (
    normalized.includes("你平时会怎么帮我") ||
    normalized.includes("你平时怎么帮我") ||
    normalized.includes("你一般会怎么帮我") ||
    normalized.includes("你通常会怎么帮我") ||
    normalized.includes("你平时会怎么帮助我") ||
    normalized.includes("你一般会怎么帮助我") ||
    normalized.includes("你通常会怎么帮助我") ||
    normalized.includes("平时你会怎么帮我") ||
    normalized.includes("平时你怎么帮我") ||
    normalized.includes("what do you usually help me with") ||
    normalized.includes("how do you usually help me") ||
    normalized.includes("how would you usually help me") ||
    normalized.includes("what kind of help do you usually offer")
  );
}

export function isRoleBackgroundPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("简单说说你的背景") ||
    normalized.includes("简单讲讲你的背景") ||
    normalized.includes("说说你的背景") ||
    normalized.includes("讲讲你的背景") ||
    normalized.includes("你的背景是什么") ||
    normalized.includes("你是什么背景") ||
    normalized.includes("你是什么来历") ||
    normalized.includes("简单介绍一下你的背景") ||
    normalized.includes("briefly tell me your background") ||
    normalized.includes("tell me your background") ||
    normalized.includes("what is your background")
  );
}

export function isRoleBoundaryPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("你能做什么，不能做什么") ||
    normalized.includes("你能做什么和不能做什么") ||
    normalized.includes("你能做什么不能做什么") ||
    normalized.includes("你能做什么，不能做什么？") ||
    normalized.includes("你能做什么不能做什么？") ||
    normalized.includes("你能做什么") ||
    normalized.includes("你不能做什么") ||
    normalized.includes("你的边界是什么") ||
    normalized.includes("what can you do and what can you not do") ||
    normalized.includes("what can you do") ||
    normalized.includes("what can't you do") ||
    normalized.includes("what are your boundaries")
  );
}

export function isRelationshipSupportivePrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

export function isShortRelationshipSupportivePrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("鼓励我一句") ||
    normalized.includes("安慰我一句") ||
    normalized.includes("安慰我一下") ||
    normalized.includes("轻轻接我一下") ||
    normalized.includes("接住我一下") ||
    normalized.includes("回我一句就好") ||
    normalized.includes("缓一下，再说") ||
    isGentleCarryForwardAfterSteadyingPrompt(content) ||
    isLightSharedPushPrompt(content) ||
    isNonJudgingFollowUpPrompt(content) ||
    isAntiLecturingFollowUpPrompt(content) ||
    isAntiCorrectionFollowUpPrompt(content) ||
    isAntiConclusionFollowUpPrompt(content) ||
    isAntiLabelingFollowUpPrompt(content) ||
    isAntiTaggingFollowUpPrompt(content) ||
    isAntiMischaracterizationFollowUpPrompt(content) ||
    isAntiOverreadingFollowUpPrompt(content) ||
    isAntiAnalysisFollowUpPrompt(content) ||
    isAntiProbingFollowUpPrompt(content) ||
    isAntiRushingFollowUpPrompt(content) ||
    isAntiSolutioningFollowUpPrompt(content) ||
    isAntiComfortingFollowUpPrompt(content) ||
    isAntiAdviceFollowUpPrompt(content) ||
    isAntiMinimizingFollowUpPrompt(content) ||
    isAntiNormalizingFollowUpPrompt(content) ||
    isAntiComparingFollowUpPrompt(content) ||
    isAntiRedirectionFollowUpPrompt(content) ||
    isAntiDefinitionFollowUpPrompt(content) ||
    isAntiCategorizingFollowUpPrompt(content) ||
    isSameSideFollowUpPrompt(content) ||
    isFriendLikeSoftFollowUpPrompt(content) ||
    isStayWithMeFollowUpPrompt(content) ||
    isGentleResumeRhythmPrompt(content) ||
    isPresenceConfirmingFollowUpPrompt(content) ||
    normalized.includes("支持我一下") ||
    normalized.includes("给我一点鼓励") ||
    normalized.includes("give me a little encouragement") ||
    normalized.includes("encourage me a bit") ||
    normalized.includes("comfort me a little")
  );
}

export function isOneLineSoftCatchPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("回我一句就好");
}

export function isBriefSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("缓一下") && normalized.includes("再说");
}

export function isGentleCarryForwardAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("缓一下") &&
    normalized.includes("再陪我往下走一点")
  );
}

export function isGuidedNextStepAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("陪我理一步");
}

export function isLightSharedPushPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("一起把这一点弄过去") ||
    normalized.includes("陪我把眼前这一下弄过去")
  );
}

export function isNonJudgingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别评判我") || normalized.includes("别数落我");
}

export function isAntiLecturingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别教育我") ||
    normalized.includes("别给我上课") ||
    normalized.includes("别跟我说教")
  );
}

export function isAntiCorrectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着纠正我") ||
    normalized.includes("别老纠正我")
  );
}

export function isAntiConclusionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我下结论") ||
    normalized.includes("别这么快下结论")
  );
}

export function isAntiLabelingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我定性") ||
    normalized.includes("别急着给我定性")
  );
}

export function isAntiTaggingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我贴标签") ||
    normalized.includes("别急着给我贴标签")
  );
}

export function isAntiMischaracterizationFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别把我说成那样") ||
    normalized.includes("别把我想成那样")
  );
}

export function isAntiOverreadingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别替我解读") || normalized.includes("别脑补我");
}

export function isAntiAnalysisFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着分析我") ||
    normalized.includes("别上来就分析我")
  );
}

export function isAntiProbingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别问我为什么") ||
    normalized.includes("别追着问我") ||
    normalized.includes("别盘问我")
  );
}

export function isAntiRushingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别催我") || normalized.includes("别逼我");
}

export function isAntiSolutioningFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着帮我解决") ||
    normalized.includes("别上来就帮我解决")
  );
}

export function isAntiComfortingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着安慰我") ||
    normalized.includes("别给我打气")
  );
}

export function isAntiAdviceFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着给我建议") ||
    normalized.includes("别上来就给我建议")
  );
}

export function isAntiMinimizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说这没什么") ||
    normalized.includes("别跟我说没什么大不了")
  );
}

export function isAntiNormalizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说大家都这样") ||
    normalized.includes("别跟我说谁都会这样")
  );
}

export function isAntiComparingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别拿别人跟我比") ||
    normalized.includes("别老拿别人跟我比")
  );
}

export function isAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}

export function isAntiDefinitionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别替我定义") ||
    normalized.includes("别替我下定义")
  );
}

export function isAntiCategorizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别替我归类");
}

export function isSameSideFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("站我这边") ||
    (normalized.includes("别跟我讲道理") && normalized.includes("站我这边"))
  );
}

export function isFriendLikeSoftFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪我说一句");
}

export function isStayWithMeFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪着我说就行");
}

export function isGentleResumeRhythmPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("慢慢继续和我说") ||
    normalized.includes("顺着刚才那样继续说")
  );
}

export function isPresenceConfirmingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("还在这儿陪我") ||
    normalized.includes("先别走开")
  );
}

export function isShortRelationshipSummaryFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

export function isOpenEndedAdviceQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("how should we plan my week") ||
    normalized.includes("how should you help me plan my week") ||
    normalized.includes("given what you know about me") ||
    normalized.includes("what should i do next") ||
    normalized.includes("what would you suggest next") ||
    normalized.includes("结合你记得的内容，怎么帮我规划这周") ||
    normalized.includes("结合你对我的了解") ||
    normalized.includes("你会怎么帮我规划这周") ||
    normalized.includes("你会怎么帮助我") ||
    normalized.includes("接下来你会怎么帮助我") ||
    normalized.includes("接下来我该怎么做") ||
    normalized.includes("下一步我该怎么做") ||
    normalized.includes("给我一个小建议") ||
    normalized.includes("我现在该先做什么") ||
    normalized.includes("那我该从哪开始") ||
    normalized.includes("你会怎么陪我推进") ||
    normalized.includes("那你会怎么帮我继续") ||
    normalized.includes("带我往下走吧") ||
    normalized.includes("陪我理一步") ||
    normalized.includes("陪我理一下") ||
    normalized.includes("陪我顺一下") ||
    normalized.includes("下一步先做什么") ||
    normalized.includes("where should i start") ||
    normalized.includes("what should i tackle first") ||
    normalized.includes("what should i do first") ||
    normalized.includes("how should we move this forward") ||
    normalized.includes("how would you help me continue") ||
    normalized.includes("what would be a good next step")
  );
}

export function isOpenEndedSummaryQuestion(args: {
  content: string;
  relationshipStylePrompt: boolean;
}) {
  const normalized = args.content.normalize("NFKC").trim().toLowerCase();

  return (
    args.relationshipStylePrompt ||
    normalized.includes("summarize what you know about me") ||
    normalized.includes("briefly summarize what you remember") ||
    normalized.includes("give me a short recap") ||
    normalized.includes("briefly say who you are again") ||
    normalized.includes("sum up what you know about me") ||
    normalized.includes("wrap this up in one short paragraph") ||
    normalized.includes("简单总结一下你记得的内容") ||
    normalized.includes("简单总结一下你对我的了解") ||
    normalized.includes("再简单介绍一下你自己") ||
    normalized.includes("再简单说一下你自己") ||
    normalized.includes("用两句话总结一下") ||
    normalized.includes("最后简单总结一下") ||
    normalized.includes("简单说说你会怎么陪我") ||
    normalized.includes("最后再简单介绍一下你自己")
  );
}

export function isFuzzyFollowUpQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();
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
    normalized === "say it again in one short sentence."
  );
}

export function isCompanionStyleExplanationCarryoverPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("简单陪我理一下") ||
    normalized.includes("陪我理一下就行") ||
    normalized.includes("先陪我理一下")
  );
}

export function isRelationshipContinuationEdgePrompt(args: {
  fuzzyFollowUpQuestion: boolean;
  shortRelationshipSupportivePrompt: boolean;
  shortRelationshipSummaryFollowUpPrompt: boolean;
  companionStyleExplanationCarryoverPrompt: boolean;
  oneLineSoftCatchPrompt: boolean;
  briefSteadyingPrompt: boolean;
  gentleCarryForwardAfterSteadyingPrompt: boolean;
  guidedNextStepAfterSteadyingPrompt: boolean;
}) {
  return (
    args.fuzzyFollowUpQuestion ||
    args.shortRelationshipSupportivePrompt ||
    args.shortRelationshipSummaryFollowUpPrompt ||
    args.companionStyleExplanationCarryoverPrompt ||
    args.oneLineSoftCatchPrompt ||
    args.briefSteadyingPrompt ||
    args.gentleCarryForwardAfterSteadyingPrompt ||
    args.guidedNextStepAfterSteadyingPrompt
  );
}

export function getDirectRecallQuestionKind(
  normalizedUserMessage: string
): DirectRecallQuestionKind {
  if (
    normalizedUserMessage.includes("what kind of reply style do i prefer") ||
    normalizedUserMessage.includes("what reply style do i prefer") ||
    normalizedUserMessage.includes("what kind of tone do i prefer") ||
    normalizedUserMessage.includes("我喜欢什么样的回复方式") ||
    normalizedUserMessage.includes("我偏好什么样的回复方式") ||
    normalizedUserMessage.includes("我喜欢什么语气") ||
    normalizedUserMessage.includes("我偏好什么语气")
  ) {
    return "reply-style";
  }

  if (
    normalizedUserMessage.includes("what profession do you remember") ||
    normalizedUserMessage.includes("what work do you remember") ||
    normalizedUserMessage.includes("what kind of work do i do") ||
    normalizedUserMessage.includes("what do you remember about my work") ||
    normalizedUserMessage.includes("你记得我做什么") ||
    normalizedUserMessage.includes("你记得我的职业") ||
    normalizedUserMessage.includes("你记得我从事什么")
  ) {
    return "profession";
  }

  if (
    normalizedUserMessage.includes(
      "what kind of weekly planning style would fit me best"
    ) ||
    normalizedUserMessage.includes("what planning style do i prefer") ||
    normalizedUserMessage.includes("what kind of planning style do i prefer") ||
    normalizedUserMessage.includes("我喜欢什么样的规划方式") ||
    normalizedUserMessage.includes("我偏好什么样的规划方式")
  ) {
    return "planning-style";
  }

  if (
    normalizedUserMessage.includes("what do you remember") ||
    normalizedUserMessage.includes("if you do not know, say you do not know") ||
    normalizedUserMessage.includes("如果你不知道") ||
    normalizedUserMessage.includes("你记得") ||
    normalizedUserMessage.includes("你还记得")
  ) {
    return "generic-memory";
  }

  return "none";
}

export function getContinuationReasonCode(args: {
  content: string;
  shortRelationshipSupportivePrompt: boolean;
  companionStyleExplanationCarryoverPrompt: boolean;
  briefSteadyingPrompt: boolean;
  gentleCarryForwardAfterSteadyingPrompt: boolean;
  guidedNextStepAfterSteadyingPrompt: boolean;
  shortRelationshipSummaryFollowUpPrompt: boolean;
  fuzzyFollowUpQuestion: boolean;
}): ContinuationReasonCode | null {
  if (
    args.shortRelationshipSupportivePrompt ||
    args.companionStyleExplanationCarryoverPrompt ||
    args.briefSteadyingPrompt ||
    args.gentleCarryForwardAfterSteadyingPrompt ||
    args.guidedNextStepAfterSteadyingPrompt
  ) {
    return "brief-supportive-carryover";
  }

  if (args.shortRelationshipSummaryFollowUpPrompt) {
    return "brief-summary-carryover";
  }

  if (args.fuzzyFollowUpQuestion) {
    return "short-fuzzy-follow-up";
  }

  return null;
}

export function buildAnswerDecisionSignals(args: {
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
}): AnswerDecisionSignals {
  return {
    directRecallQuestionKind: args.directRecallQuestionKind,
    directNamingQuestion: args.directNamingQuestion,
    directPreferredNameQuestion: args.directPreferredNameQuestion,
    roleSelfIntroPrompt: args.roleSelfIntroPrompt,
    roleCapabilityPrompt: args.roleCapabilityPrompt,
    roleBackgroundPrompt: args.roleBackgroundPrompt,
    roleBoundaryPrompt: args.roleBoundaryPrompt,
    relationshipContinuationEdgePrompt:
      args.relationshipContinuationEdgePrompt,
    relationshipStylePrompt: args.relationshipStylePrompt,
    openEndedAdviceQuestion: args.openEndedAdviceQuestion,
    openEndedSummaryQuestion: args.openEndedSummaryQuestion,
    sameThreadContinuity: args.sameThreadContinuity,
    relationshipCarryoverAvailable: args.relationshipCarryoverAvailable,
    continuationReasonCode: args.continuationReasonCode
  };
}
