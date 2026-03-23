import { generateText } from "@/lib/litellm/client";
import {
  getMemoryCategory,
  getMemoryKey,
  getMemoryScope,
  getMemorySourceRefs,
  getMemoryStability,
  getMemoryStatus,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import { buildRuntimeAssistantPayload } from "@/lib/chat/assistant-message-payload";
import { getAssistantDeveloperDiagnosticsMetadata } from "@/lib/chat/assistant-message-metadata-read";
import { persistCompletedAssistantMessage } from "@/lib/chat/assistant-message-state-persistence";
import { buildRuntimeAssistantMetadataInput } from "@/lib/chat/runtime-assistant-metadata";
import { buildRecalledStaticProfileSnapshot } from "@/lib/chat/memory-records";
import {
  loadActiveModelProfiles,
  loadActiveModelProfileById,
  loadActiveModelProfileBySlug,
  loadActivePersonaPackBySlug,
  loadActivePersonaPacks,
  bindOwnedAgentModelProfile,
  bindOwnedThreadAgent,
  createOwnedAgent,
  createOwnedThread,
  loadCompletedMessagesForThreads,
  loadFirstActiveModelProfile,
  loadFirstActivePersonaPack,
  loadLatestOwnedThread,
  loadOwnedActiveAgentsByIds,
  loadOwnedAvailableAgents,
  loadOwnedThreadTitlesByIds,
  loadModelProfilesByIds,
  loadPersonaPackNamesByIds,
  loadRecentOwnedMemories,
  loadSourceMessagesByIds,
  loadOwnedThreads,
  loadPrimaryWorkspace,
  updateOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
import {
  getModelProfileTierLabel,
  getModelProfileUsageNote,
  getUnderlyingModelLabel
} from "@/lib/chat/model-profile-metadata";
import { buildRuntimeDebugMetadata } from "@/lib/chat/runtime-debug-metadata";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import { loadThreadMessages } from "@/lib/chat/message-read";
import {
  planMemoryWriteRequests,
  planRelationshipMemoryWriteRequests
} from "@/lib/chat/memory-write";
import {
  type ApproxContextPressure,
  type SessionContinuitySignal
} from "@/lib/chat/session-context";
import {
  type AgentRecord,
  type ReplyLanguageSource,
  type RoleCorePacket,
  type RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import { ROLE_PROFILE_SELECT } from "@/lib/chat/role-repository";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import {
  prepareRuntimeMemory,
  prepareRuntimeRole,
  prepareRuntimeSession,
  prepareRuntimeTurn
} from "@/lib/chat/runtime-prepared-turn";
import { createAdminThreadStateRepository } from "@/lib/chat/thread-state-admin-repository";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import {
  buildInternalRuntimeTurnInput,
  buildRuntimeTurnInput,
  type RuntimeTurnInput,
} from "@/lib/chat/runtime-input";
import type {
  RuntimeFollowUpRequest,
  RuntimeTurnResult
} from "@/lib/chat/runtime-contract";
import { maybeWriteThreadStateAfterTurn } from "@/lib/chat/thread-state-writeback";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PERSONA_SLUGS = ["companion_default", "spark-guide"];
const DEFAULT_MODEL_PROFILE_SLUG = "spark-default";

function isRelationshipStylePrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("请简单介绍一下你自己") ||
    normalized.includes("简单介绍一下你自己") ||
    normalized.includes("先简单介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己吧") ||
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

function isRelationshipExplanatoryPrompt(content: string) {
  return (
    isRelationshipHelpNextPrompt(content) ||
    isRelationshipRoughDayPrompt(content)
  );
}

function isRelationshipHelpNextPrompt(content: string) {
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

function isRelationshipRoughDayPrompt(content: string) {
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

function isRelationshipSupportivePrompt(content: string) {
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

function isShortRelationshipSupportivePrompt(content: string) {
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

function isOneLineSoftCatchPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("回我一句就好");
}

function isBriefSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("缓一下") && normalized.includes("再说");
}

function isGentleCarryForwardAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("缓一下") &&
    normalized.includes("再陪我往下走一点")
  );
}

function isGuidedNextStepAfterSteadyingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("陪我理一步");
}

function isLightSharedPushPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("一起把这一点弄过去") ||
    normalized.includes("陪我把眼前这一下弄过去")
  );
}

function isNonJudgingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别评判我") ||
    normalized.includes("别数落我")
  );
}

function isAntiLecturingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别教育我") ||
    normalized.includes("别给我上课") ||
    normalized.includes("别跟我说教")
  );
}

function isAntiCorrectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着纠正我") ||
    normalized.includes("别老纠正我")
  );
}

function isAntiConclusionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我下结论") ||
    normalized.includes("别这么快下结论")
  );
}

function isAntiLabelingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我定性") ||
    normalized.includes("别急着给我定性")
  );
}

function isAntiTaggingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别给我贴标签") ||
    normalized.includes("别急着给我贴标签")
  );
}

function isAntiMischaracterizationFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别把我说成那样") ||
    normalized.includes("别把我想成那样")
  );
}

function isAntiOverreadingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别替我解读") ||
    normalized.includes("别脑补我")
  );
}

function isAntiAnalysisFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着分析我") ||
    normalized.includes("别上来就分析我")
  );
}

function isAntiProbingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别问我为什么") ||
    normalized.includes("别追着问我") ||
    normalized.includes("别盘问我")
  );
}

function isAntiRushingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别催我") ||
    normalized.includes("别逼我")
  );
}

function isAntiSolutioningFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着帮我解决") ||
    normalized.includes("别上来就帮我解决")
  );
}

function isAntiComfortingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着安慰我") ||
    normalized.includes("别给我打气")
  );
}

function isAntiAdviceFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别急着给我建议") ||
    normalized.includes("别上来就给我建议")
  );
}

function isAntiMinimizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说这没什么") ||
    normalized.includes("别跟我说没什么大不了")
  );
}

function isAntiNormalizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别跟我说大家都这样") ||
    normalized.includes("别跟我说谁都会这样")
  );
}

function isAntiComparingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别拿别人跟我比") ||
    normalized.includes("别老拿别人跟我比")
  );
}

function isAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}

function isAntiDefinitionFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("别替我定义") ||
    normalized.includes("别替我下定义")
  );
}

function isAntiCategorizingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("别替我归类");
}

function isSameSideFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("站我这边") ||
    (normalized.includes("别跟我讲道理") && normalized.includes("站我这边"))
  );
}

function isFriendLikeSoftFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪我说一句");
}

function isStayWithMeFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return normalized.includes("继续陪着我说就行");
}

function isGentleResumeRhythmPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("慢慢继续和我说") ||
    normalized.includes("顺着刚才那样继续说")
  );
}

function isPresenceConfirmingFollowUpPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("还在这儿陪我") ||
    normalized.includes("先别走开")
  );
}

function isRelationshipClosingPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}

function shouldPlanGentleCheckIn({
  latestUserMessage,
  continuationReasonCode
}: {
  latestUserMessage: string | null;
  continuationReasonCode: ContinuationReasonCode | null;
}) {
  if (!latestUserMessage) {
    return false;
  }

  return (
    isRelationshipRoughDayPrompt(latestUserMessage) ||
    isRelationshipSupportivePrompt(latestUserMessage) ||
    isPresenceConfirmingFollowUpPrompt(latestUserMessage) ||
    continuationReasonCode === "brief-supportive-carryover"
  );
}

function buildFollowUpRequests({
  latestUserMessage,
  threadId,
  agentId,
  userId,
  continuationReasonCode,
  replyLanguage
}: {
  latestUserMessage: string | null;
  threadId: string;
  agentId: string;
  userId: string;
  continuationReasonCode: ContinuationReasonCode | null;
  replyLanguage: RuntimeReplyLanguage;
}): RuntimeFollowUpRequest[] {
  if (
    !shouldPlanGentleCheckIn({
      latestUserMessage,
      continuationReasonCode
    })
  ) {
    return [];
  }

  return [
    {
      kind: "gentle_check_in",
      trigger_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
      reason:
        continuationReasonCode === "brief-supportive-carryover"
          ? "brief supportive carryover may benefit from a gentle follow-up"
          : "supportive or rough-day conversation may benefit from a gentle check-in",
      payload: {
        thread_id: threadId,
        agent_id: agentId,
        user_id: userId,
        reply_language: replyLanguage,
        source: "runtime_planner"
      }
    }
  ];
}

function isShortRelationshipSummaryFollowUpPrompt(content: string) {
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

function isLightStyleSofteningPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    (normalized.includes("别太正式") &&
      (normalized.includes("轻一点和我说") || normalized.includes("轻一点和我讲"))) ||
    normalized.includes("轻松点和我说就好") ||
    normalized.includes("轻松点和我讲就好")
  );
}

function isRelationshipAnswerShapePrompt(content: string) {
  return (
    isRelationshipStylePrompt(content) ||
    isRelationshipSupportivePrompt(content) ||
    isRelationshipExplanatoryPrompt(content) ||
    isRelationshipClosingPrompt(content)
  );
}

function isOpenEndedAdviceQuestion(content: string) {
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

function isOpenEndedSummaryQuestion(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    isRelationshipStylePrompt(content) ||
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

function isFuzzyFollowUpQuestion(content: string) {
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

function isCompanionStyleExplanationCarryoverPrompt(content: string) {
  const normalized = content.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("简单陪我理一下") ||
    normalized.includes("陪我理一下就行") ||
    normalized.includes("先陪我理一下")
  );
}

function isRelationshipContinuationEdgePrompt(content: string) {
  return (
    isFuzzyFollowUpQuestion(content) ||
    isShortRelationshipSupportivePrompt(content) ||
    isShortRelationshipSummaryFollowUpPrompt(content) ||
    isCompanionStyleExplanationCarryoverPrompt(content) ||
    isOneLineSoftCatchPrompt(content) ||
    isBriefSteadyingPrompt(content) ||
    isGentleCarryForwardAfterSteadyingPrompt(content) ||
    isGuidedNextStepAfterSteadyingPrompt(content)
  );
}

function getContinuationReasonCode(
  content: string
): ContinuationReasonCode | null {
  if (
    isShortRelationshipSupportivePrompt(content) ||
    isCompanionStyleExplanationCarryoverPrompt(content) ||
    isBriefSteadyingPrompt(content) ||
    isGentleCarryForwardAfterSteadyingPrompt(content) ||
    isGuidedNextStepAfterSteadyingPrompt(content)
  ) {
    return "brief-supportive-carryover";
  }

  if (isShortRelationshipSummaryFollowUpPrompt(content)) {
    return "brief-summary-carryover";
  }

  if (isFuzzyFollowUpQuestion(content)) {
    return "short-fuzzy-follow-up";
  }

  return null;
}

type WorkspaceRecord = {
  id: string;
  name: string;
  kind: string;
};

type ThreadRecord = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

type ModelProfileRecord = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  metadata: Record<string, unknown>;
};

type MessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ThreadListItem = ThreadRecord & {
  agent_name: string | null;
  latest_message_preview: string | null;
  latest_message_created_at: string | null;
};

type AvailableAgentRecord = {
  id: string;
  name: string;
  is_custom: boolean;
  persona_summary: string;
  background_summary: string | null;
  avatar_emoji: string | null;
  system_prompt_summary: string;
  source_persona_pack_id: string | null;
  default_model_profile_id: string | null;
  source_persona_pack_name: string | null;
  default_model_profile_name: string | null;
  default_model_profile_tier_label: string | null;
  is_default_for_workspace: boolean;
};

type AvailablePersonaPackRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

type AvailableModelProfileRecord = {
  id: string;
  name: string;
  provider: string;
  model: string;
  metadata: Record<string, unknown>;
  tier_label: string | null;
  usage_note: string | null;
  underlying_model: string | null;
};

export type RunAgentTurnArgs = {
  input: RuntimeTurnInput;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  supabase?: any;
};

type VisibleMemoryRecord = {
  id: string;
  memory_type: string | null;
  category: string;
  key: string;
  value: unknown;
  scope: string;
  target_agent_id: string | null;
  target_thread_id: string | null;
  target_agent_name: string | null;
  stability: string;
  status: string;
  source_refs: unknown[];
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
  source_message_id: string | null;
  source_thread_id: string | null;
  source_thread_title: string | null;
  source_timestamp: string | null;
  created_at: string;
  updated_at: string;
};

type HiddenMemoryRecord = VisibleMemoryRecord;
type IncorrectMemoryRecord = VisibleMemoryRecord;
type SupersededMemoryRecord = VisibleMemoryRecord;

type RequestedThreadFallback = {
  requestedThreadId: string;
  reasonCode: "invalid_or_unauthorized";
};

type DirectRecallQuestionKind =
  | "none"
  | "generic-memory"
  | "profession"
  | "planning-style"
  | "reply-style";
type AnswerQuestionType =
  | "direct-fact"
  | "direct-relationship-confirmation"
  | "open-ended-advice"
  | "open-ended-summary"
  | "fuzzy-follow-up"
  | "other";
type AnswerStrategy =
  | "structured-recall-first"
  | "relationship-recall-first"
  | "grounded-open-ended-advice"
  | "grounded-open-ended-summary"
  | "same-thread-continuation"
  | "default-grounded";
type AnswerStrategyReasonCode =
  | "direct-relationship-question"
  | "direct-memory-question"
  | "open-ended-advice-prompt"
  | "open-ended-summary-prompt"
  | "relationship-answer-shape-prompt"
  | "same-thread-edge-carryover"
  | "default-grounded-fallback";
type ContinuationReasonCode =
  | "short-fuzzy-follow-up"
  | "brief-supportive-carryover"
  | "brief-summary-carryover";
type AnswerStrategyPriority =
  | "high-deterministic"
  | "semi-constrained"
  | "low-deterministic";

const ANSWER_STRATEGY_MATRIX: Array<{
  questionType: AnswerQuestionType;
  strategy: AnswerStrategy;
  priority: AnswerStrategyPriority;
  description: string;
}> = [
  {
    questionType: "direct-fact",
    strategy: "structured-recall-first",
    priority: "high-deterministic",
    description:
      "Direct fact questions should prefer deterministic structured recall before more open-ended generation."
  },
  {
    questionType: "direct-relationship-confirmation",
    strategy: "relationship-recall-first",
    priority: "high-deterministic",
    description:
      "Direct relationship-confirmation questions should prefer relationship recall before canonical fallback identity."
  },
  {
    questionType: "open-ended-advice",
    strategy: "grounded-open-ended-advice",
    priority: "low-deterministic",
    description:
      "Open-ended advice should stay grounded in recalled memory without turning into a rigid fact dump."
  },
  {
    questionType: "open-ended-summary",
    strategy: "grounded-open-ended-summary",
    priority: "low-deterministic",
    description:
      "Open-ended summary and self-introduction prompts should stay natural while keeping relevant memory and relationship cues visible."
  },
  {
    questionType: "fuzzy-follow-up",
    strategy: "same-thread-continuation",
    priority: "semi-constrained",
    description:
      "Short fuzzy follow-ups should prioritize same-thread continuity in language and relationship style."
  },
  {
    questionType: "other",
    strategy: "default-grounded",
    priority: "semi-constrained",
    description:
      "Other prompts should use the default grounded answer path without overfitting to direct recall."
  }
];

function detectExplicitLanguageOverride(content: string): RuntimeReplyLanguage {
  const normalized = content.normalize("NFKC").toLowerCase();

  const englishHints = [
    "reply in english",
    "respond in english",
    "answer in english",
    "please use english",
    "请用英文",
    "请用英语",
    "用英文回答",
    "用英语回答"
  ];
  const chineseHints = [
    "reply in chinese",
    "respond in chinese",
    "answer in chinese",
    "continue in chinese",
    "keep replying in chinese",
    "please use chinese",
    "请用中文",
    "用中文回答",
    "请用简体中文",
    "用简体中文回答"
  ];

  if (englishHints.some((hint) => normalized.includes(hint))) {
    return "en";
  }

  if (chineseHints.some((hint) => normalized.includes(hint))) {
    return "zh-Hans";
  }

  return "unknown";
}

function summarizeAgentPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function buildMessagePreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

function buildMemoryRecallPrompt(
  latestUserMessage: string,
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>,
  replyLanguage: RuntimeReplyLanguage,
  relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    relationshipStylePrompt: boolean;
    sameThreadContinuity: boolean;
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
  }
) {
  const normalizedUserMessage = latestUserMessage.toLowerCase();
  const directRecallQuestionKind = getDirectRecallQuestionKind(normalizedUserMessage);
  const answerQuestionRouting = getAnswerQuestionRouting({
    latestUserMessage,
    directRecallQuestionKind,
    directNamingQuestion: relationshipRecall.directNamingQuestion,
    directPreferredNameQuestion: relationshipRecall.directPreferredNameQuestion,
    relationshipStylePrompt: relationshipRecall.relationshipStylePrompt,
    sameThreadContinuity: relationshipRecall.sameThreadContinuity,
    relationshipCarryoverAvailable: Boolean(
      relationshipRecall.addressStyleMemory ||
        relationshipRecall.nicknameMemory ||
        relationshipRecall.preferredNameMemory
    )
  });
  const answerQuestionType = answerQuestionRouting.questionType;
  const answerStrategyRule = getAnswerStrategyRule(answerQuestionType);
  const answerStrategy = answerStrategyRule.strategy;
  const isZh = replyLanguage === "zh-Hans";
  const isDirectMemoryQuestion = directRecallQuestionKind !== "none";

  if (
    recalledMemories.length === 0 &&
    !relationshipRecall.addressStyleMemory &&
    !relationshipRecall.nicknameMemory &&
    !relationshipRecall.preferredNameMemory
  ) {
    if (
      !isDirectMemoryQuestion &&
      !relationshipRecall.directNamingQuestion &&
      !relationshipRecall.directPreferredNameQuestion
    ) {
      return "";
    }

    return isZh
      ? [
          "与这条回复相关的长期记忆：",
          "无。",
          "用户正在直接追问你记得什么，但本轮没有召回到相关长期记忆。",
          "不要编造具体事实。如果用户在问你是否记得某件事，而本轮没有相关长期记忆，就直接说明你不知道。"
        ].join("\n")
      : [
          "Relevant long-term memory for this reply:",
          "None.",
          "The user is directly asking what you remember. No relevant long-term memory was recalled for this turn.",
          "Do not invent specifics. If the user asks whether you remember something and no relevant long-term memory is available, say you do not know."
        ].join("\n");
  }

  const relationshipSections =
    (relationshipRecall.directNamingQuestion ||
      relationshipRecall.relationshipStylePrompt ||
      relationshipRecall.sameThreadContinuity) &&
    relationshipRecall.nicknameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前用户可以把这个 agent 叫作“${relationshipRecall.nicknameMemory.content}”。`,
            relationshipRecall.directNamingQuestion
              ? "如果用户在问你叫什么或以后怎么叫你，优先使用这个昵称回答，而不是只返回 agent 的 canonical name。"
              : "当你在做自我介绍、开场或延续关系感时，优先自然使用这个昵称，而不是只返回 agent 的 canonical name。",
            "不要说你没有先前知识、没有对话历史，或不记得。",
            "当相关时，让这个昵称自然地体现在开场、自我介绍和后续称呼里，而不只是机械地提一次。"
          ]
        : [
            `Structured relationship memory: this user can call the current agent "${relationshipRecall.nicknameMemory.content}".`,
            relationshipRecall.directNamingQuestion
              ? "If the user asks what to call you or what your name is, answer with this nickname before the canonical agent name."
              : "When you introduce yourself or set the tone of the exchange, naturally use this nickname before falling back to the canonical agent name.",
            "Do not say that you have no prior knowledge, no conversation history, or no memory.",
            "When relevant, let this nickname show up naturally in openings, self-introductions, and follow-up phrasing instead of mentioning it only once."
          ]
      : relationshipRecall.directNamingQuestion
        ? isZh
          ? [
              "结构化关系记忆：当前没有针对这个 agent 的昵称记忆。",
              "如果用户在问你叫什么或以后怎么叫你，可以回退到 agent 的 canonical name，但不要编造昵称。"
            ]
          : [
              "Structured relationship memory: no nickname memory exists for this agent and user.",
              "If the user asks what to call you, fall back to the agent canonical name and do not invent a nickname."
            ]
        : [];

  const preferredNameSections =
    (relationshipRecall.directPreferredNameQuestion ||
      relationshipRecall.relationshipStylePrompt ||
      relationshipRecall.sameThreadContinuity) &&
    relationshipRecall.preferredNameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前这个 agent 应该把用户叫作“${relationshipRecall.preferredNameMemory.content}”。`,
            relationshipRecall.directPreferredNameQuestion
              ? "如果用户在问你应该怎么叫他/她，优先使用这个称呼回答，不要编造别的名字。"
              : "当你在开场、称呼或收尾里需要称呼用户时，优先使用这个称呼，不要编造别的名字。",
            "不要把没有对话历史和没有长期记忆混为一谈。",
            "当相关时，在开场、称呼和收尾里稳定使用这个称呼，而不是只在解释时提到一次。"
          ]
        : [
            `Structured relationship memory: this agent should address the user as "${relationshipRecall.preferredNameMemory.content}".`,
            relationshipRecall.directPreferredNameQuestion
              ? "If the user asks how you should address them, answer with this stored preferred name before falling back to generic wording."
              : "When you need to address the user in openings, greetings, or closings, use this stored preferred name before falling back to generic wording.",
            "Do not confuse missing conversation history with missing long-term memory.",
            "When relevant, use this preferred name consistently in openings, address terms, and closings instead of mentioning it only in a factual explanation."
          ]
      : relationshipRecall.directPreferredNameQuestion
        ? isZh
          ? [
              "结构化关系记忆：当前没有这个用户针对该 agent 的称呼偏好记忆。",
              "如果用户问你该怎么叫他/她，直接说明你还没有记住偏好的称呼，不要编造。"
            ]
          : [
              "Structured relationship memory: no preferred-name memory exists for this user and agent.",
              "If the user asks how you should address them, say that you have not stored a preferred name yet and do not invent one."
            ]
        : [];
  const addressStyleSections = relationshipRecall.addressStyleMemory
    ? buildAddressStyleRecallInstructions({
        isZh,
        styleValue: relationshipRecall.addressStyleMemory.content
      })
    : [];

  const sections = isZh
    ? [
        "与这条回复相关的长期记忆：",
        ...relationshipSections,
        ...preferredNameSections,
        ...addressStyleSections,
        ...recalledMemories.map(
          (memory, index) =>
            `${index + 1}. [${memory.memory_type}] ${memory.content}（置信度 ${memory.confidence.toFixed(2)}）`
        ),
        "只在这些记忆确实与当前用户消息相关时才使用它们，不要生硬地强塞进回复。",
        "即使记忆片段或内部说明是英文，只要当前轮目标语言是中文，也要整条回复保持简体中文。"
      ]
    : [
        "Relevant long-term memory for this reply:",
        ...relationshipSections,
        ...preferredNameSections,
        ...addressStyleSections,
        ...recalledMemories.map(
          (memory, index) =>
            `${index + 1}. [${memory.memory_type}] ${memory.content} (confidence ${memory.confidence.toFixed(2)})`
        ),
        "Use these memories only when they are genuinely relevant to the current user message. Do not force them into the reply.",
        "Even if a recalled memory snippet was originally stored in another language, keep the full reply in the current target language."
      ];

  sections.push(
    ...buildAnswerStrategyInstructions({
      latestUserMessage,
      answerQuestionType,
      answerStrategy,
      answerStrategyPriority: answerStrategyRule.priority,
      directRecallQuestionKind,
      isZh,
      recalledMemories,
      relationshipRecall
    })
  );

  return sections.join("\n");
}

function buildAddressStyleRecallInstructions({
  isZh,
  styleValue
}: {
  isZh: boolean;
  styleValue: string;
}) {
  if (styleValue === "formal") {
    return isZh
      ? [
          "结构化关系记忆：当前这个 agent 应该用更正式、更礼貌的方式和用户互动。",
          "保持正式，但不要生硬。",
          "让这种风格稳定体现在开场、过渡和收尾里，而不只是局部句子。"
        ]
      : [
          "Structured relationship memory: this agent should interact with the user in a more formal, respectful way.",
          "Keep the tone formal without sounding stiff.",
          "Let this style show up consistently in openings, transitions, and closings rather than in only one sentence."
        ];
  }

  if (styleValue === "friendly") {
    return isZh
      ? [
          "结构化关系记忆：当前这个 agent 应该更像朋友一样和用户互动。",
          "保持自然、亲近，但不要夸张。",
          "让这种关系感稳定体现在开场语、称呼和收尾里。"
        ]
      : [
          "Structured relationship memory: this agent should interact with the user in a more friendly, companion-like way.",
          "Keep the tone warm and natural without overdoing it.",
          "Let this relationship style show up in greetings, address terms, and closings."
        ];
  }

  if (styleValue === "no_full_name") {
    return isZh
      ? [
          "结构化关系记忆：当前这个 agent 不应使用用户的全名来称呼对方。",
          "如果需要称呼用户，优先使用更短或更中性的方式。",
          "在开场和收尾里也要遵守这个约束，不要只在解释时遵守。"
        ]
      : [
          "Structured relationship memory: this agent should avoid addressing the user by their full name.",
          "If you need to address the user, prefer a shorter or more neutral form.",
          "Apply this in openings and closings too, not only in factual explanations."
        ];
  }

  return isZh
    ? [
        "结构化关系记忆：当前这个 agent 应该用更轻松、不那么正式的方式和用户互动。",
        "保持自然、简洁和轻松，不要突然切回非常正式的口吻。",
        "让这种语气稳定体现在开场、自我介绍和收尾里。"
      ]
    : [
        "Structured relationship memory: this agent should interact with the user in a more casual, less formal way.",
        "Keep the tone natural, concise, and relaxed instead of suddenly becoming very formal.",
        "Carry this tone through greetings, self-introductions, and closings."
      ];
}

function getDirectRecallQuestionKind(
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
    normalizedUserMessage.includes("what kind of weekly planning style would fit me best") ||
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

function getAnswerQuestionRouting(params: {
  latestUserMessage: string;
  directRecallQuestionKind: DirectRecallQuestionKind;
  directNamingQuestion: boolean;
  directPreferredNameQuestion: boolean;
  relationshipStylePrompt: boolean;
  sameThreadContinuity: boolean;
  relationshipCarryoverAvailable: boolean;
}): {
  questionType: AnswerQuestionType;
  reasonCode: AnswerStrategyReasonCode;
  continuationReasonCode: ContinuationReasonCode | null;
} {
  const {
    latestUserMessage,
    directRecallQuestionKind,
    directNamingQuestion,
    directPreferredNameQuestion,
    relationshipStylePrompt,
    sameThreadContinuity,
    relationshipCarryoverAvailable
  } = params;

  if (directNamingQuestion || directPreferredNameQuestion) {
    return {
      questionType: "direct-relationship-confirmation",
      reasonCode: "direct-relationship-question",
      continuationReasonCode: null
    };
  }

  if (directRecallQuestionKind !== "none") {
    return {
      questionType: "direct-fact",
      reasonCode: "direct-memory-question",
      continuationReasonCode: null
    };
  }

  if (
    isRelationshipContinuationEdgePrompt(latestUserMessage) &&
    (sameThreadContinuity || relationshipCarryoverAvailable)
  ) {
    return {
      questionType: "fuzzy-follow-up",
      reasonCode: "same-thread-edge-carryover",
      continuationReasonCode: getContinuationReasonCode(latestUserMessage)
    };
  }

  if (relationshipStylePrompt) {
    return {
      questionType: "open-ended-summary",
      reasonCode: "relationship-answer-shape-prompt",
      continuationReasonCode: null
    };
  }

  if (isOpenEndedAdviceQuestion(latestUserMessage)) {
    return {
      questionType: "open-ended-advice",
      reasonCode: "open-ended-advice-prompt",
      continuationReasonCode: null
    };
  }

  if (isOpenEndedSummaryQuestion(latestUserMessage)) {
    return {
      questionType: "open-ended-summary",
      reasonCode: "open-ended-summary-prompt",
      continuationReasonCode: null
    };
  }

  return {
    questionType: "other",
    reasonCode: "default-grounded-fallback",
    continuationReasonCode: null
  };
}

function getAnswerStrategyRule(questionType: AnswerQuestionType) {
  return (
    ANSWER_STRATEGY_MATRIX.find((entry) => entry.questionType === questionType) ?? {
      questionType: "other" as const,
      strategy: "default-grounded" as const,
      priority: "semi-constrained" as const,
      description:
        "Other prompts should use the default grounded answer path without overfitting to direct recall."
    }
  );
}

function getAnswerStrategyPriorityLabel(
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

function buildDirectRecallInstructions(
  questionKind: DirectRecallQuestionKind,
  isZh: boolean
) {
  if (questionKind === "profession") {
    return isZh
      ? [
          "用户正在直接询问职业/身份类事实。如果上面的长期记忆已经包含职业信息，就直接回答那个职业事实，不要绕开。",
          "当相关长期记忆已经命中时，不要再说你没有先前知识、没有对话历史，或不记得。"
        ]
      : [
          "The user is directly asking for a profession or identity fact. If the recalled memory above includes that fact, answer with it plainly and directly.",
          "When relevant long-term memory is present, do not say that you have no prior knowledge, no previous conversation, or no memory."
        ];
  }

  if (questionKind === "planning-style") {
    return isZh
      ? [
          "用户正在直接询问偏好类事实。如果上面的长期记忆已经包含规划方式或回复偏好，就直接回答那个偏好，不要改写成泛泛建议。",
          "当相关长期记忆已经命中时，不要把“我没有对话历史”和“我没有长期记忆”混为一谈。"
        ]
      : [
          "The user is directly asking for a preference fact. If the recalled memory above includes a planning style or reply preference, answer with that preference directly instead of turning it into generic advice.",
          "When relevant long-term memory is present, do not confuse missing conversation history with missing long-term memory."
        ];
  }

  if (questionKind === "reply-style") {
    return isZh
      ? [
          "用户正在直接询问自己偏好的回复方式或语气。如果上面的长期记忆已经包含相关偏好，就直接回答那个偏好，不要改写成泛泛建议。",
          "如果上面的关系记忆说明当前 agent 应该用更正式、更轻松、像朋友一样，或不要叫用户全名，就优先把这些偏好直接说清楚。",
          "当相关长期记忆已经命中时，不要把“我没有对话历史”和“我没有长期记忆”混为一谈。"
        ]
      : [
          "The user is directly asking what reply style or tone they prefer. If the recalled memory above contains that preference, answer with it directly instead of turning it into generic advice.",
          "If the relationship memory above indicates a more formal, more casual, more friendly, or no-full-name preference, explain that preference plainly before falling back to vaguer wording.",
          "When relevant long-term memory is present, do not confuse missing conversation history with missing long-term memory."
        ];
  }

  return isZh
    ? [
        "用户正在直接追问你记得什么。如果上面的召回记忆已经覆盖答案，就直接、明确地回答那个记住的事实。",
        "当上面已经列出相关长期记忆时，不要再说你没有先前知识、没有对话历史，或不记得。"
      ]
    : [
        "The user is directly asking what you remember. If the answer is covered by the recalled memory above, answer with that remembered fact plainly.",
        "Do not say that you have no prior knowledge, no previous conversation, or no memory when relevant long-term memory is listed above."
      ];
}

function buildAnswerStrategyInstructions({
  latestUserMessage,
  answerQuestionType,
  answerStrategy,
  answerStrategyPriority,
  directRecallQuestionKind,
  isZh,
  recalledMemories,
  relationshipRecall
}: {
  latestUserMessage: string;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyPriority: AnswerStrategyPriority;
  directRecallQuestionKind: DirectRecallQuestionKind;
  isZh: boolean;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  relationshipRecall: {
    sameThreadContinuity: boolean;
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
  };
}) {
  const styleSofteningPrompt = isLightStyleSofteningPrompt(latestUserMessage);

  if (
    answerStrategy === "structured-recall-first" ||
    answerStrategy === "relationship-recall-first"
  ) {
    return [
      ...(isZh
        ? [
            "这类问法属于高确定性回答场景。优先用已命中的结构化记忆直接回答，不要让更自由的生成覆盖掉它。"
          ]
        : [
            "This prompt type has high deterministic priority. Prefer a direct answer grounded in recalled structured memory before freer generation."
          ]),
      ...buildDirectRecallInstructions(directRecallQuestionKind, isZh)
    ];
  }

  if (
    answerStrategy === "grounded-open-ended-advice" ||
    answerStrategy === "grounded-open-ended-summary"
  ) {
    return [
      ...(isZh
        ? [
            "这类问法属于低确定性回答场景。可以更自然地生成，但仍要保持在已召回记忆和当前关系边界内。"
          ]
        : [
            "This prompt type has low deterministic priority. Keep the answer natural and more open-ended, but stay within recalled memory and relationship boundaries."
          ]),
      ...(styleSofteningPrompt
        ? isZh
          ? [
              "当前用户是在让你把语气放轻一点。像同一个持续角色那样自然接住这个请求，并立刻用更轻松的方式继续说，不要把回复写成偏好说明。"
            ]
          : [
              "The user is asking you to soften the tone. Acknowledge it like the same ongoing role and immediately continue in a lighter way instead of turning the reply into a preference explanation."
            ]
        : []),
      ...buildOpenEndedRecallInstructions({
        latestUserMessage,
        isZh,
        recalledMemories,
        questionType: answerQuestionType,
        relationshipRecall
      })
    ];
  }

  if (answerStrategy === "same-thread-continuation") {
    return [
      ...(isZh
        ? [
            "这类问法属于半约束场景。优先延续同线程已形成的语言、称呼和关系风格，再在此基础上自然回应。"
          ]
        : [
            "This prompt type is semi-constrained. Prefer continuing the language, address terms, and relationship style already established in the same thread."
          ]),
      ...(isZh
        ? [
            "这是一个同线程里的短跟进。优先延续这个线程已经形成的语言、称呼和关系风格，不要突然切回默认语气。",
            "如果上面的长期记忆与当前线程连续性相关，就自然沿用它们，而不是把回答写成新的生硬总结。",
            "即使用户这轮是在要一句鼓励、一个简短总结，或只是要你继续说下去，也把它当作同线程关系延续，而不是新的中性任务。"
          ]
        : [
            "This is a short follow-up in the same thread. Prefer continuing the language, address terms, and relationship style already established here instead of snapping back to the default tone.",
            "If the recalled memory supports the current thread continuity, carry it forward naturally instead of turning the reply into a fresh rigid summary.",
            "Even when the user only asks for a brief encouragement line, a short recap, or a simple continuation, treat it as same-thread relationship carryover instead of a fresh neutral task."
          ]),
      ...(styleSofteningPrompt
        ? isZh
          ? [
              "当前用户是在让你把语气放轻一点。像同一个持续角色那样顺着这个请求自然放松口吻，不要把回复写成偏好设置说明。"
            ]
          : [
              "The user is asking you to soften the tone. Relax the voice naturally like the same ongoing role instead of replying with a preference-setting explanation."
            ]
        : []),
      ...(isOneLineSoftCatchPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户只想让你轻轻接一句。请只用一句话接住情绪，不要展开成分析、建议、解释或总结，也不要退回成“我们继续”这类空泛续接句。"
            ]
          : [
              "The user only wants one gentle catch line here. Reply with a single line that catches the feeling without expanding into advice, explanation, or summary, and do not fall back to an empty continuation like 'we can keep going.'"
            ]
        : []),
      ...(isBriefSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你先帮他稳一下，再继续往后说。先用很短的一两句把人接稳，不要立刻转入分析、建议、解释或总结。"
            ]
          : [
              "The user wants you to help them settle first before saying more. Use a very short steadying reply first and do not jump straight into analysis, advice, explanation, or summary."
            ]
        : []),
      ...(isGentleCarryForwardAfterSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你先缓一下，再轻轻往前带半步。先短短把人接稳，再自然给出一个很轻的陪跑式下一步，不要写成正式建议、分析、解释或总结。",
              "不要把回复扩成步骤清单、分点建议，或“第一步/先做这个”这类明确行动指挥。保持一句到两句、轻一点、像同一个人顺着往前带半步。"
            ]
          : [
              "The user wants you to help them settle first and then move forward by half a step. Steady them briefly first, then offer one very light companion-style next step without turning it into formal advice, analysis, explanation, or summary.",
              "Do not expand the reply into a step list, bullet-point guidance, or explicit directive phrases like 'first do this.' Keep it to one or two light sentences that gently carry the user forward."
            ]
        : []),
      ...(isGuidedNextStepAfterSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在 anti-advice 和 steadying 之后，要你再陪他理一步。保持同一条关系线，只给一个很小、很轻的陪跑式下一步，不要掉回 generic continuation，也不要膨胀成正式建议、步骤清单、分析、解释或任务模式。",
              "回复控制在一到两句，更像同一个人顺着陪他理清眼前的一小步，而不是切成 detached task mode。"
            ]
          : [
              "After anti-advice and steadying, the user is asking you to work through just one small next step with them. Stay on the same relationship line, give only one very light companion-style next step, and do not fall back to generic continuation or expand into formal advice, step lists, analysis, explanation, or task mode.",
              "Keep it to one or two sentences so it still sounds like the same person helping them sort one small next step instead of switching into detached task mode."
            ]
        : []),
      ...(isCompanionStyleExplanationCarryoverPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在 anti-redirection 之后，让你简单陪他理一下。保持同一条关系线，顺着他刚刚那一点轻轻理顺，不要滑进 detached advice、规划口吻、解释模板或中性说明文。",
              "回复控制在一到两句，更像同一个人陪着理清眼前这一点，而不是切成“我会先帮你抓重点/整理计划”这类任务式展开。"
            ]
          : [
              "After an anti-redirection opening, the user is asking you to simply sort this point through with them. Stay on the same relationship line, gently help them work through that exact point, and do not drift into detached advice, planning language, explanation templates, or neutral explanatory prose.",
              "Keep it to one or two sentences so it still sounds like the same person helping them sort this one point instead of switching into task-like expansion."
            ]
        : []),
      ...(isLightSharedPushPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在说“那我们先一起把这一点弄过去”。回复保持很短，像同一个人和他站在一起先过眼前这一小点，不要转成正式建议、步骤清单、分析、解释或总结。",
              "不要写成“第一步/先做这个/你应该”这类行动指挥。更像一句轻轻同站一边、一起往前过一点的陪跑式回应。"
            ]
          : [
              "The user is asking to get through this small piece together first. Keep the reply very short like the same person staying on their side and moving through this bit with them, without turning it into formal advice, a step list, analysis, explanation, or summary.",
              "Do not use directive phrasing like 'first do this' or 'you should.' Make it feel like a light shared push forward together."
            ]
        : []),
      ...(isNonJudgingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别评判我”。回复保持很短，强调你先不评判、先陪着他，不转成建议、解释、说理或道德判断。",
              "如果用户说的是“你先别数落我”，把它理解成不要责备、不要数落、先陪着他，而不是转成说教或分析。",
              "不要把它写成分析、安慰模板、价值评判或“你应该怎么做”。更像一句轻轻表明“我先不评判你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't judge me first' kind of reply. Keep it brief, emphasize that you are not judging them and are staying with them first, without turning it into advice, explanation, lecturing, or moral judgment.",
              "If the user says 'don't scold me first,' treat it as a request to avoid blame or lecturing and stay with them first.",
              "Do not write it like analysis, a canned comfort template, a value judgment, or 'what you should do.' Make it feel like a light line saying you are not judging them first and are still here."
            ]
        : []),
      ...(isAntiLecturingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别教育我”。回复保持很短，强调你先不说教、先陪着他，不转成建议、解释、辩论、讲道理或道德判断。",
              "如果用户说的是“你先别给我上课”，把它理解成不要拿说教、上课、训导的姿态来回应，先陪着他。",
              "如果用户说的是“你先别跟我说教”，把它理解成不要用说教、训人、居高临下讲道理的姿态来回应，先陪着他。",
              "不要把它写成反向说教、安慰模板、分析回复或“你应该怎么做”。更像一句轻轻表明“好，我先不教育你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't lecture me first' kind of reply. Keep it brief, emphasize that you are not lecturing them and are staying with them first, without turning it into advice, explanation, debate, reasoning, or moral judgment.",
              "If the user says 'don't give me a lecture first,' treat it as a request to avoid a lecturing or instructive posture and stay with them first.",
              "If the user says 'don't preach to me first,' treat it as a request to avoid a preachy, scolding, or superior instructive posture and stay with them first.",
              "Do not write it like reverse lecturing, a comfort template, analysis, or 'what you should do.' Make it feel like a light line saying you are not lecturing them first and are still here."
            ]
        : []),
      ...(isAntiCorrectionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着纠正我”。回复保持很短，强调你先不急着纠正、先陪着他，不转成解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别老纠正我”，把它理解成不要一直拿纠偏、改正、挑错的姿态来回应，先陪着他。",
              "不要把它写成分析、反驳、安慰模板或“你其实应该怎么做”。更像一句轻轻表明“好，我先不急着纠正你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't correct me so quickly first' kind of reply. Keep it brief, emphasize that you are not rushing to correct them and are staying with them first, without turning it into explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't keep correcting me first,' treat it as a request to avoid a repeated corrective posture and stay with them first.",
              "Do not write it like analysis, rebuttal, a canned comfort template, or 'what you should do instead.' Make it feel like a light line saying you are not rushing to correct them first and are still here."
            ]
        : []),
      ...(isAntiConclusionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我下结论”。回复保持很短，强调你先不急着下结论、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别这么快下结论”，把它理解成不要太快收束判断、定夺或盖棺论定，先陪着他。",
              "不要把它写成分析总结、反驳、安慰模板或“你其实是什么样的人”。更像一句轻轻表明“好，我先不急着给你下结论，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't jump to conclusions about me first' kind of reply. Keep it brief, emphasize that you are not rushing to conclude about them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't conclude so quickly first,' treat it as a request not to lock in a judgment too fast and stay with them first.",
              "Do not write it like a summarizing analysis, rebuttal, canned comfort template, or a statement of what kind of person they are. Make it feel like a light line saying you are not rushing to conclude about them first and are still here."
            ]
        : []),
      ...(isAntiLabelingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我定性”。回复保持很短，强调你先不急着给他定性、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别急着给我定性”，把它理解成不要太快把他定成某种性质、判断或结论，先陪着他。",
              "不要把它写成分析归类、反驳、安慰模板或“你就是怎样的人”。更像一句轻轻表明“好，我先不急着给你定性，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't label me first' kind of reply. Keep it brief, emphasize that you are not rushing to label them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't rush to label me first,' treat it as a request not to lock them into a label or verdict too quickly and stay with them first.",
              "Do not write it like categorizing analysis, rebuttal, a canned comfort template, or a statement of what kind of person they are. Make it feel like a light line saying you are not rushing to label them first and are still here."
            ]
        : []),
      ...(isAntiTaggingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我贴标签”。回复保持很短，强调你先不急着给他贴标签、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别急着给我贴标签”，把它理解成不要太快把他归进某种标签里，先陪着他。",
              "不要把它写成分析归类、反驳、安慰模板或“你就是哪一类人”。更像一句轻轻表明“好，我先不急着给你贴标签，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't tag me first' kind of reply. Keep it brief, emphasize that you are not rushing to tag them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't rush to tag me first,' treat it as a request not to place them into a label too quickly and stay with them first.",
              "Do not write it like categorizing analysis, rebuttal, a canned comfort template, or a statement of what kind of person they are. Make it feel like a light line saying you are not rushing to tag them first and are still here."
            ]
        : []),
      ...(isAntiMischaracterizationFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别把我说成那样”。回复保持很短，强调你先不急着把他说成某种样子、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别把我想成那样”，把它理解成不要急着按某种印象去想象、误读或套到他身上，先陪着他。",
              "不要把它写成分析归类、反驳、安慰模板或“你其实就是那样的人”。更像一句轻轻表明“好，我先不急着把你说成那样，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't describe me that way first' kind of reply. Keep it brief, emphasize that you are not rushing to cast them that way and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't think of me that way first,' treat it as a request not to project an impression or misread onto them too quickly and stay with them first.",
              "Do not write it like categorizing analysis, rebuttal, a canned comfort template, or a statement that they really are that kind of person. Make it feel like a light line saying you are not rushing to paint them that way first and are still here."
            ]
        : []),
      ...(isAntiOverreadingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别替我解读”。回复保持很短，强调你先不急着替他下解释、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "如果用户说的是“你先别脑补我”，把它理解成不要急着用自己的想象、脑补或过度推断去套在他身上，先陪着他。",
              "不要把它写成动机分析、安慰模板或“你其实是在想什么”。更像一句轻轻表明“好，我先不急着替你解读，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't interpret me for me first' kind of reply. Keep it brief, emphasize that you are not rushing to interpret them for them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "If the user says 'don't make things up about me first,' treat it as a request not to project imagination or overread onto them too quickly and stay with them first.",
              "Do not write it like motive analysis, a canned comfort template, or a statement of what they are really thinking. Make it feel like a light line saying you are not rushing to interpret them first and are still here."
            ]
        : []),
      ...(isAntiAnalysisFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着分析我”。回复保持很短，强调你先不急着分析他、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。",
              "不要把它写成心理分析、安慰模板或“你其实为什么会这样”。更像一句轻轻表明“好，我先不急着分析你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't analyze me first' kind of reply. Keep it brief, emphasize that you are not rushing to analyze them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment.",
              "Do not write it like psychological analysis, a canned comfort template, or an explanation of why they are really like this. Make it feel like a light line saying you are not rushing to analyze them first and are still here."
            ]
        : []),
      ...(isAntiProbingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别问我为什么”。回复保持很短，强调你先不急着追问原因、先陪着他，不转成解释、追问、分析、建议、讲道理或总结。",
              "如果用户说的是“你先别盘问我”，把它理解成不要用盘问、追着追问、审问式的姿态来回应，先陪着他。",
              "不要把它写成探因、安慰模板或引导用户解释自己。更像一句轻轻表明“好，我先不问你为什么，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't ask me why first' kind of reply. Keep it brief, emphasize that you are not rushing to probe for reasons and are staying with them first, without turning it into explanation, questioning, analysis, advice, reasoning, or summary.",
              "If the user says 'don't interrogate me first,' treat it as a request to avoid an interrogating or repeated probing posture and stay with them first.",
              "Do not write it like cause-probing, a canned comfort template, or a prompt that pushes the user to explain themselves. Make it feel like a light line saying you are not asking why first and are still here."
            ]
        : []),
      ...(isAntiRushingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别催我”。回复保持很短，强调你先不催、不逼着他往前推进，先陪着他，不转成建议、步骤、解释、追问或讲道理。",
              "如果用户说的是“你先别逼我”，把它理解成不要用逼迫、硬推、压着他往前的姿态来回应，先陪着他。",
              "不要把它写成“那你先做什么”这类推进指挥。更像一句轻轻表明“好，我先不催你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't rush me first' kind of reply. Keep it brief, emphasize that you are not pushing or hurrying them forward and are staying with them first, without turning it into advice, steps, explanation, probing, or lecturing.",
              "If the user says 'don't push me first,' treat it as a request to avoid a forcing or hard-pushing posture and stay with them first.",
              "Do not write it like directional pressure such as 'then do this first.' Make it feel like a light line saying you are not rushing them first and are still here."
            ]
        : []),
      ...(isAntiSolutioningFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着帮我解决”。回复保持很短，强调你先不急着进入解决问题模式、先陪着他，不转成建议、步骤、解释、分析或说理。",
              "如果用户说的是“你先别上来就帮我解决”，把它理解成不要一上来就切进 fix-it / 修问题模式，先陪着他。",
              "不要把它写成“那我们先怎么解决”这类修问题指挥。更像一句轻轻表明“好，我先不急着帮你解决，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't rush to solve this for me first' kind of reply. Keep it brief, emphasize that you are not rushing into problem-solving mode and are staying with them first, without turning it into advice, steps, explanation, analysis, or lecturing.",
              "If the user says 'don't jump straight into solving this for me,' treat it as a request not to open in fix-it mode and stay with them first.",
              "Do not write it like 'then here's how we solve it.' Make it feel like a light line saying you are not rushing to solve it for them first and are still here."
            ]
        : []),
      ...(isAntiComfortingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着安慰我”。回复保持很短，强调你先不急着切进安慰模板或鼓励模式、先陪着他，不转成建议、解释、打气、分析或说理。",
              "如果用户说的是“你先别给我打气”，把它理解成不要切进鼓劲、鼓励、打鸡血的姿态，先陪着他。",
              "不要把它写成“你已经很棒了”这类现成安慰句。更像一句轻轻表明“好，我先不急着安慰你，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't rush to comfort me first' kind of reply. Keep it brief, emphasize that you are not rushing into canned comforting or encouragement mode and are staying with them first, without turning it into advice, explanation, pep talk, analysis, or lecturing.",
              "If the user says 'don't start giving me a pep talk,' treat it as a request to avoid an encouraging or hype-up posture and stay with them first.",
              "Do not write it like a ready-made reassurance line such as 'you are doing great.' Make it feel like a light line saying you are not rushing to comfort them first and are still here."
            ]
        : []),
      ...(isAntiAdviceFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着给我建议”。回复保持很短，强调你先不急着切进建议模式、先陪着他，不转成出主意、步骤、解释、分析或说理。",
              "如果用户说的是“你先别上来就给我建议”，把它理解成不要一开口就切进建议、出主意或指路模式，先陪着他。",
              "不要把它写成“那你可以先……”这类建议开头。更像一句轻轻表明“好，我先不急着给你建议，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't rush to give me advice first' kind of reply. Keep it brief, emphasize that you are not rushing into advice mode and are staying with them first, without turning it into suggestions, steps, explanation, analysis, or lecturing.",
              "If the user says 'don't jump straight into giving me advice,' treat it as a request not to open in suggestion mode and stay with them first.",
              "Do not write it like an advice opener such as 'you could start by...'. Make it feel like a light line saying you are not rushing to give them advice first and are still here."
            ]
        : []),
      ...(isAntiMinimizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别跟我说这没什么”。回复保持很短，强调你先不缩小他的感受、不把这事说轻，先陪着他，不转成安慰、建议、分析、解释或说理。",
              "如果用户说的是“你先别跟我说没什么大不了”，把它理解成不要轻描淡写、不要把他的状态说成不值得认真对待，先陪着他。",
              "把它理解成用户不要被轻描淡写、不要被告知这事不值一提，先在原有关系线上接住他。",
              "不要把它写成“其实没事”“你别想太多”这类淡化状态的句子。更像一句轻轻表明“好，我先不跟你说这没什么，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't tell me this is nothing first' kind of reply. Keep it brief, emphasize that you are not minimizing what they are feeling and are staying with them first, without turning it into comfort, advice, analysis, explanation, or lecturing.",
              "If the user says 'don't tell me it's no big deal,' treat it as a request not to brush their state off or downplay it, and stay with them first.",
              "Treat it as a request not to downplay their state or wave it away as no big deal, and stay on the existing relationship line first.",
              "Do not write it like 'it's nothing' or 'don't overthink it.' Make it feel like a light line saying you are not brushing it off and are still here."
            ]
        : []),
      ...(isAntiNormalizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别跟我说大家都这样”。回复保持很短，强调你先不把他的状态泛化成人人都一样，先陪着他，不转成安慰、建议、分析、解释或说理。",
              "如果用户说的是“你先别跟我说谁都会这样”，把它理解成不要把他的状态扁平化成任何人都会经历的事，先陪着他。",
              "把它理解成用户不要被正常化、不要被一句“别人也这样”带过去，先在原有关系线上接住他。",
              "不要把它写成“很多人都这样”“这很常见”这类正常化句子。更像一句轻轻表明“好，我先不跟你说大家都这样，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't tell me everyone feels this way first' kind of reply. Keep it brief, emphasize that you are not normalizing their state away and are staying with them first, without turning it into comfort, advice, analysis, explanation, or lecturing.",
              "If the user says 'don't tell me anyone would feel this way,' treat it as a request not to flatten their state into a generic anyone-goes-through-this line, and stay with them first.",
              "Treat it as a request not to flatten what they are feeling into 'everyone goes through this' and stay on the existing relationship line first.",
              "Do not write it like 'a lot of people feel this way' or 'this is common.' Make it feel like a light line saying you are not normalizing it away and are still here."
            ]
        : []),
      ...(isAntiComparingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别拿别人跟我比”。回复保持很短，强调你先不把他和别人比较，先陪着他，不转成安慰、建议、分析、解释或说理。",
              "如果用户说的是“你先别老拿别人跟我比”，把它理解成不要反复把他拿去跟别人对照，先陪着他。",
              "把它理解成用户不要被拿去跟别人对照、不要被用别人当标尺来回应，先在原有关系线上接住他。",
              "不要把它写成“别人也能做到”“你看看谁谁谁”这类比较句子。更像一句轻轻表明“好，我先不拿别人跟你比，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't compare me to other people first' kind of reply. Keep it brief, emphasize that you are not comparing them against other people and are staying with them first, without turning it into comfort, advice, analysis, explanation, or lecturing.",
              "If the user says 'don't keep comparing me to other people,' treat it as a request to stop repeatedly measuring them against others and stay with them first.",
              "Treat it as a request not to respond by measuring them against other people or using someone else as the yardstick, and stay on the existing relationship line first.",
              "Do not write it like 'other people do this too' or 'look at what so-and-so does.' Make it feel like a light line saying you are not comparing them to others and are still here."
            ]
        : []),
      ...(isAntiRedirectionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别转移话题”。回复保持很短，强调你先不把话题岔开、不把他从当前感受上带走，先陪着他，不转成安慰、建议、分析、解释或说理。",
              "如果用户说的是“你先别岔开话题”，把它理解成不要顺手把话题带开、拐开，先陪着他留在当前这件事上。",
              "把它理解成用户要你继续留在他此刻正在说的这件事上，而不是绕开、跳开或换话题。",
              "不要把它写成换方向、换重点或“我们聊点别的”这类转向句子。更像一句轻轻表明“好，我先不转移话题，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't redirect the topic first' kind of reply. Keep it brief, emphasize that you are not steering the conversation away from what they are trying to stay with and are staying with them first, without turning it into comfort, advice, analysis, explanation, or lecturing.",
              "If the user says 'don't veer off the topic,' treat it as a request not to casually drift or branch away from what they are trying to stay with, and stay with them first.",
              "Treat it as a request to stay with the thing they are actually trying to talk about instead of pivoting, dodging, or changing the topic.",
              "Do not write it like a redirect, a new angle, or 'let's talk about something else.' Make it feel like a light line saying you are not redirecting the topic and are still here."
            ]
        : []),
      ...(isAntiDefinitionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别替我定义”。回复保持很短，强调你先不急着替他下定义、先陪着他，不转成解释、评判、分析、建议、讲道理或总结。",
              "不要把它写成身份归类、安慰模板或替用户概括他是谁。更像一句轻轻表明“好，我先不替你定义，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't define me first' kind of reply. Keep it brief, emphasize that you are not rushing to define them for them and are staying with them first, without turning it into explanation, judgment, analysis, advice, reasoning, or summary.",
              "Do not write it like identity categorization, a canned comfort template, or a summary of who they are. Make it feel like a light line saying you are not defining them first and are still here."
            ]
        : []),
      ...(isAntiCategorizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别替我归类”。回复保持很短，强调你先不急着把他归进某一类、先陪着他，不转成解释、评判、分析、建议、讲道理或总结。",
              "不要把它写成身份分类、安慰模板或替用户判断他属于哪一类。更像一句轻轻表明“好，我先不替你归类，我在这儿陪着你”。"
            ]
          : [
              "The user wants a very short 'don't sort me into a category first' kind of reply. Keep it brief, emphasize that you are not rushing to categorize them and are staying with them first, without turning it into explanation, judgment, analysis, advice, reasoning, or summary.",
              "Do not write it like identity sorting, a canned comfort template, or a judgment of what category they belong to. Make it feel like a light line saying you are not categorizing them first and are still here."
            ]
        : []),
      ...(isSameSideFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先站我这边”。回复保持很短，强调你在他这边陪着他，不转成辩论、讲道理、建议、解释或无条件替他判断所有事情。",
              "如果用户明确说了“先别跟我讲道理”，就不要把回复写成说教、分析或反驳。更像一句轻轻表明“我先在你这边陪着你”。",
              "不要把它写成价值站队宣言或展开争论，也不要无条件认同所有判断。"
            ]
          : [
              "The user wants a very short 'be on my side first' kind of reply. Keep it brief, emphasize that you are here with them on their side, and do not turn it into debate, advice, explanation, or blanket endorsement of every claim.",
              "If the user explicitly says not to lecture them first, avoid sounding preachy, analytical, or argumentative. Make it feel like a light line saying you are with them first.",
              "Do not write it like a values manifesto or an argument."
            ]
        : []),
      ...(isFriendLikeSoftFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你再像朋友一样陪一句。回复保持很短，像同一个人继续陪着说，不要转成建议、总结、解释，也不要退回成空泛的“我们继续聊”。"
            ]
          : [
              "The user wants one more brief friend-like follow-up. Keep the reply very short like the same person staying with them, without turning it into advice, summary, explanation, or an empty continuation like 'we can keep talking.'"
            ]
        : []),
      ...(isStayWithMeFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你继续陪着他说。回复保持很短，强调你还在这条关系线上陪着他，不要转成建议、总结、解释，也不要写成新的能力说明。"
            ]
          : [
              "The user wants you to keep staying with them in the conversation. Keep the reply very short, emphasize that you are still here with them on the same relationship line, and do not turn it into advice, summary, explanation, or a fresh capability statement."
            ]
        : []),
      ...(isGentleResumeRhythmPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想慢一点恢复说话节奏。像同一个人顺着刚才的关系线继续说，不要重新开场，不要转成总结、解释或建议，也不要退回成空泛的“我们继续聊”。"
            ]
          : [
              "The user wants to gently resume the rhythm of the conversation. Continue on the same relationship line without restarting, summarizing, explaining, or falling back to an empty continuation like 'we can keep talking.'"
            ]
        : []),
      ...(isPresenceConfirmingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在确认你还在不在这条关系线上。用很短的一两句确认你还在陪着他，不要转成能力说明、自我介绍、解释或空泛安慰。",
              "如果用户说的是“你先别走开”，把它理解成关系上的陪着在这儿，不要理解成字面导航、产品操作或离开页面。"
            ]
          : [
              "The user is checking whether you are still here with them on the same relationship line. Use one or two short lines to confirm your presence without turning the reply into a capability explanation, self-introduction, or generic reassurance.",
              "If the user says 'don't go away yet,' treat it as relationship presence rather than literal navigation or product-operation guidance."
            ]
        : [])
    ];
  }

  const defaultInstructions = recalledMemories.length > 0
    ? isZh
      ? [
          "这轮不是明确直问，也不是需要强结构化回填的场景。把已召回的长期记忆当作背景约束，自然融进回答里。",
          "避免无根据地自由发挥，但也不要把回答写成机械的事实列表。"
        ]
      : [
          "This turn is not a strict direct-question case. Use recalled long-term memory as background grounding and weave it in naturally.",
          "Avoid unguided drift, but do not turn the answer into a mechanical list of facts."
        ]
    : [];

  return answerStrategyPriority === "semi-constrained"
    ? [
        ...(isZh
          ? [
              "这类问法属于半约束场景。保留已召回记忆的边界，但不要把回答收得像直问事实一样生硬。"
            ]
          : [
              "This prompt type is semi-constrained. Keep recalled-memory boundaries in place without turning the reply into a rigid direct-fact answer."
            ]),
        ...(styleSofteningPrompt
          ? isZh
            ? [
                "当前用户是在让你把语气放轻一点。像同一个持续角色那样自然放轻语气并继续，不要把回复写成对偏好的生硬复述。"
              ]
            : [
                "The user is asking you to soften the tone. Continue in a lighter way like the same ongoing role instead of mechanically restating the preference."
              ]
          : []),
        ...defaultInstructions
      ]
    : defaultInstructions;
}

function buildOpenEndedRecallInstructions({
  latestUserMessage,
  isZh,
  recalledMemories,
  questionType,
  relationshipRecall
}: {
  latestUserMessage: string;
  isZh: boolean;
  questionType: AnswerQuestionType;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  relationshipRecall: {
    sameThreadContinuity: boolean;
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
  };
}) {
  if (recalledMemories.length === 0) {
    return [];
  }

  const hasRelationshipContinuity = Boolean(
    relationshipRecall.sameThreadContinuity ||
      relationshipRecall.addressStyleMemory ||
      relationshipRecall.nicknameMemory ||
      relationshipRecall.preferredNameMemory
  );
  const helpNextPrompt = isRelationshipHelpNextPrompt(latestUserMessage);
  const roughDayPrompt = isRelationshipRoughDayPrompt(latestUserMessage);
  const selfIntroPrompt = isRelationshipStylePrompt(latestUserMessage);

  if (questionType === "open-ended-summary") {
    return isZh
      ? [
          "这是一个开放式总结/自我介绍场景。把已召回的长期记忆当作背景约束，让相关事实和关系线索自然地体现在总结里。",
          "不要把回答写成逐槽位复述，也不要忽略已经命中的关系或偏好线索。",
          ...(selfIntroPrompt
            ? [
                "如果这一轮是在让你先介绍自己，把回答写成同一个持续角色的自然开场，而不是像重新开始一段陌生对话。"
              ]
            : []),
          ...(helpNextPrompt
            ? [
                "当前这一轮是在问你接下来会怎么帮助用户。直接回答你会如何继续帮助、推进或陪着往前走，不要提前跳到“如果状态不好时怎么安慰”那类下一轮场景。"
              ]
            : []),
          ...(roughDayPrompt
            ? [
                "当前这一轮是在问状态不太好时你会怎么说。优先回答你会如何安慰、解释和稳住节奏，不要把它改写成泛泛的下一步帮助说明。"
              ]
            : []),
          ...(hasRelationshipContinuity
            ? [
                "如果这个线程已经形成了更轻松、更亲近或特定称呼方式，让这种 relationship 风格继续出现在总结里，不要为了“总结”而突然变平。"
              ]
            : [])
        ]
      : [
          "This is an open-ended summary or self-introduction case. Treat recalled long-term memory as grounding so relevant facts and relationship cues naturally appear in the summary.",
          "Do not turn the reply into slot-by-slot repetition, but do not ignore recalled relationship or preference cues either.",
          ...(selfIntroPrompt
            ? [
                "If this turn is asking you to introduce yourself first, write it like the same continuing role opening the exchange naturally instead of sounding like a fresh stranger reset."
              ]
            : []),
          ...(helpNextPrompt
            ? [
                "This turn is asking how you would help next. Answer the current help-next prompt directly instead of jumping ahead to a later rough-day or comfort scenario."
              ]
            : []),
          ...(roughDayPrompt
            ? [
                "This turn is asking how you would respond when the user is having a rough day. Answer that current supportive scenario directly instead of drifting into generic next-step help."
              ]
            : []),
          ...(hasRelationshipContinuity
            ? [
                "If this thread has already established a more casual, warm, or specific address style, keep that relationship style visible in the summary instead of flattening back to a neutral recap voice."
              ]
            : [])
        ];
  }

  return isZh
    ? [
        "这不是一个需要逐槽位直接回填的直问场景。把已召回的长期记忆当作背景依据，用来组织更自然、更有帮助的回答。",
        "如果用户是在问建议、下一步、帮助方式或更开放的问题，不要只机械复述记忆槽位本身。",
        "优先把相关记忆自然融进建议、解释或行动方向里，而不是把回答写成生硬的事实堆砌。",
        ...(hasRelationshipContinuity
          ? [
              "如果这个线程已经形成了特定称呼或更稳定的 relationship 风格，在建议型回答里也继续保持，不要一到建议段落就切回中性默认语气。"
            ]
          : [])
      ]
    : [
        "This is not a slot-filling direct-question case. Treat the recalled long-term memory as grounding context for a more natural and helpful answer.",
        "If the user is asking for advice, next steps, or broader help, do not respond by mechanically repeating memory slots alone.",
        "Prefer weaving the relevant memory into guidance, explanation, or action-oriented help instead of turning the reply into a rigid fact dump.",
        ...(hasRelationshipContinuity
          ? [
              "If this thread has already established a specific address style or relationship tone, keep it steady in advice turns too instead of snapping back to a neutral default helper voice."
            ]
          : [])
      ];
}

function detectReplyLanguageFromText(content: string): RuntimeReplyLanguage {
  const explicitOverride = detectExplicitLanguageOverride(content);

  if (explicitOverride !== "unknown") {
    return explicitOverride;
  }

  const hanMatches = content.match(/[\u3400-\u9fff]/g) ?? [];
  const latinMatches = content.match(/[A-Za-z]/g) ?? [];
  const cjkPunctuationMatches = content.match(/[，。！？；：“”‘’（）]/g) ?? [];
  const latinWordMatches = content.match(/\b[A-Za-z]{2,}\b/g) ?? [];

  if (
    hanMatches.length === 0 &&
    latinMatches.length === 0 &&
    cjkPunctuationMatches.length === 0
  ) {
    return "unknown";
  }

  const zhWeight = hanMatches.length + cjkPunctuationMatches.length * 0.5;
  const enWeight =
    latinMatches.length * 0.6 + latinWordMatches.length * 1.4;

  if (hanMatches.length >= 2 && zhWeight >= enWeight * 0.8) {
    return "zh-Hans";
  }

  if (latinWordMatches.length >= 2 && enWeight > zhWeight * 1.15) {
    return "en";
  }

  if (hanMatches.length > latinMatches.length) {
    return "zh-Hans";
  }

  if (latinMatches.length > hanMatches.length) {
    return "en";
  }

  return hanMatches.length > 0 ? "zh-Hans" : "en";
}

function getReplyLanguageInstruction(language: RuntimeReplyLanguage) {
  switch (language) {
    case "zh-Hans":
      return [
        "Runtime language target: reply in Simplified Chinese for this turn unless the user explicitly asks to switch languages.",
        "The latest user message has higher priority than prior thread language, recalled memory language, model labels, or internal notes.",
        "Do not drift into English just because recalled memory, model labels, or internal notes contain English text."
      ].join(" ");
    case "en":
      return [
        "Runtime language target: reply in English for this turn unless the user explicitly asks to switch languages.",
        "The latest user message has higher priority than prior thread language, recalled memory language, model labels, or internal notes.",
        "Do not switch to another language just because recalled memory, model labels, or internal notes contain that language."
      ].join(" ");
    default:
      return "Runtime language target: follow the latest user message language, treat it as the highest-priority signal for this turn, and avoid unnecessary language switching within the same reply.";
  }
}

function isRuntimeReplyLanguage(value: unknown): value is RuntimeReplyLanguage {
  return value === "zh-Hans" || value === "en" || value === "unknown";
}

function resolveReplyLanguageForTurn({
  latestUserMessage,
  threadContinuity
}: {
  latestUserMessage: string | null;
  threadContinuity: SessionContinuitySignal;
}) {
  if (!latestUserMessage) {
    return {
      replyLanguage: threadContinuity.establishedReplyLanguage,
      source: "no-latest-user-message" as ReplyLanguageSource
    };
  }

  const latestUserLanguage = detectReplyLanguageFromText(latestUserMessage);

  if (latestUserLanguage !== "unknown") {
    return {
      replyLanguage: latestUserLanguage,
      source: "latest-user-message" as ReplyLanguageSource
    };
  }

  return {
    replyLanguage: threadContinuity.establishedReplyLanguage,
    source: "thread-continuity-fallback" as ReplyLanguageSource
  };
}

function buildThreadContinuityPrompt({
  threadContinuity,
  replyLanguage,
  relationshipRecall
}: {
  threadContinuity: SessionContinuitySignal;
  replyLanguage: RuntimeReplyLanguage;
  relationshipRecall: {
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
    sameThreadContinuity: boolean;
  };
}) {
  if (!threadContinuity.hasPriorAssistantTurn) {
    return "";
  }

  const effectiveLanguage =
    replyLanguage !== "unknown"
      ? replyLanguage
      : threadContinuity.establishedReplyLanguage;
  const isZh = effectiveLanguage === "zh-Hans";
  const relationshipContinuity = Boolean(
    relationshipRecall.addressStyleMemory ||
      relationshipRecall.nicknameMemory ||
      relationshipRecall.preferredNameMemory
  );
  const sections = [
    isZh
      ? "同线程连续性：优先延续这个线程里最近一轮 assistant 已经建立的语言、称呼方式和整体语气，除非用户当前这轮明确要求切换。"
      : "Same-thread continuity: prefer continuing the language, address terms, and overall tone established by the most recent assistant turn in this thread unless the current user message clearly changes it."
  ];

  if (relationshipContinuity) {
    sections.push(
      isZh
        ? "如果这个线程里已经形成了昵称、对用户的称呼或更正式/更轻松的互动方式，让这些关系约定继续自然体现在开场、过渡和收尾里。"
        : "If this thread has already established a nickname, a preferred way to address the user, or a more formal or casual relationship tone, let those choices continue naturally in openings, transitions, and closings."
    );
    sections.push(
      isZh
        ? "即使用户后面只是发很短的跟进、确认或继续提问，也优先延续这个线程已经形成的称呼和关系风格，不要只在第一次命中后就掉回 canonical name 或默认语气。"
        : "Even when later user turns are short follow-ups, confirmations, or brief continuations, keep the established nickname, address terms, and relationship tone instead of dropping back to the canonical name or default style after the first mention."
    );
  }

  if (threadContinuity.establishedReplyLanguage !== "unknown") {
    sections.push(
      isZh
        ? `如果用户当前这条消息本身语言不明显，就沿用这个线程里最近一轮 assistant 的语言：${threadContinuity.establishedReplyLanguage === "zh-Hans" ? "简体中文" : "英文"}。`
        : `If the current user message is language-ambiguous, fall back to the language used by the most recent assistant turn in this thread: ${threadContinuity.establishedReplyLanguage === "zh-Hans" ? "Simplified Chinese" : "English"}.`
    );
  }

  sections.push(
    isZh
      ? "不要让远处历史、全局记忆或 profile 默认值无端打断当前线程已经形成的说话方式。"
      : "Do not let distant history, global memory, or profile defaults unnecessarily reset the speaking style already established in this thread."
  );

  return sections.join("\n");
}

function buildAgentSystemPromptInternal(
  roleCorePacket: RoleCorePacket,
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }> = [],
  replyLanguage: RuntimeReplyLanguage = "unknown",
  relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    relationshipStylePrompt: boolean;
    sameThreadContinuity: boolean;
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
  } = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  },
  threadContinuityPrompt = "",
  threadState: ThreadStateRecord | null = null
) {
  const sections = [
    `You are ${roleCorePacket.identity.agent_name}.`,
    roleCorePacket.persona_summary
      ? `Persona summary: ${roleCorePacket.persona_summary}`
      : "",
    roleCorePacket.style_guidance
      ? `Style guidance: ${roleCorePacket.style_guidance}`
      : "",
    getReplyLanguageInstruction(
      roleCorePacket.language_behavior.reply_language_target
    ),
    threadContinuityPrompt,
    buildThreadStatePrompt(threadState, replyLanguage),
    agentSystemPrompt,
    buildMemoryRecallPrompt(
      latestUserMessage,
      recalledMemories,
      replyLanguage,
      relationshipRecall
    )
  ].filter(Boolean);

  return sections.join("\n\n");
}

function buildThreadStatePrompt(
  threadState: ThreadStateRecord | null | undefined,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!threadState) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections: string[] = [];

  if (threadState.lifecycle_status !== "active") {
    sections.push(
      isZh
        ? `线程状态：当前 lifecycle_status = ${threadState.lifecycle_status}。`
        : `Thread state: current lifecycle_status = ${threadState.lifecycle_status}.`
    );
  }

  if (threadState.focus_mode) {
    sections.push(
      isZh
        ? `线程状态：当前 focus_mode = ${threadState.focus_mode}。`
        : `Thread state: current focus_mode = ${threadState.focus_mode}.`
    );
  }

  if (
    threadState.continuity_status &&
    threadState.continuity_status !== "cold"
  ) {
    sections.push(
      isZh
        ? `线程状态：当前 continuity_status = ${threadState.continuity_status}。`
        : `Thread state: current continuity_status = ${threadState.continuity_status}.`
    );
  }

  if (threadState.current_language_hint) {
    sections.push(
      isZh
        ? `线程状态：当前 current_language_hint = ${threadState.current_language_hint}。`
        : `Thread state: current current_language_hint = ${threadState.current_language_hint}.`
    );
  }

  if (sections.length === 0) {
    return "";
  }

  sections.push(
    isZh
      ? "把 thread_state 视为当前线程的即时进行态；当它和远处记忆冲突时，优先保证当前线程的 focus、continuity 与语言提示不被打断。"
      : "Treat thread_state as the live coordination state for this thread; when it conflicts with distant memory, preserve the current thread focus, continuity, and language hint first."
  );

  return sections.join("\n");
}

export function buildAgentSystemPrompt(
  roleCorePacket: RoleCorePacket,
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }> = [],
  replyLanguage: RuntimeReplyLanguage = "unknown",
  relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    relationshipStylePrompt: boolean;
    sameThreadContinuity: boolean;
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
  } = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  },
  threadContinuityPrompt = "",
  threadState: ThreadStateRecord | null = null
) {
  return buildAgentSystemPromptInternal(
    roleCorePacket,
    agentSystemPrompt,
    latestUserMessage,
    recalledMemories,
    replyLanguage,
    relationshipRecall,
    threadContinuityPrompt,
    threadState
  );
}

async function getDefaultPersonaPack(providedSupabase?: any) {
  const supabase = providedSupabase ?? (await createClient());

  for (const slug of DEFAULT_PERSONA_SLUGS) {
    const { data: personaPack } = await loadActivePersonaPackBySlug({
      supabase,
      slug
    });

    if (personaPack) {
      return personaPack;
    }
  }

  const { data: personaPack } = await loadFirstActivePersonaPack({
    supabase
  });

  if (!personaPack) {
    throw new Error(
      "No active persona pack is available. Apply the persona pack migration first."
    );
  }

  return personaPack;
}

export async function getDefaultModelProfile(providedSupabase?: any) {
  const supabase = providedSupabase ?? (await createClient());

  const { data: defaultProfile } = await loadActiveModelProfileBySlug({
    supabase,
    slug: DEFAULT_MODEL_PROFILE_SLUG
  });

  if (defaultProfile) {
    return defaultProfile as ModelProfileRecord;
  }

  const { data: fallbackProfile } = await loadFirstActiveModelProfile({
    supabase
  });

  if (!fallbackProfile) {
    throw new Error(
      "No active model profile is available. Apply the model profile migration first."
    );
  }

  return fallbackProfile as ModelProfileRecord;
}

async function resolveModelProfileForAgent({
  agent,
  workspaceId,
  userId,
  supabase: providedSupabase
}: {
  agent: AgentRecord;
  workspaceId: string;
  userId: string;
  supabase?: any;
}) {
  const supabase = providedSupabase ?? (await createClient());

  if (agent.default_model_profile_id) {
    const { data: boundProfile } = await loadActiveModelProfileById({
      supabase,
      modelProfileId: agent.default_model_profile_id
    });

    if (boundProfile) {
      return boundProfile as ModelProfileRecord;
    }
  }

  const defaultProfile = await getDefaultModelProfile(supabase);

  const { error } = await bindOwnedAgentModelProfile({
    supabase,
    agentId: agent.id,
    workspaceId,
    userId,
    modelProfileId: defaultProfile.id
  });

  if (error) {
    throw new Error(
      `Failed to bind a default model profile to the active agent: ${error.message}`
    );
  }

  agent.default_model_profile_id = defaultProfile.id;

  return defaultProfile;
}

export async function resolveAgentForWorkspace({
  workspaceId,
  userId,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  supabase?: any;
}) {
  const supabase = providedSupabase ?? (await createClient());
  const roleResolution = await resolveRoleProfile({
    repository: new SupabaseRoleRepository(supabase),
    workspaceId,
    userId
  });

  if (roleResolution.status === "resolved") {
    return roleResolution.role;
  }

  const personaPack = await getDefaultPersonaPack(supabase);
  const defaultModelProfile = await getDefaultModelProfile(supabase);

  const { data: createdAgent, error } = await createOwnedAgent({
    supabase,
    workspaceId,
    userId,
    sourcePersonaPackId: personaPack.id,
    name: personaPack.name,
    personaSummary: personaPack.persona_summary,
    stylePrompt: personaPack.style_prompt,
    systemPrompt: personaPack.system_prompt,
    defaultModelProfileId: defaultModelProfile.id,
    isCustom: false,
    metadata: buildAgentSourceMetadata({
      autoCreated: true,
      sourceSlug: personaPack.slug
    }),
    select: ROLE_PROFILE_SELECT
  });

  if (error || !createdAgent) {
    throw new Error(
      `Failed to create a default agent for this workspace: ${error?.message ?? "unknown error"}`
    );
  }

  return createdAgent as AgentRecord;
}

export async function getChatState() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      user,
      workspace: null,
      thread: null,
      agent: null,
      messages: []
    };
  }

  let { data: thread } = await loadLatestOwnedThread({
    supabase,
    workspaceId: workspace.id,
    userId: user.id
  });

  let agent: AgentRecord | null = null;

  if (thread?.agent_id) {
    const roleResolution = await resolveRoleProfile({
      repository: new SupabaseRoleRepository(supabase),
      workspaceId: workspace.id,
      userId: user.id,
      requestedAgentId: thread.agent_id
    });

    if (roleResolution.status === "resolved") {
      agent = roleResolution.role;
    }
  }

  if (!agent) {
    agent = await resolveAgentForWorkspace({
      workspaceId: workspace.id,
      userId: user.id
    });

    if (!thread) {
      const { data: createdThread, error } = await createOwnedThread({
        supabase,
        workspaceId: workspace.id,
        userId: user.id,
        agentId: agent.id,
        title: "New chat"
      });

      if (error || !createdThread) {
        throw new Error(
          `Failed to create default chat thread: ${error?.message ?? "unknown error"}`
        );
      }

      thread = createdThread;
    } else {
      const { data: updatedThread, error } = await bindOwnedThreadAgent({
        supabase,
        threadId: thread.id,
        userId: user.id,
        agentId: agent.id
      });

      if (error || !updatedThread) {
        throw new Error(
          `Failed to bind thread to the default agent: ${error?.message ?? "unknown error"}`
        );
      }

      thread = updatedThread;
    }
  }

  if (!thread) {
    throw new Error("Thread resolution failed for the current workspace.");
  }

  const { data: messages, error: messagesError } = await loadThreadMessages({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id
  });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  return {
    user,
    workspace: workspace as WorkspaceRecord,
    thread: thread as ThreadRecord,
    agent,
    messages: (messages ?? []) as MessageRecord[]
  };
}

export async function getChatPageState({
  requestedThreadId
}: {
  requestedThreadId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      user,
      workspace: null,
      availablePersonaPacks: [],
      availableModelProfiles: [],
      availableAgents: [],
      defaultAgentId: null,
      visibleMemories: [],
      hiddenMemories: [],
      incorrectMemories: [],
      supersededMemories: [],
      threads: [],
      thread: null,
      agent: null,
      messages: [],
      canonicalThreadId: null,
      shouldReplaceUrl: false,
      requestedThreadFallback: null as RequestedThreadFallback | null
    };
  }

  const { data: rawThreads, error: threadsError } = await loadOwnedThreads({
    supabase,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (threadsError) {
    throw new Error(`Failed to load threads: ${threadsError.message}`);
  }

  const { data: personaPacksData, error: personaPacksError } =
    await loadActivePersonaPacks({
      supabase
    });

  if (personaPacksError) {
    throw new Error(
      `Failed to load available persona packs: ${personaPacksError.message}`
    );
  }

  const { data: availableAgentsData, error: availableAgentsError } =
    await loadOwnedAvailableAgents({
      supabase,
      workspaceId: workspace.id,
      userId: user.id
    });

  if (availableAgentsError) {
    throw new Error(
      `Failed to load available agents: ${availableAgentsError.message}`
    );
  }

  const { data: availableModelProfilesData, error: availableModelProfilesError } =
    await loadActiveModelProfiles({
      supabase
    });

  if (availableModelProfilesError) {
    throw new Error(
      `Failed to load available model profiles: ${availableModelProfilesError.message}`
    );
  }

  const { data: visibleMemoriesData, error: visibleMemoriesError } =
    await loadRecentOwnedMemories({
      supabase,
      workspaceId: workspace.id,
      userId: user.id,
      limit: 60
    });

  if (visibleMemoriesError) {
    throw new Error(
      `Failed to load visible memories: ${visibleMemoriesError.message}`
    );
  }

  const rawAvailableAgents = (availableAgentsData ?? []) as Array<{
    id: string;
    name: string;
    is_custom: boolean;
    persona_summary: string;
    system_prompt: string;
    source_persona_pack_id: string | null;
    default_model_profile_id: string | null;
    metadata: Record<string, unknown>;
  }>;
  const personaPackIds = [
    ...new Set(
      rawAvailableAgents
        .map((agent) => agent.source_persona_pack_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  const modelProfileIds = [
    ...new Set(
      rawAvailableAgents
        .map((agent) => agent.default_model_profile_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  const rawVisibleMemories = (visibleMemoriesData ?? []) as Array<{
    id: string;
    memory_type: string | null;
    category?: string | null;
    key?: string | null;
    value?: unknown;
    scope?: string | null;
    subject_user_id?: string | null;
    target_agent_id?: string | null;
    target_thread_id?: string | null;
    stability?: string | null;
    status?: string | null;
    source_refs?: unknown;
    content: string;
    confidence: number;
    metadata: Record<string, unknown>;
    source_message_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  const validVisibleMemories = rawVisibleMemories.filter((memory) =>
    isMemoryScopeValid(memory)
  );
  const filteredVisibleMemories = validVisibleMemories
    .filter(
      (memory) => !isMemoryHidden(memory) && !isMemoryIncorrect(memory)
    )
    .slice(0, 20);
  const filteredHiddenMemories = validVisibleMemories
    .filter(
      (memory) => isMemoryHidden(memory) && !isMemoryIncorrect(memory)
    )
    .slice(0, 20);
  const filteredIncorrectMemories = validVisibleMemories
    .filter((memory) => isMemoryIncorrect(memory))
    .slice(0, 20);
  const filteredSupersededMemories = validVisibleMemories
    .filter(
      (memory) =>
        !isMemoryHidden(memory) &&
        !isMemoryIncorrect(memory) &&
        getMemoryStatus(memory) === "superseded"
    )
    .slice(0, 20);
  const sourceMessageIds = [
    ...new Set(
      [
        ...filteredVisibleMemories,
        ...filteredHiddenMemories,
        ...filteredIncorrectMemories,
        ...filteredSupersededMemories
      ]
        .map((memory) => memory.source_message_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  let personaPackNameById = new Map<string, string>();
  let modelProfileNameById = new Map<string, string>();
  let modelProfileTierLabelById = new Map<string, string>();
  let sourceMessageById = new Map<
    string,
    { thread_id: string; created_at: string }
  >();
  let sourceThreadTitleById = new Map<string, string>();

  if (personaPackIds.length > 0) {
    const { data: personaPacks, error: personaPacksError } =
      await loadPersonaPackNamesByIds({
        supabase,
        personaPackIds
      });

    if (personaPacksError) {
      throw new Error(
        `Failed to load agent persona packs: ${personaPacksError.message}`
      );
    }

    const typedPersonaPacks = (personaPacks ?? []) as Array<{
      id: string;
      name: string;
    }>;

    personaPackNameById = new Map(
      typedPersonaPacks.map((personaPack) => [personaPack.id, personaPack.name])
    );
  }

  if (modelProfileIds.length > 0) {
    const { data: modelProfiles, error: modelProfilesError } =
      await loadModelProfilesByIds({
        supabase,
        modelProfileIds
      });

    if (modelProfilesError) {
      throw new Error(
        `Failed to load agent model profiles: ${modelProfilesError.message}`
      );
    }

    const typedModelProfiles = (modelProfiles ?? []) as Array<{
      id: string;
      name: string;
      metadata: Record<string, unknown> | null;
    }>;

    modelProfileNameById = new Map(
      typedModelProfiles.map((modelProfile) => [modelProfile.id, modelProfile.name])
    );
    modelProfileTierLabelById = new Map();

    for (const modelProfile of typedModelProfiles) {
      const tierLabel = getModelProfileTierLabel(modelProfile.metadata);
      if (tierLabel !== null) {
        modelProfileTierLabelById.set(modelProfile.id, tierLabel);
      }
    }
  }

  if (sourceMessageIds.length > 0) {
    const { data: sourceMessages, error: sourceMessagesError } =
      await loadSourceMessagesByIds({
        supabase,
        sourceMessageIds,
        workspaceId: workspace.id
      });

    if (sourceMessagesError) {
      throw new Error(
        `Failed to load memory source messages: ${sourceMessagesError.message}`
      );
    }

    const typedSourceMessages = (sourceMessages ?? []) as Array<{
      id: string;
      thread_id: string;
      created_at: string;
    }>;

    sourceMessageById = new Map(
      typedSourceMessages.map((message) => [
        message.id,
        {
          thread_id: message.thread_id,
          created_at: message.created_at
        }
      ])
    );

    const sourceThreadIds = [...new Set(typedSourceMessages.map((message) => message.thread_id))];

    if (sourceThreadIds.length > 0) {
      const { data: sourceThreads, error: sourceThreadsError } =
        await loadOwnedThreadTitlesByIds({
          supabase,
          threadIds: sourceThreadIds,
          workspaceId: workspace.id,
          userId: user.id
        });

      if (sourceThreadsError) {
        throw new Error(
          `Failed to load memory source threads: ${sourceThreadsError.message}`
        );
      }

      const typedSourceThreads = (sourceThreads ?? []) as Array<{
        id: string;
        title: string;
      }>;

      sourceThreadTitleById = new Map(
        typedSourceThreads.map((thread) => [thread.id, thread.title])
      );
    }
  }

  const availableAgents = rawAvailableAgents.map((agent) => ({
    ...agent,
    persona_summary: agent.persona_summary,
    background_summary:
      typeof agent.metadata?.background_summary === "string" &&
      agent.metadata.background_summary.trim().length > 0
        ? agent.metadata.background_summary
        : null,
    avatar_emoji:
      typeof agent.metadata?.avatar_emoji === "string" &&
      agent.metadata.avatar_emoji.trim().length > 0
        ? agent.metadata.avatar_emoji
        : null,
    system_prompt_summary: summarizeAgentPrompt(agent.system_prompt),
    source_persona_pack_name: agent.source_persona_pack_id
      ? personaPackNameById.get(agent.source_persona_pack_id) ?? null
      : null,
    default_model_profile_name: agent.default_model_profile_id
      ? modelProfileNameById.get(agent.default_model_profile_id) ?? null
      : null,
    default_model_profile_tier_label: agent.default_model_profile_id
      ? modelProfileTierLabelById.get(agent.default_model_profile_id) ?? null
      : null,
    is_default_for_workspace:
      agent.metadata?.is_default_for_workspace === true
  })) as AvailableAgentRecord[];
  const defaultAgentId =
    availableAgents.find((agent) => agent.is_default_for_workspace)?.id ??
    availableAgents[0]?.id ??
    null;
  const agentNameById = new Map(availableAgents.map((agent) => [agent.id, agent.name]));
  const availablePersonaPacks = (personaPacksData ?? []) as AvailablePersonaPackRecord[];
  const availableModelProfiles = ((availableModelProfilesData ?? []) as Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
    metadata: Record<string, unknown> | null;
  }>).map((modelProfile) => ({
    ...modelProfile,
    metadata: modelProfile.metadata ?? {},
    tier_label: getModelProfileTierLabel(modelProfile.metadata),
    usage_note: getModelProfileUsageNote(modelProfile.metadata),
    underlying_model: getUnderlyingModelLabel(modelProfile.metadata)
  })) as AvailableModelProfileRecord[];
  const visibleMemories = filteredVisibleMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      target_agent_id: memory.target_agent_id ?? null,
      target_thread_id: memory.target_thread_id ?? null,
      target_agent_name: memory.target_agent_id
        ? agentNameById.get(memory.target_agent_id) ?? null
        : null,
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as VisibleMemoryRecord[];
  const hiddenMemories = filteredHiddenMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      target_agent_id: memory.target_agent_id ?? null,
      target_thread_id: memory.target_thread_id ?? null,
      target_agent_name: memory.target_agent_id
        ? agentNameById.get(memory.target_agent_id) ?? null
        : null,
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as HiddenMemoryRecord[];
  const incorrectMemories = filteredIncorrectMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      target_agent_id: memory.target_agent_id ?? null,
      target_thread_id: memory.target_thread_id ?? null,
      target_agent_name: memory.target_agent_id
        ? agentNameById.get(memory.target_agent_id) ?? null
        : null,
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as IncorrectMemoryRecord[];
  const supersededMemories = filteredSupersededMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      target_agent_id: memory.target_agent_id ?? null,
      target_thread_id: memory.target_thread_id ?? null,
      target_agent_name: memory.target_agent_id
        ? agentNameById.get(memory.target_agent_id) ?? null
        : null,
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as SupersededMemoryRecord[];
  const threads = (rawThreads ?? []) as ThreadRecord[];

  if (threads.length === 0) {
    return {
      user,
      workspace: workspace as WorkspaceRecord,
      availablePersonaPacks,
      availableModelProfiles,
      availableAgents,
      defaultAgentId,
      visibleMemories,
      hiddenMemories,
      incorrectMemories,
      supersededMemories,
      threads: [],
      thread: null,
      agent: null,
      messages: [],
      canonicalThreadId: null,
      shouldReplaceUrl: false,
      requestedThreadFallback: requestedThreadId
        ? ({
            requestedThreadId,
            reasonCode: "invalid_or_unauthorized"
          } satisfies RequestedThreadFallback)
        : null
    };
  }

  const agentIds = [
    ...new Set(
      threads
        .map((thread) => thread.agent_id)
        .filter((agentId): agentId is string => typeof agentId === "string")
    )
  ];
  let agentById = new Map<string, AgentRecord>();
  let latestMessageByThreadId = new Map<
    string,
    { content: string; created_at: string }
  >();

  if (agentIds.length > 0) {
    const { data: agents, error: agentsError } = await loadOwnedActiveAgentsByIds({
      supabase,
      agentIds,
      workspaceId: workspace.id,
      userId: user.id
    });

    if (agentsError) {
      throw new Error(`Failed to load thread agents: ${agentsError.message}`);
    }

    agentById = new Map(
      ((agents ?? []) as AgentRecord[]).map((agent) => [agent.id, agent])
    );
  }

  if (threads.length > 0) {
    const threadIds = threads.map((thread) => thread.id);
    const { data: latestMessages, error: latestMessagesError } =
      await loadCompletedMessagesForThreads({
        supabase,
        threadIds,
        workspaceId: workspace.id
      });

    if (latestMessagesError) {
      throw new Error(
        `Failed to load thread previews: ${latestMessagesError.message}`
      );
    }

    latestMessageByThreadId = new Map();

    for (const message of latestMessages ?? []) {
      if (!latestMessageByThreadId.has(message.thread_id)) {
        latestMessageByThreadId.set(message.thread_id, {
          content: message.content,
          created_at: message.created_at
        });
      }
    }
  }

  const threadItems: ThreadListItem[] = threads.map((thread) => ({
    ...thread,
    agent_name: thread.agent_id ? agentById.get(thread.agent_id)?.name ?? null : null,
    latest_message_preview: latestMessageByThreadId.get(thread.id)
      ? buildMessagePreview(latestMessageByThreadId.get(thread.id)!.content)
      : null,
    latest_message_created_at:
      latestMessageByThreadId.get(thread.id)?.created_at ?? null
  }));

  const matchedThread = requestedThreadId
    ? threadItems.find((thread) => thread.id === requestedThreadId) ?? null
    : null;
  const activeThread = matchedThread ?? threadItems[0];
  const requestedThreadFallback =
    requestedThreadId && !matchedThread
      ? ({
          requestedThreadId,
          reasonCode: "invalid_or_unauthorized"
        } satisfies RequestedThreadFallback)
      : null;
  const shouldReplaceUrl =
    Boolean(activeThread) && activeThread.id !== (requestedThreadId ?? null);
  const activeAgent =
    activeThread?.agent_id ? agentById.get(activeThread.agent_id) ?? null : null;

  const { data: messages, error: messagesError } = await loadThreadMessages({
    supabase,
    threadId: activeThread.id,
    workspaceId: workspace.id
  });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  return {
    user,
    workspace: workspace as WorkspaceRecord,
    availablePersonaPacks,
    availableModelProfiles,
    availableAgents,
    defaultAgentId,
    visibleMemories,
    hiddenMemories,
    incorrectMemories,
    supersededMemories,
    threads: threadItems,
    thread: activeThread,
    agent: activeAgent,
    messages: (messages ?? []) as MessageRecord[],
    canonicalThreadId: activeThread.id,
    shouldReplaceUrl,
    requestedThreadFallback
  };
}

export async function generateAgentReply({
  userId,
  workspace,
  thread,
  agent,
  messages,
  assistantMessageId,
  runtimeTurnInput,
  supabase: providedSupabase
}: {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
  runtimeTurnInput?: RuntimeTurnInput;
  supabase?: any;
}): Promise<RuntimeTurnResult> {
  const supabase = providedSupabase ?? (await createClient());
  const sessionContext = await prepareRuntimeSession({
    thread,
    agent,
    messages,
    detectReplyLanguageFromText,
    isReplyLanguage: isRuntimeReplyLanguage
  });
  const latestUserMessageContent = sessionContext.current_user_message;
  const threadContinuity = sessionContext.continuity_signals;
  const sameThreadContinuationApplicable =
    latestUserMessageContent !== null &&
    threadContinuity.hasPriorAssistantTurn &&
    isRelationshipContinuationEdgePrompt(latestUserMessageContent);
  const preferSameThreadContinuation = sameThreadContinuationApplicable;
  const recentRawTurnCount = sessionContext.recent_raw_turn_count;
  const approxContextPressure = sessionContext.approx_context_pressure;
  const longChainPressureCandidate =
    sameThreadContinuationApplicable &&
    recentRawTurnCount >= 10 &&
    (approxContextPressure === "elevated" || approxContextPressure === "high");
  const replyLanguageDecision = resolveReplyLanguageForTurn({
    latestUserMessage: latestUserMessageContent,
    threadContinuity
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const relationshipStylePrompt =
    latestUserMessageContent !== null &&
    isRelationshipAnswerShapePrompt(latestUserMessageContent);
  const input =
    runtimeTurnInput ??
    buildInternalRuntimeTurnInput({
      userId,
      agentId: agent.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      content: latestUserMessageContent ?? "",
      messageId: sessionContext.current_message_id,
    });
  const sameThreadContinuity = threadContinuity.hasPriorAssistantTurn;
  const runtimeMemoryContext = await prepareRuntimeMemory({
    workspaceId: workspace.id,
    userId,
    agentId: agent.id,
    threadId: thread.id,
    latestUserMessage: latestUserMessageContent,
    preferSameThreadContinuation,
    sameThreadContinuity,
    relationshipStylePrompt,
    threadState: sessionContext.thread_state,
    supabase
  });
  const memoryRecall = runtimeMemoryContext.memoryRecall;
  let relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    relationshipStylePrompt: boolean;
    sameThreadContinuity: boolean;
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
  } = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  };
  let answerQuestionType: AnswerQuestionType = "other";
  let answerStrategy: AnswerStrategy = "default-grounded";
  let answerStrategyPriority: AnswerStrategyPriority = "semi-constrained";
  let answerStrategyReasonCode: AnswerStrategyReasonCode =
    "default-grounded-fallback";
  let continuationReasonCode: ContinuationReasonCode | null = null;

  if (latestUserMessageContent) {
    relationshipRecall = runtimeMemoryContext.relationshipRecall;

    const answerQuestionRouting = getAnswerQuestionRouting({
      latestUserMessage: latestUserMessageContent,
      directRecallQuestionKind: getDirectRecallQuestionKind(
        latestUserMessageContent.normalize("NFKC").trim().toLowerCase()
      ),
      directNamingQuestion: relationshipRecall.directNamingQuestion,
      directPreferredNameQuestion: relationshipRecall.directPreferredNameQuestion,
      relationshipStylePrompt: relationshipRecall.relationshipStylePrompt,
      sameThreadContinuity: relationshipRecall.sameThreadContinuity,
      relationshipCarryoverAvailable: Boolean(
        relationshipRecall.addressStyleMemory ||
          relationshipRecall.nicknameMemory ||
          relationshipRecall.preferredNameMemory
      )
    });
    answerQuestionType = answerQuestionRouting.questionType;
    answerStrategyReasonCode = answerQuestionRouting.reasonCode;
    continuationReasonCode = answerQuestionRouting.continuationReasonCode;
    const answerStrategyRule = getAnswerStrategyRule(answerQuestionType);
    answerStrategy = answerStrategyRule.strategy;
    answerStrategyPriority = answerStrategyRule.priority;
  }
  const recalledMemories = memoryRecall.memories.filter(
    (
      memory
    ): memory is {
      memory_type: "profile" | "preference" | "relationship";
      content: string;
      confidence: number;
    } => memory.memory_type !== "goal"
  );
  const relationshipMemories = [
    relationshipRecall.addressStyleMemory,
    relationshipRecall.nicknameMemory,
    relationshipRecall.preferredNameMemory
  ].filter(Boolean) as Array<{
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
  const allRecalledMemories =
    relationshipMemories.length > 0
      ? [...recalledMemories, ...relationshipMemories]
      : recalledMemories;
  const modelProfile = await resolveModelProfileForAgent({
    agent,
    workspaceId: workspace.id,
    userId,
    supabase
  });
  const threadContinuityPrompt = buildThreadContinuityPrompt({
    threadContinuity,
    replyLanguage,
    relationshipRecall
  });
  const roleCorePacketForTurn = prepareRuntimeRole({
    agent,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source,
    preferSameThreadContinuation,
    relationshipRecall
  });
  const preparedRuntimeTurn = await prepareRuntimeTurn({
    input,
    agent,
    roleCorePacket: roleCorePacketForTurn,
    session: sessionContext,
    runtimeMemoryContext,
    workspace,
    thread,
    messages,
    assistantMessageId,
    supabase
  });
  return runPreparedRuntimeTurn({
    preparedRuntimeTurn,
    userId,
    latestUserMessageContent,
    allRecalledMemories,
    relationshipMemories,
    modelProfile,
    replyLanguage,
    threadContinuityPrompt,
    answerQuestionType,
    answerStrategy,
    answerStrategyReasonCode,
    answerStrategyPriority,
    continuationReasonCode,
    recentRawTurnCount,
    approxContextPressure,
    sameThreadContinuationApplicable,
    longChainPressureCandidate,
    preferSameThreadContinuation,
    replyLanguageDecision
  });
}

export async function runPreparedRuntimeTurn({
  preparedRuntimeTurn,
  userId,
  latestUserMessageContent,
  allRecalledMemories,
  relationshipMemories,
  modelProfile,
  replyLanguage,
  threadContinuityPrompt,
  answerQuestionType,
  answerStrategy,
  answerStrategyReasonCode,
  answerStrategyPriority,
  continuationReasonCode,
  recentRawTurnCount,
  approxContextPressure,
  sameThreadContinuationApplicable,
  longChainPressureCandidate,
  preferSameThreadContinuation,
  replyLanguageDecision
}: {
  preparedRuntimeTurn: Awaited<ReturnType<typeof prepareRuntimeTurn>>;
  userId: string;
  latestUserMessageContent: string | null;
  allRecalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  relationshipMemories: Array<{
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
  modelProfile: Awaited<ReturnType<typeof resolveModelProfileForAgent>>;
  replyLanguage: RuntimeReplyLanguage;
  threadContinuityPrompt: string;
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerStrategyReasonCode: AnswerStrategyReasonCode;
  answerStrategyPriority: AnswerStrategyPriority;
  continuationReasonCode: ContinuationReasonCode | null;
  recentRawTurnCount: number;
  approxContextPressure: ApproxContextPressure;
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  replyLanguageDecision: {
    replyLanguage: RuntimeReplyLanguage;
    source: ReplyLanguageSource;
  };
}): Promise<RuntimeTurnResult> {
  const agent = preparedRuntimeTurn.role.agent;
  const relationshipRecall =
    preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall;
  const memoryRecall = preparedRuntimeTurn.memory.runtime_memory_context.memoryRecall;
  const recalledProfileSnapshot =
    buildRecalledStaticProfileSnapshot(memoryRecall.memories);
  const { workspace, thread, messages, assistant_message_id, supabase } =
    preparedRuntimeTurn.resources;
  const runtimeSupabase = supabase as any;
  const promptMessages = [
    {
      role: "system" as const,
      content: buildAgentSystemPrompt(
        preparedRuntimeTurn.role.role_core,
        agent.system_prompt,
        latestUserMessageContent ?? "",
        allRecalledMemories,
        replyLanguage,
        relationshipRecall,
        threadContinuityPrompt,
        preparedRuntimeTurn.session.thread_state
      )
    },
    ...messages
      .filter((message) => message.status !== "failed" && message.status !== "pending")
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  ];

  const result = await generateText({
    model: modelProfile.model,
    messages: promptMessages,
    temperature: modelProfile.temperature,
    maxOutputTokens: modelProfile.max_output_tokens
  });

  const memoryWriteRequests =
    latestUserMessageContent !== null &&
    preparedRuntimeTurn.session.current_message_id !== undefined
      ? [
          ...(await planMemoryWriteRequests({
            latestUserMessage: latestUserMessageContent,
            recentContext: preparedRuntimeTurn.session.recent_raw_turns
              .slice(-3)
              .map((message) => ({
                role: message.role,
                content: message.content
              })),
            sourceTurnId: preparedRuntimeTurn.session.current_message_id
          })),
          ...planRelationshipMemoryWriteRequests({
            latestUserMessage: latestUserMessageContent,
            sourceTurnId: preparedRuntimeTurn.session.current_message_id,
            agentId: agent.id
          })
        ]
      : [];
  const followUpRequests = buildFollowUpRequests({
    latestUserMessage: latestUserMessageContent,
    threadId: thread.id,
    agentId: agent.id,
    userId,
    continuationReasonCode,
    replyLanguage
  });

  const assistantPayload = buildRuntimeAssistantPayload({
    content: result.content,
    metadata: buildRuntimeAssistantMetadataInput({
      agent: {
        id: agent.id,
        name: agent.name
      },
      model: {
        result_model: result.model ?? null,
        provider: modelProfile.provider,
        requested: modelProfile.model,
        profile_id: modelProfile.id,
        profile_name: modelProfile.name,
        profile_tier_label: getModelProfileTierLabel(modelProfile.metadata),
        profile_usage_note: getModelProfileUsageNote(modelProfile.metadata),
        underlying_label:
          getUnderlyingModelLabel(modelProfile.metadata) ??
          `${modelProfile.provider}/${result.model ?? modelProfile.model}`
      },
      runtime: {
        role_core_packet: preparedRuntimeTurn.role.role_core,
        runtime_input: preparedRuntimeTurn.input,
        session_thread_id: preparedRuntimeTurn.session.thread_id,
        session_agent_id: preparedRuntimeTurn.session.agent_id,
        current_message_id: preparedRuntimeTurn.session.current_message_id,
        recent_raw_turn_count: preparedRuntimeTurn.session.recent_raw_turn_count,
        approx_context_pressure:
          preparedRuntimeTurn.session.approx_context_pressure
      },
      reply_language: {
        target: replyLanguage,
        detected: detectReplyLanguageFromText(result.content),
        source: replyLanguageDecision.source
      },
      answer: {
        question_type: answerQuestionType,
        strategy: answerStrategy,
        strategy_reason_code: answerStrategyReasonCode,
        strategy_priority: answerStrategyPriority,
        strategy_priority_label: getAnswerStrategyPriorityLabel(
          answerStrategyPriority,
          replyLanguage === "zh-Hans"
        )
      },
      session: {
        continuation_reason_code: continuationReasonCode,
        thread_state:
          preparedRuntimeTurn.memory.runtime_memory_context.threadStateRecall
            .snapshot
            ? {
                lifecycle_status:
                  preparedRuntimeTurn.memory.runtime_memory_context
                    .threadStateRecall.snapshot.lifecycle_status,
                focus_mode:
                  preparedRuntimeTurn.memory.runtime_memory_context
                    .threadStateRecall.snapshot.focus_mode ?? null,
                continuity_status:
                  preparedRuntimeTurn.memory.runtime_memory_context
                    .threadStateRecall.snapshot.continuity_status ?? null,
                current_language_hint:
                  preparedRuntimeTurn.memory.runtime_memory_context
                    .threadStateRecall.snapshot.current_language_hint ?? null
              }
            : null,
        same_thread_continuation_applicable:
          sameThreadContinuationApplicable,
        long_chain_pressure_candidate: longChainPressureCandidate,
        same_thread_continuation_preferred: preferSameThreadContinuation,
        distant_memory_fallback_allowed: !preferSameThreadContinuation
      },
      memory: {
        recalled_memories: allRecalledMemories.map((memory) => ({
          memory_type: memory.memory_type,
          content: memory.content,
          confidence: memory.confidence
        })),
        hit_count: allRecalledMemories.length,
        used: allRecalledMemories.length > 0,
        types_used:
          relationshipMemories.length > 0
            ? Array.from(
                new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
              )
            : memoryRecall.usedMemoryTypes,
        profile_snapshot: recalledProfileSnapshot,
        hidden_exclusion_count: memoryRecall.hiddenExclusionCount,
        incorrect_exclusion_count: memoryRecall.incorrectExclusionCount
      },
      follow_up: {
        request_count: followUpRequests.length
      }
    })
  });

  const { error } = await persistCompletedAssistantMessage({
    supabase: runtimeSupabase,
    assistantMessageId: assistant_message_id,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId,
    payload: assistantPayload
  });

  if (error) {
    throw new Error(`Failed to store assistant reply: ${error.message}`);
  }

  await updateOwnedThread({
    supabase: runtimeSupabase,
    threadId: thread.id,
    userId,
    patch: {
      agent_id: agent.id,
      updated_at: new Date().toISOString()
    }
  });

  const runtimeTurnResult: RuntimeTurnResult = {
    assistant_message: {
      role: "assistant",
      content: result.content,
      language: replyLanguage,
      message_type: "text",
      metadata: assistantPayload.metadata as Record<string, unknown>
    },
    memory_write_requests: memoryWriteRequests,
    follow_up_requests: followUpRequests,
    runtime_events: [
      {
        type: "memory_recalled",
        payload: {
          count: allRecalledMemories.length,
          memory_types: relationshipMemories.length > 0
            ? Array.from(
                new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
              )
            : memoryRecall.usedMemoryTypes,
          hidden_exclusion_count: memoryRecall.hiddenExclusionCount,
          incorrect_exclusion_count: memoryRecall.incorrectExclusionCount
        }
      },
      {
        type: "memory_write_planned",
        payload: {
          count: memoryWriteRequests.length,
          memory_types: Array.from(
            new Set(memoryWriteRequests.map((request) => request.memory_type))
          ),
          record_targets: Array.from(
            new Set(
              memoryWriteRequests.map(
                (request) => resolvePlannedMemoryWriteTarget(request).recordTarget
              )
            )
          )
        }
      },
      {
        type: "follow_up_planned",
        payload: {
          count: followUpRequests.length,
          kinds: Array.from(
            new Set(followUpRequests.map((request) => request.kind))
          )
        }
      },
      {
        type: "answer_strategy_selected",
        payload: {
          question_type: answerQuestionType,
          strategy: answerStrategy,
          reason_code: answerStrategyReasonCode,
          priority: answerStrategyPriority,
          continuation_reason_code: continuationReasonCode,
          reply_language: replyLanguage
        }
      },
      {
        type: "assistant_reply_completed",
        payload: {
          thread_id: thread.id,
          agent_id: agent.id,
          recalled_count: allRecalledMemories.length,
          message_type: "text",
          language: replyLanguage
        }
      }
    ],
    debug_metadata: buildRuntimeDebugMetadata({
      model_profile_id: modelProfile.id,
      answer_strategy: answerStrategy,
      answer_strategy_reason_code: answerStrategyReasonCode,
      recalled_memory_count: allRecalledMemories.length,
      memory_types_used:
        relationshipMemories.length > 0
          ? Array.from(
              new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
            )
          : memoryRecall.usedMemoryTypes,
      memory_recall_routes: memoryRecall.appliedRoutes,
      profile_snapshot: recalledProfileSnapshot,
      memory_write_request_count: memoryWriteRequests.length,
      follow_up_request_count: followUpRequests.length,
      continuation_reason_code: continuationReasonCode,
      recent_turn_count: recentRawTurnCount,
      context_pressure: approxContextPressure,
      thread_state_recall:
        preparedRuntimeTurn.memory.runtime_memory_context.threadStateRecall,
      reply_language: replyLanguage
    })
  };

  try {
    const threadStateWriteback = await maybeWriteThreadStateAfterTurn({
      prepared: preparedRuntimeTurn,
      result: runtimeTurnResult,
      repository: createAdminThreadStateRepository(),
      repository_name: "supabase"
    });

    runtimeTurnResult.runtime_events.push({
      type: "thread_state_writeback_completed",
      payload: {
        status: threadStateWriteback.status,
        repository: threadStateWriteback.repository
      }
    });

    runtimeTurnResult.debug_metadata = {
      ...(runtimeTurnResult.debug_metadata ?? {}),
      thread_state_writeback:
        threadStateWriteback.status === "written"
          ? {
              status: threadStateWriteback.status,
              repository: threadStateWriteback.repository
            }
          : {
              status: threadStateWriteback.status,
              repository: threadStateWriteback.repository,
              reason: threadStateWriteback.reason
            }
    };
  } catch {
    // Keep thread state writeback as a soft-fail side effect for now.
  }

  return runtimeTurnResult;
}

export async function runAgentTurn({
  input,
  workspace,
  thread,
  agent,
  messages,
  assistantMessageId,
  supabase
}: RunAgentTurnArgs): Promise<RuntimeTurnResult> {
  if (input.actor.user_id.trim().length === 0) {
    throw new Error("RuntimeTurnInput.actor.user_id is required.");
  }

  if (input.actor.agent_id !== agent.id) {
    throw new Error("RuntimeTurnInput.actor.agent_id does not match the loaded agent.");
  }

  if (input.actor.thread_id !== thread.id) {
    throw new Error("RuntimeTurnInput.actor.thread_id does not match the loaded thread.");
  }

  if (
    input.actor.workspace_id &&
    input.actor.workspace_id !== workspace.id
  ) {
    throw new Error(
      "RuntimeTurnInput.actor.workspace_id does not match the loaded workspace."
    );
  }

  return generateAgentReply({
    userId: input.actor.user_id,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId,
    runtimeTurnInput: input,
    supabase
  });
}
