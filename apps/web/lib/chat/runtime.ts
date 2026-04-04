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
import type { RecalledMemory, StoredMemory } from "@/lib/chat/memory-shared";
import {
  buildRecalledStaticProfileSnapshot,
  buildRuntimeMemorySemanticSummary
} from "@/lib/chat/memory-records";
import {
  buildScenarioMemoryPackPromptSection,
  resolveActiveScenarioMemoryPack,
  resolveScenarioGovernanceFabricPlanePhaseSnapshot,
  resolveScenarioMemoryPackStrategy,
  type ActiveScenarioMemoryPack
} from "@/lib/chat/memory-packs";
import {
  buildKnowledgeSummary,
  buildKnowledgePromptSection,
  filterKnowledgeByActiveNamespace,
  resolveKnowledgeGovernanceFabricPlanePhaseSnapshot,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import {
  buildMemoryNamespacePromptSection,
  resolveActiveMemoryNamespace,
  resolveNamespaceGovernanceFabricPlanePhaseSnapshot,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
import {
  buildCompactedThreadSummary,
  resolveThreadGovernanceFabricPlanePhaseSnapshot,
  selectRetainedThreadCompactionSummary,
  buildThreadCompactionPromptSection
} from "@/lib/chat/thread-compaction";
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
  loadOwnedUserAppSettingsMetadata,
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
import {
  type OutputGovernancePacketV1,
  buildOutputGovernancePromptSection,
  maybeRewriteGovernedAssistantText,
  resolveCompanionTextCleanupZh
} from "@/lib/chat/output-governance";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import { loadThreadMessages } from "@/lib/chat/message-read";
import {
  planMemoryWriteRequestsWithPlannerInputs,
  planRelationshipMemoryWriteRequests
} from "@/lib/chat/memory-write";
import { buildPlannerCandidatePreviewFromGenericExtraction } from "@/lib/chat/memory-planner-candidates";
import {
  buildPlannerCandidatePreviewsFromWriteRequests,
  summarizePlannerCandidates
} from "@/lib/chat/memory-planner-candidates";
import {
  type ApproxContextPressure,
  type RecentRawTurn,
  type SessionContinuitySignal
} from "@/lib/chat/session-context";
import {
  type AgentRecord,
  buildRoleCoreMemoryCloseNoteArtifact,
  buildRoleCoreMemoryCloseNoteArchive,
  buildRoleCoreMemoryCloseNotePersistenceEnvelope,
  buildRoleCoreMemoryCloseNotePersistenceManifest,
  buildRoleCoreMemoryCloseNoteHandoffPacket,
  buildRoleCoreMemoryCloseNoteOutput,
  buildRoleCoreMemoryCloseNotePersistencePayload,
  buildRoleCoreMemoryCloseNoteRecord,
  type RoleCoreMemoryCloseNoteArchive,
  type RoleCoreMemoryCloseNoteArtifact,
  type RoleCoreMemoryCloseNoteHandoffPacket,
  type RoleCoreMemoryCloseNotePersistenceEnvelope,
  type RoleCoreMemoryCloseNotePersistenceManifest,
  type RoleCoreMemoryCloseNoteRecord,
  type RoleCoreMemoryCloseNoteOutput,
  type RoleCoreMemoryCloseNotePersistencePayload,
  type ReplyLanguageSource,
  type RoleCorePacket,
  type RuntimeReplyLanguage,
  withRoleCoreMemoryHandoff
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
import { loadRelevantKnowledgeForRuntime } from "@/lib/chat/runtime-knowledge-sources";
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
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isTransientSupabaseFetchError } from "@/lib/supabase/transient-fetch";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";
import type { SupabaseClient } from "@supabase/supabase-js";

function nowMs() {
  return Date.now();
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

function isSmokeModeEnabled() {
  return process.env.PLAYWRIGHT_SMOKE_MODE === "1";
}

type RuntimePageUser = {
  id: string;
  email?: string | null;
};

async function resolveRuntimePageUserWithSmokeFallback(
  supabase: SupabaseClient
): Promise<{
  supabase: SupabaseClient;
  user: RuntimePageUser | null;
}> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      return {
        supabase,
        user: {
          id: user.id,
          email: user.email ?? null
        }
      };
    }
  } catch (error) {
    if (!isTransientSupabaseFetchError(error) || !isSmokeModeEnabled()) {
      throw error;
    }
  }

  if (!isSmokeModeEnabled()) {
    return {
      supabase,
      user: null
    };
  }

  const smokeConfig = getSmokeConfig();

  if (!smokeConfig) {
    return {
      supabase,
      user: null
    };
  }

  const admin = createAdminClient();
  const smokeUser = await ensureSmokeUserState(admin, smokeConfig, {
    resetPassword: false
  });

  return {
    supabase: admin,
    user: {
      id: smokeUser.id,
      email: smokeUser.email
    }
  };
}

function approximateTokenCountFromBytes(bytes: number) {
  return Math.max(1, Math.ceil(bytes / 4));
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateForCompactPrompt(value: string | null | undefined, maxChars: number) {
  const normalized = compactWhitespace(value ?? "");
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

const DEFAULT_PERSONA_SLUGS = ["companion_default", "spark-guide"];
const DEFAULT_MODEL_PROFILE_SLUG = "spark-default";
const IM_LITELLM_TIMEOUT_MS = 30_000;

function resolveKnowledgeLoadLimit(route: string | null | undefined) {
  switch (route) {
    case "no_knowledge":
      return 0;
    case "light_knowledge":
      return 3;
    case "artifact_knowledge":
      return 4;
    case "domain_knowledge":
    default:
      return 8;
  }
}

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

export function buildVisibleMemoryRecord(args: {
  memory: StoredMemory;
  agentNameById: Map<string, string>;
  sourceMessageById: Map<string, { thread_id: string | null; created_at: string }>;
  sourceThreadTitleById: Map<string, string>;
}): VisibleMemoryRecord {
  const sourceMessage = args.memory.source_message_id
    ? args.sourceMessageById.get(args.memory.source_message_id) ?? null
    : null;

  return {
    ...args.memory,
    content: args.memory.content,
    confidence: args.memory.confidence,
    category: getMemoryCategory(args.memory),
    key: getMemoryKey(args.memory),
    value: args.memory.value ?? args.memory.content,
    scope: getMemoryScope(args.memory),
    target_agent_id: args.memory.target_agent_id ?? null,
    target_thread_id: args.memory.target_thread_id ?? null,
    target_agent_name: args.memory.target_agent_id
      ? args.agentNameById.get(args.memory.target_agent_id) ?? null
      : null,
    stability: getMemoryStability(args.memory),
    status: getMemoryStatus(args.memory),
    metadata: (args.memory.metadata ?? {}) as Record<string, unknown>,
    source_message_id: args.memory.source_message_id ?? null,
    source_refs: getMemorySourceRefs(args.memory),
    source_thread_id: sourceMessage?.thread_id ?? null,
    source_thread_title: sourceMessage?.thread_id
      ? args.sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
      : null,
    source_timestamp: sourceMessage?.created_at ?? null,
    created_at: args.memory.created_at,
    updated_at: args.memory.updated_at ?? args.memory.created_at
  };
}

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
  recalledMemories: RecalledMemory[],
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

function buildMemoryLayerAssemblyPrompt(args: {
  recalledMemories: RecalledMemory[];
  threadState: ThreadStateRecord | null | undefined;
  scenarioPack: ActiveScenarioMemoryPack | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const isZh = args.replyLanguage === "zh-Hans";
  const strategy = resolveScenarioMemoryPackStrategy(
    args.scenarioPack ?? { pack_id: "companion" }
  );
  const relationshipMemories = args.recalledMemories
    .filter((memory) => memory.memory_type === "relationship")
    .slice(0, strategy.layer_budget_bundle.relationship_limit);
  const relationshipFilteredMemories = args.recalledMemories.filter(
    (memory) => memory.memory_type !== "relationship"
  );
  const dynamicProfileMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "dynamic_profile")
    .slice(
      0,
      strategy.dynamic_profile_strategy ===
        "suppress_when_memory_record_present" &&
        relationshipFilteredMemories.some(
          (memory) => memory.semantic_layer === "memory_record"
        )
        ? 0
        : 1
    );
  const staticProfileMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "static_profile")
    .slice(0, strategy.layer_budget_bundle.static_profile_limit);
  const memoryRecordBudget = strategy.layer_budget_bundle.memory_record_limit;
  const memoryRecordMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "memory_record")
    .sort((left, right) => {
      const getMemoryRecordPriority = (
        memoryType: RecalledMemory["memory_type"]
      ) => {
        const priority = strategy.memory_record_priority_order.indexOf(memoryType);
        return priority >= 0 ? priority : strategy.memory_record_priority_order.length;
      };
      const leftPriority = getMemoryRecordPriority(left.memory_type);
      const rightPriority = getMemoryRecordPriority(right.memory_type);
      return leftPriority - rightPriority;
    })
    .slice(0, memoryRecordBudget);

  const sections: string[] = [
    isZh
      ? "本轮 context assembly 顺序："
      : "Context assembly order for this turn:"
  ];

  if (args.threadState) {
    sections.push(
      isZh
        ? "1. thread_state：优先承接当前线程的即时 focus、continuity 和语言提示。"
        : "1. thread_state: anchor immediate thread focus, continuity, and language carryover first."
    );
  }

  const layerPromptSections: Array<{
    layer:
      | "dynamic_profile"
      | "static_profile"
      | "memory_record"
      | "relationship";
    content: string[];
  }> = [];

  if (dynamicProfileMemories.length > 0) {
    layerPromptSections.push({
      layer: "dynamic_profile",
      content: [
        isZh
          ? "2. dynamic_profile：承接当前阶段仍持续有效的工作方式或偏好。"
          : "2. dynamic_profile: carry the still-active phase-level working mode or preference.",
        ...dynamicProfileMemories.map((memory, index) =>
          isZh
            ? `   - DP${index + 1}: ${memory.content}`
            : `   - DP${index + 1}: ${memory.content}`
        )
      ]
    });
  }

  if (staticProfileMemories.length > 0) {
    layerPromptSections.push({
      layer: "static_profile",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "companion"
            ? "3. static_profile：作为稳定长期偏好的回答基线。"
            : "3. static_profile：仅保留最小稳定偏好基线，避免压过执行上下文。"
          : args.scenarioPack?.pack_id === "companion"
            ? "3. static_profile: use as the stable long-term preference baseline."
            : "3. static_profile: keep only a minimal stable-preference baseline so it does not outweigh execution context.",
        ...staticProfileMemories.map((memory, index) =>
          isZh
            ? `   - SP${index + 1}: ${memory.content}`
            : `   - SP${index + 1}: ${memory.content}`
        )
      ]
    });
  }

  if (memoryRecordMemories.length > 0) {
    layerPromptSections.push({
      layer: "memory_record",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "project_ops"
            ? "4. memory_record：优先承接进展轨迹、事件事实与执行上下文。"
            : "4. memory_record：仅保留最小事件事实支撑，并优先当前最直接的 episode 线索。"
          : args.scenarioPack?.pack_id === "project_ops"
            ? "4. memory_record: prioritize progress traces, event facts, and execution context."
            : "4. memory_record: keep only a minimal event-facts support layer and favor the most direct episode cue first.",
        ...memoryRecordMemories.map((memory, index) =>
          isZh
            ? `   - MR${index + 1} [${memory.memory_type}]: ${memory.content}`
            : `   - MR${index + 1} [${memory.memory_type}]: ${memory.content}`
        )
      ]
    });
  }

  if (relationshipMemories.length > 0) {
    layerPromptSections.push({
      layer: "relationship",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "companion"
            ? "5. relationship memory：作为陪伴连续性与关系 grounding 的补充锚点。"
            : "5. relationship memory：仅保留最小关系 grounding，避免压过项目执行上下文。"
          : args.scenarioPack?.pack_id === "companion"
            ? "5. relationship memory: use as a continuity and relationship-grounding support layer."
            : "5. relationship memory: keep only a minimal relationship-grounding layer so it does not outweigh project execution context.",
        ...relationshipMemories.map((memory, index) =>
          isZh
            ? `   - RM${index + 1}: ${memory.content}`
            : `   - RM${index + 1}: ${memory.content}`
        )
      ]
    });
  }

  const orderedLayerPromptSections = layerPromptSections.sort((left, right) => {
    const leftPriority = strategy.assembly_layer_order.indexOf(left.layer);
    const rightPriority = strategy.assembly_layer_order.indexOf(right.layer);
    return leftPriority - rightPriority;
  });

  sections.push(...orderedLayerPromptSections.flatMap((section) => section.content));

  return sections.length > 1 ? sections.join("\n") : "";
}

function buildScenarioMemoryPackAssemblyPrompt(args: {
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildScenarioMemoryPackPromptSection({
    pack: resolveActiveScenarioMemoryPack({
      activeNamespace: args.activeMemoryNamespace ?? null,
      relevantKnowledge: args.relevantKnowledge
    }),
    replyLanguage: args.replyLanguage
  });
}

function buildKnowledgeLayerPrompt(args: {
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const activePack = resolveActiveScenarioMemoryPack({
    activeNamespace: args.activeMemoryNamespace ?? null,
    relevantKnowledge: args.relevantKnowledge
  });

  return buildKnowledgePromptSection({
    knowledge: args.relevantKnowledge,
    activeNamespace: args.activeMemoryNamespace ?? null,
    activePackId: activePack.pack_id,
    replyLanguage: args.replyLanguage
  });
}

function buildKnowledgeLayerPromptCompact(args: {
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (args.relevantKnowledge.length === 0) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const selected = args.relevantKnowledge.slice(0, 2);
  const items = selected
    .map((item) => {
      const title = item.title.trim();
      const summary = item.summary.trim();
      if (isZh) {
        return [title, summary].filter(Boolean).join("：");
      }
      return [title, summary].filter(Boolean).join(": ");
    })
    .filter(Boolean);

  if (items.length === 0) {
    return "";
  }

  return isZh
    ? `知识摘要：${items.join("；")}。只把这些当作轻量背景提示，不要展开成长篇说明。`
    : `Knowledge summary: ${items.join("; ")}. Use these only as light background support, not as a long explanation.`;
}

function buildThreadCompactionLayerPrompt(args: {
  compactedThreadSummary:
    | ReturnType<typeof buildCompactedThreadSummary>
    | null
    | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildThreadCompactionPromptSection({
    compactedThreadSummary: args.compactedThreadSummary ?? null,
    replyLanguage: args.replyLanguage
  });
}

function buildThreadCompactionLayerPromptCompact(args: {
  compactedThreadSummary:
    | ReturnType<typeof buildCompactedThreadSummary>
    | null
    | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const summary = args.compactedThreadSummary;
  if (!summary) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const compactSummary = truncateForCompactPrompt(summary.summary_text, isZh ? 220 : 260);
  if (isZh) {
    return `线程近程摘要：${compactSummary} 聚焦=${summary.focus_mode}；保留=${summary.retention_mode}。只把它当作最近对话的压缩提示，不要扩写成长期画像。`;
  }

  return `Recent thread summary: ${compactSummary} Focus=${summary.focus_mode}; retention=${summary.retention_mode}. Treat this only as compact recent context, not a new long-term profile.`;
}

function buildOutputGovernancePromptSectionCompact(
  governance: OutputGovernancePacketV1 | null | undefined,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!governance) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const expressionBrief = truncateForCompactPrompt(governance.expression_brief, isZh ? 220 : 260);
  const relationalBrief = truncateForCompactPrompt(
    governance.relational_brief,
    isZh ? 120 : 160
  );
  const sceneBrief = truncateForCompactPrompt(governance.scene_brief, isZh ? 140 : 180);
  const knowledgeBrief = truncateForCompactPrompt(
    governance.knowledge_brief,
    isZh ? 100 : 140
  );
  const avoid = truncateForCompactPrompt(governance.avoidances.slice(0, 2).join(" "), isZh ? 120 : 160);
  const modality = truncateForCompactPrompt(
    governance.modality_rules.slice(0, 2).join(" "),
    isZh ? 120 : 160
  );

  const sections = [
    isZh ? "输出治理（紧凑版）" : "Output governance (compact)",
    expressionBrief
      ? isZh
        ? `表达：${expressionBrief}`
        : `Expression: ${expressionBrief}`
      : "",
    relationalBrief
      ? isZh
        ? `关系：${relationalBrief}`
        : `Relationship: ${relationalBrief}`
      : "",
    sceneBrief ? (isZh ? `场景：${sceneBrief}` : `Scene: ${sceneBrief}`) : "",
    knowledgeBrief
      ? isZh
        ? `知识：${knowledgeBrief}`
        : `Knowledge: ${knowledgeBrief}`
      : "",
    avoid
      ? isZh
        ? `避免：${avoid}`
        : `Avoid: ${avoid}`
      : "",
    modality
      ? isZh
        ? `规则：${modality}`
        : `Rules: ${modality}`
      : ""
  ].filter(Boolean);

  return sections.join("\n");
}

function buildMemoryNamespaceLayerPrompt(args: {
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildMemoryNamespacePromptSection({
    namespace: args.activeMemoryNamespace ?? null,
    replyLanguage: args.replyLanguage
  });
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

export function buildRelationshipAdoptionInstructions(args: {
  isZh: boolean;
  mode: "open-ended-summary" | "open-ended-advice" | "same-thread-continuation";
  relationshipRecall: {
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
  const sections: string[] = [];
  const nickname = args.relationshipRecall.nicknameMemory?.content?.trim() ?? "";
  const preferredName =
    args.relationshipRecall.preferredNameMemory?.content?.trim() ?? "";

  if (preferredName) {
    sections.push(
      args.isZh
        ? args.mode === "same-thread-continuation"
          ? `如果这轮回复会直接称呼用户，优先继续用“${preferredName}”这个已记住的称呼，尤其在开场、接续和收尾里不要退回成泛泛的“你”或重新发明别的叫法。`
          : `如果这轮回复里需要称呼用户，优先直接用“${preferredName}”这个已记住的称呼，而不是退回成泛泛称呼或重新发明别的叫法。`
        : args.mode === "same-thread-continuation"
          ? `If this reply directly addresses the user, keep using the stored preferred name "${preferredName}", especially in openings, carry-forward lines, and closings, instead of dropping back to generic wording or inventing a different address term.`
          : `If this reply addresses the user, prefer the stored preferred name "${preferredName}" instead of falling back to generic wording or inventing a different address term.`
    );
  }

  if (nickname) {
    sections.push(
      args.isZh
        ? args.mode === "same-thread-continuation"
          ? `如果这轮回复里会提到你自己的名字、身份或开场自称，优先继续用“${nickname}”这个昵称，不要刚命中过一次又掉回 canonical name。`
          : `如果这轮回复里会提到你自己的名字、自我介绍或开场自称，优先使用“${nickname}”这个昵称，不要刚命中过一次又掉回 canonical name。`
        : args.mode === "same-thread-continuation"
          ? `If this reply mentions your own name, identity, or opening self-reference, keep using the stored nickname "${nickname}" instead of dropping back to the canonical name after the first successful recall.`
          : `If this reply mentions your own name, self-introduction, or opening self-reference, prefer the stored nickname "${nickname}" instead of dropping back to the canonical name.`
    );
  }

  if (preferredName && nickname) {
    sections.push(
      args.isZh
        ? "如果这轮回复里同时自然涉及双方称呼，让这两个已记住的叫法稳定一起出现，而不是只保留其中一个。"
        : "If this reply naturally touches both sides of the relationship, let both remembered address choices stay visible together instead of keeping only one of them."
    );
  }

  return sections;
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
  recalledMemories: RecalledMemory[];
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
      }),
      ...buildRelationshipAdoptionInstructions({
        isZh,
        mode:
          answerStrategy === "grounded-open-ended-summary"
            ? "open-ended-summary"
            : "open-ended-advice",
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
      ...buildRelationshipAdoptionInstructions({
        isZh,
        mode: "same-thread-continuation",
        relationshipRecall
      }),
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
  recalledMemories: RecalledMemory[];
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

function parseIsoMillis(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

function getImTemporalContinuityHints(recentRawTurns: RecentRawTurn[]) {
  if (recentRawTurns.length === 0) {
    return {
      recentSameSession: false,
      sameDayContinuation: false,
      consecutiveUserMessages: 0,
      minutesSinceLastAssistant: null as number | null
    };
  }

  const latestUserTurn = [...recentRawTurns].reverse().find((turn) => turn.role === "user");
  const latestAssistantTurn = [...recentRawTurns]
    .reverse()
    .find((turn) => turn.role === "assistant");

  const latestUserMillis = parseIsoMillis(latestUserTurn?.created_at);
  const latestAssistantMillis = parseIsoMillis(latestAssistantTurn?.created_at);
  const minutesSinceLastAssistant =
    latestUserMillis !== null && latestAssistantMillis !== null
      ? Math.max(0, Math.round((latestUserMillis - latestAssistantMillis) / 60_000))
      : null;
  const sameDayContinuation =
    latestUserTurn !== undefined &&
    latestAssistantTurn !== undefined &&
    latestUserTurn.created_at.slice(0, 10) === latestAssistantTurn.created_at.slice(0, 10);

  let consecutiveUserMessages = 0;
  for (let index = recentRawTurns.length - 1; index >= 0; index -= 1) {
    if (recentRawTurns[index]?.role !== "user") {
      break;
    }
    consecutiveUserMessages += 1;
  }

  return {
    recentSameSession:
      sameDayContinuation &&
      minutesSinceLastAssistant !== null &&
      minutesSinceLastAssistant <= 240,
    sameDayContinuation,
    consecutiveUserMessages,
    minutesSinceLastAssistant
  };
}

type RuntimeTemporalContext = {
  timezone: string;
  localDate: string;
  localTime: string;
  partOfDay: "late_night" | "morning" | "noon" | "afternoon" | "evening";
};

type HumanizedTemporalMode = "same_session" | "same_day_continuation" | "reconnect";
type HumanizedInteractionStage =
  | "opening"
  | "continuation"
  | "deepening"
  | "transition"
  | "closing";
type HumanizedUserEmotion =
  | "calm"
  | "sharing"
  | "low"
  | "distressed"
  | "anxious"
  | "energized"
  | "unclear";
type HumanizedUserIntent =
  | "greeting"
  | "continue"
  | "sharing"
  | "companionship"
  | "understanding"
  | "comfort"
  | "advice"
  | "co_working"
  | "playful";
type HumanizedPrimaryPosture =
  | "everyday_companion"
  | "resonant_companion"
  | "soothing_support"
  | "side_by_side_support"
  | "active_interaction";
type HumanizedResponseObjective =
  | "calibrate"
  | "receive"
  | "advance"
  | "answer"
  | "share"
  | "maintain_connection";
type HumanizedResponseLength =
  | "one_line"
  | "two_lines"
  | "short_paragraph"
  | "expandable";
type HumanizedOpeningStyle =
  | "light_greeting"
  | "direct_carryover"
  | "emotion_first"
  | "question_first"
  | "problem_first";
type HumanizedToneTension = "loose" | "steady" | "warm" | "light" | "active";
type HumanizedTextFollowUpPolicy =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
type HumanizedTextFollowUpDepth = "none" | "light" | "medium";
type HumanizedCaptionPolicy = "shared_viewing" | "intimate_share";
type HumanizedArtifactAction = "allow" | "defer" | "block";
type HumanizedRhythmVariant = "single_breath" | "soft_pause" | "linger";
type HumanizedTextRenderMode =
  | "default"
  | "input_conflict_clarifier"
  | "low_confidence_calibrator"
  | "same_session_greeting"
  | "same_day_greeting"
  | "maintain_connection"
  | "movement_escape";
type HumanizedMovementImpulseMode =
  | "destination_planning"
  | "stroll_breath"
  | "short_escape";
type HumanizedSecondSentenceRole =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
type HumanizedTextLeadRewriteMode =
  | "none"
  | "light_companionship_catch"
  | "advice_carryover"
  | "advice_carryover_variant";
type HumanizedTextCleanupPolicy = {
  stripResettingGreetingLead: boolean;
  stripTemplateFollowUpLead: boolean;
  stripGenericSoothingLead: boolean;
};
type HumanizedCaptionScene =
  | "grassland"
  | "mountain_water"
  | "seaside"
  | "icy_plain"
  | "sky_birds"
  | "sunset"
  | "generic";
type HumanizedProductFeedbackCategory =
  | "memory_capability_mocking"
  | "image_mismatch"
  | "general_quality_complaint";

// Central decision contract for humanized output.
// Runtime owns output decisions; downstream renderers should only execute these
// fields and must not introduce new routing or modality decisions locally.
type HumanizedDeliveryStrategy = {
  temporalMode: HumanizedTemporalMode;
  interactionStage: HumanizedInteractionStage;
  userEmotion: HumanizedUserEmotion;
  userIntent: HumanizedUserIntent;
  responseObjective: HumanizedResponseObjective;
  primaryPosture: HumanizedPrimaryPosture;
  secondaryPosture: HumanizedPrimaryPosture | null;
  forbiddenPosture: string | null;
  responseLength: HumanizedResponseLength;
  openingStyle: HumanizedOpeningStyle;
  toneTension: HumanizedToneTension;
  textRenderMode: HumanizedTextRenderMode;
  textFollowUpPolicy: HumanizedTextFollowUpPolicy;
  textFollowUpDepth: HumanizedTextFollowUpDepth;
  shouldIncludeSecondSentence: boolean;
  textSentenceCount: 1 | 2;
  textSecondSentenceRole: HumanizedSecondSentenceRole;
  textRhythmVariant: HumanizedRhythmVariant;
  textLeadRewriteMode: HumanizedTextLeadRewriteMode;
  textCleanupPolicy: HumanizedTextCleanupPolicy;
  movementImpulseMode: HumanizedMovementImpulseMode | null;
  movementImpulseRepeated: boolean;
  textVariantIndex: 0 | 1 | 2;
  captionPolicy: HumanizedCaptionPolicy;
  captionSentenceCount: 1 | 2 | 3;
  captionRhythmVariant: HumanizedRhythmVariant;
  captionScene: HumanizedCaptionScene;
  captionVariantIndex: 0 | 1 | 2;
  artifactAction: HumanizedArtifactAction;
  imageArtifactAction: HumanizedArtifactAction;
  audioArtifactAction: HumanizedArtifactAction;
  avoidances: string[];
  confidence: {
    emotion: "high" | "medium" | "low";
    intent: "high" | "medium" | "low";
    fallbackObjective?: "calibrate" | "maintain_connection";
  };
};

type HumanizedDeliveryPacket = {
  temporalContext: RuntimeTemporalContext & {
    temporalMode: HumanizedTemporalMode;
    minutesSinceLastAssistant: number | null;
  };
  sessionActivityContext: {
    todayTurnCount: number | null;
    recentHourTurnCount: number | null;
    consecutiveUserMessages: number;
    openConversationActive: boolean;
  };
  threadFreshness: {
    isNewThread: boolean;
    isDirectReplyToLastAssistant: boolean;
    threadDepth: "shallow" | "medium" | "deep";
  };
  signalRecognition: {
    contentSignals: {
      semanticBrief: string;
      hasSemanticGap: boolean;
      hasMemoryConflict: boolean;
      executableWithoutClarification: boolean;
      confidence: "high" | "medium" | "low";
    };
    emotionSignals: {
      emotionCandidates: HumanizedUserEmotion[];
      intensity: "light" | "medium" | "high" | "unclear";
      repeatedEmotionSignal: boolean;
      confidence: "high" | "medium" | "low";
    };
    intentSignals: {
      surfaceIntent: HumanizedUserIntent;
      deepIntent: HumanizedUserIntent | null;
      relationshipProbe: boolean;
      negativeProductFeedback: boolean;
      negativeProductFeedbackCategory: HumanizedProductFeedbackCategory | null;
      confidence: "high" | "medium" | "low";
    };
    behaviorSignals: {
      repeatedSameMessage: boolean;
      messageShape:
        | "single_token"
        | "short_sentence"
        | "long_paragraph"
        | "emoji_or_symbol";
      rhythm: "rapid_fire" | "normal" | "slow_return";
      topicLoopSignal: boolean;
      confidence: "high" | "medium" | "low";
    };
  };
  userState: {
    emotion: HumanizedUserEmotion;
    emotionIntensity: "light" | "medium" | "high" | "unclear";
    emotionConfidence: "high" | "medium" | "low";
    intent: HumanizedUserIntent;
    deepIntent: HumanizedUserIntent | null;
    intentConfidence: "high" | "medium" | "low";
    interactionStage: HumanizedInteractionStage;
    relationshipTemperature: "warmer" | "baseline" | "cooler";
    anomaly: {
      needsCalibration: boolean;
      repetitionSignal: boolean;
      crossMemoryConflict: boolean;
    };
  };
  dialogState: {
    topicState: "new_topic" | "continuing_topic" | "repeated_topic" | "subtext_topic";
    relationshipState: "confirming" | "stable" | "warming" | "cooling";
    confidence: "high" | "medium" | "low";
  };
  patternSignals: {
    recurrentTheme: "movement_escape" | null;
    repeatedEmotion: HumanizedUserEmotion | null;
    inputConflict: boolean;
    conflictHint: string | null;
    negativeProductFeedback: boolean;
    negativeProductFeedbackCategory: HumanizedProductFeedbackCategory | null;
  };
  deliveryStrategy: HumanizedDeliveryStrategy;
  execution: {
    memoryWriteBack: {
      shouldWrite: boolean;
      targetMemoryLayers: Array<
        | "role_layer"
        | "structured_long_term_memory"
        | "knowledge_layer"
        | "thread_state_layer"
        | "recent_raw_turns_layer"
      >;
      writeBrief?: string;
    };
    multimodalActions: {
      generateImage: boolean;
      imagePromptBrief?: string;
      generateAudio: boolean;
      audioStyleBrief?: string;
      otherActions?: string[];
    };
  };
};

function buildRuntimeTemporalContext(): RuntimeTemporalContext {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || process.env.TZ || "UTC";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const hour = Number(valueByType.get("hour") ?? "0");
  const localDate = `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
  const localTime = `${valueByType.get("hour")}:${valueByType.get("minute")}`;

  let partOfDay: RuntimeTemporalContext["partOfDay"] = "late_night";
  if (hour >= 6 && hour < 11) {
    partOfDay = "morning";
  } else if (hour >= 11 && hour < 14) {
    partOfDay = "noon";
  } else if (hour >= 14 && hour < 18) {
    partOfDay = "afternoon";
  } else if (hour >= 18 && hour < 24) {
    partOfDay = "evening";
  }

  return {
    timezone,
    localDate,
    localTime,
    partOfDay
  };
}

function detectHumanizedUserEmotion(latestUserMessage: string): HumanizedUserEmotion {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "unclear";
  }

  if (
    /撑不住|崩溃|快不行|活不下去|受不了了|绝望|痛苦死了|真的很难受|i can't take it|i cant take it|breaking down|falling apart/u.test(
      normalized
    )
  ) {
    return "distressed";
  }

  if (
    /焦虑|慌|压力好大|压力很大|紧张|睡不着|失眠|害怕|烦死了|烦得很|overwhelmed|anxious|stressed|panic/u.test(
      normalized
    )
  ) {
    return "anxious";
  }

  if (
    /有点烦|很烦|心烦|烦啊|烦呢|烦躁|有点烦躁|累|好累|低落|难受|委屈|心情不好|没劲|疲惫|沮丧|sad|tired|down/u.test(
      normalized
    )
  ) {
    return "low";
  }

  if (/开心|高兴|激动|好兴奋|太爽了|太好了|冲|想马上|有动力|excited|pumped|energized/u.test(normalized)) {
    return "energized";
  }

  if (/我觉得|我刚刚|看到|想到|分享|哈哈|笑死|猫|路上|今天|刚才|noticed|saw|thought/u.test(normalized)) {
    return "sharing";
  }

  return "calm";
}

function detectHumanizedUserIntent(latestUserMessage: string): HumanizedUserIntent {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "continue";
  }

  if (
    /^(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)(?:[，,\s。！？!?]*(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello))*[，,\s。！？!?]*$/iu.test(
      normalized
    )
  ) {
    return "greeting";
  }

  if (/哈哈|笑死|嘿嘿|逗你|抱抱|亲亲|哼|坏蛋|playful|joking/u.test(normalized)) {
    return "playful";
  }

  if (/记得|还记得|你知道我|你怎么看我|理解我|懂我|remember|understand me/u.test(normalized)) {
    return "understanding";
  }

  if (/陪我|陪陪我|在吗|别走|跟我聊聊|陪着我|stay with me|be here/u.test(normalized)) {
    return "companionship";
  }

  if (/安慰|抱抱|接住我|哄哄我|comfort me|reassure me/u.test(normalized)) {
    return "comfort";
  }

  if (
    /有点烦|很烦|心烦|烦啊|烦呢|烦躁|有点烦躁|难受|委屈|低落|不舒服|撑不住|好累|我现在有点/u.test(
      normalized
    )
  ) {
    return "companionship";
  }

  if (/帮我理|一起理|一起想|一起做|一起推进|一起排|陪我弄|co-work|work through/u.test(normalized)) {
    return "co_working";
  }

  if (/怎么办|建议|怎么做|帮我|可以吗|能不能|how do i|what should i|advice|suggest/u.test(normalized)) {
    return "advice";
  }

  if (/我觉得|我刚刚|看到|想到|分享|路上|今天|刚才|noticed|saw|thought/u.test(normalized)) {
    return "sharing";
  }

  return "continue";
}

function detectHumanizedInteractionStage(args: {
  latestUserMessage: string;
  temporalHints: ReturnType<typeof getImTemporalContinuityHints>;
}): HumanizedInteractionStage {
  const normalized = args.latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "continuation";
  }

  if (!args.temporalHints.sameDayContinuation) {
    return "opening";
  }

  if (
    /^(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)(?:[，,\s。！？!?]*(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello))*[，,\s。！？!?]*$/iu.test(
      normalized
    )
  ) {
    return "continuation";
  }

  if (/先不聊了|晚点再说|先这样|我先去忙|回头聊|bye|good night/u.test(normalized)) {
    return "closing";
  }

  if (/另外|还有|换个话题|顺便|说到这个|by the way/u.test(normalized)) {
    return "transition";
  }

  if (/其实|说真的|我现在|最近|一直|越来越|真的|honestly|lately/u.test(normalized)) {
    return "deepening";
  }

  return "continuation";
}

function normalizeComparableUserText(input: string) {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[，。,\.！!？?\s]/gu, "");
}

function isMovementEscapeMessage(input: string) {
  return /想出门|想出去|想旅游|想旅行|想走走|散散心|透口气|抽身|逃离|躲开|换个地方/u.test(
    input
  );
}

function detectRepeatedEmotionSignal(args: {
  recentUserMessages: string[];
  latestEmotion: HumanizedUserEmotion;
}) {
  if (!["low", "anxious", "distressed"].includes(args.latestEmotion)) {
    return null;
  }

  const matchingCount = args.recentUserMessages.filter((message) => {
    const emotion = detectHumanizedUserEmotion(message);
    return emotion === args.latestEmotion || (args.latestEmotion === "low" && emotion === "anxious");
  }).length;

  return matchingCount >= 2 ? args.latestEmotion : null;
}

function detectEmotionIntensity(
  latestUserMessage: string,
  emotion: HumanizedUserEmotion
): "light" | "medium" | "high" | "unclear" {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized || emotion === "unclear") {
    return "unclear";
  }

  if (
    /真的|特别|非常|太|快撑不住|崩溃|受不了了|绝望|痛苦死了|panic|breaking down|falling apart/u.test(
      normalized
    )
  ) {
    return "high";
  }

  if (
    /有点|一点|还好|稍微|先|just a bit|kind of|a little/u.test(normalized)
  ) {
    return "light";
  }

  return "medium";
}

function detectEmotionConfidence(
  latestUserMessage: string,
  emotion: HumanizedUserEmotion
): "high" | "medium" | "low" {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized || emotion === "unclear") {
    return "low";
  }

  if (
    /(烦|烦躁|焦虑|难受|委屈|低落|开心|激动|高兴|失眠|压力|累|撑不住|崩溃)/u.test(
      normalized
    )
  ) {
    return "high";
  }

  if (normalized.length <= 2) {
    return "low";
  }

  return "medium";
}

function detectIntentConfidence(
  latestUserMessage: string,
  intent: HumanizedUserIntent
): "high" | "medium" | "low" {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return "low";
  }

  if (
    intent === "greeting" ||
    intent === "advice" ||
    intent === "co_working" ||
    intent === "comfort" ||
    intent === "understanding"
  ) {
    return "high";
  }

  if (normalized.length <= 2 || /^(嗯|哦|好|行|啊|诶|欸)$/u.test(normalized)) {
    return "low";
  }

  return "medium";
}

function detectRelationshipProbeSignal(latestUserMessage: string) {
  return /你还记得|你记得|你在不在|你还在吗|你会不会觉得|你是不是还记得|你有没有记住/u.test(
    latestUserMessage.normalize("NFKC")
  );
}

function detectExplicitAudioIntent(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return /语音|音频|声音|读给我听|说给我听|用声音|audio|voice note|voice reply|say it aloud|read it aloud/u.test(
    normalized
  );
}

function normalizeComparableZh(content: string) {
  return content
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[，。！？!?、,\.\s]/gu, "")
    .trim();
}

function areVerySimilarUserTurnsZh(a: string, b: string) {
  const left = normalizeComparableZh(a);
  const right = normalizeComparableZh(b);
  return left.length > 0 && left === right;
}

function detectLightGreetingPrompt(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return false;
  }

  return /^(你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)[，,\s。！？!?]*$/iu.test(
    normalized
  );
}

function detectMovementImpulse(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return false;
  }

  return /想出门|想出去|想旅游|想旅行|想走走|想散心|想透口气|想离开一下|想去个地方/u.test(
    normalized
  );
}

function detectMovementImpulseMode(latestUserMessage: string): HumanizedMovementImpulseMode {
  const normalized = latestUserMessage.normalize("NFKC");

  if (/想旅游|想旅行|去哪儿|去哪里|去个地方|认真去个地方|认真想去哪/u.test(normalized)) {
    return "destination_planning";
  }

  if (/离开一下|躲一会|抽身|退开|逃开|先离开|走开一下/u.test(normalized)) {
    return "short_escape";
  }

  return "stroll_breath";
}

function detectCaptionScene(source: string): HumanizedCaptionScene {
  if (/草原|非洲|长颈鹿|象群|大象|斑马/u.test(source)) {
    return "grassland";
  }

  if (/阿拉斯加|雪山|山脉|群山|湖面|湖水|倒影|雪峰/u.test(source)) {
    return "mountain_water";
  }

  if (/海边|海浪|海风|沙滩|海面/u.test(source)) {
    return "seaside";
  }

  if (/冰川|冰山|北极|雪原|冰面/u.test(source)) {
    return "icy_plain";
  }

  if (/蓝天|飞鸟|鸟群|天空/u.test(source)) {
    return "sky_birds";
  }

  if (/夕阳|日落|黄昏|落日/u.test(source)) {
    return "sunset";
  }

  return "generic";
}

function detectDeepIntent(args: {
  latestUserMessage: string;
  surfaceIntent: HumanizedUserIntent;
  emotion: HumanizedUserEmotion;
}) {
  const normalized = args.latestUserMessage.normalize("NFKC");
  if (args.surfaceIntent === "advice" && /(烦|难受|委屈|低落|只是想聊聊|陪我|在吗)/u.test(normalized)) {
    return "companionship" as const;
  }

  if (args.surfaceIntent === "continue" && detectRelationshipProbeSignal(normalized)) {
    return "understanding" as const;
  }

  if (
    (args.surfaceIntent === "sharing" || args.surfaceIntent === "continue") &&
    (args.emotion === "low" || args.emotion === "anxious")
  ) {
    return "companionship" as const;
  }

  return null;
}

function detectMessageShape(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{S}\p{P}]+$/u.test(normalized)) {
    return "emoji_or_symbol" as const;
  }

  if (normalized.length <= 2) {
    return "single_token" as const;
  }

  if (normalized.length <= 24) {
    return "short_sentence" as const;
  }

  return "long_paragraph" as const;
}

function detectBehaviorRhythm(args: {
  temporalHints: ReturnType<typeof getImTemporalContinuityHints>;
  recentRawTurns: RecentRawTurn[];
}) {
  if (args.temporalHints.consecutiveUserMessages >= 2) {
    return "rapid_fire" as const;
  }

  const latestUserTurn = [...args.recentRawTurns].reverse().find((turn) => turn.role === "user");
  const previousTurn = args.recentRawTurns.length >= 2
    ? args.recentRawTurns[args.recentRawTurns.length - 2]
    : null;
  const latestMillis = parseIsoMillis(latestUserTurn?.created_at);
  const previousMillis = parseIsoMillis(previousTurn?.created_at);

  if (
    latestMillis !== null &&
    previousMillis !== null &&
    latestMillis - previousMillis >= 30 * 60_000
  ) {
    return "slow_return" as const;
  }

  return "normal" as const;
}

function countTurnsSince(args: { recentRawTurns: RecentRawTurn[]; localDate: string; nowMs: number }) {
  let todayTurnCount = 0;
  let recentHourTurnCount = 0;

  for (const turn of args.recentRawTurns) {
    const createdAt = turn.created_at;
    if (createdAt.slice(0, 10) === args.localDate) {
      todayTurnCount += 1;
    }

    const turnMillis = parseIsoMillis(createdAt);
    if (turnMillis !== null && args.nowMs - turnMillis <= 60 * 60_000) {
      recentHourTurnCount += 1;
    }
  }

  return {
    todayTurnCount,
    recentHourTurnCount
  };
}

function detectRecurrentThemeSignal(args: {
  latestUserMessage: string;
  recentUserMessages: string[];
}) {
  const latestNormalized = normalizeComparableUserText(args.latestUserMessage);
  const repeatedSameMessage = args.recentUserMessages.some((message) => {
    if (message === args.latestUserMessage) {
      return false;
    }
    return normalizeComparableUserText(message) === latestNormalized;
  });

  if (repeatedSameMessage) {
    return "movement_escape" as const;
  }

  const movementCount = args.recentUserMessages.filter((message) =>
    isMovementEscapeMessage(message)
  ).length;
  return movementCount >= 2 && isMovementEscapeMessage(args.latestUserMessage)
    ? ("movement_escape" as const)
    : null;
}

function detectInputConflictSignal(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC");
  const placeMentions = [
    { label: "北海", pattern: /北海/u },
    { label: "阿拉斯加", pattern: /阿拉斯加/u },
    { label: "澳洲", pattern: /澳洲|澳大利亚/u },
    { label: "非洲", pattern: /非洲/u }
  ].filter((entry) => entry.pattern.test(normalized));

  if (placeMentions.length >= 2) {
    return {
      inputConflict: true,
      conflictHint: `${placeMentions[0]!.label} vs ${placeMentions[1]!.label}`
    };
  }

  return {
    inputConflict: false,
    conflictHint: null
  };
}

function detectNegativeProductFeedbackSignal(latestUserMessage: string): {
  detected: boolean;
  category: HumanizedProductFeedbackCategory | null;
  confidence: "high" | "medium" | "low";
  reason: string | null;
} {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();

  if (!normalized) {
    return {
      detected: false,
      category: null,
      confidence: "low",
      reason: null
    };
  }

  if (
    /记忆(力|能力)?(不行|太差|好差|很差|拉胯|不太行|不怎么样)|你.*记不住|你又忘了|你怎么又忘了|你这记忆|memory.*(bad|weak|terrible)|you.*forgot again|you can'?t remember/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "memory_capability_mocking",
      confidence: "high",
      reason: "user_negative_feedback_about_memory"
    };
  }

  if (
    /图片(不对|不符|不符合|不一样|不匹配|跑偏|偏了|有问题)|图不对|图有问题|图片和.*不符|image.*(wrong|off|doesn'?t match|mismatch)|picture.*(wrong|off|doesn'?t match|mismatch)/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "image_mismatch",
      confidence: "high",
      reason: "user_negative_feedback_about_image_match"
    };
  }

  if (
    /你这产品|你这个产品|这个功能(不行|很差|太差)|回复(不对|很差|不行)|效果(不行|很差|不好)|体验(很差|不好)|bug|有毛病|吐槽|槽点|bad product|poor quality|this is wrong|this is bad/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "general_quality_complaint",
      confidence: "medium",
      reason: "user_general_negative_product_feedback"
    };
  }

  return {
    detected: false,
    category: null,
    confidence: "low",
    reason: null
  };
}

function buildHumanizedDeliveryPacket(args: {
  latestUserMessage: string;
  temporalContext: RuntimeTemporalContext;
  temporalHints: ReturnType<typeof getImTemporalContinuityHints>;
  recentRawTurns: RecentRawTurn[];
}): HumanizedDeliveryPacket {
  const userEmotion = detectHumanizedUserEmotion(args.latestUserMessage);
  const emotionIntensity = detectEmotionIntensity(args.latestUserMessage, userEmotion);
  const emotionConfidence = detectEmotionConfidence(args.latestUserMessage, userEmotion);
  const userIntent = detectHumanizedUserIntent(args.latestUserMessage);
  const deepIntent = detectDeepIntent({
    latestUserMessage: args.latestUserMessage,
    surfaceIntent: userIntent,
    emotion: userEmotion
  });
  const effectiveIntent = deepIntent ?? userIntent;
  const intentConfidence = detectIntentConfidence(args.latestUserMessage, userIntent);
  const interactionStage = detectHumanizedInteractionStage({
    latestUserMessage: args.latestUserMessage,
    temporalHints: args.temporalHints
  });
  const recentUserMessages = args.recentRawTurns
    .filter((turn) => turn.role === "user" && typeof turn.content === "string")
    .map((turn) => turn.content as string)
    .slice(-6);
  const temporalMode: HumanizedTemporalMode = args.temporalHints.recentSameSession
    ? "same_session"
    : args.temporalHints.sameDayContinuation
      ? "same_day_continuation"
      : "reconnect";
  const recurrentTheme = detectRecurrentThemeSignal({
    latestUserMessage: args.latestUserMessage,
    recentUserMessages
  });
  const repeatedEmotion = detectRepeatedEmotionSignal({
    recentUserMessages,
    latestEmotion: userEmotion
  });
  const inputConflict = detectInputConflictSignal(args.latestUserMessage);
  const negativeProductFeedback = detectNegativeProductFeedbackSignal(
    args.latestUserMessage
  );
  const repeatedSameMessage = recentUserMessages.some((message) => {
    if (message === args.latestUserMessage) {
      return false;
    }
    return normalizeComparableUserText(message) === normalizeComparableUserText(args.latestUserMessage);
  });
  const topicLoopSignal =
    recurrentTheme === "movement_escape" || repeatedEmotion !== null;
  const relationshipProbe = detectRelationshipProbeSignal(args.latestUserMessage);
  const messageShape = detectMessageShape(args.latestUserMessage);
  const behaviorRhythm = detectBehaviorRhythm({
    temporalHints: args.temporalHints,
    recentRawTurns: args.recentRawTurns
  });
  const turnCounts = countTurnsSince({
    recentRawTurns: args.recentRawTurns,
    localDate: args.temporalContext.localDate,
    nowMs: Date.now()
  });
  const latestTurn = args.recentRawTurns[args.recentRawTurns.length - 1] as RecentRawTurn | undefined;
  const previousTurn = args.recentRawTurns.length >= 2
    ? (args.recentRawTurns[args.recentRawTurns.length - 2] as RecentRawTurn)
    : null;
  const recentUserTurns = args.recentRawTurns.filter(
    (turn) => turn.role === "user"
  );
  const previousUserTurn =
    recentUserTurns.length >= 2
      ? (recentUserTurns[recentUserTurns.length - 2] as RecentRawTurn)
      : null;
  const lightGreetingPrompt = detectLightGreetingPrompt(args.latestUserMessage);
  const movementImpulse = detectMovementImpulse(args.latestUserMessage);
  const repeatedSameUserMessage =
    typeof previousUserTurn?.content === "string"
      ? areVerySimilarUserTurnsZh(args.latestUserMessage, previousUserTurn.content)
      : false;

  let primaryPosture: HumanizedPrimaryPosture = "everyday_companion";
  let secondaryPosture: HumanizedPrimaryPosture | null = null;

  if (userEmotion === "distressed" || effectiveIntent === "comfort") {
    primaryPosture = "soothing_support";
    secondaryPosture = "resonant_companion";
  } else if (effectiveIntent === "advice" || effectiveIntent === "co_working") {
    primaryPosture = "side_by_side_support";
    secondaryPosture = userEmotion === "low" || userEmotion === "anxious"
      ? "resonant_companion"
      : "everyday_companion";
  } else if (effectiveIntent === "playful" || userEmotion === "energized") {
    primaryPosture = "active_interaction";
    secondaryPosture = "everyday_companion";
  } else if (effectiveIntent === "companionship" || userEmotion === "low" || userEmotion === "anxious") {
    primaryPosture = "resonant_companion";
    secondaryPosture = "everyday_companion";
  }

  const needsCalibration = inputConflict.inputConflict;
  const responseObjective: HumanizedResponseObjective = needsCalibration
    ? "calibrate"
    : effectiveIntent === "greeting" || effectiveIntent === "understanding"
      ? "maintain_connection"
      : effectiveIntent === "sharing"
        ? "share"
        : effectiveIntent === "advice"
          ? "answer"
          : effectiveIntent === "co_working"
            ? "advance"
            : effectiveIntent === "companionship" || effectiveIntent === "comfort"
              ? "receive"
              : "maintain_connection";
  const forbiddenPosture =
    effectiveIntent === "greeting" || effectiveIntent === "playful"
      ? "soothing_support"
      : effectiveIntent === "advice" || effectiveIntent === "co_working"
        ? "pure_soothing_without_problem_engagement"
        : userEmotion === "distressed"
          ? "overly_active_or_joking"
          : null;

  let responseLength: HumanizedResponseLength = "two_lines";
  if (effectiveIntent === "greeting") {
    responseLength = "one_line";
  } else if (effectiveIntent === "advice" || effectiveIntent === "co_working") {
    responseLength = "short_paragraph";
  } else if (primaryPosture === "soothing_support") {
    responseLength = "two_lines";
  }

  let openingStyle: HumanizedOpeningStyle = "direct_carryover";
  if (effectiveIntent === "greeting") {
    openingStyle = "light_greeting";
  } else if (primaryPosture === "soothing_support" || userEmotion === "distressed" || userEmotion === "anxious") {
    openingStyle = "emotion_first";
  } else if (effectiveIntent === "advice") {
    openingStyle = "question_first";
  } else if (effectiveIntent === "co_working") {
    openingStyle = "problem_first";
  }

  const toneTension: HumanizedToneTension =
    primaryPosture === "active_interaction"
      ? "active"
      : primaryPosture === "soothing_support"
        ? "warm"
        : primaryPosture === "side_by_side_support"
          ? "steady"
          : "loose";

  let textFollowUpPolicy: HumanizedTextFollowUpPolicy = "none";
  let textFollowUpDepth: HumanizedTextFollowUpDepth = "none";
  let shouldIncludeSecondSentence = false;
  let textSentenceCount: 1 | 2 = 1;
  let textSecondSentenceRole: HumanizedSecondSentenceRole = "none";
  let textRhythmVariant: HumanizedRhythmVariant = "single_breath";
  let textRenderMode: HumanizedTextRenderMode = "default";
  let textLeadRewriteMode: HumanizedTextLeadRewriteMode = "none";
  let textCleanupPolicy: HumanizedTextCleanupPolicy = {
    stripResettingGreetingLead: false,
    stripTemplateFollowUpLead: false,
    stripGenericSoothingLead: false
  };
  let movementImpulseMode: HumanizedMovementImpulseMode | null = null;
  let movementImpulseRepeated = false;
  let textVariantIndex: 0 | 1 | 2 = 0;
  let captionPolicy: HumanizedCaptionPolicy = "shared_viewing";
  let captionSentenceCount: 1 | 2 | 3 = 2;
  let captionRhythmVariant: HumanizedRhythmVariant = "soft_pause";
  let captionScene: HumanizedCaptionScene = "generic";
  let captionVariantIndex: 0 | 1 | 2 = 0;
  let artifactAction: HumanizedArtifactAction = "defer";
  let imageArtifactAction: HumanizedArtifactAction = "defer";
  let audioArtifactAction: HumanizedArtifactAction = "defer";
  const explicitAudioIntent = detectExplicitAudioIntent(args.latestUserMessage);
  const captionSource = `${args.latestUserMessage}\n${previousUserTurn?.content ?? ""}`;
  captionScene = detectCaptionScene(captionSource);
  captionVariantIndex = (hashString(captionSource) % 3) as 0 | 1 | 2;

  if (!needsCalibration && effectiveIntent !== "greeting") {
    if (effectiveIntent === "advice" || effectiveIntent === "co_working") {
      textFollowUpPolicy = "gentle_question";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = true;
      textSentenceCount = 2;
      textSecondSentenceRole = "gentle_question";
      textRhythmVariant = "soft_pause";
      textLeadRewriteMode = repeatedSameUserMessage
        ? "advice_carryover_variant"
        : "advice_carryover";
    } else if (
      effectiveIntent === "companionship" &&
      primaryPosture === "resonant_companion" &&
      recurrentTheme === "movement_escape"
    ) {
      movementImpulseMode = detectMovementImpulseMode(args.latestUserMessage);
      movementImpulseRepeated = repeatedSameMessage || topicLoopSignal;
      textFollowUpPolicy =
        movementImpulseRepeated ? "reflective_ack" : "gentle_question";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = textFollowUpPolicy !== "reflective_ack";
      textSentenceCount = shouldIncludeSecondSentence ? 2 : 1;
      textSecondSentenceRole = shouldIncludeSecondSentence
        ? textFollowUpPolicy
        : "none";
      textRhythmVariant = shouldIncludeSecondSentence ? "soft_pause" : "single_breath";
      textRenderMode = "movement_escape";
      textVariantIndex = (
        hashString(
          `${args.latestUserMessage}\n${previousUserTurn?.content ?? ""}\n${recurrentTheme ?? ""}`
        ) % 3
      ) as 0 | 1 | 2;
    } else if (
      effectiveIntent === "companionship" &&
      (userEmotion === "low" || userEmotion === "anxious")
    ) {
      textFollowUpPolicy = "reflective_ack";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = false;
      textSentenceCount = 1;
      textSecondSentenceRole = "none";
      textRhythmVariant = "single_breath";
      textLeadRewriteMode = "light_companionship_catch";
    } else if (effectiveIntent === "sharing") {
      textFollowUpPolicy = "gentle_question";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = true;
      textSentenceCount = 2;
      textSecondSentenceRole = "gentle_question";
      textRhythmVariant = "soft_pause";
    }
  }

  if (
    primaryPosture === "resonant_companion" ||
    primaryPosture === "soothing_support" ||
    args.temporalHints.sameDayContinuation
  ) {
    captionPolicy = "intimate_share";
  }

  if (captionPolicy === "intimate_share") {
    captionSentenceCount = 2;
    captionRhythmVariant = "soft_pause";
  } else {
    captionSentenceCount = 1;
    captionRhythmVariant = "single_breath";
  }

  if (responseLength === "one_line") {
    shouldIncludeSecondSentence = false;
    textSentenceCount = 1;
    textSecondSentenceRole = "none";
    textRhythmVariant = "single_breath";
  }

  textCleanupPolicy = {
    stripResettingGreetingLead: args.temporalHints.recentSameSession,
    stripTemplateFollowUpLead:
      args.temporalHints.recentSameSession &&
      args.temporalHints.consecutiveUserMessages >= 2,
    stripGenericSoothingLead:
      effectiveIntent !== "comfort" &&
      effectiveIntent !== "companionship" &&
      primaryPosture !== "soothing_support" &&
      forbiddenPosture !== "soothing_support"
  };

  if (lightGreetingPrompt) {
    textCleanupPolicy.stripGenericSoothingLead = true;
  }

  if (needsCalibration) {
    textRenderMode = "input_conflict_clarifier";
  } else if (
    responseObjective === "calibrate" &&
    (intentConfidence === "low" || emotionConfidence === "low")
  ) {
    textRenderMode = "low_confidence_calibrator";
  } else if ((args.temporalHints.recentSameSession || args.temporalHints.sameDayContinuation) && lightGreetingPrompt) {
    textRenderMode = args.temporalHints.recentSameSession
      ? "same_session_greeting"
      : "same_day_greeting";
  } else if (
    responseObjective === "maintain_connection" &&
    responseLength === "one_line"
  ) {
    textRenderMode = "maintain_connection";
  } else if (
    effectiveIntent === "companionship" &&
    primaryPosture === "resonant_companion" &&
    movementImpulse
  ) {
    textRenderMode = "movement_escape";
  }

  if (needsCalibration) {
    artifactAction = "block";
    imageArtifactAction = "block";
    audioArtifactAction = "block";
  } else {
    if (effectiveIntent === "sharing" || effectiveIntent === "advice") {
      imageArtifactAction = "allow";
    }

    if (explicitAudioIntent) {
      audioArtifactAction = "allow";
    }

    artifactAction =
      imageArtifactAction === "allow" || audioArtifactAction === "allow"
        ? "allow"
        : "defer";
  }

  const avoidances: string[] = [];
  if (effectiveIntent === "greeting") {
    avoidances.push("do_not_turn_a_light_greeting_into_a_soothing_block");
  }
  if (effectiveIntent === "advice" || effectiveIntent === "co_working") {
    avoidances.push("do_not_default_to_reassurance_before_engaging_the_actual_problem");
  }
  if (inputConflict.inputConflict) {
    avoidances.push("do_not_smooth_over_conflicting_places_or_targets_without_clarifying_first");
  }
  if (temporalMode !== "reconnect") {
    avoidances.push("do_not_reopen_the_conversation_like_a_fresh_start");
  }

  return {
    temporalContext: {
      ...args.temporalContext,
      temporalMode,
      minutesSinceLastAssistant: args.temporalHints.minutesSinceLastAssistant
    },
    sessionActivityContext: {
      todayTurnCount: turnCounts.todayTurnCount,
      recentHourTurnCount: turnCounts.recentHourTurnCount,
      consecutiveUserMessages: args.temporalHints.consecutiveUserMessages,
      openConversationActive:
        args.temporalHints.recentSameSession || args.temporalHints.sameDayContinuation
    },
    threadFreshness: {
      isNewThread: args.recentRawTurns.length <= 1,
      isDirectReplyToLastAssistant: latestTurn?.role === "user" && previousTurn?.role === "assistant",
      threadDepth:
        args.recentRawTurns.length >= 12
          ? "deep"
          : args.recentRawTurns.length >= 5
            ? "medium"
            : "shallow"
    },
    signalRecognition: {
      contentSignals: {
        semanticBrief: truncateForCompactPrompt(args.latestUserMessage, 80),
        hasSemanticGap: needsCalibration,
        hasMemoryConflict: false,
        executableWithoutClarification: !needsCalibration,
        confidence: needsCalibration ? "high" : "medium"
      },
      emotionSignals: {
        emotionCandidates: deepIntent === "companionship" && userEmotion === "calm"
          ? [userEmotion, "low"]
          : [userEmotion],
        intensity: emotionIntensity,
        repeatedEmotionSignal: repeatedEmotion !== null,
        confidence: emotionConfidence
      },
      intentSignals: {
        surfaceIntent: userIntent,
        deepIntent,
        relationshipProbe,
        negativeProductFeedback: negativeProductFeedback.detected,
        negativeProductFeedbackCategory: negativeProductFeedback.category,
        confidence: intentConfidence
      },
      behaviorSignals: {
        repeatedSameMessage,
        messageShape,
        rhythm: behaviorRhythm,
        topicLoopSignal,
        confidence: repeatedSameMessage || topicLoopSignal ? "high" : "medium"
      }
    },
    userState: {
      emotion: userEmotion,
      emotionIntensity,
      emotionConfidence,
      intent: userIntent,
      deepIntent,
      intentConfidence,
      interactionStage,
      relationshipTemperature:
        args.temporalHints.sameDayContinuation && args.temporalHints.consecutiveUserMessages >= 2
          ? "warmer"
          : "baseline",
      anomaly: {
        needsCalibration,
        repetitionSignal: topicLoopSignal || repeatedSameMessage,
        crossMemoryConflict: false
      }
    },
    dialogState: {
      topicState: topicLoopSignal
        ? "repeated_topic"
        : interactionStage === "transition"
          ? "new_topic"
          : interactionStage === "deepening"
            ? "subtext_topic"
            : "continuing_topic",
      relationshipState: relationshipProbe
        ? "confirming"
        : args.temporalHints.sameDayContinuation && args.temporalHints.consecutiveUserMessages >= 2
          ? "warming"
          : "stable",
      confidence:
        intentConfidence === "low" && emotionConfidence === "low" ? "low" : "medium"
    },
    patternSignals: {
      recurrentTheme,
      repeatedEmotion,
      inputConflict: inputConflict.inputConflict,
      conflictHint: inputConflict.conflictHint,
      negativeProductFeedback: negativeProductFeedback.detected,
      negativeProductFeedbackCategory: negativeProductFeedback.category
    },
    deliveryStrategy: {
      temporalMode,
      interactionStage,
      userEmotion,
      userIntent,
      responseObjective,
      primaryPosture,
      secondaryPosture,
      forbiddenPosture,
      responseLength,
      openingStyle,
      toneTension,
      textRenderMode,
      textFollowUpPolicy,
      textFollowUpDepth,
      shouldIncludeSecondSentence,
      textSentenceCount,
      textSecondSentenceRole,
      textRhythmVariant,
      textLeadRewriteMode,
      textCleanupPolicy,
      movementImpulseMode,
      movementImpulseRepeated,
      textVariantIndex,
      captionPolicy,
      captionSentenceCount,
      captionRhythmVariant,
      captionScene,
      captionVariantIndex,
      artifactAction,
      imageArtifactAction,
      audioArtifactAction,
      avoidances,
      confidence: {
        emotion: emotionConfidence,
        intent: intentConfidence,
        fallbackObjective:
          emotionConfidence === "low" || intentConfidence === "low"
            ? "calibrate"
            : undefined
      }
    },
    execution: {
      memoryWriteBack: {
        shouldWrite: false,
        targetMemoryLayers: [],
        writeBrief: undefined
      },
      multimodalActions: {
        generateImage: imageArtifactAction === "allow",
        generateAudio: audioArtifactAction === "allow"
      }
    }
  };
}

function buildHumanizedDeliveryPromptSection(args: {
  packet: HumanizedDeliveryPacket | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (!args.packet) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const packet = args.packet;
  if (isZh) {
    const sceneDirectives: string[] = [];
    if (packet.userState.intent === "greeting") {
      sceneDirectives.push(
        "如果用户只是轻招呼，就只轻轻接住一下。优先一句，最多两句，不要泛问近况，不要转成安抚段落。"
      );
    }
    if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
      sceneDirectives.push(
        "如果用户在要建议或一起推进，先直接进入并肩支持。可以先给一个很轻的起手或只问一个聚焦澄清问题，但不要先绕回情绪总结、关系确认或安抚模板。"
      );
    }
    if (
      packet.userState.intent === "companionship" &&
      (packet.userState.emotion === "low" || packet.userState.emotion === "anxious")
    ) {
      sceneDirectives.push(
        "如果用户只是有点烦、低落或心里堵着，先用一两句轻轻接住，不要立刻上升成大段安抚、鸡汤或心理解释。"
      );
    }
    if (packet.patternSignals.recurrentTheme === "movement_escape") {
      sceneDirectives.push(
        "如果用户最近已经反复提到想出去、想抽身或想旅游，可以轻轻点出“这念头像是这几轮都在往上冒”，不要每次都装作第一次听到。"
      );
    }
    if (packet.patternSignals.inputConflict && packet.patternSignals.conflictHint) {
      sceneDirectives.push(
        `如果用户同一句里把对象说混了（例如 ${packet.patternSignals.conflictHint}），先用一句轻量校准，不要直接顺滑生成。`
      );
    }
    if (packet.patternSignals.negativeProductFeedback) {
      sceneDirectives.push(
        `如果用户对产品效果表达了负面评价（${packet.patternSignals.negativeProductFeedbackCategory ?? "negative_product_feedback"}），先正面接住问题，不要装作没看见，也不要立刻自我辩护。`
      );
    }
    if (
      packet.deliveryStrategy.confidence.intent === "low" ||
      packet.deliveryStrategy.confidence.emotion === "low"
    ) {
      sceneDirectives.push(
        "如果当前判断置信度不高，先轻轻接一下，再用一句很短的确认把方向对齐，不要贸然展开。"
      );
    }
    return [
      "真人感输出策略（紧凑版）",
      `当前时刻：${packet.temporalContext.temporalMode}，${packet.temporalContext.partOfDay}。`,
      `用户状态：情绪=${packet.userState.emotion}/${packet.userState.emotionIntensity}；意图=${packet.userState.intent}${packet.userState.deepIntent ? `→${packet.userState.deepIntent}` : ""}；阶段=${packet.userState.interactionStage}。`,
      `对话状态：话题=${packet.dialogState.topicState}；关系=${packet.dialogState.relationshipState}；关系温度=${packet.userState.relationshipTemperature}。`,
      packet.patternSignals.recurrentTheme || packet.patternSignals.inputConflict
        ? `补充信号：重复主题=${packet.patternSignals.recurrentTheme ?? "none"}；重复情绪=${packet.patternSignals.repeatedEmotion ?? "none"}；输入冲突=${packet.patternSignals.inputConflict ? packet.patternSignals.conflictHint ?? "true" : "none"}。`
        : "",
      `表达策略：目标=${packet.deliveryStrategy.responseObjective}；主姿态=${packet.deliveryStrategy.primaryPosture}${packet.deliveryStrategy.secondaryPosture ? `；次姿态=${packet.deliveryStrategy.secondaryPosture}` : ""}${packet.deliveryStrategy.forbiddenPosture ? `；禁止姿态=${packet.deliveryStrategy.forbiddenPosture}` : ""}；长度=${packet.deliveryStrategy.responseLength}；开口=${packet.deliveryStrategy.openingStyle}；语气=${packet.deliveryStrategy.toneTension}。`,
      `文本渲染：模式=${packet.deliveryStrategy.textRenderMode}；策略=${packet.deliveryStrategy.textFollowUpPolicy}；深度=${packet.deliveryStrategy.textFollowUpDepth}；句数=${packet.deliveryStrategy.textSentenceCount}；第二句职责=${packet.deliveryStrategy.textSecondSentenceRole}；节奏=${packet.deliveryStrategy.textRhythmVariant}；开头改写=${packet.deliveryStrategy.textLeadRewriteMode}；清洗=${JSON.stringify(packet.deliveryStrategy.textCleanupPolicy)}；主题模式=${packet.deliveryStrategy.movementImpulseMode ?? "none"}；变体=${packet.deliveryStrategy.textVariantIndex}。`,
      `文本渲染：模式=${packet.deliveryStrategy.textRenderMode}；策略=${packet.deliveryStrategy.textFollowUpPolicy}；深度=${packet.deliveryStrategy.textFollowUpDepth}；句数=${packet.deliveryStrategy.textSentenceCount}；第二句职责=${packet.deliveryStrategy.textSecondSentenceRole}；节奏=${packet.deliveryStrategy.textRhythmVariant}；开头改写=${packet.deliveryStrategy.textLeadRewriteMode}；清洗=${JSON.stringify(packet.deliveryStrategy.textCleanupPolicy)}；主题模式=${packet.deliveryStrategy.movementImpulseMode ?? "none"}；重复=${packet.deliveryStrategy.movementImpulseRepeated ? "yes" : "no"}；变体=${packet.deliveryStrategy.textVariantIndex}。`,
      `图片文案：策略=${packet.deliveryStrategy.captionPolicy}；句数=${packet.deliveryStrategy.captionSentenceCount}；节奏=${packet.deliveryStrategy.captionRhythmVariant}；场景=${packet.deliveryStrategy.captionScene}；变体=${packet.deliveryStrategy.captionVariantIndex}。`,
      `多模态动作：artifact=${packet.deliveryStrategy.artifactAction}；image=${packet.deliveryStrategy.imageArtifactAction}；audio=${packet.deliveryStrategy.audioArtifactAction}。`,
      ...sceneDirectives,
      packet.deliveryStrategy.avoidances.length > 0
        ? `避免：${packet.deliveryStrategy.avoidances.join("；")}。`
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const sceneDirectives: string[] = [];
  if (packet.userState.intent === "greeting") {
    sceneDirectives.push(
      "If the user is only greeting lightly, answer with one short line, at most two. Do not expand into a check-in or a soothing paragraph."
    );
  }
  if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
    sceneDirectives.push(
      "If the user is asking for advice or to work through something together, move into side-by-side help immediately. If clarification is needed, ask only one focused question instead of circling back through reassurance."
    );
  }
  if (
    packet.userState.intent === "companionship" &&
    (packet.userState.emotion === "low" || packet.userState.emotion === "anxious")
  ) {
    sceneDirectives.push(
      "If the user only sounds a little low or bothered, catch it in one or two light lines first. Do not inflate it into a full soothing block or therapeutic explanation."
    );
  }
  if (
    packet.deliveryStrategy.confidence.intent === "low" ||
    packet.deliveryStrategy.confidence.emotion === "low"
  ) {
    sceneDirectives.push(
      "If intent or emotion confidence is low, lightly acknowledge first and use one short clarifying question instead of committing to a strong interpretation."
    );
  }

  return [
    "Humanized delivery strategy (compact)",
    `Temporal mode: ${packet.temporalContext.temporalMode}; part of day: ${packet.temporalContext.partOfDay}.`,
    `User state: emotion=${packet.userState.emotion}/${packet.userState.emotionIntensity}; intent=${packet.userState.intent}${packet.userState.deepIntent ? `→${packet.userState.deepIntent}` : ""}; stage=${packet.userState.interactionStage}.`,
    `Dialog state: topic=${packet.dialogState.topicState}; relationship=${packet.dialogState.relationshipState}; warmth=${packet.userState.relationshipTemperature}.`,
    packet.patternSignals.negativeProductFeedback
      ? `Product feedback signal: ${packet.patternSignals.negativeProductFeedbackCategory ?? "negative_product_feedback"}.`
      : "",
    `Delivery: objective=${packet.deliveryStrategy.responseObjective}; primary=${packet.deliveryStrategy.primaryPosture}${packet.deliveryStrategy.secondaryPosture ? `; secondary=${packet.deliveryStrategy.secondaryPosture}` : ""}${packet.deliveryStrategy.forbiddenPosture ? `; forbidden=${packet.deliveryStrategy.forbiddenPosture}` : ""}; length=${packet.deliveryStrategy.responseLength}; opening=${packet.deliveryStrategy.openingStyle}; tone=${packet.deliveryStrategy.toneTension}.`,
    `Text rendering: mode=${packet.deliveryStrategy.textRenderMode}; policy=${packet.deliveryStrategy.textFollowUpPolicy}; depth=${packet.deliveryStrategy.textFollowUpDepth}; sentences=${packet.deliveryStrategy.textSentenceCount}; second_sentence_role=${packet.deliveryStrategy.textSecondSentenceRole}; rhythm=${packet.deliveryStrategy.textRhythmVariant}; lead_rewrite=${packet.deliveryStrategy.textLeadRewriteMode}; cleanup=${JSON.stringify(packet.deliveryStrategy.textCleanupPolicy)}; movement_mode=${packet.deliveryStrategy.movementImpulseMode ?? "none"}; repeated=${packet.deliveryStrategy.movementImpulseRepeated ? "yes" : "no"}; variant=${packet.deliveryStrategy.textVariantIndex}.`,
    `Image caption: policy=${packet.deliveryStrategy.captionPolicy}; sentences=${packet.deliveryStrategy.captionSentenceCount}; rhythm=${packet.deliveryStrategy.captionRhythmVariant}; scene=${packet.deliveryStrategy.captionScene}; variant=${packet.deliveryStrategy.captionVariantIndex}.`,
    `Artifact action: overall=${packet.deliveryStrategy.artifactAction}; image=${packet.deliveryStrategy.imageArtifactAction}; audio=${packet.deliveryStrategy.audioArtifactAction}.`,
    ...sceneDirectives,
    packet.deliveryStrategy.avoidances.length > 0
      ? `Avoid: ${packet.deliveryStrategy.avoidances.join("; ")}.`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTemporalContextPrompt(args: {
  replyLanguage: RuntimeReplyLanguage;
  recentRawTurns: RecentRawTurn[];
}) {
  const temporalContext = buildRuntimeTemporalContext();
  const continuityHints = getImTemporalContinuityHints(args.recentRawTurns);
  const isZh = args.replyLanguage === "zh-Hans";
  const partOfDayLabel = (() => {
    switch (temporalContext.partOfDay) {
      case "morning":
        return isZh ? "早上" : "morning";
      case "noon":
        return isZh ? "中午" : "midday";
      case "afternoon":
        return isZh ? "下午" : "afternoon";
      case "evening":
        return isZh ? "晚上" : "evening";
      default:
        return isZh ? "深夜" : "late night";
    }
  })();

  if (isZh) {
    const sections = [
      `当前本地时间：${temporalContext.localDate} ${temporalContext.localTime}（${temporalContext.timezone}），现在属于${partOfDayLabel}。`,
      "把时段感当作即时语境来用：早上/中午/晚上这些轻招呼要和当前时间一致，不要忽略现在到底是什么时候。"
    ];

    if (continuityHints.recentSameSession) {
      sections.push(
        "如果这还是同一段进行中的对话，用户只是轻轻打个招呼，就把它当作续聊里的轻碰一下，不要重开场。"
      );
    }

    return sections.join("\n");
  }

  const sections = [
    `Current local time: ${temporalContext.localDate} ${temporalContext.localTime} (${temporalContext.timezone}), which is ${partOfDayLabel}.`,
    "Use time-of-day as live context: match greetings and tone to whether it is morning, midday, afternoon, evening, or late night right now."
  ];

  if (continuityHints.recentSameSession) {
    sections.push(
      "If this is still the same ongoing conversation and the user sends only a light greeting, treat it as a soft touch within the same thread instead of reopening the whole exchange."
    );
  }

  return sections.join("\n");
}

function buildThreadContinuityPrompt({
  threadContinuity,
  replyLanguage,
  relationshipRecall,
  recentRawTurns = []
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
  recentRawTurns?: RecentRawTurn[];
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
  const temporalHints = getImTemporalContinuityHints(recentRawTurns);
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

  if (temporalHints.recentSameSession) {
    sections.push(
      isZh
        ? `时间连续性：这还是同一段进行中的对话，距离上一轮 assistant 大约 ${temporalHints.minutesSinceLastAssistant ?? 0} 分钟。不要重新用“早上好/晚上好/很高兴又见到你”这类重启式问候开场。`
        : `Temporal continuity: this is still the same ongoing conversation, about ${temporalHints.minutesSinceLastAssistant ?? 0} minutes after the previous assistant turn. Do not reopen with restart-style greetings like "good morning" or "glad to see you again."`
    );
  } else if (temporalHints.sameDayContinuation) {
    sections.push(
      isZh
        ? "时间连续性：这仍然是同一天里的延续。除非用户主动寒暄，不要把它写成一次全新的开场。"
        : "Temporal continuity: this is still a same-day continuation. Unless the user clearly opens with a greeting, do not treat it as a brand-new opening."
    );
  }

  if (temporalHints.consecutiveUserMessages >= 2) {
    sections.push(
      isZh
        ? `用户刚连续发了 ${temporalHints.consecutiveUserMessages} 条消息。把它们视为同一股思路顺着接，不要把最后一条当作全新话题重新起势。`
        : `The user just sent ${temporalHints.consecutiveUserMessages} consecutive messages. Treat them as one continuing thought instead of resetting around only the last message.`
    );
  }

  return sections.join("\n");
}

function buildAgentSystemPromptInternal(
  roleCorePacket: RoleCorePacket,
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories: RecalledMemory[] = [],
  relevantKnowledge: RuntimeKnowledgeSnippet[] = [],
  compactedThreadSummary: ReturnType<typeof buildCompactedThreadSummary> = null,
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null = null,
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
  recentRawTurns: RecentRawTurn[] = [],
  threadContinuityPrompt = "",
  threadState: ThreadStateRecord | null = null,
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null = null,
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null = null,
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null = null,
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null = null,
  closeNoteArchive: RoleCoreMemoryCloseNoteArchive | null = null,
  closeNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null = null,
  closeNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null = null,
  closeNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null = null,
  outputGovernancePrompt = "",
  humanizedDeliveryPrompt = "",
  runtimeSurface: "full" | "im_summary" = "full"
) {
  return buildAgentSystemPromptSectionsInternal(
    roleCorePacket,
    agentSystemPrompt,
    latestUserMessage,
    recalledMemories,
    relevantKnowledge,
    compactedThreadSummary,
    activeMemoryNamespace,
    replyLanguage,
    relationshipRecall,
    recentRawTurns,
    threadContinuityPrompt,
    threadState,
    closeNoteHandoffPacket,
    closeNoteArtifact,
    closeNoteOutput,
    closeNoteRecord,
    closeNoteArchive,
    closeNotePersistencePayload,
    closeNotePersistenceEnvelope,
    closeNotePersistenceManifest,
    outputGovernancePrompt,
    humanizedDeliveryPrompt,
    runtimeSurface
  )
    .map((section) => section.content)
    .join("\n\n");
}

function buildAgentSystemPromptSectionsInternal(
  roleCorePacket: RoleCorePacket,
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories: RecalledMemory[] = [],
  relevantKnowledge: RuntimeKnowledgeSnippet[] = [],
  compactedThreadSummary: ReturnType<typeof buildCompactedThreadSummary> = null,
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null = null,
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
  recentRawTurns: RecentRawTurn[] = [],
  threadContinuityPrompt = "",
  threadState: ThreadStateRecord | null = null,
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null = null,
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null = null,
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null = null,
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null = null,
  closeNoteArchive: RoleCoreMemoryCloseNoteArchive | null = null,
  closeNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null = null,
  closeNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null = null,
  closeNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null = null,
  outputGovernancePrompt = "",
  humanizedDeliveryPrompt = "",
  runtimeSurface: "full" | "im_summary" = "full"
) {
  const activePack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace ?? null,
    relevantKnowledge
  });

  const baseSections = [
    {
      key: "identity",
      content: `You are ${roleCorePacket.identity.agent_name}.`
    },
    {
      key: "persona_summary",
      content: roleCorePacket.persona_summary
        ? `Persona summary: ${roleCorePacket.persona_summary}`
        : ""
    },
    {
      key: "style_guidance",
      content: roleCorePacket.style_guidance
        ? `Style guidance: ${roleCorePacket.style_guidance}`
        : ""
    },
    {
      key: "reply_language",
      content: getReplyLanguageInstruction(
        roleCorePacket.language_behavior.reply_language_target
      )
    },
    {
      key: "temporal_context",
      content:
        runtimeSurface === "im_summary"
          ? buildTemporalContextPrompt({
              replyLanguage,
              recentRawTurns
            })
          : ""
    },
    {
      key: "humanized_delivery",
      content: runtimeSurface === "im_summary" ? humanizedDeliveryPrompt : ""
    },
    {
      key: "thread_continuity",
      content: threadContinuityPrompt
    },
    {
      key: "thread_state",
      content: buildThreadStatePrompt(threadState, replyLanguage)
    },
    {
      key: "memory_semantic_summary",
      content: buildMemorySemanticSummaryPrompt({
        recalledMemories,
        threadState,
        replyLanguage
      })
    }
  ];

  const fullSections = [
    {
      key: "scenario_pack_assembly",
      content: buildScenarioMemoryPackAssemblyPrompt({
        activeMemoryNamespace,
        relevantKnowledge,
        replyLanguage
      })
    },
    {
      key: "knowledge_layer",
      content: buildKnowledgeLayerPrompt({
        relevantKnowledge,
        activeMemoryNamespace,
        replyLanguage
      })
    },
    {
      key: "memory_namespace_layer",
      content: buildMemoryNamespaceLayerPrompt({
        activeMemoryNamespace,
        replyLanguage
      })
    },
    {
      key: "thread_compaction_layer",
      content: buildThreadCompactionLayerPrompt({
        compactedThreadSummary,
        replyLanguage
      })
    },
    {
      key: "memory_layer_assembly",
      content: buildMemoryLayerAssemblyPrompt({
        recalledMemories,
        threadState,
        scenarioPack: activePack,
        replyLanguage
      })
    },
    {
      key: "role_core_handoff",
      content: buildRoleCoreMemoryHandoffPrompt(roleCorePacket, replyLanguage)
    },
    {
      key: "close_note_handoff",
      content: buildRoleCoreMemoryCloseNoteHandoffPrompt(
        closeNoteHandoffPacket,
        replyLanguage
      )
    },
    {
      key: "close_note_artifact",
      content: buildRoleCoreMemoryCloseNoteArtifactPrompt(
        closeNoteArtifact,
        replyLanguage
      )
    },
    {
      key: "close_note_output",
      content: buildRoleCoreMemoryCloseNoteOutputPrompt(closeNoteOutput, replyLanguage)
    },
    {
      key: "close_note_record",
      content: buildRoleCoreMemoryCloseNoteRecordPrompt(closeNoteRecord, replyLanguage)
    },
    {
      key: "close_note_archive",
      content: buildRoleCoreMemoryCloseNoteArchivePrompt(closeNoteArchive, replyLanguage)
    },
    {
      key: "close_note_persistence_payload",
      content: buildRoleCoreMemoryCloseNotePersistencePayloadPrompt(
        closeNotePersistencePayload,
        replyLanguage
      )
    },
    {
      key: "close_note_persistence_envelope",
      content: buildRoleCoreMemoryCloseNotePersistenceEnvelopePrompt(
        closeNotePersistenceEnvelope,
        replyLanguage
      )
    },
    {
      key: "close_note_persistence_manifest",
      content: buildRoleCoreMemoryCloseNotePersistenceManifestPrompt(
        closeNotePersistenceManifest,
        replyLanguage
      )
    }
  ];

  const imSummarySections = [
    {
      key: "knowledge_layer",
      content:
        relevantKnowledge.length > 0
          ? buildKnowledgeLayerPromptCompact({
              relevantKnowledge,
              replyLanguage
            })
          : ""
    },
    {
      key: "thread_compaction_layer",
      content: compactedThreadSummary
        ? buildThreadCompactionLayerPromptCompact({
            compactedThreadSummary,
            replyLanguage
          })
        : ""
    }
  ];

  return [
    ...baseSections,
    ...(runtimeSurface === "im_summary" ? imSummarySections : fullSections),
    {
      key: "output_governance",
      content: outputGovernancePrompt
    },
    {
      key: "agent_system_prompt",
      content: agentSystemPrompt
    },
    {
      key: "memory_recall",
      content: buildMemoryRecallPrompt(
        latestUserMessage,
        recalledMemories,
        replyLanguage,
        relationshipRecall
      )
    }
  ].filter((section) => section.content);
}

function buildRoleCoreMemoryHandoffPrompt(
  roleCorePacket: RoleCorePacket,
  replyLanguage: RuntimeReplyLanguage
) {
  const handoff = roleCorePacket.memory_handoff;

  if (!handoff) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core memory handoff：handoff_version = ${handoff.handoff_version}。`
      : `Role core memory handoff: handoff_version = ${handoff.handoff_version}.`,
    isZh
      ? `Namespace phase snapshot：${handoff.namespace_phase_snapshot_id}；${handoff.namespace_phase_snapshot_summary}。`
      : `Namespace phase snapshot: ${handoff.namespace_phase_snapshot_id}; ${handoff.namespace_phase_snapshot_summary}.`,
    handoff.retention_phase_snapshot_id &&
    handoff.retention_phase_snapshot_summary
      ? isZh
        ? `Retention phase snapshot：${handoff.retention_phase_snapshot_id}；${handoff.retention_phase_snapshot_summary}。`
        : `Retention phase snapshot: ${handoff.retention_phase_snapshot_id}; ${handoff.retention_phase_snapshot_summary}.`
      : isZh
        ? "Retention phase snapshot：none。"
        : "Retention phase snapshot: none.",
    isZh
      ? `Knowledge phase snapshot：${handoff.knowledge_phase_snapshot_id}；${handoff.knowledge_phase_snapshot_summary}。`
      : `Knowledge phase snapshot: ${handoff.knowledge_phase_snapshot_id}; ${handoff.knowledge_phase_snapshot_summary}.`,
    handoff.knowledge_scope_layers?.length ||
    handoff.knowledge_governance_classes?.length
      ? isZh
        ? `Knowledge handoff depth：scope_layers = ${handoff.knowledge_scope_layers?.join(", ") || "none"}；governance_classes = ${handoff.knowledge_governance_classes?.join(", ") || "none"}。`
        : `Knowledge handoff depth: scope_layers = ${handoff.knowledge_scope_layers?.join(", ") || "none"}; governance_classes = ${handoff.knowledge_governance_classes?.join(", ") || "none"}.`
      : "",
    isZh
      ? `Scenario phase snapshot：${handoff.scenario_phase_snapshot_id}；${handoff.scenario_phase_snapshot_summary}。`
      : `Scenario phase snapshot: ${handoff.scenario_phase_snapshot_id}; ${handoff.scenario_phase_snapshot_summary}.`,
    handoff.scenario_strategy_bundle_id && handoff.scenario_orchestration_mode
      ? isZh
        ? `Scenario handoff depth：strategy_bundle = ${handoff.scenario_strategy_bundle_id}；orchestration_mode = ${handoff.scenario_orchestration_mode}。`
        : `Scenario handoff depth: strategy_bundle = ${handoff.scenario_strategy_bundle_id}; orchestration_mode = ${handoff.scenario_orchestration_mode}.`
      : "",
    handoff.retention_decision_group
      ? isZh
        ? `Retention handoff depth：decision_group = ${handoff.retention_decision_group}；retained_fields = ${handoff.retention_retained_fields?.join(", ") || "none"}。`
        : `Retention handoff depth: decision_group = ${handoff.retention_decision_group}; retained_fields = ${handoff.retention_retained_fields?.join(", ") || "none"}.`
      : "",
    isZh
      ? "将这些 phase snapshot 视为当前 role-core 记忆交接基线；回答时保持 handoff 与 runtime memory surface 一致，不要把它们回退成更旧的散点 summary。"
      : "Treat these phase snapshots as the current role-core memory handoff baseline; keep responses aligned with the handoff and runtime memory surfaces instead of falling back to older fragmented summaries."
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteHandoffPrompt(
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteHandoffPacket) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note handoff：packet_version = ${closeNoteHandoffPacket.packet_version}；readiness = ${closeNoteHandoffPacket.readiness_judgment}。`
      : `Role core close-note handoff: packet_version = ${closeNoteHandoffPacket.packet_version}; readiness = ${closeNoteHandoffPacket.readiness_judgment}.`,
    isZh
      ? `Close-note progress：${closeNoteHandoffPacket.progress_range}；close_note_recommended = ${closeNoteHandoffPacket.close_note_recommended ? "true" : "false"}。`
      : `Close-note progress: ${closeNoteHandoffPacket.progress_range}; close_note_recommended = ${closeNoteHandoffPacket.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Namespace close-note section：${closeNoteHandoffPacket.namespace.phase_snapshot_id}；${closeNoteHandoffPacket.namespace.phase_snapshot_summary}。`
      : `Namespace close-note section: ${closeNoteHandoffPacket.namespace.phase_snapshot_id}; ${closeNoteHandoffPacket.namespace.phase_snapshot_summary}.`,
    closeNoteHandoffPacket.retention.phase_snapshot_id &&
    closeNoteHandoffPacket.retention.phase_snapshot_summary
      ? isZh
        ? `Retention close-note section：${closeNoteHandoffPacket.retention.phase_snapshot_id}；${closeNoteHandoffPacket.retention.phase_snapshot_summary}；decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}。`
        : `Retention close-note section: ${closeNoteHandoffPacket.retention.phase_snapshot_id}; ${closeNoteHandoffPacket.retention.phase_snapshot_summary}; decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}.`
      : isZh
        ? "Retention close-note section：none。"
        : "Retention close-note section: none.",
    isZh
      ? `Knowledge close-note section：${closeNoteHandoffPacket.knowledge.phase_snapshot_id}；scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}。`
      : `Knowledge close-note section: ${closeNoteHandoffPacket.knowledge.phase_snapshot_id}; scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}.`,
    isZh
      ? `Scenario close-note section：${closeNoteHandoffPacket.scenario.phase_snapshot_id}；strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}。`
      : `Scenario close-note section: ${closeNoteHandoffPacket.scenario.phase_snapshot_id}; strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}.`,
    isZh
      ? `Close-note carry-through：blocking_items = ${closeNoteHandoffPacket.blocking_items.join(", ") || "none"}；non_blocking_items = ${closeNoteHandoffPacket.non_blocking_items.join(", ") || "none"}。`
      : `Close-note carry-through: blocking_items = ${closeNoteHandoffPacket.blocking_items.join(", ") || "none"}; non_blocking_items = ${closeNoteHandoffPacket.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note acceptance gaps：blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteHandoffPacket.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note acceptance gaps: blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteHandoffPacket.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note next expansion focus：${closeNoteHandoffPacket.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note next expansion focus: ${closeNoteHandoffPacket.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteArtifactPrompt(
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteArtifact) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note artifact：artifact_version = ${closeNoteArtifact.artifact_version}；readiness = ${closeNoteArtifact.readiness_judgment}。`
      : `Role core close-note artifact: artifact_version = ${closeNoteArtifact.artifact_version}; readiness = ${closeNoteArtifact.readiness_judgment}.`,
    isZh
      ? `Close-note artifact progress：${closeNoteArtifact.progress_range}；close_candidate = ${closeNoteArtifact.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNoteArtifact.close_note_recommended ? "true" : "false"}。`
      : `Close-note artifact progress: ${closeNoteArtifact.progress_range}; close_candidate = ${closeNoteArtifact.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNoteArtifact.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note artifact headline：${closeNoteArtifact.headline}。`
      : `Close-note artifact headline: ${closeNoteArtifact.headline}.`,
    isZh
      ? `Namespace artifact section：${closeNoteArtifact.sections.namespace}。`
      : `Namespace artifact section: ${closeNoteArtifact.sections.namespace}.`,
    isZh
      ? `Retention artifact section：${closeNoteArtifact.sections.retention}。`
      : `Retention artifact section: ${closeNoteArtifact.sections.retention}.`,
    isZh
      ? `Knowledge artifact section：${closeNoteArtifact.sections.knowledge}。`
      : `Knowledge artifact section: ${closeNoteArtifact.sections.knowledge}.`,
    isZh
      ? `Scenario artifact section：${closeNoteArtifact.sections.scenario}。`
      : `Scenario artifact section: ${closeNoteArtifact.sections.scenario}.`,
    isZh
      ? `Close-note artifact carry-through：${closeNoteArtifact.carry_through_summary}`
      : `Close-note artifact carry-through: ${closeNoteArtifact.carry_through_summary}`,
    isZh
      ? `Close-note artifact acceptance：${closeNoteArtifact.acceptance_summary}`
      : `Close-note artifact acceptance: ${closeNoteArtifact.acceptance_summary}`,
    isZh
      ? `Close-note artifact non-blocking items：${closeNoteArtifact.non_blocking_items.join(", ") || "none"}。`
      : `Close-note artifact non-blocking items: ${closeNoteArtifact.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note artifact tail candidates：${closeNoteArtifact.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note artifact tail candidates: ${closeNoteArtifact.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note artifact gap buckets：blocking = ${closeNoteArtifact.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteArtifact.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteArtifact.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note artifact gap buckets: blocking = ${closeNoteArtifact.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteArtifact.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteArtifact.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note artifact next focus：${closeNoteArtifact.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note artifact next focus: ${closeNoteArtifact.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteOutputPrompt(
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteOutput) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note output：output_version = ${closeNoteOutput.output_version}；readiness = ${closeNoteOutput.readiness_judgment}。`
      : `Role core close-note output: output_version = ${closeNoteOutput.output_version}; readiness = ${closeNoteOutput.readiness_judgment}.`,
    isZh
      ? `Close-note output progress：${closeNoteOutput.progress_range}；close_candidate = ${closeNoteOutput.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNoteOutput.close_note_recommended ? "true" : "false"}。`
      : `Close-note output progress: ${closeNoteOutput.progress_range}; close_candidate = ${closeNoteOutput.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNoteOutput.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note output headline：${closeNoteOutput.headline}。`
      : `Close-note output headline: ${closeNoteOutput.headline}.`,
    isZh
      ? `Namespace output section：${closeNoteOutput.namespace.output_summary}。`
      : `Namespace output section: ${closeNoteOutput.namespace.output_summary}.`,
    isZh
      ? `Retention output section：${closeNoteOutput.retention.output_summary}。`
      : `Retention output section: ${closeNoteOutput.retention.output_summary}.`,
    isZh
      ? `Knowledge output section：${closeNoteOutput.knowledge.output_summary}。`
      : `Knowledge output section: ${closeNoteOutput.knowledge.output_summary}.`,
    isZh
      ? `Scenario output section：${closeNoteOutput.scenario.output_summary}。`
      : `Scenario output section: ${closeNoteOutput.scenario.output_summary}.`,
    isZh
      ? `Close-note output emission：${closeNoteOutput.emission_summary}`
      : `Close-note output emission: ${closeNoteOutput.emission_summary}`,
    isZh
      ? `Close-note output non-blocking items：${closeNoteOutput.non_blocking_items.join(", ") || "none"}。`
      : `Close-note output non-blocking items: ${closeNoteOutput.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note output tail candidates：${closeNoteOutput.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note output tail candidates: ${closeNoteOutput.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note output gap buckets：blocking = ${closeNoteOutput.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteOutput.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteOutput.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note output gap buckets: blocking = ${closeNoteOutput.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteOutput.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteOutput.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note output next focus：${closeNoteOutput.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note output next focus: ${closeNoteOutput.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteRecordPrompt(
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteRecord) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note record：record_version = ${closeNoteRecord.record_version}；readiness = ${closeNoteRecord.readiness_judgment}。`
      : `Role core close-note record: record_version = ${closeNoteRecord.record_version}; readiness = ${closeNoteRecord.readiness_judgment}.`,
    isZh
      ? `Close-note record progress：${closeNoteRecord.progress_range}；close_candidate = ${closeNoteRecord.close_candidate ? "true" : "false"}。`
      : `Close-note record progress: ${closeNoteRecord.progress_range}; close_candidate = ${closeNoteRecord.close_candidate ? "true" : "false"}.`,
    isZh
      ? `Close-note record headline：${closeNoteRecord.headline}。`
      : `Close-note record headline: ${closeNoteRecord.headline}.`,
    isZh
      ? `Namespace record section：${closeNoteRecord.namespace.record_summary}。`
      : `Namespace record section: ${closeNoteRecord.namespace.record_summary}.`,
    isZh
      ? `Retention record section：${closeNoteRecord.retention.record_summary}。`
      : `Retention record section: ${closeNoteRecord.retention.record_summary}.`,
    isZh
      ? `Knowledge record section：${closeNoteRecord.knowledge.record_summary}。`
      : `Knowledge record section: ${closeNoteRecord.knowledge.record_summary}.`,
    isZh
      ? `Scenario record section：${closeNoteRecord.scenario.record_summary}。`
      : `Scenario record section: ${closeNoteRecord.scenario.record_summary}.`,
    isZh
      ? `Close-note record non-blocking items：${closeNoteRecord.non_blocking_items.join(", ") || "none"}。`
      : `Close-note record non-blocking items: ${closeNoteRecord.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note record tail candidates：${closeNoteRecord.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note record tail candidates: ${closeNoteRecord.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note record gap buckets：blocking = ${closeNoteRecord.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteRecord.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteRecord.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note record gap buckets: blocking = ${closeNoteRecord.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteRecord.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteRecord.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note record next focus：${closeNoteRecord.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note record next focus: ${closeNoteRecord.next_expansion_focus.join(", ") || "none"}.`,
    isZh
      ? `Close-note record summary：${closeNoteRecord.record_summary}`
      : `Close-note record summary: ${closeNoteRecord.record_summary}`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteArchivePrompt(
  closeNoteArchive: RoleCoreMemoryCloseNoteArchive | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteArchive) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note archive：archive_version = ${closeNoteArchive.archive_version}；readiness = ${closeNoteArchive.readiness_judgment}。`
      : `Role core close-note archive: archive_version = ${closeNoteArchive.archive_version}; readiness = ${closeNoteArchive.readiness_judgment}.`,
    isZh
      ? `Close-note archive progress：${closeNoteArchive.progress_range}；close_candidate = ${closeNoteArchive.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNoteArchive.close_note_recommended ? "true" : "false"}。`
      : `Close-note archive progress: ${closeNoteArchive.progress_range}; close_candidate = ${closeNoteArchive.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNoteArchive.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note archive headline：${closeNoteArchive.headline}。`
      : `Close-note archive headline: ${closeNoteArchive.headline}.`,
    isZh
      ? `Namespace archive section：${closeNoteArchive.namespace.archive_summary}。`
      : `Namespace archive section: ${closeNoteArchive.namespace.archive_summary}.`,
    isZh
      ? `Retention archive section：${closeNoteArchive.retention.archive_summary}。`
      : `Retention archive section: ${closeNoteArchive.retention.archive_summary}.`,
    isZh
      ? `Knowledge archive section：${closeNoteArchive.knowledge.archive_summary}。`
      : `Knowledge archive section: ${closeNoteArchive.knowledge.archive_summary}.`,
    isZh
      ? `Scenario archive section：${closeNoteArchive.scenario.archive_summary}。`
      : `Scenario archive section: ${closeNoteArchive.scenario.archive_summary}.`,
    isZh
      ? `Close-note archive summary：${closeNoteArchive.archive_summary}`
      : `Close-note archive summary: ${closeNoteArchive.archive_summary}`,
    isZh
      ? `Close-note archive non-blocking items：${closeNoteArchive.non_blocking_items.join(", ") || "none"}。`
      : `Close-note archive non-blocking items: ${closeNoteArchive.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note archive tail candidates：${closeNoteArchive.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note archive tail candidates: ${closeNoteArchive.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note archive gap buckets：blocking = ${closeNoteArchive.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteArchive.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteArchive.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note archive gap buckets: blocking = ${closeNoteArchive.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteArchive.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteArchive.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note archive next focus：${closeNoteArchive.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note archive next focus: ${closeNoteArchive.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNotePersistencePayloadPrompt(
  closeNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNotePersistencePayload) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note persistence payload：payload_version = ${closeNotePersistencePayload.payload_version}；readiness = ${closeNotePersistencePayload.readiness_judgment}。`
      : `Role core close-note persistence payload: payload_version = ${closeNotePersistencePayload.payload_version}; readiness = ${closeNotePersistencePayload.readiness_judgment}.`,
    isZh
      ? `Close-note persistence progress：${closeNotePersistencePayload.progress_range}；close_candidate = ${closeNotePersistencePayload.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNotePersistencePayload.close_note_recommended ? "true" : "false"}。`
      : `Close-note persistence progress: ${closeNotePersistencePayload.progress_range}; close_candidate = ${closeNotePersistencePayload.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNotePersistencePayload.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note persistence headline：${closeNotePersistencePayload.headline}。`
      : `Close-note persistence headline: ${closeNotePersistencePayload.headline}.`,
    isZh
      ? `Namespace persistence section：${closeNotePersistencePayload.namespace.persistence_summary}。`
      : `Namespace persistence section: ${closeNotePersistencePayload.namespace.persistence_summary}.`,
    isZh
      ? `Retention persistence section：${closeNotePersistencePayload.retention.persistence_summary}。`
      : `Retention persistence section: ${closeNotePersistencePayload.retention.persistence_summary}.`,
    isZh
      ? `Knowledge persistence section：${closeNotePersistencePayload.knowledge.persistence_summary}。`
      : `Knowledge persistence section: ${closeNotePersistencePayload.knowledge.persistence_summary}.`,
    isZh
      ? `Scenario persistence section：${closeNotePersistencePayload.scenario.persistence_summary}。`
      : `Scenario persistence section: ${closeNotePersistencePayload.scenario.persistence_summary}.`,
    isZh
      ? `Close-note persistence summary：${closeNotePersistencePayload.persistence_summary}`
      : `Close-note persistence summary: ${closeNotePersistencePayload.persistence_summary}`,
    isZh
      ? `Close-note persistence non-blocking items：${closeNotePersistencePayload.non_blocking_items.join(", ") || "none"}。`
      : `Close-note persistence non-blocking items: ${closeNotePersistencePayload.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence tail candidates：${closeNotePersistencePayload.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note persistence tail candidates: ${closeNotePersistencePayload.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence gap buckets：blocking = ${closeNotePersistencePayload.acceptance_gap_buckets.blocking}；non_blocking = ${closeNotePersistencePayload.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNotePersistencePayload.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note persistence gap buckets: blocking = ${closeNotePersistencePayload.acceptance_gap_buckets.blocking}; non_blocking = ${closeNotePersistencePayload.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNotePersistencePayload.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note persistence next focus：${closeNotePersistencePayload.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note persistence next focus: ${closeNotePersistencePayload.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNotePersistenceEnvelopePrompt(
  closeNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNotePersistenceEnvelope) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note persistence envelope：envelope_version = ${closeNotePersistenceEnvelope.envelope_version}；readiness = ${closeNotePersistenceEnvelope.readiness_judgment}。`
      : `Role core close-note persistence envelope: envelope_version = ${closeNotePersistenceEnvelope.envelope_version}; readiness = ${closeNotePersistenceEnvelope.readiness_judgment}.`,
    isZh
      ? `Close-note persistence envelope progress：${closeNotePersistenceEnvelope.progress_range}；close_candidate = ${closeNotePersistenceEnvelope.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNotePersistenceEnvelope.close_note_recommended ? "true" : "false"}。`
      : `Close-note persistence envelope progress: ${closeNotePersistenceEnvelope.progress_range}; close_candidate = ${closeNotePersistenceEnvelope.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNotePersistenceEnvelope.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note persistence envelope headline：${closeNotePersistenceEnvelope.headline}。`
      : `Close-note persistence envelope headline: ${closeNotePersistenceEnvelope.headline}.`,
    isZh
      ? `Namespace persistence envelope section：${closeNotePersistenceEnvelope.namespace.envelope_summary}。`
      : `Namespace persistence envelope section: ${closeNotePersistenceEnvelope.namespace.envelope_summary}.`,
    isZh
      ? `Retention persistence envelope section：${closeNotePersistenceEnvelope.retention.envelope_summary}。`
      : `Retention persistence envelope section: ${closeNotePersistenceEnvelope.retention.envelope_summary}.`,
    isZh
      ? `Knowledge persistence envelope section：${closeNotePersistenceEnvelope.knowledge.envelope_summary}。`
      : `Knowledge persistence envelope section: ${closeNotePersistenceEnvelope.knowledge.envelope_summary}.`,
    isZh
      ? `Scenario persistence envelope section：${closeNotePersistenceEnvelope.scenario.envelope_summary}。`
      : `Scenario persistence envelope section: ${closeNotePersistenceEnvelope.scenario.envelope_summary}.`,
    isZh
      ? `Close-note persistence envelope summary：${closeNotePersistenceEnvelope.envelope_summary}`
      : `Close-note persistence envelope summary: ${closeNotePersistenceEnvelope.envelope_summary}`,
    isZh
      ? `Close-note persistence envelope non-blocking items：${closeNotePersistenceEnvelope.non_blocking_items.join(", ") || "none"}。`
      : `Close-note persistence envelope non-blocking items: ${closeNotePersistenceEnvelope.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence envelope tail candidates：${closeNotePersistenceEnvelope.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note persistence envelope tail candidates: ${closeNotePersistenceEnvelope.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence envelope gap buckets：blocking = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.blocking}；non_blocking = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note persistence envelope gap buckets: blocking = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.blocking}; non_blocking = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNotePersistenceEnvelope.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note persistence envelope next focus：${closeNotePersistenceEnvelope.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note persistence envelope next focus: ${closeNotePersistenceEnvelope.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNotePersistenceManifestPrompt(
  closeNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNotePersistenceManifest) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note persistence manifest：manifest_version = ${closeNotePersistenceManifest.manifest_version}；readiness = ${closeNotePersistenceManifest.readiness_judgment}。`
      : `Role core close-note persistence manifest: manifest_version = ${closeNotePersistenceManifest.manifest_version}; readiness = ${closeNotePersistenceManifest.readiness_judgment}.`,
    isZh
      ? `Close-note persistence manifest progress：${closeNotePersistenceManifest.progress_range}；close_candidate = ${closeNotePersistenceManifest.close_candidate ? "true" : "false"}；close_note_recommended = ${closeNotePersistenceManifest.close_note_recommended ? "true" : "false"}。`
      : `Close-note persistence manifest progress: ${closeNotePersistenceManifest.progress_range}; close_candidate = ${closeNotePersistenceManifest.close_candidate ? "true" : "false"}; close_note_recommended = ${closeNotePersistenceManifest.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Close-note persistence manifest headline：${closeNotePersistenceManifest.headline}。`
      : `Close-note persistence manifest headline: ${closeNotePersistenceManifest.headline}.`,
    isZh
      ? `Namespace persistence manifest section：${closeNotePersistenceManifest.namespace.manifest_summary}。`
      : `Namespace persistence manifest section: ${closeNotePersistenceManifest.namespace.manifest_summary}.`,
    isZh
      ? `Retention persistence manifest section：${closeNotePersistenceManifest.retention.manifest_summary}。`
      : `Retention persistence manifest section: ${closeNotePersistenceManifest.retention.manifest_summary}.`,
    isZh
      ? `Knowledge persistence manifest section：${closeNotePersistenceManifest.knowledge.manifest_summary}。`
      : `Knowledge persistence manifest section: ${closeNotePersistenceManifest.knowledge.manifest_summary}.`,
    isZh
      ? `Scenario persistence manifest section：${closeNotePersistenceManifest.scenario.manifest_summary}。`
      : `Scenario persistence manifest section: ${closeNotePersistenceManifest.scenario.manifest_summary}.`,
    isZh
      ? `Close-note persistence manifest summary：${closeNotePersistenceManifest.manifest_summary}`
      : `Close-note persistence manifest summary: ${closeNotePersistenceManifest.manifest_summary}`,
    isZh
      ? `Close-note persistence manifest non-blocking items：${closeNotePersistenceManifest.non_blocking_items.join(", ") || "none"}。`
      : `Close-note persistence manifest non-blocking items: ${closeNotePersistenceManifest.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence manifest tail candidates：${closeNotePersistenceManifest.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note persistence manifest tail candidates: ${closeNotePersistenceManifest.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note persistence manifest gap buckets：blocking = ${closeNotePersistenceManifest.acceptance_gap_buckets.blocking}；non_blocking = ${closeNotePersistenceManifest.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNotePersistenceManifest.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note persistence manifest gap buckets: blocking = ${closeNotePersistenceManifest.acceptance_gap_buckets.blocking}; non_blocking = ${closeNotePersistenceManifest.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNotePersistenceManifest.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note persistence manifest next focus：${closeNotePersistenceManifest.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note persistence manifest next focus: ${closeNotePersistenceManifest.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
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

function buildMemorySemanticSummaryPrompt(args: {
  recalledMemories: RecalledMemory[];
  threadState: ThreadStateRecord | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const profileSnapshot = args.recalledMemories
    .filter(
      (memory) =>
        memory.memory_type === "profile" || memory.memory_type === "preference"
    )
    .map((memory) => memory.content);
  const semanticSummary = buildRuntimeMemorySemanticSummary({
    memoryTypesUsed: args.recalledMemories.map((memory) => memory.memory_type),
    profileSnapshot,
    hasThreadState: Boolean(args.threadState),
    threadStateFocusMode: args.threadState?.focus_mode ?? null,
    semanticLayersUsed: args.recalledMemories.map(
      (memory) => memory.semantic_layer
    )
  });

  if (
    !semanticSummary.primary_layer &&
    semanticSummary.observed_layers.length === 0
  ) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `本轮记忆语义摘要：primary_layer = ${semanticSummary.primary_layer ?? "none"}；observed_layers = ${semanticSummary.observed_layers.join(", ") || "none"}。`
      : `Memory semantic summary for this turn: primary_layer = ${semanticSummary.primary_layer ?? "none"}; observed_layers = ${semanticSummary.observed_layers.join(", ") || "none"}.`
  ];
  const hasEpisodeMemory = args.recalledMemories.some(
    (memory) => memory.memory_type === "episode"
  );
  const hasTimelineMemory = args.recalledMemories.some(
    (memory) => memory.memory_type === "timeline"
  );

  if (semanticSummary.primary_layer === "thread_state") {
    sections.push(
      isZh
        ? "优先让当前线程状态决定即时 focus、continuity 和语言延续，再用其它记忆层做补充。"
        : "Let the current thread state drive immediate focus, continuity, and language carryover first, then use other memory layers as support."
    );
  } else if (semanticSummary.primary_layer === "static_profile") {
    sections.push(
      isZh
        ? "优先把稳定 profile / preference 作为回答基线，再按需要补充关系或线程状态。"
        : "Use stable profile and preference facts as the baseline first, then layer in relationship or thread-state detail only when needed."
    );
  } else if (semanticSummary.primary_layer === "dynamic_profile") {
    sections.push(
      isZh
        ? "优先把当前阶段仍持续有效的动态画像当作本轮回答基线，不要把它误压回线程即时状态或静态长期偏好。"
        : "Use the currently active dynamic profile as the baseline for this turn instead of collapsing it back into thread-state immediacy or static long-term preference."
    );
  } else if (semanticSummary.primary_layer === "memory_record") {
    sections.push(
      isZh
        ? "优先把关系/事件类记忆当作当前问题的直接事实来源，不要被更远的默认 profile 稀释。"
        : "Treat relationship or event-like memory as the direct fact source for this turn before falling back to more distant profile defaults."
    );
  }

  if (hasEpisodeMemory) {
    sections.push(
      isZh
        ? "如果命中 episode 记忆，把它当作与当前问题直接相关的过去事件或阶段事实，优先用来支撑当前回答，不要把它压扁成泛泛偏好。"
        : "When episode memory is present, treat it as a concrete past event or stage fact tied to the current question instead of flattening it into a generic preference."
    );
  }

  if (hasTimelineMemory) {
    sections.push(
      isZh
        ? "如果命中 timeline 记忆，把它当作“变化过程/阶段演进”的线索，用来解释事情是怎么一路发展到现在，而不是只摘一条静态事实。"
        : "When timeline memory is present, use it as a cue for how the situation evolved over time rather than reducing it to a single static fact."
    );
  }

  if (
    semanticSummary.observed_layers.includes("dynamic_profile") &&
    semanticSummary.observed_layers.includes("thread_state")
  ) {
    sections.push(
      isZh
        ? "如果同时命中 dynamic profile 和 thread_state，让 thread_state 决定即时线程推进，让 dynamic profile 决定当前阶段仍持续有效的工作方式或偏好。"
        : "When both dynamic profile and thread_state are present, let thread_state govern immediate thread coordination while dynamic profile carries the still-active phase-level working mode or preference."
    );
  }

  if (
    semanticSummary.observed_layers.includes("static_profile") &&
    semanticSummary.observed_layers.includes("memory_record")
  ) {
    sections.push(
      isZh
        ? "如果同时命中稳定画像和关系记忆，让 stable profile 决定长期偏好，让 relationship memory 决定称呼、关系事实和直接确认信息。"
        : "When both stable profile and relationship memory are present, let stable profile guide long-lived preferences while relationship memory handles address terms, relationship facts, and direct confirmations."
    );
  }

  return sections.join("\n");
}

export function buildAgentSystemPrompt(
  roleCorePacket: RoleCorePacket,
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories: RecalledMemory[] = [],
  relevantKnowledge: RuntimeKnowledgeSnippet[] = [],
  compactedThreadSummary: ReturnType<typeof buildCompactedThreadSummary> = null,
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null = null,
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
  threadState: ThreadStateRecord | null = null,
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null = null,
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null = null,
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null = null,
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null = null,
  closeNoteArchive: RoleCoreMemoryCloseNoteArchive | null = null,
  closeNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null = null,
  closeNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null = null,
  closeNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null = null,
  outputGovernancePrompt = "",
  humanizedDeliveryPrompt = "",
  runtimeSurface: "full" | "im_summary" = "full"
) {
  return buildAgentSystemPromptInternal(
    roleCorePacket,
    agentSystemPrompt,
    latestUserMessage,
    recalledMemories,
    relevantKnowledge,
    compactedThreadSummary,
    activeMemoryNamespace,
    replyLanguage,
    relationshipRecall,
    [],
    threadContinuityPrompt,
    threadState,
    closeNoteHandoffPacket,
    closeNoteArtifact,
    closeNoteOutput,
    closeNoteRecord,
    closeNoteArchive,
    closeNotePersistencePayload,
    closeNotePersistenceEnvelope,
    closeNotePersistenceManifest,
    outputGovernancePrompt,
    humanizedDeliveryPrompt,
    runtimeSurface
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

async function getAccountLevelModelProfileForUser(args: {
  userId: string;
  supabase?: any;
}) {
  const supabase = args.supabase ?? (await createClient());
  const { data: appSettings } = await loadOwnedUserAppSettingsMetadata({
    supabase,
    userId: args.userId
  });
  const metadata =
    appSettings?.metadata &&
    typeof appSettings.metadata === "object" &&
    !Array.isArray(appSettings.metadata)
      ? (appSettings.metadata as Record<string, unknown>)
      : {};
  const preferredTextModelSlug =
    typeof metadata.default_text_model_slug === "string" &&
    metadata.default_text_model_slug.trim().length > 0
      ? metadata.default_text_model_slug.trim()
      : null;

  if (preferredTextModelSlug) {
    const { data: preferredProfile } = await loadActiveModelProfileBySlug({
      supabase,
      slug: preferredTextModelSlug
    });

    if (preferredProfile) {
      return preferredProfile as ModelProfileRecord;
    }
  }

  return null;
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
  const totalStartedAt = nowMs();

  const accountLevelStartedAt = nowMs();
  const accountLevelProfile = await getAccountLevelModelProfileForUser({
    supabase,
    userId
  });
  const accountLevelDurationMs = elapsedMs(accountLevelStartedAt);

  if (accountLevelProfile) {
    return {
      profile: accountLevelProfile,
      timingMs: {
        total: elapsedMs(totalStartedAt),
        account_level_lookup: accountLevelDurationMs,
        bound_profile_lookup: 0,
        default_profile_lookup: 0,
        bind_default_profile: 0,
      },
    };
  }

  if (agent.default_model_profile_id) {
    const boundProfileStartedAt = nowMs();
    const { data: boundProfile } = await loadActiveModelProfileById({
      supabase,
      modelProfileId: agent.default_model_profile_id
    });
    const boundProfileDurationMs = elapsedMs(boundProfileStartedAt);

    if (boundProfile) {
      return {
        profile: boundProfile as ModelProfileRecord,
        timingMs: {
          total: elapsedMs(totalStartedAt),
          account_level_lookup: accountLevelDurationMs,
          bound_profile_lookup: boundProfileDurationMs,
          default_profile_lookup: 0,
          bind_default_profile: 0,
        },
      };
    }
  }

  const defaultProfileStartedAt = nowMs();
  const defaultProfile = await getDefaultModelProfile(supabase);
  const defaultProfileDurationMs = elapsedMs(defaultProfileStartedAt);

  const bindDefaultStartedAt = nowMs();
  const { error } = await bindOwnedAgentModelProfile({
    supabase,
    agentId: agent.id,
    workspaceId,
    userId,
    modelProfileId: defaultProfile.id
  });
  const bindDefaultDurationMs = elapsedMs(bindDefaultStartedAt);

  if (error) {
    throw new Error(
      `Failed to bind a default model profile to the active agent: ${error.message}`
    );
  }

  agent.default_model_profile_id = defaultProfile.id;

  return {
    profile: defaultProfile,
    timingMs: {
      total: elapsedMs(totalStartedAt),
      account_level_lookup: accountLevelDurationMs,
      bound_profile_lookup: 0,
      default_profile_lookup: defaultProfileDurationMs,
      bind_default_profile: bindDefaultDurationMs,
    },
  };
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
  const initialSupabase = await createClient();
  const { supabase, user } =
    await resolveRuntimePageUserWithSmokeFallback(initialSupabase);

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
  const initialSupabase = await createClient();
  const { supabase, user } =
    await resolveRuntimePageUserWithSmokeFallback(initialSupabase);

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
  const visibleMemories = filteredVisibleMemories.map((memory) =>
    buildVisibleMemoryRecord({
      memory,
      agentNameById,
      sourceMessageById,
      sourceThreadTitleById
    })
  ) as VisibleMemoryRecord[];
  const hiddenMemories = filteredHiddenMemories.map((memory) =>
    buildVisibleMemoryRecord({
      memory,
      agentNameById,
      sourceMessageById,
      sourceThreadTitleById
    })
  ) as HiddenMemoryRecord[];
  const incorrectMemories = filteredIncorrectMemories.map((memory) =>
    buildVisibleMemoryRecord({
      memory,
      agentNameById,
      sourceMessageById,
      sourceThreadTitleById
    })
  ) as IncorrectMemoryRecord[];
  const supersededMemories = filteredSupersededMemories.map((memory) =>
    buildVisibleMemoryRecord({
      memory,
      agentNameById,
      sourceMessageById,
      sourceThreadTitleById
    })
  ) as SupersededMemoryRecord[];
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
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId,
    agentId: agent.id,
    threadId: thread.id,
    relevantKnowledge: []
  });
  const prepareRuntimeMemoryStartedAt = nowMs();
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
    activeNamespace: activeMemoryNamespace,
    supabase
  });
  const prepareRuntimeMemoryDurationMs = elapsedMs(prepareRuntimeMemoryStartedAt);
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
    (memory): memory is RecalledMemory => memory.memory_type !== "goal"
  );
  const relationshipMemories = [
    relationshipRecall.addressStyleMemory,
    relationshipRecall.nicknameMemory,
    relationshipRecall.preferredNameMemory
  ].filter(Boolean) as Array<{
    memory_id: string;
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
  const relationshipRecallKeys = [
    relationshipRecall.addressStyleMemory ? "user_address_style" : null,
    relationshipRecall.nicknameMemory ? "agent_nickname" : null,
    relationshipRecall.preferredNameMemory ? "user_preferred_name" : null
  ].filter((value): value is string => value !== null);
  const relationshipRecallMemoryIds = relationshipMemories.map(
    (memory) => memory.memory_id
  );
  const allRecalledMemories =
    relationshipMemories.length > 0
      ? [...recalledMemories, ...relationshipMemories]
      : recalledMemories;
  const modelProfileStartedAt = nowMs();
  const modelProfileResolution = await resolveModelProfileForAgent({
    agent,
    workspaceId: workspace.id,
    userId,
    supabase
  });
  const modelProfileDurationMs = elapsedMs(modelProfileStartedAt);
  const modelProfile = modelProfileResolution.profile;
  const modelProfileTimingMs = modelProfileResolution.timingMs;
  const threadContinuityPrompt = buildThreadContinuityPrompt({
    threadContinuity,
    replyLanguage,
    relationshipRecall,
    recentRawTurns: sessionContext.recent_raw_turns
  });
  const roleCorePacketForTurn = prepareRuntimeRole({
    agent,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source,
    preferSameThreadContinuation,
    relationshipRecall
  });
  const prepareRuntimeTurnStartedAt = nowMs();
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
  const prepareRuntimeTurnDurationMs = elapsedMs(prepareRuntimeTurnStartedAt);
  const runPreparedRuntimeTurnStartedAt = nowMs();
  const runtimeTurnResult = await runPreparedRuntimeTurn({
    preparedRuntimeTurn,
    userId,
    latestUserMessageContent,
    allRecalledMemories,
    relationshipMemories,
    modelProfile,
    modelProfileTimingMs,
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
  const runPreparedRuntimeTurnDurationMs = elapsedMs(runPreparedRuntimeTurnStartedAt);

  runtimeTurnResult.debug_metadata = {
    ...(runtimeTurnResult.debug_metadata ?? {}),
    runtime_timing_ms: {
      ...((runtimeTurnResult.debug_metadata?.runtime_timing_ms &&
      typeof runtimeTurnResult.debug_metadata.runtime_timing_ms === "object" &&
      !Array.isArray(runtimeTurnResult.debug_metadata.runtime_timing_ms)
        ? runtimeTurnResult.debug_metadata.runtime_timing_ms
        : {}) as Record<string, unknown>),
      prepare_runtime_memory: prepareRuntimeMemoryDurationMs,
      prepare_runtime_memory_recall:
        runtimeMemoryContext.timing_ms?.memory_recall ?? 0,
      prepare_runtime_memory_nickname_recall:
        runtimeMemoryContext.timing_ms?.nickname_recall ?? 0,
      prepare_runtime_memory_preferred_name_recall:
        runtimeMemoryContext.timing_ms?.preferred_name_recall ?? 0,
      prepare_runtime_memory_address_style_recall:
        runtimeMemoryContext.timing_ms?.address_style_recall ?? 0,
      prepare_runtime_memory_total:
        runtimeMemoryContext.timing_ms?.total ?? prepareRuntimeMemoryDurationMs,
      resolve_model_profile: modelProfileDurationMs,
      prepare_runtime_turn: prepareRuntimeTurnDurationMs,
      run_prepared_runtime_turn: runPreparedRuntimeTurnDurationMs
    }
  };

  console.info("[runtime-turn]", {
    thread_id: thread.id,
    agent_id: agent.id,
    prepare_runtime_memory_duration_ms: prepareRuntimeMemoryDurationMs,
    prepare_runtime_memory_recall_duration_ms:
      runtimeMemoryContext.timing_ms?.memory_recall ?? 0,
    prepare_runtime_memory_nickname_recall_duration_ms:
      runtimeMemoryContext.timing_ms?.nickname_recall ?? 0,
    prepare_runtime_memory_preferred_name_recall_duration_ms:
      runtimeMemoryContext.timing_ms?.preferred_name_recall ?? 0,
    prepare_runtime_memory_address_style_recall_duration_ms:
      runtimeMemoryContext.timing_ms?.address_style_recall ?? 0,
    resolve_model_profile_duration_ms: modelProfileDurationMs,
    prepare_runtime_turn_duration_ms: prepareRuntimeTurnDurationMs,
    run_prepared_runtime_turn_duration_ms: runPreparedRuntimeTurnDurationMs,
    total_duration_ms:
      prepareRuntimeMemoryDurationMs +
      modelProfileDurationMs +
      prepareRuntimeTurnDurationMs +
      runPreparedRuntimeTurnDurationMs
  });

  return runtimeTurnResult;
}

export async function runPreparedRuntimeTurn({
  preparedRuntimeTurn,
  userId,
  latestUserMessageContent,
  allRecalledMemories,
  relationshipMemories,
  modelProfile,
  modelProfileTimingMs,
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
  allRecalledMemories: RecalledMemory[];
  relationshipMemories: Array<{
    memory_id: string;
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
  modelProfile: Awaited<ReturnType<typeof resolveModelProfileForAgent>>["profile"];
  modelProfileTimingMs: Awaited<ReturnType<typeof resolveModelProfileForAgent>>["timingMs"];
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
  const runPreparedStartedAt = nowMs();
  const agent = preparedRuntimeTurn.role.agent;
  const relationshipRecall =
    preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall;
  const memoryRecall = preparedRuntimeTurn.memory.runtime_memory_context.memoryRecall;
  const relationshipRecallKeys = [
    relationshipRecall.addressStyleMemory ? "user_address_style" : null,
    relationshipRecall.nicknameMemory ? "agent_nickname" : null,
    relationshipRecall.preferredNameMemory ? "user_preferred_name" : null
  ].filter((value): value is string => value !== null);
  const relationshipRecallMemoryIds = relationshipMemories.map(
    (memory) => memory.memory_id
  );
  const recalledProfileSnapshot =
    buildRecalledStaticProfileSnapshot(memoryRecall.memories);
  const compactedThreadSummary = selectRetainedThreadCompactionSummary({
    compactedThreadSummary: buildCompactedThreadSummary({
      threadState: preparedRuntimeTurn.session.thread_state,
      recentTurnCount: recentRawTurnCount,
      latestUserMessage: latestUserMessageContent
    })
  });
  const knowledgeRoute =
    preparedRuntimeTurn.governance?.knowledge_route?.route ?? null;
  const knowledgeLoadLimit = resolveKnowledgeLoadLimit(knowledgeRoute);
  const knowledgeLoadStartedAt = nowMs();
  const knowledgeLoad =
    knowledgeLoadLimit > 0
      ? await loadRelevantKnowledgeForRuntime({
          userId,
          workspaceId: preparedRuntimeTurn.resources.workspace.id,
          agentId: agent.id,
          latestUserMessage: latestUserMessageContent,
          knowledgeRoute,
          limit: knowledgeLoadLimit
        })
      : {
          snippets: [],
        gating: {
          knowledge_route: knowledgeRoute,
          query_token_count: 0,
          available: false,
          available_count: 0,
          should_inject: false,
          injection_gap_reason: null,
          retained_count: 0,
          suppressed: knowledgeLoadLimit === 0,
          suppression_reason:
            knowledgeLoadLimit === 0 ? "knowledge_route_no_knowledge" : null,
            zero_match_filtered_count: 0,
            weak_match_filtered_count: 0
          }
        };
  const knowledgeLoadDurationMs = elapsedMs(knowledgeLoadStartedAt);
  const relevantKnowledge = knowledgeLoad.snippets;
  const knowledgeGating = knowledgeLoad.gating;
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId,
    agentId: agent.id,
    threadId: preparedRuntimeTurn.session.thread_id,
    relevantKnowledge
  });
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: relevantKnowledge,
    namespace: activeMemoryNamespace
  });
  const knowledgeInjectionGapReason =
    knowledgeGating.should_inject && applicableKnowledge.length === 0
      ? "namespace_filtered_after_availability"
      : null;
  const knowledgeGatingWithOutcome = {
    ...knowledgeGating,
    injection_gap_reason: knowledgeInjectionGapReason
  };
  const activeScenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace,
    relevantKnowledge: applicableKnowledge
  });
  const namespaceGovernanceFabricPlanePhaseSnapshot =
    resolveNamespaceGovernanceFabricPlanePhaseSnapshot(activeMemoryNamespace);
  const retentionGovernanceFabricPlanePhaseSnapshot = compactedThreadSummary
    ? resolveThreadGovernanceFabricPlanePhaseSnapshot({
        lifecycle_governance_fabric_plane_digest:
          compactedThreadSummary.lifecycle_governance_fabric_plane_digest,
        keep_drop_governance_fabric_plane_summary:
          compactedThreadSummary.keep_drop_governance_fabric_plane_summary,
        lifecycle_governance_fabric_plane_alignment_mode:
          compactedThreadSummary
            .lifecycle_governance_fabric_plane_alignment_mode,
        lifecycle_governance_fabric_plane_reuse_mode:
          compactedThreadSummary.lifecycle_governance_fabric_plane_reuse_mode,
        retention_section_order: compactedThreadSummary.retention_section_order,
        retained_fields: compactedThreadSummary.retained_fields
      })
    : null;
  const knowledgeSummary = buildKnowledgeSummary({
    knowledge: applicableKnowledge,
    activeNamespace: activeMemoryNamespace
  });
  const knowledgeGovernanceFabricPlanePhaseSnapshot =
    resolveKnowledgeGovernanceFabricPlanePhaseSnapshot({
      governanceFabricPlaneDigest:
        knowledgeSummary.governance_fabric_plane_digest,
      sourceBudgetGovernanceFabricPlaneSummary:
        knowledgeSummary.source_budget_governance_fabric_plane_summary,
      governanceFabricPlaneMode: knowledgeSummary.governance_fabric_plane_mode,
      governanceFabricPlaneReuseMode:
        knowledgeSummary.governance_fabric_plane_reuse_mode,
      applicableKnowledge
    });
  const scenarioGovernanceFabricPlanePhaseSnapshot =
    resolveScenarioGovernanceFabricPlanePhaseSnapshot(activeScenarioMemoryPack);
  const activeScenarioMemoryPackStrategy =
    resolveScenarioMemoryPackStrategy(activeScenarioMemoryPack);
  const roleCorePacketWithMemoryHandoff = withRoleCoreMemoryHandoff({
    packet: preparedRuntimeTurn.role.role_core,
    memoryHandoff: {
      handoff_version: "v1",
      namespace_phase_snapshot_id:
        namespaceGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      namespace_phase_snapshot_summary:
        namespaceGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      retention_phase_snapshot_id:
        retentionGovernanceFabricPlanePhaseSnapshot?.phase_snapshot_id ?? null,
      retention_phase_snapshot_summary:
        retentionGovernanceFabricPlanePhaseSnapshot?.phase_snapshot_summary ?? null,
      retention_decision_group:
        compactedThreadSummary?.retention_decision_group ?? null,
      retention_retained_fields: compactedThreadSummary?.retained_fields ?? [],
      knowledge_phase_snapshot_id:
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      knowledge_phase_snapshot_summary:
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      knowledge_scope_layers: knowledgeSummary.scope_layers,
      knowledge_governance_classes: knowledgeSummary.governance_classes,
      scenario_phase_snapshot_id:
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      scenario_phase_snapshot_summary:
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      scenario_strategy_bundle_id:
        activeScenarioMemoryPackStrategy.strategy_bundle_id,
      scenario_orchestration_mode: activeScenarioMemoryPack.orchestration_mode
    }
  });
  const roleCoreCloseNoteHandoffPacket = buildRoleCoreMemoryCloseNoteHandoffPacket(
    {
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      readinessJudgment: "close_ready",
      progressRange: "60% - 65%",
      closeCandidate: true,
      closeNoteRecommended: true,
      blockingItems: [],
      nonBlockingItems: [
        "close_note_acceptance_structuring",
        "close_note_gate_snapshot_consumption",
        "close_readiness_handoff_alignment"
      ],
      tailCandidateItems: [
        "packet_output_symmetry_cleanup",
        "non_blocking_packet_negative_coverage",
        "close_note_tail_cleanup_alignment"
      ],
      acceptanceGapBuckets: {
        blocking: 0,
        non_blocking: 3,
        tail_candidate: 3
      },
      nextExpansionFocus: [
        "close_note_acceptance_structuring",
        "close_note_gate_snapshot_consumption",
        "close_readiness_handoff_alignment"
      ]
    }
  );
  const roleCoreCloseNoteArtifact = buildRoleCoreMemoryCloseNoteArtifact({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteHandoffPacket: roleCoreCloseNoteHandoffPacket
  });
  const roleCoreCloseNoteOutput = buildRoleCoreMemoryCloseNoteOutput({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteHandoffPacket: roleCoreCloseNoteHandoffPacket,
    closeNoteArtifact: roleCoreCloseNoteArtifact
  });
  const roleCoreCloseNoteRecord = buildRoleCoreMemoryCloseNoteRecord({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteOutput: roleCoreCloseNoteOutput,
    closeNoteArtifact: roleCoreCloseNoteArtifact
  });
  const roleCoreCloseNoteArchive = buildRoleCoreMemoryCloseNoteArchive({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteRecord: roleCoreCloseNoteRecord,
    closeNoteOutput: roleCoreCloseNoteOutput
  });
  const roleCoreCloseNotePersistencePayload =
    buildRoleCoreMemoryCloseNotePersistencePayload({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNoteArchive: roleCoreCloseNoteArchive,
      closeNoteRecord: roleCoreCloseNoteRecord
    });
  const roleCoreCloseNotePersistenceEnvelope =
    buildRoleCoreMemoryCloseNotePersistenceEnvelope({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNotePersistencePayload: roleCoreCloseNotePersistencePayload,
      closeNoteArchive: roleCoreCloseNoteArchive
    });
  const roleCoreCloseNotePersistenceManifest =
    buildRoleCoreMemoryCloseNotePersistenceManifest({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNotePersistenceEnvelope: roleCoreCloseNotePersistenceEnvelope,
      closeNotePersistencePayload: roleCoreCloseNotePersistencePayload
    });
  const runtimeSurface =
    preparedRuntimeTurn.input.message.source === "im" ? "im_summary" : "full";
  const imTemporalContinuityHints = getImTemporalContinuityHints(
    preparedRuntimeTurn.session.recent_raw_turns
  );
  const runtimeTemporalContext = buildRuntimeTemporalContext();
  const humanizedDeliveryPacket =
    runtimeSurface === "im_summary" && latestUserMessageContent
      ? buildHumanizedDeliveryPacket({
          latestUserMessage: latestUserMessageContent,
          temporalContext: runtimeTemporalContext,
          temporalHints: imTemporalContinuityHints,
          recentRawTurns: preparedRuntimeTurn.session.recent_raw_turns
        })
      : null;
  const outputGovernancePrompt =
    runtimeSurface === "im_summary"
      ? buildOutputGovernancePromptSectionCompact(
          preparedRuntimeTurn.governance?.output_governance,
          replyLanguage
        )
      : buildOutputGovernancePromptSection(
          preparedRuntimeTurn.governance?.output_governance,
          replyLanguage
        );
  const humanizedDeliveryPrompt =
    runtimeSurface === "im_summary"
      ? buildHumanizedDeliveryPromptSection({
          packet: humanizedDeliveryPacket,
          replyLanguage
        })
      : "";
  const { workspace, thread, messages, assistant_message_id, supabase } =
    preparedRuntimeTurn.resources;
  const runtimeSupabase = supabase as any;
  const systemPromptSections = buildAgentSystemPromptSectionsInternal(
    roleCorePacketWithMemoryHandoff,
    agent.system_prompt,
    latestUserMessageContent ?? "",
    allRecalledMemories,
    applicableKnowledge,
    compactedThreadSummary,
    activeMemoryNamespace,
    replyLanguage,
    relationshipRecall,
    preparedRuntimeTurn.session.recent_raw_turns,
    threadContinuityPrompt,
    preparedRuntimeTurn.session.thread_state,
    roleCoreCloseNoteHandoffPacket,
    roleCoreCloseNoteArtifact,
    roleCoreCloseNoteOutput,
    roleCoreCloseNoteRecord,
    roleCoreCloseNoteArchive,
    roleCoreCloseNotePersistencePayload,
    roleCoreCloseNotePersistenceEnvelope,
    roleCoreCloseNotePersistenceManifest,
    outputGovernancePrompt,
    humanizedDeliveryPrompt,
    runtimeSurface
  );
  const systemPrompt = systemPromptSections
    .map((section) => section.content)
    .join("\n\n");
  const promptMessages = [
    {
      role: "system" as const,
      content: systemPrompt
    },
    ...(typeof preparedRuntimeTurn.input.message.metadata?.assistant_generation_hint === "string"
      && preparedRuntimeTurn.input.message.metadata.assistant_generation_hint.trim().length > 0
      ? [
          {
            role: "system" as const,
            content: preparedRuntimeTurn.input.message.metadata.assistant_generation_hint.trim()
          }
        ]
      : []),
    ...messages
      .filter((message) => message.status !== "failed" && message.status !== "pending")
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  ];
  const promptMessageCount = promptMessages.length;
  const promptSystemChars = promptMessages
    .filter((message) => message.role === "system")
    .reduce((total, message) => total + message.content.length, 0);
  const promptUserChars = promptMessages
    .filter((message) => message.role === "user")
    .reduce((total, message) => total + message.content.length, 0);
  const promptAssistantChars = promptMessages
    .filter((message) => message.role === "assistant")
    .reduce((total, message) => total + message.content.length, 0);
  const promptTotalChars = promptMessages.reduce(
    (total, message) => total + message.content.length,
    0
  );
  const promptTotalBytes = Buffer.byteLength(
    JSON.stringify(promptMessages),
    "utf8"
  );
  const promptApproxTokenCount = approximateTokenCountFromBytes(promptTotalBytes);
  const promptSystemSectionLengths = systemPromptSections
    .map((section) => ({
      key: section.key,
      chars: section.content.length
    }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 8);
  const generateTextStartedAt = nowMs();
  const result = await generateText({
    model: modelProfile.model,
    messages: promptMessages,
    temperature: modelProfile.temperature,
    maxOutputTokens: modelProfile.max_output_tokens,
    timeoutMs:
      preparedRuntimeTurn.input.message.source === "im"
        ? IM_LITELLM_TIMEOUT_MS
        : undefined
  });
  const generateTextDurationMs = elapsedMs(generateTextStartedAt);
  const recentUserTurns = preparedRuntimeTurn.session.recent_raw_turns.filter(
    (turn) => turn.role === "user"
  );
  const previousUserTurn =
    recentUserTurns.length >= 2 ? recentUserTurns[recentUserTurns.length - 2] : null;
  const resolvedTextCleanup =
    humanizedDeliveryPacket?.deliveryStrategy.textCleanupPolicy != null
      ? resolveCompanionTextCleanupZh({
          content: result.content,
          policy: humanizedDeliveryPacket.deliveryStrategy.textCleanupPolicy
        })
      : null;

  const finalAssistantContent = maybeRewriteGovernedAssistantText({
    content: result.content,
    governance: preparedRuntimeTurn.governance ?? null,
    replyLanguage,
    userMessage: latestUserMessageContent ?? "",
    generationHint:
      typeof preparedRuntimeTurn.input.message.metadata?.assistant_generation_hint ===
      "string"
        ? preparedRuntimeTurn.input.message.metadata.assistant_generation_hint
        : null,
    userIntent: humanizedDeliveryPacket?.userState.intent ?? null,
    textRenderMode:
      humanizedDeliveryPacket?.deliveryStrategy.textRenderMode ?? null,
    textSentenceCount:
      humanizedDeliveryPacket?.deliveryStrategy.textSentenceCount ?? 1,
    textSecondSentenceRole:
      humanizedDeliveryPacket?.deliveryStrategy.textSecondSentenceRole ?? null,
    textRhythmVariant:
      humanizedDeliveryPacket?.deliveryStrategy.textRhythmVariant ?? null,
    textLeadRewriteMode:
      humanizedDeliveryPacket?.deliveryStrategy.textLeadRewriteMode ?? null,
    resolvedTextCleanup,
    movementImpulseMode:
      humanizedDeliveryPacket?.deliveryStrategy.movementImpulseMode ?? null,
    movementImpulseRepeated:
      humanizedDeliveryPacket?.deliveryStrategy.movementImpulseRepeated ?? false,
    textVariantIndex:
      humanizedDeliveryPacket?.deliveryStrategy.textVariantIndex ?? 0,
    captionPolicy:
      humanizedDeliveryPacket?.deliveryStrategy.captionPolicy ?? null,
    captionSentenceCount:
      humanizedDeliveryPacket?.deliveryStrategy.captionSentenceCount ?? 1,
    captionRhythmVariant:
      humanizedDeliveryPacket?.deliveryStrategy.captionRhythmVariant ?? null,
    captionScene:
      humanizedDeliveryPacket?.deliveryStrategy.captionScene ?? null,
    captionVariantIndex:
      humanizedDeliveryPacket?.deliveryStrategy.captionVariantIndex ?? 0,
    currentPartOfDay: runtimeTemporalContext.partOfDay,
    inputConflict: humanizedDeliveryPacket?.patternSignals.inputConflict ?? false,
    conflictHint: humanizedDeliveryPacket?.patternSignals.conflictHint ?? null
  });

  const currentSourceMessageId =
    preparedRuntimeTurn.session.current_message_id ?? null;
  const recentUserContextForMemoryPlanning =
    preparedRuntimeTurn.session.recent_raw_turns.slice(-3).map((message) => ({
      role: message.role,
      content: message.content
    }));
  const memoryWritePlanning =
    latestUserMessageContent !== null && currentSourceMessageId !== null
      ? await planMemoryWriteRequestsWithPlannerInputs({
            latestUserMessage: latestUserMessageContent,
            recentContext: recentUserContextForMemoryPlanning,
            sourceTurnId: currentSourceMessageId
          })
      : {
          requests: [],
          rejected_generic_candidates: []
        };
  const memoryWriteRequests = [
    ...memoryWritePlanning.requests,
    ...(
      latestUserMessageContent !== null && currentSourceMessageId !== null
        ? planRelationshipMemoryWriteRequests({
            latestUserMessage: latestUserMessageContent,
            sourceTurnId: currentSourceMessageId,
            agentId: agent.id
          })
        : []
    )
  ];
  const memoryPlannerCandidates =
    latestUserMessageContent !== null && currentSourceMessageId !== null
      ? memoryWritePlanning.rejected_generic_candidates.map((candidate) =>
          buildPlannerCandidatePreviewFromGenericExtraction({
            candidate,
            latestUserMessage: latestUserMessageContent,
            recentContext: recentUserContextForMemoryPlanning,
            sourceTurnId: currentSourceMessageId
          })
        )
      : [];
  const runtimePlannedCandidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests: memoryWriteRequests,
    activeNamespace: activeMemoryNamespace
  }).concat(memoryPlannerCandidates);
  const memoryPlannerSummary = summarizePlannerCandidates(
    runtimePlannedCandidates
  );
  const followUpRequests = buildFollowUpRequests({
    latestUserMessage: latestUserMessageContent,
    threadId: thread.id,
    agentId: agent.id,
    userId,
    continuationReasonCode,
    replyLanguage
  });

  const assistantPayload = buildRuntimeAssistantPayload({
    content: finalAssistantContent,
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
        role_core_packet: roleCorePacketWithMemoryHandoff,
        role_core_close_note_handoff_packet: roleCoreCloseNoteHandoffPacket,
        role_core_close_note_artifact: roleCoreCloseNoteArtifact,
        role_core_close_note_record: roleCoreCloseNoteRecord,
        role_core_close_note_archive: roleCoreCloseNoteArchive,
        role_core_close_note_persistence_envelope:
          roleCoreCloseNotePersistenceEnvelope,
        role_core_close_note_persistence_manifest:
          roleCoreCloseNotePersistenceManifest,
        role_core_close_note_persistence_payload:
          roleCoreCloseNotePersistencePayload,
        role_core_close_note_output: roleCoreCloseNoteOutput,
        runtime_input: preparedRuntimeTurn.input,
        session_thread_id: preparedRuntimeTurn.session.thread_id,
        session_agent_id: preparedRuntimeTurn.session.agent_id,
        current_message_id: preparedRuntimeTurn.session.current_message_id,
        recent_raw_turn_count: preparedRuntimeTurn.session.recent_raw_turn_count,
        approx_context_pressure:
          preparedRuntimeTurn.session.approx_context_pressure,
        output_governance:
          preparedRuntimeTurn.governance?.output_governance ?? null
      },
      reply_language: {
        target: replyLanguage,
        detected: detectReplyLanguageFromText(finalAssistantContent),
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
        ),
        relationship_recall: {
          used: relationshipMemories.length > 0,
          direct_naming_question: relationshipRecall.directNamingQuestion,
          direct_preferred_name_question:
            relationshipRecall.directPreferredNameQuestion,
          relationship_style_prompt: relationshipRecall.relationshipStylePrompt,
          same_thread_continuity: relationshipRecall.sameThreadContinuity,
          recalled_keys: relationshipRecallKeys,
          recalled_memory_ids: relationshipRecallMemoryIds,
          adopted_agent_nickname_target:
            relationshipRecall.nicknameMemory?.content ?? null,
          adopted_user_preferred_name_target:
            relationshipRecall.preferredNameMemory?.content ?? null
        }
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
          confidence: memory.confidence,
          semantic_layer: memory.semantic_layer ?? null
        })),
        hit_count: allRecalledMemories.length,
        used: allRecalledMemories.length > 0,
        types_used:
          relationshipMemories.length > 0
            ? Array.from(
                new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
              )
            : memoryRecall.usedMemoryTypes,
        semantic_layers: Array.from(
          new Set(
            allRecalledMemories
              .map((memory) => memory.semantic_layer)
              .filter((layer): layer is NonNullable<typeof layer> => Boolean(layer))
          )
        ),
        memory_record_recall_preferred:
          memoryRecall.memoryRecordRecallPreferred === true,
        profile_fallback_suppressed:
          memoryRecall.profileFallbackSuppressed === true,
        profile_snapshot: recalledProfileSnapshot,
        scenario_pack: activeScenarioMemoryPack,
        hidden_exclusion_count: memoryRecall.hiddenExclusionCount,
        incorrect_exclusion_count: memoryRecall.incorrectExclusionCount
      },
      knowledge: {
        snippets: applicableKnowledge,
        gating: knowledgeGatingWithOutcome
      },
      namespace: {
        active_namespace: activeMemoryNamespace
      },
      compaction: {
        summary: compactedThreadSummary
      },
      follow_up: {
        request_count: followUpRequests.length
      }
    })
  });
  const assistantPayloadContentBytes = Buffer.byteLength(
    assistantPayload.content,
    "utf8"
  );
  const assistantPayloadMetadataBytes = Buffer.byteLength(
    JSON.stringify(assistantPayload.metadata),
    "utf8"
  );
  const assistantPayloadTotalBytes =
    assistantPayloadContentBytes + assistantPayloadMetadataBytes;

  const persistAssistantStartedAt = nowMs();
  const { error } = await persistCompletedAssistantMessage({
    supabase: runtimeSupabase,
    assistantMessageId: assistant_message_id,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId,
    payload: assistantPayload
  });
  const persistAssistantDurationMs = elapsedMs(persistAssistantStartedAt);

  if (error) {
    throw new Error(`Failed to store assistant reply: ${error.message}`);
  }

  const updateThreadStartedAt = nowMs();
  await updateOwnedThread({
    supabase: runtimeSupabase,
    threadId: thread.id,
    userId,
    patch: {
      agent_id: agent.id,
      updated_at: new Date().toISOString()
    }
  });
  const updateThreadDurationMs = elapsedMs(updateThreadStartedAt);

  const runtimeTurnResult: RuntimeTurnResult = {
    assistant_message: {
      role: "assistant",
      content: finalAssistantContent,
      language: replyLanguage,
      message_type: "text",
      metadata: assistantPayload.metadata as Record<string, unknown>
    },
    memory_write_requests: memoryWriteRequests,
    memory_planner_candidates: memoryPlannerCandidates,
    follow_up_requests: followUpRequests,
    memory_usage_updates: relationshipMemories.map((memory) => ({
      memory_item_id: memory.memory_id,
      usage_kind: "relationship_recall"
    })),
    runtime_events: [
      {
        type: "knowledge_selected",
        payload: {
          count: applicableKnowledge.length,
          knowledge_route: knowledgeGating.knowledge_route,
          available: knowledgeGatingWithOutcome.available,
          available_count: knowledgeGatingWithOutcome.available_count,
          should_inject: knowledgeGatingWithOutcome.should_inject,
          injection_gap_reason: knowledgeGatingWithOutcome.injection_gap_reason,
          suppressed: knowledgeGatingWithOutcome.suppressed,
          suppression_reason: knowledgeGatingWithOutcome.suppression_reason,
          query_token_count: knowledgeGatingWithOutcome.query_token_count,
          zero_match_filtered_count:
            knowledgeGatingWithOutcome.zero_match_filtered_count,
          weak_match_filtered_count:
            knowledgeGatingWithOutcome.weak_match_filtered_count
        }
      },
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
          incorrect_exclusion_count: memoryRecall.incorrectExclusionCount,
          memory_record_recall_preferred:
            memoryRecall.memoryRecordRecallPreferred === true,
          profile_fallback_suppressed:
            memoryRecall.profileFallbackSuppressed === true
        }
      },
      {
        type: "memory_write_planned",
        payload: {
          count: memoryWriteRequests.length,
          planner_candidate_count: memoryPlannerSummary.candidate_count,
          rejected_candidate_count:
            memoryPlannerSummary.rejected_candidate_count,
          downgraded_candidate_count:
            memoryPlannerSummary.downgraded_candidate_count,
          memory_types: Array.from(
            new Set(memoryWriteRequests.map((request) => request.memory_type))
          ),
          record_targets: Array.from(
            new Set(
              memoryWriteRequests.map(
                (request) =>
                  resolvePlannedMemoryWriteTarget(
                    request,
                    activeMemoryNamespace
                  ).recordTarget
              )
            )
          ),
          write_boundaries: Array.from(
            new Set(
              memoryWriteRequests.map(
                (request) =>
                  resolvePlannedMemoryWriteTarget(
                    request,
                    activeMemoryNamespace
                  ).writeBoundary
              )
            )
          ),
          decision_kind_counts: memoryPlannerSummary.decision_kind_counts,
          target_layer_counts: memoryPlannerSummary.target_layer_counts,
          boundary_reason_counts: memoryPlannerSummary.boundary_reason_counts,
          decision_reason_counts: memoryPlannerSummary.decision_reason_counts,
          downgrade_reason_counts:
            memoryPlannerSummary.downgrade_reason_counts,
          rejection_reason_counts:
            memoryPlannerSummary.rejection_reason_counts
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
      relationship_recall: {
        used: relationshipMemories.length > 0,
        direct_naming_question: relationshipRecall.directNamingQuestion,
        direct_preferred_name_question:
          relationshipRecall.directPreferredNameQuestion,
        relationship_style_prompt: relationshipRecall.relationshipStylePrompt,
        same_thread_continuity: relationshipRecall.sameThreadContinuity,
        recalled_keys: relationshipRecallKeys,
        recalled_memory_ids: relationshipRecallMemoryIds,
        adopted_agent_nickname_target:
          relationshipRecall.nicknameMemory?.content ?? null,
        adopted_user_preferred_name_target:
          relationshipRecall.preferredNameMemory?.content ?? null
      },
      recalled_memory_count: allRecalledMemories.length,
      memory_types_used:
        relationshipMemories.length > 0
          ? Array.from(
              new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
            )
          : memoryRecall.usedMemoryTypes,
      memory_semantic_layers: Array.from(
        new Set(
          allRecalledMemories
            .map((memory) => memory.semantic_layer)
            .filter((layer): layer is NonNullable<typeof layer> => Boolean(layer))
        )
      ),
      memory_recall_routes: memoryRecall.appliedRoutes,
      memory_record_recall_preferred:
        memoryRecall.memoryRecordRecallPreferred === true,
      profile_fallback_suppressed:
        memoryRecall.profileFallbackSuppressed === true,
      profile_snapshot: recalledProfileSnapshot,
      memory_write_request_count: memoryWriteRequests.length,
      memory_planner_summary: memoryPlannerSummary,
      follow_up_request_count: followUpRequests.length,
      continuation_reason_code: continuationReasonCode,
      recent_turn_count: recentRawTurnCount,
      context_pressure: approxContextPressure,
      thread_state_recall:
        preparedRuntimeTurn.memory.runtime_memory_context.threadStateRecall,
      reply_language: replyLanguage,
      output_governance: preparedRuntimeTurn.governance ?? null,
      scenario_memory_pack: resolveActiveScenarioMemoryPack({
        activeNamespace: activeMemoryNamespace,
        relevantKnowledge: applicableKnowledge
      }),
      relevant_knowledge: applicableKnowledge,
      knowledge_gating: knowledgeGatingWithOutcome,
      active_memory_namespace: activeMemoryNamespace,
      compacted_thread_summary: compactedThreadSummary,
      role_core_close_note_handoff_packet: roleCoreCloseNoteHandoffPacket,
      role_core_close_note_artifact: roleCoreCloseNoteArtifact,
      role_core_close_note_record: roleCoreCloseNoteRecord,
      role_core_close_note_archive: roleCoreCloseNoteArchive,
      role_core_close_note_persistence_envelope:
        roleCoreCloseNotePersistenceEnvelope,
      role_core_close_note_persistence_manifest:
        roleCoreCloseNotePersistenceManifest,
      role_core_close_note_persistence_payload:
        roleCoreCloseNotePersistencePayload,
      role_core_close_note_output: roleCoreCloseNoteOutput
    })
  };

  try {
    const threadStateWritebackStartedAt = nowMs();
    const threadStateWriteback = await maybeWriteThreadStateAfterTurn({
      prepared: preparedRuntimeTurn,
      result: runtimeTurnResult,
      repository: createAdminThreadStateRepository(),
      repository_name: "supabase"
    });
    const threadStateWritebackDurationMs = elapsedMs(threadStateWritebackStartedAt);

    runtimeTurnResult.runtime_events.push({
      type: "thread_state_writeback_completed",
      payload: {
        status: threadStateWriteback.status,
        repository: threadStateWriteback.repository,
        anchor_mode:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.anchor_mode
            : null,
        focus_projection_reason:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.focus_projection_reason
            : null,
        continuity_projection_reason:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.continuity_projection_reason
            : null,
        reason:
          threadStateWriteback.status === "written"
            ? null
            : threadStateWriteback.reason
      }
    });

    runtimeTurnResult.debug_metadata = {
      ...(runtimeTurnResult.debug_metadata ?? {}),
      humanized_delivery: humanizedDeliveryPacket
        ? {
            response_objective: humanizedDeliveryPacket.deliveryStrategy.responseObjective,
            text_follow_up_policy:
              humanizedDeliveryPacket.deliveryStrategy.textFollowUpPolicy,
            text_follow_up_depth:
              humanizedDeliveryPacket.deliveryStrategy.textFollowUpDepth,
            should_include_second_sentence:
              humanizedDeliveryPacket.deliveryStrategy.shouldIncludeSecondSentence,
            text_render_mode:
              humanizedDeliveryPacket.deliveryStrategy.textRenderMode,
            text_sentence_count:
              humanizedDeliveryPacket.deliveryStrategy.textSentenceCount,
            text_second_sentence_role:
              humanizedDeliveryPacket.deliveryStrategy.textSecondSentenceRole,
            text_rhythm_variant:
              humanizedDeliveryPacket.deliveryStrategy.textRhythmVariant,
            text_lead_rewrite_mode:
              humanizedDeliveryPacket.deliveryStrategy.textLeadRewriteMode,
            text_cleanup_policy:
              humanizedDeliveryPacket.deliveryStrategy.textCleanupPolicy,
            movement_impulse_mode:
              humanizedDeliveryPacket.deliveryStrategy.movementImpulseMode,
            movement_impulse_repeated:
              humanizedDeliveryPacket.deliveryStrategy.movementImpulseRepeated,
            text_variant_index:
              humanizedDeliveryPacket.deliveryStrategy.textVariantIndex,
            caption_policy: humanizedDeliveryPacket.deliveryStrategy.captionPolicy,
            caption_sentence_count:
              humanizedDeliveryPacket.deliveryStrategy.captionSentenceCount,
            caption_rhythm_variant:
              humanizedDeliveryPacket.deliveryStrategy.captionRhythmVariant,
            caption_scene:
              humanizedDeliveryPacket.deliveryStrategy.captionScene,
            caption_variant_index:
              humanizedDeliveryPacket.deliveryStrategy.captionVariantIndex,
            artifact_action: humanizedDeliveryPacket.deliveryStrategy.artifactAction,
            image_artifact_action:
              humanizedDeliveryPacket.deliveryStrategy.imageArtifactAction,
            audio_artifact_action:
              humanizedDeliveryPacket.deliveryStrategy.audioArtifactAction,
            input_conflict: humanizedDeliveryPacket.patternSignals.inputConflict,
            conflict_hint: humanizedDeliveryPacket.patternSignals.conflictHint,
            negative_product_feedback_detected:
              humanizedDeliveryPacket.patternSignals.negativeProductFeedback,
            negative_product_feedback_category:
              humanizedDeliveryPacket.patternSignals.negativeProductFeedbackCategory,
          }
        : null,
      runtime_timing_ms: {
        ...(runtimeTurnResult.debug_metadata?.runtime_timing_ms &&
        typeof runtimeTurnResult.debug_metadata.runtime_timing_ms === "object" &&
        !Array.isArray(runtimeTurnResult.debug_metadata.runtime_timing_ms)
          ? (runtimeTurnResult.debug_metadata.runtime_timing_ms as Record<string, unknown>)
          : {}),
        knowledge_load: knowledgeLoadDurationMs,
        generate_text: generateTextDurationMs,
        resolve_model_profile_account_level:
          modelProfileTimingMs.account_level_lookup,
        resolve_model_profile_bound_profile:
          modelProfileTimingMs.bound_profile_lookup,
        resolve_model_profile_default_profile:
          modelProfileTimingMs.default_profile_lookup,
        resolve_model_profile_bind_default:
          modelProfileTimingMs.bind_default_profile,
        persist_assistant_message: persistAssistantDurationMs,
        update_thread: updateThreadDurationMs,
        assistant_payload_content_bytes: assistantPayloadContentBytes,
        assistant_payload_metadata_bytes: assistantPayloadMetadataBytes,
        assistant_payload_total_bytes: assistantPayloadTotalBytes,
        prompt_message_count: promptMessageCount,
        prompt_system_chars: promptSystemChars,
        prompt_system_top_sections: promptSystemSectionLengths,
        prompt_user_chars: promptUserChars,
        prompt_assistant_chars: promptAssistantChars,
        prompt_total_chars: promptTotalChars,
        prompt_total_bytes: promptTotalBytes,
        prompt_approx_tokens: promptApproxTokenCount,
        thread_state_writeback: threadStateWritebackDurationMs,
        run_prepared_total: elapsedMs(runPreparedStartedAt)
      },
      thread_state_writeback:
        threadStateWriteback.status === "written"
          ? {
              status: threadStateWriteback.status,
              repository: threadStateWriteback.repository,
              anchor_mode: threadStateWriteback.anchor_mode,
              focus_projection_reason:
                threadStateWriteback.focus_projection_reason,
              continuity_projection_reason:
                threadStateWriteback.continuity_projection_reason
            }
          : {
              status: threadStateWriteback.status,
              repository: threadStateWriteback.repository,
              reason: threadStateWriteback.reason
            }
    };
  } catch {
    runtimeTurnResult.debug_metadata = {
      ...(runtimeTurnResult.debug_metadata ?? {}),
      humanized_delivery: humanizedDeliveryPacket
        ? {
            response_objective: humanizedDeliveryPacket.deliveryStrategy.responseObjective,
            text_follow_up_policy:
              humanizedDeliveryPacket.deliveryStrategy.textFollowUpPolicy,
            text_follow_up_depth:
              humanizedDeliveryPacket.deliveryStrategy.textFollowUpDepth,
            should_include_second_sentence:
              humanizedDeliveryPacket.deliveryStrategy.shouldIncludeSecondSentence,
            text_render_mode:
              humanizedDeliveryPacket.deliveryStrategy.textRenderMode,
            text_sentence_count:
              humanizedDeliveryPacket.deliveryStrategy.textSentenceCount,
            text_second_sentence_role:
              humanizedDeliveryPacket.deliveryStrategy.textSecondSentenceRole,
            text_rhythm_variant:
              humanizedDeliveryPacket.deliveryStrategy.textRhythmVariant,
            text_lead_rewrite_mode:
              humanizedDeliveryPacket.deliveryStrategy.textLeadRewriteMode,
            text_cleanup_policy:
              humanizedDeliveryPacket.deliveryStrategy.textCleanupPolicy,
            movement_impulse_mode:
              humanizedDeliveryPacket.deliveryStrategy.movementImpulseMode,
            movement_impulse_repeated:
              humanizedDeliveryPacket.deliveryStrategy.movementImpulseRepeated,
            text_variant_index:
              humanizedDeliveryPacket.deliveryStrategy.textVariantIndex,
            caption_policy: humanizedDeliveryPacket.deliveryStrategy.captionPolicy,
            caption_sentence_count:
              humanizedDeliveryPacket.deliveryStrategy.captionSentenceCount,
            caption_rhythm_variant:
              humanizedDeliveryPacket.deliveryStrategy.captionRhythmVariant,
            caption_scene:
              humanizedDeliveryPacket.deliveryStrategy.captionScene,
            caption_variant_index:
              humanizedDeliveryPacket.deliveryStrategy.captionVariantIndex,
            artifact_action: humanizedDeliveryPacket.deliveryStrategy.artifactAction,
            image_artifact_action:
              humanizedDeliveryPacket.deliveryStrategy.imageArtifactAction,
            audio_artifact_action:
              humanizedDeliveryPacket.deliveryStrategy.audioArtifactAction,
            negative_product_feedback_detected:
              humanizedDeliveryPacket.patternSignals.negativeProductFeedback,
            negative_product_feedback_category:
              humanizedDeliveryPacket.patternSignals.negativeProductFeedbackCategory,
          }
        : null,
      runtime_timing_ms: {
        ...(runtimeTurnResult.debug_metadata?.runtime_timing_ms &&
        typeof runtimeTurnResult.debug_metadata.runtime_timing_ms === "object" &&
        !Array.isArray(runtimeTurnResult.debug_metadata.runtime_timing_ms)
          ? (runtimeTurnResult.debug_metadata.runtime_timing_ms as Record<string, unknown>)
          : {}),
        knowledge_load: knowledgeLoadDurationMs,
        generate_text: generateTextDurationMs,
        resolve_model_profile_account_level:
          modelProfileTimingMs.account_level_lookup,
        resolve_model_profile_bound_profile:
          modelProfileTimingMs.bound_profile_lookup,
        resolve_model_profile_default_profile:
          modelProfileTimingMs.default_profile_lookup,
        resolve_model_profile_bind_default:
          modelProfileTimingMs.bind_default_profile,
        persist_assistant_message: persistAssistantDurationMs,
        update_thread: updateThreadDurationMs,
        assistant_payload_content_bytes: assistantPayloadContentBytes,
        assistant_payload_metadata_bytes: assistantPayloadMetadataBytes,
        assistant_payload_total_bytes: assistantPayloadTotalBytes,
        prompt_message_count: promptMessageCount,
        prompt_system_chars: promptSystemChars,
        prompt_user_chars: promptUserChars,
        prompt_assistant_chars: promptAssistantChars,
        prompt_total_chars: promptTotalChars,
        prompt_total_bytes: promptTotalBytes,
        prompt_approx_tokens: promptApproxTokenCount,
        run_prepared_total: elapsedMs(runPreparedStartedAt)
      }
    };
    // Keep thread state writeback as a soft-fail side effect for now.
  }

  console.info("[runtime-turn:prepared]", {
    thread_id: thread.id,
    agent_id: agent.id,
    knowledge_route: knowledgeRoute,
    knowledge_load_limit: knowledgeLoadLimit,
    knowledge_load_duration_ms: knowledgeLoadDurationMs,
    generate_text_duration_ms: generateTextDurationMs,
    resolve_model_profile_account_level_duration_ms:
      modelProfileTimingMs.account_level_lookup,
    resolve_model_profile_bound_profile_duration_ms:
      modelProfileTimingMs.bound_profile_lookup,
    resolve_model_profile_default_profile_duration_ms:
      modelProfileTimingMs.default_profile_lookup,
    resolve_model_profile_bind_default_duration_ms:
      modelProfileTimingMs.bind_default_profile,
    persist_assistant_message_duration_ms: persistAssistantDurationMs,
    update_thread_duration_ms: updateThreadDurationMs,
    prompt_message_count: promptMessageCount,
    prompt_system_chars: promptSystemChars,
    prompt_system_top_sections: promptSystemSectionLengths,
    humanized_temporal_mode: humanizedDeliveryPacket?.temporalContext.temporalMode ?? null,
    humanized_user_emotion: humanizedDeliveryPacket?.userState.emotion ?? null,
    humanized_user_intent: humanizedDeliveryPacket?.userState.intent ?? null,
    humanized_interaction_stage:
      humanizedDeliveryPacket?.userState.interactionStage ?? null,
    humanized_primary_posture:
      humanizedDeliveryPacket?.deliveryStrategy.primaryPosture ?? null,
    humanized_secondary_posture:
      humanizedDeliveryPacket?.deliveryStrategy.secondaryPosture ?? null,
    humanized_forbidden_posture:
      humanizedDeliveryPacket?.deliveryStrategy.forbiddenPosture ?? null,
    humanized_response_objective:
      humanizedDeliveryPacket?.deliveryStrategy.responseObjective ?? null,
    humanized_response_length:
      humanizedDeliveryPacket?.deliveryStrategy.responseLength ?? null,
    humanized_opening_style:
      humanizedDeliveryPacket?.deliveryStrategy.openingStyle ?? null,
    humanized_text_follow_up_policy:
      humanizedDeliveryPacket?.deliveryStrategy.textFollowUpPolicy ?? null,
    humanized_text_follow_up_depth:
      humanizedDeliveryPacket?.deliveryStrategy.textFollowUpDepth ?? null,
    humanized_should_include_second_sentence:
      humanizedDeliveryPacket?.deliveryStrategy.shouldIncludeSecondSentence ?? false,
    humanized_text_render_mode:
      humanizedDeliveryPacket?.deliveryStrategy.textRenderMode ?? null,
    humanized_text_sentence_count:
      humanizedDeliveryPacket?.deliveryStrategy.textSentenceCount ?? null,
    humanized_text_second_sentence_role:
      humanizedDeliveryPacket?.deliveryStrategy.textSecondSentenceRole ?? null,
    humanized_text_rhythm_variant:
      humanizedDeliveryPacket?.deliveryStrategy.textRhythmVariant ?? null,
    humanized_text_lead_rewrite_mode:
      humanizedDeliveryPacket?.deliveryStrategy.textLeadRewriteMode ?? null,
    humanized_text_cleanup_policy:
      humanizedDeliveryPacket?.deliveryStrategy.textCleanupPolicy ?? null,
    humanized_movement_impulse_mode:
      humanizedDeliveryPacket?.deliveryStrategy.movementImpulseMode ?? null,
    humanized_movement_impulse_repeated:
      humanizedDeliveryPacket?.deliveryStrategy.movementImpulseRepeated ?? false,
    humanized_text_variant_index:
      humanizedDeliveryPacket?.deliveryStrategy.textVariantIndex ?? null,
    humanized_caption_policy:
      humanizedDeliveryPacket?.deliveryStrategy.captionPolicy ?? null,
    humanized_caption_sentence_count:
      humanizedDeliveryPacket?.deliveryStrategy.captionSentenceCount ?? null,
    humanized_caption_rhythm_variant:
      humanizedDeliveryPacket?.deliveryStrategy.captionRhythmVariant ?? null,
    humanized_caption_scene:
      humanizedDeliveryPacket?.deliveryStrategy.captionScene ?? null,
    humanized_caption_variant_index:
      humanizedDeliveryPacket?.deliveryStrategy.captionVariantIndex ?? null,
    humanized_artifact_action:
      humanizedDeliveryPacket?.deliveryStrategy.artifactAction ?? null,
    humanized_image_artifact_action:
      humanizedDeliveryPacket?.deliveryStrategy.imageArtifactAction ?? null,
    humanized_audio_artifact_action:
      humanizedDeliveryPacket?.deliveryStrategy.audioArtifactAction ?? null,
    humanized_intent_confidence:
      humanizedDeliveryPacket?.deliveryStrategy.confidence.intent ?? null,
    humanized_emotion_confidence:
      humanizedDeliveryPacket?.deliveryStrategy.confidence.emotion ?? null,
    humanized_today_turn_count:
      humanizedDeliveryPacket?.sessionActivityContext.todayTurnCount ?? null,
    humanized_recent_hour_turn_count:
      humanizedDeliveryPacket?.sessionActivityContext.recentHourTurnCount ?? null,
    humanized_thread_depth:
      humanizedDeliveryPacket?.threadFreshness.threadDepth ?? null,
    humanized_topic_state:
      humanizedDeliveryPacket?.dialogState.topicState ?? null,
    humanized_relationship_state:
      humanizedDeliveryPacket?.dialogState.relationshipState ?? null,
    humanized_recurrent_theme:
      humanizedDeliveryPacket?.patternSignals.recurrentTheme ?? null,
    humanized_repeated_emotion:
      humanizedDeliveryPacket?.patternSignals.repeatedEmotion ?? null,
    humanized_input_conflict:
      humanizedDeliveryPacket?.patternSignals.inputConflict ?? false,
    humanized_conflict_hint:
      humanizedDeliveryPacket?.patternSignals.conflictHint ?? null,
    humanized_negative_product_feedback:
      humanizedDeliveryPacket?.patternSignals.negativeProductFeedback ?? false,
    humanized_negative_product_feedback_category:
      humanizedDeliveryPacket?.patternSignals.negativeProductFeedbackCategory ??
      null,
    prompt_user_chars: promptUserChars,
    prompt_assistant_chars: promptAssistantChars,
    prompt_total_chars: promptTotalChars,
    prompt_total_bytes: promptTotalBytes,
    prompt_approx_tokens: promptApproxTokenCount,
    assistant_payload_content_bytes: assistantPayloadContentBytes,
    assistant_payload_metadata_bytes: assistantPayloadMetadataBytes,
    assistant_payload_total_bytes: assistantPayloadTotalBytes,
    total_duration_ms: elapsedMs(runPreparedStartedAt)
  });

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
