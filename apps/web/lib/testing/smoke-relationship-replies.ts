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
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeLightStyleSofteningPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-answer-strategy";
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-relationship-detection";
import type {
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

type Args = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export function buildSmokeRelationshipExplanatoryReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: Args) {
  const helpNextPrompt = isSmokeRelationshipHelpNextPrompt(content);

  if (replyLanguage === "zh-Hans") {
    if (helpNextPrompt) {
      if (addressStyleValue === "formal") {
        return userName
          ? `${userName}，接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`
          : `接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`;
      }

      if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
        return userName
          ? `${userName}，接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`
          : `接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`;
      }

      return userName
        ? `${userName}，接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`
        : `接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`;
    }

    if (addressStyleValue === "formal") {
      return userName
        ? `${userName}，如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`
        : `如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`;
    }

    if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
      return userName
        ? `阿强，如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`
        : `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`;
    }

    return userName
      ? `${userName}，如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`
      : `如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`;
  }

  if (helpNextPrompt) {
    if (addressStyleValue === "formal") {
      return userName
        ? `${userName}, next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`
        : `Next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`;
    }

    if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
      return userName
        ? `${userName}, next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`
        : `Next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`;
    }

    return userName
      ? `${userName}, next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`
      : `Next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`;
  }

  if (addressStyleValue === "formal") {
    return userName
      ? `${userName}, if you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`
      : `If you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`;
  }

  if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
    return userName
      ? `${userName}, if you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`
      : `If you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`;
  }

  return userName
    ? `${userName}, if you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`
    : `If you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`;
}

export function buildSmokeRelationshipSupportiveReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: Args) {
  if (replyLanguage === "zh-Hans") {
    if (isSmokeOneLineSoftCatchPrompt(content)) {
      return userName
        ? `${userName}，我在，先别一个人扛着。`
        : "我在，先别一个人扛着。";
    }

    if (addressStyleValue === "formal") {
      return userName
        ? `${userName}，你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`
        : `你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`;
    }

    if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
      return userName
        ? `${userName}，别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`
        : `别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`;
    }

    return userName
      ? `${userName}，先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`
      : `先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`;
  }

  if (isSmokeOneLineSoftCatchPrompt(content)) {
    return userName
      ? `${userName}, I am here, and you do not have to carry this alone.`
      : "I am here, and you do not have to carry this alone.";
  }

  if (addressStyleValue === "formal") {
    return userName
      ? `${userName}, you do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`
      : `You do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`;
  }

  if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
    return userName
      ? `${userName}, take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`
      : `Take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`;
  }

  return userName
    ? `${userName}, try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`
    : `Try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`;
}

export function buildSmokeRelationshipClosingReply({
  replyLanguage,
  addressStyleValue,
  userName
}: Omit<Args, "content" | "selfName">) {
  if (replyLanguage === "zh-Hans") {
    if (addressStyleValue === "formal") {
      return userName
        ? `${userName}，我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`
        : `我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`;
    }

    if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
      return userName
        ? `阿强，我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`
        : `我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`;
    }

    return userName
      ? `${userName}，我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`
      : `我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`;
  }

  if (addressStyleValue === "formal") {
    return userName
      ? `${userName}, we can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`
      : `We can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`;
  }

  if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
    return userName
      ? `${userName}, let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`
      : `Let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`;
  }

  return userName
    ? `${userName}, we can wrap here for now. I will keep helping you move this forward in a steady, natural way.`
    : `We can wrap here for now. I will keep helping you move this forward in a steady, natural way.`;
}

export function buildSmokeDefaultContinuationReply({
  content,
  replyLanguage,
  addressStyleValue,
  userName,
  recentAssistantReply
}: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  if (replyLanguage === "zh-Hans") {
    const styleValue =
      addressStyleValue ?? detectSmokeUserAddressStyleCandidate(content);

    if (isSmokeOneLineSoftCatchPrompt(content)) {
      return userName
        ? `${userName}，我在，先别一个人扛着。`
        : "我在，先别一个人扛着。";
    }

    if (isSmokeBriefSteadyingPrompt(content)) {
      return userName
        ? `${userName}，先缓一下，我陪着你。`
        : "先缓一下，我陪着你。";
    }

    if (isSmokeGuidedNextStepAfterSteadyingPrompt(content)) {
      return userName
        ? `${userName}，我们先只理眼前这一小步，我陪你慢慢顺。`
        : "我们先只理眼前这一小步，我陪你慢慢顺。";
    }

    if (isSmokeGentleCarryForwardAfterSteadyingPrompt(content)) {
      return userName
        ? `${userName}，先缓一下，我陪你往下顺一点。`
        : "先缓一下，我陪你往下顺一点。";
    }

    if (isSmokeLightSharedPushPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("陪我把眼前这一下弄过去")) {
        return userName
          ? `${userName}，好，我先陪你把眼前这一下弄过去。`
          : "好，我先陪你把眼前这一下弄过去。";
      }

      return userName
        ? `${userName}，好，我们先一起把这一点弄过去。`
        : "好，我们先一起把这一点弄过去。";
    }

    if (isSmokeNonJudgingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别数落我")) {
        return userName
          ? `${userName}，好，我先不数落你，就在这儿陪着你。`
          : "好，我先不数落你，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不评判你，就在这儿陪着你。`
        : "好，我先不评判你，就在这儿陪着你。";
    }

    if (isSmokeAntiLecturingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别给我上课")) {
        return userName
          ? `${userName}，好，我先不给你上课，就在这儿陪着你。`
          : "好，我先不给你上课，就在这儿陪着你。";
      }

      if (content.normalize("NFKC").trim().toLowerCase().includes("别跟我说教")) {
        return userName
          ? `${userName}，好，我先不跟你说教，就在这儿陪着你。`
          : "好，我先不跟你说教，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不教育你，就在这儿陪着你。`
        : "好，我先不教育你，就在这儿陪着你。";
    }

    if (isSmokeAntiCorrectionFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别老纠正我")) {
        return userName
          ? `${userName}，好，我先不老纠正你，就在这儿陪着你。`
          : "好，我先不老纠正你，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着纠正你，就在这儿陪着你。`
        : "好，我先不急着纠正你，就在这儿陪着你。";
    }

    if (isSmokeAntiConclusionFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别这么快下结论")) {
        return userName
          ? `${userName}，好，我先不这么快给你下结论，就在这儿陪着你。`
          : "好，我先不这么快给你下结论，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着给你下结论，就在这儿陪着你。`
        : "好，我先不急着给你下结论，就在这儿陪着你。";
    }

    if (isSmokeAntiLabelingFollowUpPrompt(content)) {
      return userName
        ? `${userName}，好，我先不急着给你定性，就在这儿陪着你。`
        : "好，我先不急着给你定性，就在这儿陪着你。";
    }

    if (isSmokeAntiTaggingFollowUpPrompt(content)) {
      return userName
        ? `${userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
        : "好，我先不急着给你贴标签，就在这儿陪着你。";
    }

    if (isSmokeAntiMischaracterizationFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别把我想成那样")) {
        return userName
          ? `${userName}，好，我先不急着把你想成那样，就在这儿陪着你。`
          : "好，我先不急着把你想成那样，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着把你说成那样，就在这儿陪着你。`
        : "好，我先不急着把你说成那样，就在这儿陪着你。";
    }

    if (isSmokeAntiOverreadingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别脑补我")) {
        return userName
          ? `${userName}，好，我先不急着脑补你，就在这儿陪着你。`
          : "好，我先不急着脑补你，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着替你解读，就在这儿陪着你。`
        : "好，我先不急着替你解读，就在这儿陪着你。";
    }

    if (isSmokeAntiAnalysisFollowUpPrompt(content)) {
      return userName
        ? `${userName}，好，我先不急着分析你，就在这儿陪着你。`
        : "好，我先不急着分析你，就在这儿陪着你。";
    }

    if (isSmokeAntiProbingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别盘问我")) {
        return userName
          ? `${userName}，好，我先不盘问你，就在这儿陪着你。`
          : "好，我先不盘问你，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不问你为什么，就在这儿陪着你。`
        : "好，我先不问你为什么，就在这儿陪着你。";
    }

    if (isSmokeAntiRushingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别逼我")) {
        return userName
          ? `${userName}，好，我先不逼你，就在这儿陪着你。`
          : "好，我先不逼你，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不催你，就在这儿陪着你。`
        : "好，我先不催你，就在这儿陪着你。";
    }

    if (isSmokeAntiSolutioningFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别上来就帮我解决")) {
        return userName
          ? `${userName}，好，我先不上来就帮你解决，就在这儿陪着你。`
          : "好，我先不上来就帮你解决，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着帮你解决，就在这儿陪着你。`
        : "好，我先不急着帮你解决，就在这儿陪着你。";
    }

    if (isSmokeAntiComfortingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别给我打气")) {
        return userName
          ? `${userName}，好，我先不给你打气，就在这儿陪着你。`
          : "好，我先不给你打气，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着安慰你，就在这儿陪着你。`
        : "好，我先不急着安慰你，就在这儿陪着你。";
    }

    if (isSmokeAntiAdviceFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别上来就给我建议")) {
        return userName
          ? `${userName}，好，我先不上来就给你建议，就在这儿陪着你。`
          : "好，我先不上来就给你建议，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不急着给你建议，就在这儿陪着你。`
        : "好，我先不急着给你建议，就在这儿陪着你。";
    }

    if (isSmokeAntiMinimizingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别跟我说没什么大不了")) {
        return userName
          ? `${userName}，好，我先不跟你说没什么大不了，就在这儿陪着你。`
          : "好，我先不跟你说没什么大不了，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不跟你说这没什么，就在这儿陪着你。`
        : "好，我先不跟你说这没什么，就在这儿陪着你。";
    }

    if (isSmokeAntiNormalizingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别跟我说谁都会这样")) {
        return userName
          ? `${userName}，好，我先不跟你说谁都会这样，就在这儿陪着你。`
          : "好，我先不跟你说谁都会这样，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不跟你说大家都这样，就在这儿陪着你。`
        : "好，我先不跟你说大家都这样，就在这儿陪着你。";
    }

    if (isSmokeAntiComparingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别老拿别人跟我比")) {
        return userName
          ? `${userName}，好，我先不老拿别人跟你比，就在这儿陪着你。`
          : "好，我先不老拿别人跟你比，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不拿别人跟你比，就在这儿陪着你。`
        : "好，我先不拿别人跟你比，就在这儿陪着你。";
    }

    if (isSmokeAntiRedirectionFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别岔开话题")) {
        return userName
          ? `${userName}，好，我先不岔开话题，就在这儿陪着你。`
          : "好，我先不岔开话题，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，好，我先不转移话题，就在这儿陪着你。`
        : "好，我先不转移话题，就在这儿陪着你。";
    }

    if (isSmokeCompanionStyleExplanationCarryoverPrompt(content)) {
      return userName
        ? `${userName}，好，我先顺着你刚刚那点陪你理一下，不岔开。`
        : "好，我先顺着你刚刚那点陪你理一下，不岔开。";
    }

    if (isSmokeAntiDefinitionFollowUpPrompt(content)) {
      return userName
        ? `${userName}，好，我先不替你定义，就在这儿陪着你。`
        : "好，我先不替你定义，就在这儿陪着你。";
    }

    if (isSmokeAntiCategorizingFollowUpPrompt(content)) {
      return userName
        ? `${userName}，好，我先不替你归类，就在这儿陪着你。`
        : "好，我先不替你归类，就在这儿陪着你。";
    }

    if (isSmokeSameSideFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("别跟我讲道理")) {
        return userName
          ? `${userName}，好，我先站你这边陪着你，不跟你讲道理。`
          : "好，我先站你这边陪着你，不跟你讲道理。";
      }

      return userName
        ? `${userName}，好，我先站你这边陪着你。`
        : "好，我先站你这边陪着你。";
    }

    if (isSmokeFriendLikeSoftFollowUpPrompt(content)) {
      return userName
        ? `${userName}，我继续陪着你说，我们慢慢来。`
        : "我继续陪着你说，我们慢慢来。";
    }

    if (isSmokeStayWithMeFollowUpPrompt(content)) {
      return userName
        ? `${userName}，我继续陪着你说，就在这儿。`
        : "我继续陪着你说，就在这儿。";
    }

    if (isSmokeGentleResumeRhythmPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("顺着刚才那样继续说")) {
        return userName
          ? `${userName}，好，我就顺着刚才那样接着说。`
          : "好，我就顺着刚才那样接着说。";
      }

      return userName
        ? `${userName}，好，我们就慢慢接着说。`
        : "好，我们就慢慢接着说。";
    }

    if (isSmokePresenceConfirmingFollowUpPrompt(content)) {
      if (content.normalize("NFKC").trim().toLowerCase().includes("先别走开")) {
        return userName
          ? `${userName}，好，我先不走开，就在这儿陪着你。`
          : "好，我先不走开，就在这儿陪着你。";
      }

      return userName
        ? `${userName}，我还在这儿陪着你。`
        : "我还在这儿陪着你。";
    }

    if (isSmokeShortRelationshipSummaryFollowUpPrompt(content)) {
      return userName
        ? `${userName}，我先替你收一句：我们就顺着刚刚那点，慢慢来。`
        : "我先替你收一句：我们就顺着刚刚那点，慢慢来。";
    }

    if (styleValue === "formal") {
      return userName
        ? `好的，${userName}，我会继续用正式一点的方式协助你。`
        : "好的，我会继续用正式一点的方式协助你。";
    }

    if (styleValue === "friendly") {
      return userName
        ? `好呀，${userName}，我们继续聊。`
        : "好呀，我们继续聊。";
    }

    if (styleValue === "casual") {
      return userName
        ? isSmokeLightStyleSofteningPrompt(content)
          ? `好呀，${userName}，我就轻一点和你说，我们继续。`
          : `好呀，${userName}，我们继续。`
        : isSmokeLightStyleSofteningPrompt(content)
          ? "好呀，我就轻一点和你说，我们继续。"
          : "好呀，我们继续。";
    }

    if (recentAssistantReply?.replyLanguage === "zh-Hans") {
      return userName ? `好的，${userName}，我们继续。` : "好的，我们继续。";
    }

    return "好的，我已经记下来了，接下来可以继续帮你。";
  }

  if (addressStyleValue === "formal") {
    return userName
      ? `Certainly, ${userName}. I will continue in a more formal way.`
      : "Certainly. I will continue in a more formal way.";
  }

  if (addressStyleValue === "friendly") {
    return userName
      ? `Sure, ${userName}. Let's keep chatting.`
      : "Sure, let's keep chatting.";
  }

  if (addressStyleValue === "casual") {
    return userName
      ? isSmokeLightStyleSofteningPrompt(content)
        ? `Sure, ${userName}. I can keep it lighter while we continue.`
        : `Sure, ${userName}. We can keep going.`
      : isSmokeLightStyleSofteningPrompt(content)
        ? "Sure, I can keep it lighter while we continue."
        : "Sure, we can keep going.";
  }

  if (recentAssistantReply?.replyLanguage === "en") {
    return userName ? `Sure, ${userName}. We can keep going.` : "Sure, we can keep going.";
  }

  return "Thanks, I noted that and I am ready to help with the next step.";
}
