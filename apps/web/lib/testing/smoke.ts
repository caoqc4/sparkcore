import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { loadThreadMessages } from "@/lib/chat/message-read";
import {
  loadRecentOwnedMemories,
  loadOwnedMemoryItemByTypeAndContent,
  loadOwnedRelationshipMemoryByValue
} from "@/lib/chat/memory-item-read";
import { insertMessage } from "@/lib/chat/message-persistence";
import {
  insertMemoryItem,
  updateMemoryItem
} from "@/lib/chat/memory-item-persistence";
import { buildThreadActivityPatch } from "@/lib/chat/thread-activity";
import {
  loadActiveModelProfileById,
  createOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedActiveAgentByName,
  loadOwnedThread,
  updateOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-seed-persistence";
import {
  ensureSmokeModelProfiles,
  ensureSmokeUser,
  getSmokeAdminClient,
  resetSmokeWorkspaceState,
  seedSmokeAgents,
  type SmokeConfig,
  type SmokeUser
} from "@/lib/testing/smoke-runtime-state";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";
import {
  buildSmokeAssistantMetadata,
  buildSmokeRoleCorePacket,
  type SmokeAnswerQuestionType,
  type SmokeAnswerStrategy,
  type SmokeAnswerStrategyReasonCode,
  type SmokeApproxContextPressure,
  type SmokeContinuationReasonCode,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource,
  type SmokeRoleCorePacket
} from "@/lib/testing/smoke-assistant-builders";
import {
  detectSmokeNicknameCandidate,
  detectSmokeUserAddressStyleCandidate,
  detectSmokeUserPreferredNameCandidate
} from "@/lib/testing/smoke-relationship-detection";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke-config";
import { createSmokeLoginResponse } from "@/lib/testing/smoke-login";
import {
  detectSmokeReplyLanguage,
  getSmokeApproxContextPressure,
  getSmokeRecentAssistantReply,
  getSmokeRecentRuntimeMessages,
  resolveSmokeReplyLanguage,
  type SmokeContinuityReply
} from "@/lib/testing/smoke-reply-analysis";
import {
  buildMemoryV2Fields,
  inferLegacyMemoryStability,
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid,
  LEGACY_MEMORY_KEY
} from "@/lib/chat/memory-v2";

const SMOKE_MODEL_PROFILES = getSmokeModelProfiles();

export { getSmokeConfig, isAuthorizedSmokeRequest };

type SmokeThread = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  agent_id: string | null;
  title: string;
};

function buildSmokeRelationshipSeedMetadata(relationKind: string) {
  return buildSmokeSeedMetadata({
    relation_kind: relationKind
  });
}

function isSmokeMemoryApplicableToThread({
  memory,
  agentId,
  threadId
}: {
  memory: {
    scope?: string | null;
    target_agent_id?: string | null;
    target_thread_id?: string | null;
  };
  agentId: string;
  threadId: string;
}) {
  if (!isMemoryScopeValid(memory)) {
    return false;
  }

  if (memory.scope === "user_agent") {
    return memory.target_agent_id === agentId;
  }

  if (memory.scope === "thread_local") {
    return memory.target_thread_id === threadId;
  }

  return true;
}

export async function resetSmokeState() {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
    );
  }

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config, {
    resetPassword: true
  });
  const modelProfiles = await ensureSmokeModelProfiles(admin);

  await resetSmokeWorkspaceState(admin, smokeUser);
  await seedSmokeAgents(admin, smokeUser, modelProfiles);

  return {
    workspaceId: smokeUser.workspaceId,
    smokeEmail: smokeUser.email
  };
}

export async function createSmokeThread({
  agentName
}: {
  agentName: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke thread creation requires the smoke env vars and service role key."
    );
  }

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);

  const { data: agent, error: agentError } = await loadOwnedActiveAgentByName({
    supabase: admin,
    agentName,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? `Smoke agent "${agentName}" is unavailable.`
    );
  }

  const { data: thread, error: threadError } = await createOwnedThread({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: agent.id
  });

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "Failed to create the smoke test thread."
    );
  }

  return {
    threadId: thread.id
  };
}

function isSmokeLightStyleSofteningPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    (normalized.includes("别太正式") &&
      (normalized.includes("轻一点和我说") || normalized.includes("轻一点和我讲"))) ||
    normalized.includes("轻松点和我说就好") ||
    normalized.includes("轻松点和我讲就好")
  );
}

function isSmokeDirectNamingQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeDirectUserPreferredNameQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeBriefGreetingRequest(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("请简单和我打个招呼") ||
    normalized.includes("简单和我打个招呼") ||
    normalized.includes("简短和我打个招呼") ||
    normalized.includes("greet me briefly") ||
    normalized.includes("say a quick hello")
  );
}

function isSmokeSelfIntroGreetingRequest(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeRelationshipExplanatoryPrompt(content: string) {
  return (
    isSmokeRelationshipHelpNextPrompt(content) ||
    isSmokeRelationshipRoughDayPrompt(content)
  );
}

function isSmokeRelationshipHelpNextPrompt(content: string) {
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

function isSmokeRelationshipRoughDayPrompt(content: string) {
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

function isSmokeRelationshipSupportivePrompt(content: string) {
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

function isSmokeShortRelationshipSupportivePrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("鼓励我一句") ||
    normalized.includes("安慰我一句") ||
    normalized.includes("安慰我一下") ||
    normalized.includes("轻轻接我一下") ||
    normalized.includes("接住我一下") ||
    normalized.includes("回我一句就好") ||
    normalized.includes("缓一下，再说") ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeLightSharedPushPrompt(content) ||
    isSmokeNonJudgingFollowUpPrompt(content) ||
    isSmokeAntiLecturingFollowUpPrompt(content) ||
    isSmokeAntiCorrectionFollowUpPrompt(content) ||
    isSmokeAntiConclusionFollowUpPrompt(content) ||
    isSmokeAntiLabelingFollowUpPrompt(content) ||
    isSmokeAntiTaggingFollowUpPrompt(content) ||
    isSmokeAntiMischaracterizationFollowUpPrompt(content) ||
    isSmokeAntiOverreadingFollowUpPrompt(content) ||
    isSmokeAntiAnalysisFollowUpPrompt(content) ||
    isSmokeAntiProbingFollowUpPrompt(content) ||
    isSmokeAntiRushingFollowUpPrompt(content) ||
    isSmokeAntiSolutioningFollowUpPrompt(content) ||
    isSmokeAntiComfortingFollowUpPrompt(content) ||
    isSmokeAntiAdviceFollowUpPrompt(content) ||
    isSmokeAntiMinimizingFollowUpPrompt(content) ||
    isSmokeAntiNormalizingFollowUpPrompt(content) ||
    isSmokeAntiComparingFollowUpPrompt(content) ||
    isSmokeAntiRedirectionFollowUpPrompt(content) ||
    isSmokeAntiDefinitionFollowUpPrompt(content) ||
    isSmokeAntiCategorizingFollowUpPrompt(content) ||
    isSmokeSameSideFollowUpPrompt(content) ||
    isSmokeFriendLikeSoftFollowUpPrompt(content) ||
    isSmokeStayWithMeFollowUpPrompt(content) ||
    isSmokeGentleResumeRhythmPrompt(content) ||
    isSmokePresenceConfirmingFollowUpPrompt(content) ||
    normalized.includes("支持我一下") ||
    normalized.includes("给我一点鼓励") ||
    normalized.includes("give me a little encouragement") ||
    normalized.includes("encourage me a bit") ||
    normalized.includes("comfort me a little")
  );
}

function isSmokeOneLineSoftCatchPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("回我一句就好");
}

function isSmokeBriefSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("缓一下") && normalized.includes("再说");
}

function isSmokeGentleCarryForwardAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("缓一下") &&
    normalized.includes("再陪我往下走一点")
  );
}

function isSmokeGuidedNextStepAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("陪我理一步");
}

function isSmokeLightSharedPushPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("一起把这一点弄过去") ||
    normalized.includes("陪我把眼前这一下弄过去")
  );
}

function isSmokeNonJudgingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别评判我") ||
    normalized.includes("别数落我")
  );
}

function isSmokeAntiLecturingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别教育我") ||
    normalized.includes("别给我上课") ||
    normalized.includes("别跟我说教")
  );
}

function isSmokeAntiCorrectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着纠正我") ||
    normalized.includes("别老纠正我")
  );
}

function isSmokeAntiConclusionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我下结论") ||
    normalized.includes("别这么快下结论")
  );
}

function isSmokeAntiLabelingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我定性") ||
    normalized.includes("别急着给我定性")
  );
}

function isSmokeAntiTaggingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我贴标签") ||
    normalized.includes("别急着给我贴标签")
  );
}

function isSmokeAntiMischaracterizationFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别把我说成那样") ||
    normalized.includes("别把我想成那样")
  );
}

function isSmokeAntiOverreadingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别替我解读") ||
    normalized.includes("别脑补我")
  );
}

function isSmokeAntiAnalysisFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着分析我") ||
    normalized.includes("别上来就分析我")
  );
}

function isSmokeAntiProbingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别问我为什么") ||
    normalized.includes("别追着问我") ||
    normalized.includes("别盘问我")
  );
}

function isSmokeAntiRushingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别催我") ||
    normalized.includes("别逼我")
  );
}

function isSmokeAntiSolutioningFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着帮我解决") ||
    normalized.includes("别上来就帮我解决")
  );
}

function isSmokeAntiComfortingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着安慰我") ||
    normalized.includes("别给我打气")
  );
}

function isSmokeAntiAdviceFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着给我建议") ||
    normalized.includes("别上来就给我建议")
  );
}

function isSmokeAntiMinimizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说这没什么") ||
    normalized.includes("别跟我说没什么大不了")
  );
}

function isSmokeAntiNormalizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说大家都这样") ||
    normalized.includes("别跟我说谁都会这样")
  );
}

function isSmokeAntiComparingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别拿别人跟我比") ||
    normalized.includes("别老拿别人跟我比")
  );
}

function isSmokeAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}

function isSmokeAntiDefinitionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别替我定义") ||
    normalized.includes("别替我下定义")
  );
}

function isSmokeAntiCategorizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别替我归类");
}

function isSmokeSameSideFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("站我这边") ||
    (normalized.includes("别跟我讲道理") && normalized.includes("站我这边"))
  );
}

function isSmokeFriendLikeSoftFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪我说一句");
}

function isSmokeStayWithMeFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪着我说就行");
}

function isSmokeGentleResumeRhythmPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("慢慢继续和我说") ||
    normalized.includes("顺着刚才那样继续说")
  );
}

function isSmokePresenceConfirmingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("还在这儿陪我") ||
    normalized.includes("先别走开")
  );
}

function isSmokeRelationshipClosingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}

function isSmokeShortRelationshipSummaryFollowUpPrompt(content: string) {
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

function isSmokeCompanionStyleExplanationCarryoverPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("简单陪我理一下") ||
    normalized.includes("陪我理一下就行") ||
    normalized.includes("先陪我理一下")
  );
}

function isSmokeRelationshipAnswerShapePrompt(content: string) {
  return (
    isSmokeSelfIntroGreetingRequest(content) ||
    isSmokeRelationshipSupportivePrompt(content) ||
    isSmokeRelationshipExplanatoryPrompt(content) ||
    isSmokeRelationshipClosingPrompt(content)
  );
}

function isSmokeDirectPlanningPreferenceQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("what planning style do i prefer") ||
    normalized.includes("what kind of planning style do i prefer") ||
    normalized.includes("what kind of weekly planning style would fit me best") ||
    normalized.includes("我喜欢什么样的规划方式") ||
    normalized.includes("我偏好什么样的规划方式")
  );
}

function isSmokeDirectProfessionQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeDirectReplyStyleQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeOpenEndedPlanningHelpQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

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

function isSmokeOpenEndedSummaryQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("summarize what you know about me") ||
    normalized.includes("briefly summarize what you remember") ||
    normalized.includes("简单总结一下你记得的内容") ||
    normalized.includes("简单总结一下你对我的了解")
  );
}

function isSmokeFuzzyFollowUpQuestion(content: string) {
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
    normalized === "say it again in one short sentence." ||
    normalized === "👍"
  );
}

function isSmokeRelationshipContinuationEdgePrompt(content: string) {
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

function getSmokeContinuationReasonCode(
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

function getSmokeAnswerStrategy({
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

function buildSmokeAssistantReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
  recentAssistantReply,
  recalledMemories,
  agentName,
  addressStyleMemory,
  nicknameMemory,
  preferredNameMemory
}: {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  modelProfileName: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  nicknameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  preferredNameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
}) {
  const normalized = content.toLowerCase();
  const rememberedProfession = recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  if (normalized.includes("reply in one sentence with a quick hello")) {
    return replyLanguage === "zh-Hans"
      ? `你好，我是通过 ${modelProfileName} 回复的 SparkCore。`
      : `Hello from SparkCore via ${modelProfileName}.`;
  }

  if (isSmokeSelfIntroGreetingRequest(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      const greeting =
        styleValue === "formal"
          ? userName
            ? `您好，${userName}。`
            : "您好。"
          : styleValue === "friendly"
            ? userName
              ? `嗨，${userName}。`
              : "嗨，朋友。"
            : styleValue === "casual"
              ? userName
                ? `嗨，${userName}。`
                : "嗨。"
              : userName
                ? `你好，${userName}。`
                : "你好。";

      const intro =
        nicknameMemory || styleValue === "friendly"
          ? `我是${selfName}，很高兴继续和你聊。`
          : `我是${selfName}，很高兴继续为你提供帮助。`;

      return `${greeting} ${intro}`;
    }

    const greeting =
      styleValue === "formal"
        ? userName
          ? `Hello, ${userName}.`
          : "Hello."
        : styleValue === "friendly"
          ? userName
            ? `Hey, ${userName}.`
            : "Hey, friend."
          : styleValue === "casual"
            ? userName
              ? `Hey, ${userName}.`
              : "Hey."
            : userName
              ? `Hello, ${userName}.`
              : "Hello.";

    const intro =
      nicknameMemory || styleValue === "friendly"
        ? `I am ${selfName}, and it is good to keep chatting with you.`
        : `I am ${selfName}, and I am glad to keep helping you.`;

    return `${greeting} ${intro}`;
  }

  if (isSmokeBriefGreetingRequest(content)) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (styleValue === "formal") {
      return replyLanguage === "zh-Hans"
        ? "您好，很高兴继续为您提供帮助。"
        : "Hello, I am glad to continue assisting you.";
    }

    if (styleValue === "friendly") {
      return replyLanguage === "zh-Hans"
        ? "嗨，朋友，很高兴又见到你。"
        : "Hey friend, it is good to see you again.";
    }

    if (styleValue === "casual") {
      return replyLanguage === "zh-Hans"
        ? "嗨，很高兴继续和你聊。"
        : "Hey, good to keep chatting with you.";
    }

    return replyLanguage === "zh-Hans"
      ? "你好，很高兴见到你。"
      : "Hello, it is good to see you.";
  }

  if (
    normalized.includes("product designer") &&
    normalized.includes("concise weekly planning")
  ) {
    return replyLanguage === "zh-Hans"
      ? "谢谢，我知道你是一名产品设计师，并且偏好简洁的每周规划方式。"
      : "Thanks. I understand that you work as a product designer and prefer concise weekly planning.";
  }

  if (isSmokeDirectProfessionQuestion(content)) {
    if (!rememberedProfession) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return replyLanguage === "zh-Hans"
      ? "我记得你是一名产品设计师。"
      : "I remember that you work as a product designer.";
  }

  if (isSmokeDirectPlanningPreferenceQuestion(content)) {
    if (!rememberedPlanningPreference) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return replyLanguage === "zh-Hans"
      ? "你偏好简洁的每周规划方式。"
      : "You prefer concise weekly planning.";
  }

  if (isSmokeDirectReplyStyleQuestion(content)) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (!styleValue) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    if (styleValue === "formal") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我用更正式、更礼貌的方式回复你。"
        : "You prefer that I reply in a more formal, respectful way.";
    }

    if (styleValue === "friendly") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我更像朋友一样和你说话。"
        : "You prefer that I speak to you in a more friendly, companion-like way.";
    }

    if (styleValue === "no_full_name") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我不要用你的全名来称呼你。"
        : "You prefer that I avoid addressing you by your full name.";
    }

    return replyLanguage === "zh-Hans"
      ? "你偏好我用更轻松、不那么正式的方式回复你。"
      : "You prefer that I reply in a more casual, less formal way.";
  }

  if (
    answerStrategy === "grounded-open-ended-advice" &&
    isSmokeOpenEndedPlanningHelpQuestion(content)
  ) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      const opening =
        styleValue === "formal"
          ? "好的，我会更正式一点地来帮你梳理。"
          : styleValue === "friendly"
            ? "好呀，我会更像朋友一样陪你一起梳理。"
            : "好呀，我来帮你一起理一理。";

      if (rememberedProfession && rememberedPlanningPreference) {
        return `${opening} 结合我记得的内容，你是一名产品设计师，也偏好简洁的每周规划方式，所以我会先帮你收拢本周最重要的三件事，再把它们拆成清晰的下一步。`;
      }

      if (rememberedPlanningPreference) {
        return `${opening} 我会按你偏好的简洁每周规划方式，先收拢重点，再拆出最清晰的下一步。`;
      }

      return `${opening} 我会先帮你抓住本周重点，再整理出一份简洁可执行的周计划。`;
    }

    const opening =
      styleValue === "formal"
        ? "Certainly. I will take a more formal approach here."
        : styleValue === "friendly"
          ? "Absolutely. I can take a more friendly, companion-like approach here."
          : "Sure, I can help you sort it out.";

    if (rememberedProfession && rememberedPlanningPreference) {
      return `${opening} Based on what I remember, you work as a product designer and prefer concise weekly planning, so I would start with your top three priorities and turn them into clear next steps.`;
    }

    if (rememberedPlanningPreference) {
      return `${opening} I would use your preference for concise weekly planning to narrow the week to the clearest priorities and next steps.`;
    }

    return `${opening} I would start by identifying the week's priorities and turning them into a short, actionable plan.`;
  }

  if (
    answerStrategy === "grounded-open-ended-summary" &&
    isSmokeOpenEndedSummaryQuestion(content)
  ) {
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (rememberedProfession && userName) {
        return `我记得你叫${userName}，是一名产品设计师。现在由${selfName}继续陪你把事情往前推进。`;
      }

      if (rememberedProfession) {
        return `我记得你是一名产品设计师，现在由${selfName}继续陪你把事情往前推进。`;
      }

      return `现在由${selfName}继续陪你往前推进，我会结合已经记得的内容来帮助你。`;
    }

    if (rememberedProfession && userName) {
      return `I remember that you go by ${userName} and work as a product designer. ${selfName} can keep helping you move things forward from here.`;
    }

    if (rememberedProfession) {
      return `I remember that you work as a product designer. ${selfName} can keep helping you move things forward from here.`;
    }

    return `${selfName} can keep helping you move things forward from here with the context already remembered.`;
  }

  if (isSmokeDirectNamingQuestion(content)) {
    if (nicknameMemory) {
      return replyLanguage === "zh-Hans"
        ? `哈哈，我叫${nicknameMemory.content}！`
        : `You can call me ${nicknameMemory.content}.`;
    }

    return replyLanguage === "zh-Hans"
      ? `我叫${agentName}。`
      : `My name is ${agentName}.`;
  }

  if (isSmokeDirectUserPreferredNameQuestion(content)) {
    if (preferredNameMemory) {
      return replyLanguage === "zh-Hans"
        ? `我应该叫你${preferredNameMemory.content}。`
        : `I should call you ${preferredNameMemory.content}.`;
    }

    return replyLanguage === "zh-Hans"
      ? "我还没有记住你偏好的称呼。"
      : "I have not stored your preferred name yet.";
  }

  if (
    content.includes("请用两句话介绍你自己") ||
    content.includes("你能如何帮助我")
  ) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? "SparkCore";
    const userName = preferredNameMemory?.content ?? null;
    const opening =
      styleValue === "formal"
        ? userName
          ? `您好，${userName}。`
          : "您好。"
        : styleValue === "friendly"
          ? userName
            ? `嗨，${userName}。`
            : "嗨，朋友。"
          : styleValue === "casual"
            ? userName
              ? `嗨，${userName}。`
              : "嗨。"
            : userName
              ? `你好，${userName}。`
              : "你好。";

    return `${opening} 我是${selfName}，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。`;
  }

  if (isSmokeRelationshipExplanatoryPrompt(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;
    const helpNextPrompt = isSmokeRelationshipHelpNextPrompt(content);

    if (replyLanguage === "zh-Hans") {
      if (helpNextPrompt) {
        if (styleValue === "formal") {
          return userName
            ? `${userName}，接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`
            : `接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`;
        }

        if (styleValue === "friendly" || styleValue === "casual") {
          return userName
            ? `${userName}，接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`
            : `接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`;
        }

        return userName
          ? `${userName}，接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`
          : `接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`;
      }

      if (styleValue === "formal") {
        return userName
          ? `${userName}，如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`
          : `如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `阿强，如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`
          : `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`;
      }

      return userName
        ? `${userName}，如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`
        : `如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`;
    }

    if (helpNextPrompt) {
      if (styleValue === "formal") {
        return userName
          ? `${userName}, next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`
          : `Next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `${userName}, next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`
          : `Next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`;
      }

      return userName
        ? `${userName}, next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`
        : `Next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`;
    }

    if (styleValue === "formal") {
      return userName
        ? `${userName}, if you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`
        : `If you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, if you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`
        : `If you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`;
    }

    return userName
      ? `${userName}, if you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`
      : `If you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`;
  }

  if (isSmokeRelationshipSupportivePrompt(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (isSmokeOneLineSoftCatchPrompt(content)) {
        return userName
          ? `${userName}，我在，先别一个人扛着。`
          : "我在，先别一个人扛着。";
      }

      if (styleValue === "formal") {
        return userName
          ? `${userName}，你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`
          : `你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
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

    if (styleValue === "formal") {
      return userName
        ? `${userName}, you do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`
        : `You do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`
        : `Take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`;
    }

    return userName
      ? `${userName}, try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`
      : `Try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`;
  }

  if (isSmokeRelationshipClosingPrompt(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (styleValue === "formal") {
        return userName
          ? `${userName}，我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`
          : `我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `阿强，我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`
          : `我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`;
      }

      return userName
        ? `${userName}，我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`
        : `我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`;
    }

    if (styleValue === "formal") {
      return userName
        ? `${userName}, we can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`
        : `We can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`
        : `Let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`;
    }

    return userName
      ? `${userName}, we can wrap here for now. I will keep helping you move this forward in a steady, natural way.`
      : `We can wrap here for now. I will keep helping you move this forward in a steady, natural way.`;
  }

  if (
    normalized.includes("please introduce yourself in two short sentences") ||
    normalized.includes("explain how you can help me")
  ) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? "SparkCore";
    const userName = preferredNameMemory?.content ?? null;
    const opening =
      styleValue === "formal"
        ? userName
          ? `Hello, ${userName}.`
          : "Hello."
        : styleValue === "friendly"
          ? userName
            ? `Hey, ${userName}.`
            : "Hey, friend."
          : styleValue === "casual"
            ? userName
              ? `Hey, ${userName}.`
              : "Hey."
            : userName
              ? `Hello, ${userName}.`
              : "Hello.";

    return `${opening} I am ${selfName}, and I can help you organize plans, reuse memory, and continue conversations across threads.`;
  }

  return replyLanguage === "zh-Hans"
    ? (() => {
        const styleValue =
          addressStyleMemory?.content ?? detectSmokeUserAddressStyleCandidate(content);
        const userName = preferredNameMemory?.content ?? null;

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
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别数落我")
          ) {
            return userName
              ? `${userName}，好，我先不数落你，就在这儿陪着你。`
              : "好，我先不数落你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不评判你，就在这儿陪着你。`
            : "好，我先不评判你，就在这儿陪着你。";
        }

        if (isSmokeAntiLecturingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别给我上课")
          ) {
            return userName
              ? `${userName}，好，我先不给你上课，就在这儿陪着你。`
              : "好，我先不给你上课，就在这儿陪着你。";
          }

          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说教")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说教，就在这儿陪着你。`
              : "好，我先不跟你说教，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不教育你，就在这儿陪着你。`
            : "好，我先不教育你，就在这儿陪着你。";
        }

        if (isSmokeAntiCorrectionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别老纠正我")
          ) {
            return userName
              ? `${userName}，好，我先不老纠正你，就在这儿陪着你。`
              : "好，我先不老纠正你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着纠正你，就在这儿陪着你。`
            : "好，我先不急着纠正你，就在这儿陪着你。";
        }

        if (isSmokeAntiConclusionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别这么快下结论")
          ) {
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
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别急着给我贴标签")
          ) {
            return userName
              ? `${userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
              : "好，我先不急着给你贴标签，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
            : "好，我先不急着给你贴标签，就在这儿陪着你。";
        }

        if (isSmokeAntiMischaracterizationFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别把我想成那样")
          ) {
            return userName
              ? `${userName}，好，我先不急着把你想成那样，就在这儿陪着你。`
              : "好，我先不急着把你想成那样，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着把你说成那样，就在这儿陪着你。`
            : "好，我先不急着把你说成那样，就在这儿陪着你。";
        }

        if (isSmokeAntiOverreadingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别脑补我")
          ) {
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
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别盘问我")
          ) {
            return userName
              ? `${userName}，好，我先不盘问你，就在这儿陪着你。`
              : "好，我先不盘问你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不问你为什么，就在这儿陪着你。`
            : "好，我先不问你为什么，就在这儿陪着你。";
        }

        if (isSmokeAntiRushingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别逼我")
          ) {
            return userName
              ? `${userName}，好，我先不逼你，就在这儿陪着你。`
              : "好，我先不逼你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不催你，就在这儿陪着你。`
            : "好，我先不催你，就在这儿陪着你。";
        }

        if (isSmokeAntiSolutioningFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别上来就帮我解决")
          ) {
            return userName
              ? `${userName}，好，我先不上来就帮你解决，就在这儿陪着你。`
              : "好，我先不上来就帮你解决，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着帮你解决，就在这儿陪着你。`
            : "好，我先不急着帮你解决，就在这儿陪着你。";
        }

        if (isSmokeAntiComfortingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别给我打气")
          ) {
            return userName
              ? `${userName}，好，我先不给你打气，就在这儿陪着你。`
              : "好，我先不给你打气，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着安慰你，就在这儿陪着你。`
            : "好，我先不急着安慰你，就在这儿陪着你。";
        }

        if (isSmokeAntiAdviceFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别上来就给我建议")
          ) {
            return userName
              ? `${userName}，好，我先不上来就给你建议，就在这儿陪着你。`
              : "好，我先不上来就给你建议，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着给你建议，就在这儿陪着你。`
            : "好，我先不急着给你建议，就在这儿陪着你。";
        }

        if (isSmokeAntiMinimizingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说没什么大不了")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说没什么大不了，就在这儿陪着你。`
              : "好，我先不跟你说没什么大不了，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不跟你说这没什么，就在这儿陪着你。`
            : "好，我先不跟你说这没什么，就在这儿陪着你。";
        }

        if (isSmokeAntiNormalizingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说谁都会这样")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说谁都会这样，就在这儿陪着你。`
              : "好，我先不跟你说谁都会这样，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不跟你说大家都这样，就在这儿陪着你。`
            : "好，我先不跟你说大家都这样，就在这儿陪着你。";
        }

        if (isSmokeAntiComparingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别老拿别人跟我比")
          ) {
            return userName
              ? `${userName}，好，我先不老拿别人跟你比，就在这儿陪着你。`
              : "好，我先不老拿别人跟你比，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不拿别人跟你比，就在这儿陪着你。`
            : "好，我先不拿别人跟你比，就在这儿陪着你。";
        }

        if (isSmokeAntiRedirectionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别岔开话题")
          ) {
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
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我讲道理")
          ) {
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
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("先别走开")
          ) {
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
      })()
    : (() => {
        const styleValue =
          addressStyleMemory?.content ?? detectSmokeUserAddressStyleCandidate(content);
        const userName = preferredNameMemory?.content ?? null;

        if (isSmokeOneLineSoftCatchPrompt(content)) {
          return userName
            ? `${userName}, I am here, and you do not have to carry this alone.`
            : "I am here, and you do not have to carry this alone.";
        }

        if (isSmokeBriefSteadyingPrompt(content)) {
          return userName
            ? `${userName}, take a breath first. I am here with you.`
            : "Take a breath first. I am here with you.";
        }

        if (styleValue === "formal") {
          return userName
            ? `Certainly, ${userName}. I will continue in a more formal way.`
            : "Certainly. I will continue in a more formal way.";
        }

        if (styleValue === "friendly") {
          return userName
            ? `Sure, ${userName}. Let's keep chatting.`
            : "Sure, let's keep chatting.";
        }

        if (styleValue === "casual") {
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
      })();
}

export async function createSmokeTurn({
  threadId,
  content
}: {
  threadId: string;
  content: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke message creation requires the smoke env vars and service role key."
    );
  }

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Smoke turn content is required.");
  }

  const { data: thread, error: threadError } = await loadOwnedThread({
    supabase: admin,
    threadId,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "The requested smoke thread is unavailable."
    );
  }

  if (!thread.agent_id) {
    throw new Error("The smoke thread is not bound to an agent.");
  }

  const { data: agent, error: agentError } = await loadOwnedActiveAgent({
    supabase: admin,
    agentId: thread.agent_id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? "The bound smoke agent is unavailable."
    );
  }

  const ensuredAgent = agent;

  const { data: modelProfile, error: modelProfileError } =
    await loadActiveModelProfileById({
      supabase: admin,
      modelProfileId: ensuredAgent.default_model_profile_id
    });

  if (modelProfileError || !modelProfile) {
    throw new Error(
      modelProfileError?.message ??
        "The bound smoke model profile is unavailable."
    );
  }

  const { data: existingMemories, error: memoriesError } = await loadRecentOwnedMemories({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    select:
      "id, memory_type, content, confidence, category, key, value, scope, status, target_agent_id, target_thread_id, metadata",
    limit: 200
  });

  if (memoriesError) {
    throw new Error(`Failed to load smoke memories: ${memoriesError.message}`);
  }

  const smokeExistingMemories = (existingMemories ?? []) as Array<{
    id: string;
    memory_type: "profile" | "preference" | null;
    content: string;
    confidence: number;
    category: string | null;
    key: string | null;
    value: string | null;
    scope: string | null;
    status: string | null;
    target_agent_id: string | null;
    target_thread_id: string | null;
    metadata: Record<string, unknown> | null;
  }>;

  const { data: existingMessages, error: messagesError } = await loadThreadMessages({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    select: "role, content, status, metadata"
  });

  if (messagesError) {
    throw new Error(`Failed to load smoke messages: ${messagesError.message}`);
  }

  const recentAssistantReply = getSmokeRecentAssistantReply(
    (existingMessages ?? []) as Array<{
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
    }>
  );

  const validExistingMemories =
    smokeExistingMemories.filter((memory) =>
      isSmokeMemoryApplicableToThread({
        memory,
        agentId: ensuredAgent.id,
        threadId: thread.id
      })
    ) ?? [];
  const activeMemories = validExistingMemories.filter((memory) =>
    isMemoryActive(memory)
  );
  const hiddenExclusionCount = validExistingMemories.filter((memory) =>
    isMemoryHidden(memory)
  ).length;
  const incorrectExclusionCount = validExistingMemories.filter((memory) =>
    isMemoryIncorrect(memory)
  ).length;

  const recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }> = activeMemories
    .filter((memory) => {
      const normalizedContent = memory.content.toLowerCase();
      return (
        (trimmedContent.toLowerCase().includes("profession") &&
          normalizedContent.includes("product designer")) ||
        (isSmokeOpenEndedSummaryQuestion(trimmedContent) &&
          normalizedContent.includes("product designer")) ||
        (isSmokeDirectProfessionQuestion(trimmedContent) &&
          normalizedContent.includes("product designer")) ||
        ((trimmedContent.toLowerCase().includes("weekly planning") ||
          isSmokeOpenEndedPlanningHelpQuestion(trimmedContent) ||
          isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
          isSmokeDirectPlanningPreferenceQuestion(trimmedContent)) &&
          normalizedContent.includes("concise weekly planning"))
      );
    })
    .map((memory) => ({
      memory_type:
        memory.memory_type === "preference" ? "preference" : "profile",
      content: memory.content,
      confidence: memory.confidence
    }));
  const relationshipStylePrompt = isSmokeRelationshipAnswerShapePrompt(trimmedContent);
  const sameThreadContinuity = recentAssistantReply !== null;
  const sameThreadContinuationApplicable =
    sameThreadContinuity && isSmokeRelationshipContinuationEdgePrompt(trimmedContent);
  const relationshipCarryoverAvailable = activeMemories.some(
    (memory) =>
      memory.category === "relationship" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === ensuredAgent.id
  );
  const answerStrategyRule = getSmokeAnswerStrategy({
    content: trimmedContent,
    sameThreadContinuity,
    relationshipStylePrompt,
    relationshipCarryoverAvailable
  });
  const preferSameThreadContinuation =
    answerStrategyRule.answerStrategy === "same-thread-continuation";
  const recentRawTurnCount = getSmokeRecentRuntimeMessages(
    (existingMessages ?? []) as Array<{
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
    }>
  ).length + 1;
  const approxContextPressure = getSmokeApproxContextPressure(
    (existingMessages ?? []) as Array<{
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
    }>,
    trimmedContent
  );
  const longChainPressureCandidate =
    sameThreadContinuationApplicable &&
    recentRawTurnCount >= 10 &&
    (approxContextPressure === "elevated" || approxContextPressure === "high");
  const nicknameMemory =
    isSmokeDirectNamingQuestion(trimmedContent) ||
    relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
    sameThreadContinuity
    ? activeMemories.find(
        (memory) =>
          memory.category === "relationship" &&
          memory.key === "agent_nickname" &&
          memory.scope === "user_agent" &&
          memory.target_agent_id === ensuredAgent.id
      )
    : null;

  if (nicknameMemory) {
    recalledMemories.unshift({
      memory_type: "relationship",
      content:
        typeof nicknameMemory.value === "string"
          ? nicknameMemory.value
          : nicknameMemory.content,
      confidence: nicknameMemory.confidence
    });
  }
  const preferredNameMemory =
    isSmokeDirectUserPreferredNameQuestion(trimmedContent) ||
    relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
    sameThreadContinuity
    ? activeMemories.find(
        (memory) =>
          memory.category === "relationship" &&
          memory.key === "user_preferred_name" &&
          memory.scope === "user_agent" &&
          memory.target_agent_id === ensuredAgent.id
      )
    : null;

  if (preferredNameMemory) {
    recalledMemories.unshift({
      memory_type: "relationship",
      content:
        typeof preferredNameMemory.value === "string"
          ? preferredNameMemory.value
          : preferredNameMemory.content,
      confidence: preferredNameMemory.confidence
    });
  }

  const addressStyleMemory = activeMemories.find(
    (memory) =>
      memory.category === "relationship" &&
      memory.key === "user_address_style" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === ensuredAgent.id
  );

  if (addressStyleMemory) {
    recalledMemories.unshift({
      memory_type: "relationship",
      content:
        typeof addressStyleMemory.value === "string"
          ? addressStyleMemory.value
          : addressStyleMemory.content,
      confidence: addressStyleMemory.confidence
    });
  }

  const usedMemoryTypes = Array.from(
    new Set(recalledMemories.map((memory) => memory.memory_type))
  );

  const { data: insertedUserMessage, error: insertedUserMessageError } =
    await insertMessage({
      supabase: admin,
      threadId: thread.id,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      payload: {
        role: "user",
        content: trimmedContent
      },
      select: "id"
    }).single();

  if (insertedUserMessageError || !insertedUserMessage) {
    throw new Error(
      insertedUserMessageError?.message ?? "Failed to insert the smoke user message."
    );
  }

  const ensuredUserMessage = insertedUserMessage;

  const threadPatch = buildThreadActivityPatch({
    content: trimmedContent,
    shouldSummarizeTitle: thread.title === "New chat"
  });

  const { error: threadUpdateError } = await updateOwnedThread({
    supabase: admin,
    threadId: thread.id,
    userId: smokeUser.id,
    patch: threadPatch
  });

  if (threadUpdateError) {
    throw new Error(
      `Failed to update the smoke thread: ${threadUpdateError.message}`
    );
  }

  const createdTypes: Array<"profile" | "preference" | "relationship"> = [];
  const loweredContent = trimmedContent.toLowerCase();

  async function upsertMemory(memoryType: "profile" | "preference", value: string, confidence: number) {
    const { data: existingMemory } = await loadOwnedMemoryItemByTypeAndContent({
      supabase: admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      memoryType,
      content: value,
      select: "id, metadata"
    });

    if (existingMemory) {
      await updateMemoryItem({
        supabase: admin,
        memoryItemId: existingMemory.id,
        patch: {
          status: "active",
          metadata: mergeSmokeSeedMetadata(
            (existingMemory.metadata ?? {}) as Record<string, unknown>
          ),
          updated_at: new Date().toISOString()
        }
      }).eq("user_id", smokeUser.id);
      return;
    }

    const { error } = await insertMemoryItem({
      supabase: admin,
      payload: {
      workspace_id: smokeUser.workspaceId,
      user_id: smokeUser.id,
      agent_id: ensuredAgent.id,
      memory_type: memoryType,
      content: value,
      confidence,
      source_message_id: ensuredUserMessage.id,
      ...buildMemoryV2Fields({
        category: memoryType,
        key: LEGACY_MEMORY_KEY,
        value,
        scope: "user_global",
        subjectUserId: smokeUser.id,
        stability: inferLegacyMemoryStability(memoryType),
        status: "active",
        sourceRefs: [
          {
            kind: "message",
            source_message_id: ensuredUserMessage.id
          }
        ]
      }),
      metadata: buildSmokeSeedMetadata()
      }
    });

    if (error) {
      throw new Error(`Failed to seed smoke memory: ${error.message}`);
    }

    createdTypes.push(memoryType);
  }

  if (loweredContent.includes("product designer")) {
    await upsertMemory("profile", "product designer", 0.95);
  }

  if (loweredContent.includes("concise weekly planning")) {
    await upsertMemory("preference", "concise weekly planning", 0.93);
  }

  const smokeNickname = detectSmokeNicknameCandidate(trimmedContent);
  const smokePreferredName = detectSmokeUserPreferredNameCandidate(trimmedContent);
  const smokeUserAddressStyle =
    detectSmokeUserAddressStyleCandidate(trimmedContent);
  const replyLanguageDecision = resolveSmokeReplyLanguage({
    content: trimmedContent,
    recentAssistantReply
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const effectiveAddressStyleValue = addressStyleMemory
    ? typeof addressStyleMemory.value === "string"
      ? addressStyleMemory.value
      : addressStyleMemory.content
    : null;

  async function insertRelationshipMemory(args: {
    key: "agent_nickname" | "user_preferred_name" | "user_address_style";
    value: string;
    confidence: number;
    stability: "high" | "medium";
    errorLabel: string;
  }) {
    const { error } = await insertMemoryItem({
      supabase: admin,
      payload: {
      workspace_id: smokeUser.workspaceId,
      user_id: smokeUser.id,
      agent_id: ensuredAgent.id,
      source_message_id: ensuredUserMessage.id,
      memory_type: null,
      content: args.value,
      confidence: args.confidence,
      importance: 0.5,
      ...buildMemoryV2Fields({
        category: "relationship",
        key: args.key,
        value: args.value,
        scope: "user_agent",
        subjectUserId: smokeUser.id,
        targetAgentId: ensuredAgent.id,
        stability: args.stability,
        status: "active",
        sourceRefs: [
          {
            kind: "message",
            source_message_id: ensuredUserMessage.id
          }
        ]
      }),
      metadata: buildSmokeRelationshipSeedMetadata(args.key)
      }
    });

    if (error) {
      throw new Error(`Failed to seed ${args.errorLabel} memory: ${error.message}`);
    }

    createdTypes.push("relationship");
  }

  if (smokeNickname) {
    const { data: existingNickname } = await loadOwnedRelationshipMemoryByValue({
      supabase: admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      key: "agent_nickname",
      targetAgentId: ensuredAgent.id,
      value: smokeNickname
    });

    if (!existingNickname) {
      await insertRelationshipMemory({
        key: "agent_nickname",
        value: smokeNickname,
        confidence: 0.96,
        stability: "high",
        errorLabel: "nickname"
      });
    }
  }

  if (smokePreferredName) {
    const { data: existingPreferredName } = await loadOwnedRelationshipMemoryByValue({
      supabase: admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      key: "user_preferred_name",
      targetAgentId: ensuredAgent.id,
      value: smokePreferredName
    });

    if (!existingPreferredName) {
      await insertRelationshipMemory({
        key: "user_preferred_name",
        value: smokePreferredName,
        confidence: 0.94,
        stability: "high",
        errorLabel: "preferred-name"
      });
    }
  }

  if (smokeUserAddressStyle) {
    const { data: existingAddressStyle } = await loadOwnedRelationshipMemoryByValue({
      supabase: admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      key: "user_address_style",
      targetAgentId: ensuredAgent.id,
      value: smokeUserAddressStyle
    });

    if (!existingAddressStyle) {
      await insertRelationshipMemory({
        key: "user_address_style",
        value: smokeUserAddressStyle,
        confidence: 0.9,
        stability: "medium",
        errorLabel: "address-style"
      });
    }
  }

  const assistantContent = buildSmokeAssistantReply({
    content: trimmedContent,
    answerStrategy: answerStrategyRule.answerStrategy,
    modelProfileName: modelProfile.name,
    replyLanguage,
    recentAssistantReply,
    agentName: ensuredAgent.name,
    addressStyleMemory: addressStyleMemory
      ? {
          memory_type: "relationship",
          content:
            typeof addressStyleMemory.value === "string"
              ? addressStyleMemory.value
              : addressStyleMemory.content,
          confidence: addressStyleMemory.confidence
        }
      : null,
    nicknameMemory: nicknameMemory
      ? {
          memory_type: "relationship",
          content:
            typeof nicknameMemory.value === "string"
              ? nicknameMemory.value
              : nicknameMemory.content,
          confidence: nicknameMemory.confidence
        }
      : null,
    preferredNameMemory: preferredNameMemory
      ? {
          memory_type: "relationship",
          content:
            typeof preferredNameMemory.value === "string"
              ? preferredNameMemory.value
              : preferredNameMemory.content,
          confidence: preferredNameMemory.confidence
        }
      : null,
    recalledMemories
  });
  const roleCorePacket = buildSmokeRoleCorePacket({
    agentId: ensuredAgent.id,
    agentName: ensuredAgent.name,
    personaSummary: ensuredAgent.persona_summary ?? null,
    styleGuidance: ensuredAgent.style_prompt ?? null,
    relationshipStyleValue: effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source,
    preferSameThreadContinuation
  });

  const { data: insertedAssistantMessage, error: insertedAssistantMessageError } =
    await insertMessage({
      supabase: admin,
      threadId: thread.id,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      payload: {
        role: "assistant",
        content: assistantContent,
        status: "completed",
        metadata: buildSmokeAssistantMetadata({
          agentId: ensuredAgent.id,
          agentName: ensuredAgent.name,
          roleCorePacket,
          modelProfileId: modelProfile.id,
          modelProfileName: modelProfile.name,
          model: modelProfile.model,
          replyLanguage,
          replyLanguageDetected: detectSmokeReplyLanguage(assistantContent),
          replyLanguageSource: replyLanguageDecision.source,
          questionType: answerStrategyRule.questionType,
          answerStrategy: answerStrategyRule.answerStrategy,
          answerStrategyReasonCode: answerStrategyRule.reasonCode,
          continuationReasonCode: answerStrategyRule.continuationReasonCode,
          recentRawTurnCount,
          approxContextPressure,
          sameThreadContinuationApplicable,
          longChainPressureCandidate,
          sameThreadContinuationPreferred: preferSameThreadContinuation,
          distantMemoryFallbackAllowed: !preferSameThreadContinuation,
          recalledMemories,
          usedMemoryTypes,
          hiddenExclusionCount,
          incorrectExclusionCount,
          createdTypes
        })
      },
      select: "id"
    }).single();

  if (insertedAssistantMessageError || !insertedAssistantMessage) {
    throw new Error(
      insertedAssistantMessageError?.message ??
        "Failed to insert the smoke assistant reply."
    );
  }

  return {
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  };
}

export { createSmokeLoginResponse };
