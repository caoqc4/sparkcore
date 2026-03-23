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
import {
  buildSmokeEnDefaultContinuationReply,
  buildSmokeZhDefaultContinuationReply
} from "@/lib/testing/smoke-continuation-replies";
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
    return buildSmokeZhDefaultContinuationReply({
      content,
      addressStyleValue,
      userName,
      recentAssistantReply
    });
  }

  return buildSmokeEnDefaultContinuationReply({
    content,
    addressStyleValue,
    userName,
    recentAssistantReply
  });
}
