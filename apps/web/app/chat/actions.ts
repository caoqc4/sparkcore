"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiProviderError, AiProviderFetchError } from "@/lib/ai/client";
import { classifyAssistantError } from "@/lib/chat/assistant-error";
import { extractExplicitAudioContent } from "@/lib/chat/multimodal-intent-decision";
import {
  maybeGenerateAssistantArtifacts,
  prepareExplicitArtifactContext,
} from "@/lib/chat/multimodal-artifacts";
import { classifyStoredMemorySemanticTarget } from "@/lib/chat/memory-records";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import {
  canTransitionMemoryStatus,
  getMemoryStatus,
  normalizeSingleSlotValue,
  resolveSupportedSingleSlotTarget
} from "@/lib/chat/memory-v2";
import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
import { readHumanizedArtifactAction } from "@/lib/chat/humanized-delivery-consumption";
import { getDefaultModelProfile } from "@/lib/chat/runtime-model-profile-resolution";
import {
  loadActiveSingleSlotMemoryRows,
  loadOwnedMemoryItemById
} from "@/lib/chat/memory-item-read";
import { updateMemoryItem } from "@/lib/chat/memory-item-persistence";
import { buildWebRuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  insertAndPersistRuntimeUserMessage
} from "@/lib/chat/runtime-user-message-persistence";
import { prepareWebMediaInput } from "@/lib/chat/web-media-processing";
import { runAgentTurn } from "@/lib/chat/runtime";
import {
  loadActiveModelProfileById,
  loadActivePersonaPackById,
  createOwnedAgent,
  createOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedAvailableAgents,
  loadOwnedThread,
  loadPrimaryWorkspace,
  updateOwnedAgent,
  updateOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { loadThreadMessages } from "@/lib/chat/message-read";
import { recoverRetryRuntimeTurn } from "@/lib/chat/runtime-turn-retry";
import {
  insertPendingAssistantMessage,
  markAssistantMessageFailed,
  markAssistantMessageRetried
} from "@/lib/chat/assistant-message-state-persistence";
import { bootstrapRuntimeAssistantTurn } from "@/lib/chat/runtime-turn-bootstrap";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  persistAssistantRequestPreviews,
  processAssistantRuntimePostProcessing
} from "@/lib/chat/runtime-turn-post-processing";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  resolveChatLocale
} from "@/lib/i18n/chat-ui";

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

function logWebChatActionSuccess(args: {
  event: "send_message" | "retry_assistant_reply";
  threadId: string;
  agentId: string;
  userId: string;
  workspaceId: string;
  assistantMessageId: string;
  sourceMessageId: string;
  durationMs: number;
  stageTimings: Record<string, number>;
}) {
  console.info("[web-chat:action]", {
    event: args.event,
    status: "ok",
    thread_id: args.threadId,
    agent_id: args.agentId,
    user_id: args.userId,
    workspace_id: args.workspaceId,
    assistant_message_id: args.assistantMessageId,
    source_message_id: args.sourceMessageId,
    total_duration_ms: args.durationMs,
    stage_timings_ms: args.stageTimings
  });
}

function logWebChatActionFailure(args: {
  event: "send_message" | "retry_assistant_reply";
  threadId: string;
  agentId: string;
  userId: string;
  workspaceId: string;
  assistantMessageId: string;
  sourceMessageId: string;
  durationMs: number;
  stageTimings: Record<string, number>;
  assistantFailure: ReturnType<typeof classifyAssistantError>;
  error: unknown;
}) {
  console.error("[web-chat:action]", {
    event: args.event,
    status: "failed",
    thread_id: args.threadId,
    agent_id: args.agentId,
    user_id: args.userId,
    workspace_id: args.workspaceId,
    assistant_message_id: args.assistantMessageId,
    source_message_id: args.sourceMessageId,
    total_duration_ms: args.durationMs,
    stage_timings_ms: args.stageTimings,
    error_type: args.assistantFailure.errorType,
    provider_failure_category: args.assistantFailure.providerFailureCategory,
    error_message: args.assistantFailure.message,
    provider_status: args.error instanceof AiProviderError ? args.error.status : null,
    provider_operation:
      args.error instanceof AiProviderFetchError ? args.error.operation : null,
    provider_endpoint:
      args.error instanceof AiProviderFetchError ? args.error.endpoint : null,
    cause_message:
      args.error instanceof AiProviderFetchError &&
      args.error.causeError instanceof Error
        ? args.error.causeError.message
        : null
  });
}

async function runDeferredWebArtifactGeneration(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  userMessage: string;
  assistantReply: string;
  agentName: string | null;
  personaSummary: string;
  agentMetadata: Record<string, unknown> | null;
  preparedArtifactContext: NonNullable<
    Awaited<ReturnType<typeof prepareExplicitArtifactContext>>
  >;
  deliverableImageRequested: boolean;
  deliverableAudioRequested: boolean;
}) {
  try {
    await maybeGenerateAssistantArtifacts({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      userMessage: args.userMessage,
      assistantReply: args.assistantReply,
      agentName: args.agentName,
      personaSummary: args.personaSummary,
      agentMetadata: args.agentMetadata,
      preparedContext: {
        ...args.preparedArtifactContext,
        intent: {
          ...args.preparedArtifactContext.intent,
          imageRequested: args.deliverableImageRequested,
          audioRequested: args.deliverableAudioRequested,
        },
      },
      audioTranscriptOverride:
        args.preparedArtifactContext.audioTranscriptOverride ?? null,
    });

    await updateAssistantPreviewMetadata({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          artifact_generation_completed_at: new Date().toISOString(),
          artifact_generation_status: "completed",
          explicit_media_delivery_mode: "artifact_first",
          explicit_audio_requested: args.deliverableAudioRequested,
          explicit_image_requested: args.deliverableImageRequested,
        }
      })
    });
  } catch (artifactError) {
    console.error("Deferred web artifact generation failed:", artifactError);

    await updateAssistantPreviewMetadata({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          artifact_generation_completed_at: new Date().toISOString(),
          artifact_generation_status: "failed",
          artifact_generation_error:
            artifactError instanceof Error
              ? artifactError.message
              : "web_artifact_generation_failed",
          explicit_media_delivery_mode: "artifact_first",
          explicit_audio_requested: args.deliverableAudioRequested,
          explicit_image_requested: args.deliverableImageRequested,
        }
      })
    });
  }
}

async function runDeferredWebPostProcessing(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  activeMemoryNamespace?: ActiveRuntimeMemoryNamespace | null;
  runtimeTurnResult: Parameters<typeof processAssistantRuntimePostProcessing>[0]["runtimeTurnResult"];
}) {
  try {
    await updateAssistantPreviewMetadata({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          post_processing_started_at: new Date().toISOString(),
          post_processing_status: "running"
        }
      })
    });

    await processAssistantRuntimePostProcessing({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      activeMemoryNamespace: args.activeMemoryNamespace ?? null,
      runtimeTurnResult: args.runtimeTurnResult
    });

    await updateAssistantPreviewMetadata({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          post_processing_completed_at: new Date().toISOString(),
          post_processing_status: "completed"
        }
      })
    });
  } catch (postProcessingError) {
    console.error("[web-post-processing:failed]", postProcessingError);

    await updateAssistantPreviewMetadata({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          post_processing_completed_at: new Date().toISOString(),
          post_processing_status: "failed",
          post_processing_error:
            postProcessingError instanceof Error
              ? postProcessingError.message
              : "web_post_processing_failed"
        }
      })
    });
  }
}

export type SendMessageResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RetryAssistantReplyResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RenameThreadResult =
  | { ok: true; threadId: string; title: string }
  | { ok: false; threadId: string | null; message: string };

export type CreateAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: null; message: string };

export type RenameAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: string | null; message: string };

type ChatFeedbackTone = "success" | "error";

async function getChatActionCopy() {
  const cookieStore = await cookies();
  const locale = resolveChatLocale(cookieStore.get(CHAT_UI_LANGUAGE_COOKIE)?.value);
  const isZh = locale === "zh-CN";
  return {
    choosePersonaPack: isZh ? "请先选择一个 persona pack 再创建 agent。" : "Choose a persona pack before creating an agent.",
    sessionExpired: isZh ? "登录状态已过期，请重新登录后继续。" : "Your session expired. Sign in again to continue.",
    noWorkspace: isZh ? "当前账户没有可用工作区。" : "No workspace is available for this account.",
    selectedPersonaPackUnavailable: isZh ? "所选 persona pack 当前不可用。" : "The selected persona pack is unavailable.",
    createAgentFailed: isZh ? "创建新 agent 失败。" : "Failed to create the new agent.",
    renameAgentMissing: isZh ? "无法确定要重命名的 agent。" : "The agent to rename could not be determined.",
    agentNameRequired: isZh ? "先输入 agent 名称再保存。" : "Type an agent name before saving.",
    selectedAgentUnavailable: isZh ? "所选 agent 当前不可用。" : "The selected agent is unavailable.",
    selectedModelUnavailable: isZh ? "所选模型配置当前不可用。" : "The selected model profile is unavailable.",
    renameAgentFailed: isZh ? "重命名 agent 失败。" : "Failed to rename the agent.",
    chooseAgentBeforeNewThread: isZh ? "请先选择一个 agent 再创建新线程。" : "Choose an agent before creating a new thread.",
    selectedAgentUnavailableForWorkspace: isZh ? "当前工作区里无法使用所选 agent。" : "The selected agent is unavailable for this workspace.",
    createThreadFailed: isZh ? "创建新线程失败。" : "Failed to create the new thread.",
    newChatReady: isZh ? "新聊天已就绪，随时可以发送第一条消息。" : "New chat is ready. Send the first message when you are ready.",
    chooseActiveAgentBeforeDefault: isZh ? "请先选择一个可用 agent 再设为默认。" : "Choose an active agent before setting a default.",
    activeAgentsLoadFailed: isZh ? "加载可用 agent 失败。" : "Failed to load active agents.",
    defaultAgentUnavailable: isZh ? "所选默认 agent 当前不可用。" : "The selected default agent is unavailable.",
    defaultAgentUpdated: isZh ? "工作区默认 agent 已更新。" : "Workspace default agent updated.",
    memoryMissingHide: isZh ? "无法确定要隐藏的记忆。" : "The memory to hide could not be determined.",
    memoryUnavailable: isZh ? "所选记忆不可用。" : "The selected memory is unavailable.",
    memoryCannotHide: isZh ? "当前状态下无法隐藏这条记忆。" : "This memory cannot be hidden from its current state.",
    memoryHidden: isZh ? "记忆已从召回中隐藏。" : "Memory hidden from recall.",
    memoryMissingRestore: isZh ? "无法确定要恢复的记忆。" : "The memory to restore could not be determined.",
    memoryHiddenUnavailable: isZh ? "所选隐藏记忆不可用。" : "The selected hidden memory is unavailable.",
    memoryCannotRestore: isZh ? "当前状态下无法恢复这条记忆。" : "This memory cannot be restored from its current state.",
    memoryRestored: isZh ? "记忆已恢复到召回中。" : "Memory restored to recall.",
    memoryMissingCorrect: isZh ? "无法确定要纠正的记忆。" : "The memory to correct could not be determined.",
    memoryCannotIncorrect: isZh ? "当前状态下无法将这条记忆标记为错误。" : "This memory cannot be marked incorrect from its current state.",
    memoryIncorrect: isZh ? "记忆已标记为错误，并从召回中移除。" : "Memory marked as incorrect and removed from recall.",
    sendMessageRequired: isZh ? "先输入消息再发送。" : "Type a message before sending.",
    activeThreadMissing: isZh ? "无法确定当前活跃线程。" : "The active thread could not be determined.",
    requestedThreadMissing: isZh ? "无法加载请求的线程。" : "The requested thread could not be loaded.",
    threadUnbound: isZh ? "这个线程还没有绑定 agent。" : "This thread is not bound to an agent yet.",
    boundAgentMissing: isZh ? "无法加载这个线程绑定的 agent。" : "The bound agent for this thread could not be loaded.",
    prepareMediaFailed: isZh ? "处理上传媒体失败。" : "Failed to prepare the uploaded media.",
    storeMessageFailed: isZh ? "保存用户消息失败。" : "Failed to store the user message.",
    initAssistantFailed: isZh ? "初始化助手回复失败。" : "Failed to initialize the assistant reply.",
    failedTurnMissing: isZh ? "无法定位失败的助手回合。" : "The failed assistant turn could not be located.",
    activeThreadOrAgentMissing: isZh ? "无法解析当前线程或其绑定 agent。" : "The active thread or its agent could not be resolved.",
    loadThreadMessagesFailed: isZh ? "加载线程消息失败。" : "Failed to load thread messages.",
    failedTurnUnavailable: isZh ? "所选失败回合已经不可用。" : "The selected failed assistant turn is no longer available.",
    sourceUserMessageMissing: isZh ? "无法恢复这次失败回复对应的用户消息。" : "The user message for this failed reply could not be recovered.",
    renameThreadMissing: isZh ? "无法确定要重命名的线程。" : "The thread to rename could not be determined.",
    threadTitleRequired: isZh ? "先输入标题再保存。" : "Type a title before saving.",
    renameThreadFailed: isZh ? "重命名线程失败。" : "Failed to rename the thread.",
  };
}

function normalizeThreadTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return normalized.slice(0, 80).trimEnd();
}

function normalizeAgentName(name: string, fallbackName: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  const candidate = normalized.length > 0 ? normalized : fallbackName;

  if (candidate.length <= 80) {
    return candidate;
  }

  return candidate.slice(0, 80).trimEnd();
}

function normalizeAgentIdentityText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

function normalizeAvatarEmoji(value: string) {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 8) {
    return normalized;
  }

  return normalized.slice(0, 8).trim();
}

function buildChatRedirectTarget(threadId: FormDataEntryValue | null) {
  return typeof threadId === "string" && threadId.trim().length > 0
    ? `/chat?thread=${encodeURIComponent(threadId)}`
    : "/chat";
}

function appendChatFeedback(
  target: string,
  feedback: {
    type: ChatFeedbackTone;
    message: string;
  }
) {
  const [pathname, query = ""] = target.split("?");
  const nextParams = new URLSearchParams(query);
  nextParams.delete("error");
  nextParams.set("feedback", feedback.message);
  nextParams.set("feedback_type", feedback.type);

  const nextQuery = nextParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export async function setChatUiLanguage(formData: FormData) {
  const languageValue = formData.get("language");
  const redirectPathValue = formData.get("redirect_path");
  const nextLocale = resolveChatLocale(
    typeof languageValue === "string" ? languageValue : undefined
  );
  const redirectPath =
    typeof redirectPathValue === "string" && redirectPathValue.startsWith("/")
      ? redirectPathValue
      : "/chat";

  const cookieStore = await cookies();
  cookieStore.set(CHAT_UI_LANGUAGE_COOKIE, nextLocale, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(redirectPath);
}

export async function createAgentFromPersonaPack(
  formData: FormData
): Promise<CreateAgentResult> {
  const copy = await getChatActionCopy();
  const personaPackId = formData.get("persona_pack_id");
  const requestedName = formData.get("agent_name");

  if (typeof personaPackId !== "string" || personaPackId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: copy.choosePersonaPack
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId: null,
      message: copy.sessionExpired
    };
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      agentId: null,
      message: copy.noWorkspace
    };
  }

  const { data: personaPack } = await loadActivePersonaPackById({
    supabase,
    personaPackId
  });

  if (!personaPack) {
    return {
      ok: false,
      agentId: null,
      message: copy.selectedPersonaPackUnavailable
    };
  }

  const defaultModelProfile = await getDefaultModelProfile();
  const agentName = normalizeAgentName(
    typeof requestedName === "string" ? requestedName : "",
    personaPack.name
  );

  const { data: createdAgent, error } = await createOwnedAgent({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    sourcePersonaPackId: personaPack.id,
    name: agentName,
    personaSummary: personaPack.persona_summary,
    stylePrompt: personaPack.style_prompt,
    systemPrompt: personaPack.system_prompt,
    defaultModelProfileId: defaultModelProfile.id,
    isCustom: false,
    metadata: buildAgentSourceMetadata({
      createdFromChat: true,
      sourceSlug: personaPack.slug,
      sourceDescription: personaPack.description
    }),
    select: "id, name"
  });

  if (error || !createdAgent) {
    return {
      ok: false,
      agentId: null,
      message: error?.message ?? copy.createAgentFailed
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: createdAgent.id,
    agentName: createdAgent.name
  };
}

export async function renameAgent(
  formData: FormData
): Promise<RenameAgentResult> {
  const copy = await getChatActionCopy();
  const agentId = formData.get("agent_id");
  const agentName = formData.get("agent_name");
  const modelProfileId = formData.get("model_profile_id");
  const personaSummary = formData.get("persona_summary");
  const backgroundSummary = formData.get("background_summary");
  const avatarEmoji = formData.get("avatar_emoji");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: copy.renameAgentMissing
    };
  }

  if (typeof agentName !== "string") {
    return {
      ok: false,
      agentId,
      message: copy.agentNameRequired
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId,
      message: copy.sessionExpired
    };
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      agentId,
      message: copy.noWorkspace
    };
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    return {
      ok: false,
      agentId,
      message: copy.selectedAgentUnavailable
    };
  }

  const normalizedName = normalizeAgentName(agentName, agent.name);
  const normalizedPersonaSummary =
    typeof personaSummary === "string"
      ? normalizeAgentIdentityText(personaSummary, 280)
      : agent.persona_summary;
  const normalizedBackgroundSummary =
    typeof backgroundSummary === "string"
      ? normalizeAgentIdentityText(backgroundSummary, 280)
      : typeof agent.metadata?.background_summary === "string"
        ? agent.metadata.background_summary
        : "";
  const normalizedAvatarEmoji =
    typeof avatarEmoji === "string"
      ? normalizeAvatarEmoji(avatarEmoji)
      : typeof agent.metadata?.avatar_emoji === "string"
        ? agent.metadata.avatar_emoji
        : "";
  let nextModelProfileId = agent.default_model_profile_id ?? null;

  if (typeof modelProfileId === "string" && modelProfileId.trim().length > 0) {
    const { data: modelProfile } = await loadActiveModelProfileById({
      supabase,
      modelProfileId
    });

    if (!modelProfile) {
      return {
        ok: false,
        agentId,
        message: copy.selectedModelUnavailable
      };
    }

    nextModelProfileId = modelProfile.id;
  }

  const nextMetadata = {
    ...(agent.metadata ?? {}),
    background_summary: normalizedBackgroundSummary || null,
    avatar_emoji: normalizedAvatarEmoji || null
  };

  const { data: updatedAgent, error } = await updateOwnedAgent({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id,
    patch: {
      name: normalizedName,
      persona_summary: normalizedPersonaSummary,
      default_model_profile_id: nextModelProfileId,
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    },
    select: "id, name"
  }).single();

  if (error || !updatedAgent) {
    return {
      ok: false,
      agentId,
      message: error?.message ?? copy.renameAgentFailed
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: updatedAgent.id,
    agentName: updatedAgent.name
  };
}

export async function createThread(formData: FormData) {
  const copy = await getChatActionCopy();
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: copy.chooseAgentBeforeNewThread
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: copy.selectedAgentUnavailableForWorkspace
      })
    );
  }

  const { data: createdThread, error } = await createOwnedThread({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    agentId: agent.id
  });

  if (error || !createdThread) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: error?.message ?? copy.createThreadFailed
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(`/chat?thread=${encodeURIComponent(createdThread.id)}`, {
      type: "success",
      message: copy.newChatReady
    })
  );
}

export async function setDefaultAgent(formData: FormData) {
  const copy = await getChatActionCopy();
  const agentId = formData.get("agent_id");
  const redirectThreadId = formData.get("redirect_thread_id");
  const redirectTarget = buildChatRedirectTarget(redirectThreadId);

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.chooseActiveAgentBeforeDefault
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: activeAgents, error: activeAgentsError } = await loadOwnedAvailableAgents({
    supabase,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (activeAgentsError || !activeAgents) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: activeAgentsError?.message ?? copy.activeAgentsLoadFailed
      })
    );
  }

  const activeAgentList = activeAgents as Array<{
    id: string;
    metadata: Record<string, unknown> | null;
  }>;

  if (!activeAgentList.some((agent) => agent.id === agentId)) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.defaultAgentUnavailable
      })
    );
  }

  for (const activeAgent of activeAgentList) {
    const nextMetadata = { ...(activeAgent.metadata ?? {}) } as Record<string, unknown>;

    if (activeAgent.id === agentId) {
      nextMetadata.is_default_for_workspace = true;
    } else {
      delete nextMetadata.is_default_for_workspace;
    }

    const { error } = await updateOwnedAgent({
      supabase,
      agentId: activeAgent.id,
      workspaceId: workspace.id,
      userId: user.id,
      patch: {
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      }
    });

    if (error) {
      redirect(
        appendChatFeedback(redirectTarget, {
          type: "error",
          message: error.message
        })
      );
    }
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: copy.defaultAgentUpdated
    })
  );
}

export async function hideMemory(formData: FormData) {
  const copy = await getChatActionCopy();
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryMissingHide
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryUnavailable
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "hidden")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryCannotHide
      })
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  nextMetadata.is_hidden = true;
  nextMetadata.hidden_at = new Date().toISOString();
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "hidden",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: copy.memoryHidden
    })
  );
}

export async function restoreMemory(formData: FormData) {
  const copy = await getChatActionCopy();
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryMissingRestore
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select:
      "id, workspace_id, memory_type, category, key, value, content, scope, target_agent_id, target_thread_id, metadata, status"
  });

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryHiddenUnavailable
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "active")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryCannotRestore
      })
    );
  }

  const singleSlotTarget = resolveSupportedSingleSlotTarget(memoryItem);

  if (singleSlotTarget) {
    const conflictingQuery = loadActiveSingleSlotMemoryRows({
      supabase,
      workspaceId: memoryItem.workspace_id,
      userId: user.id,
      category: singleSlotTarget.category,
      key: singleSlotTarget.key,
      scope: singleSlotTarget.scope,
      excludedMemoryItemId: memoryItem.id,
      targetAgentId: singleSlotTarget.targetAgentId,
      targetThreadId: singleSlotTarget.targetThreadId,
      select: "id, memory_type, category, scope, metadata"
    });

    const { data: conflictingActiveRows, error: conflictingRowsError } =
      await conflictingQuery;

    if (conflictingRowsError) {
      redirect(
        appendChatFeedback(redirectTarget, {
          type: "error",
          message: conflictingRowsError.message
        })
      );
    }

    for (const row of conflictingActiveRows ?? []) {
      const nextSupersededMetadata = {
        ...((row.metadata ?? {}) as Record<string, unknown>),
        superseded_at: new Date().toISOString(),
        superseded_by_restore_memory_id: memoryItem.id,
        semantic_target: classifyStoredMemorySemanticTarget(row)
      };

      const { error: supersedeError } = await updateMemoryItem({
        supabase,
        memoryItemId: row.id,
        patch: {
          status: "superseded",
          metadata: nextSupersededMetadata,
          updated_at: new Date().toISOString()
        }
      }).eq("user_id", user.id);

      if (supersedeError) {
        redirect(
          appendChatFeedback(redirectTarget, {
            type: "error",
            message: supersedeError.message
          })
        );
      }
    }
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  delete nextMetadata.is_hidden;
  delete nextMetadata.hidden_at;
  delete nextMetadata.is_incorrect;
  delete nextMetadata.incorrect_at;
  delete nextMetadata.superseded_at;
  delete nextMetadata.superseded_by_source_message_id;
  delete nextMetadata.superseded_by_restore_memory_id;
  const normalizedValueSource =
    typeof memoryItem.value === "string"
      ? memoryItem.value
      : typeof memoryItem.content === "string"
        ? memoryItem.content
        : "";
  nextMetadata.normalization = normalizeSingleSlotValue(normalizedValueSource);
  nextMetadata.restored_at = new Date().toISOString();
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "active",
      last_confirmed_at: new Date().toISOString(),
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: copy.memoryRestored
    })
  );
}

export async function markMemoryIncorrect(formData: FormData) {
  const copy = await getChatActionCopy();
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryMissingCorrect
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryUnavailable
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "incorrect")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: copy.memoryCannotIncorrect
      })
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  delete nextMetadata.is_hidden;
  delete nextMetadata.hidden_at;
  nextMetadata.is_incorrect = true;
  nextMetadata.incorrect_at = new Date().toISOString();
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "incorrect",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: copy.memoryIncorrect
    })
  );
}

export async function sendMessage(
  formData: FormData
): Promise<SendMessageResult> {
  const sendStartedAt = nowMs();
  const sendStageTimings: Record<string, number> = {};
  const copy = await getChatActionCopy();
  const content = formData.get("content");
  const threadId = formData.get("thread_id");
  const imageFileEntries = formData.getAll("image_file");
  const audioFileEntry = formData.get("audio_file");
  const imageFiles = imageFileEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );
  const audioFile =
    audioFileEntry instanceof File && audioFileEntry.size > 0 ? audioFileEntry : null;

  if (
    typeof content !== "string" ||
    (content.trim().length === 0 && imageFiles.length === 0 && !audioFile)
  ) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: copy.sendMessageRequired
    };
  }

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: copy.activeThreadMissing
    };
  }

  const resolveSessionStartedAt = nowMs();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  sendStageTimings.resolve_user_session = elapsedMs(resolveSessionStartedAt);

  if (!user) {
    return {
      ok: false,
      threadId,
      message: copy.sessionExpired
    };
  }

  const loadWorkspaceStartedAt = nowMs();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });
  sendStageTimings.load_workspace = elapsedMs(loadWorkspaceStartedAt);

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: copy.noWorkspace
    };
  }

  const loadThreadStartedAt = nowMs();
  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });
  sendStageTimings.load_thread = elapsedMs(loadThreadStartedAt);

  if (!thread) {
    return {
      ok: false,
      threadId: null,
      message: copy.requestedThreadMissing
    };
  }

  if (!thread.agent_id) {
    return {
      ok: false,
      threadId: thread.id,
      message: copy.threadUnbound
    };
  }

  const loadAgentStartedAt = nowMs();
  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId: thread.agent_id,
    workspaceId: workspace.id,
    userId: user.id
  });
  sendStageTimings.load_agent = elapsedMs(loadAgentStartedAt);

  if (!agent) {
    return {
      ok: false,
      threadId: thread.id,
      message: copy.boundAgentMissing
    };
  }

  let preparedInput: Awaited<ReturnType<typeof prepareWebMediaInput>>;

  try {
    const prepareMediaStartedAt = nowMs();
    preparedInput = await prepareWebMediaInput({
      content,
      imageFiles,
      audioFile
    });
    sendStageTimings.prepare_media = elapsedMs(prepareMediaStartedAt);
  } catch (error) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        error instanceof Error
          ? error.message
          : copy.prepareMediaFailed
    };
  }

  const fallbackDisplayContent = imageFiles.length > 0
    ? imageFiles.length === 1
      ? "Image"
      : `${imageFiles.length} images`
    : audioFile
      ? "Voice input"
      : "";
  const displayContent =
    preparedInput.displayContent.trim() || content.trim() || fallbackDisplayContent;
  const runtimeContent =
    preparedInput.runtimeContent.trim() || displayContent;

  const persistUserMessageStartedAt = nowMs();
  const {
    data: insertedMessage,
    error: insertError,
    runtimeTurnInput,
    metadataError
  } = await insertAndPersistRuntimeUserMessage({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    content: displayContent,
    buildRuntimeTurnInput: (messageId) =>
      buildWebRuntimeTurnInput({
        userId: user.id,
        agentId: thread.agent_id,
        threadId: thread.id,
        workspaceId: workspace.id,
        content: runtimeContent,
        messageId,
        baseMetadata: preparedInput.metadata,
        trigger: "chat_send"
      })
  });
  sendStageTimings.persist_user_message = elapsedMs(persistUserMessageStartedAt);

  if (insertError || !insertedMessage) {
    return {
      ok: false,
      threadId: thread.id,
      message: insertError?.message ?? copy.storeMessageFailed
    };
  }

  if (metadataError) {
    console.warn("Failed to persist runtime user message metadata:", metadataError);
  }

  let threadPatch: { updated_at: string; title?: string };
  let updatedMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  let assistantPlaceholder: { id: string };

  try {
    const bootstrapStartedAt = nowMs();
    const bootstrap = await bootstrapRuntimeAssistantTurn({
      supabase,
      thread: {
        id: thread.id,
        title: thread.title,
        agent_id: thread.agent_id,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        status: thread.status
      },
      workspaceId: workspace.id,
      userId: user.id,
      content: displayContent,
      userMessageId: insertedMessage.id
    });
    threadPatch = bootstrap.threadPatch;
    updatedMessages = bootstrap.persistedMessages;
    assistantPlaceholder = bootstrap.assistantPlaceholder;
    sendStageTimings.bootstrap = elapsedMs(bootstrapStartedAt);
  } catch (bootstrapError) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        bootstrapError instanceof Error
          ? bootstrapError.message
          : copy.initAssistantFailed
    };
  }

  let preparedArtifactContext: Awaited<
    ReturnType<typeof prepareExplicitArtifactContext>
  > | null = null;

  try {
    const prepareArtifactContextStartedAt = nowMs();
    preparedArtifactContext = await prepareExplicitArtifactContext({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      agentId: thread.agent_id,
      userMessage: runtimeContent,
      agentName: agent.name,
      personaSummary: agent.persona_summary,
      agentMetadata:
        agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
          ? (agent.metadata as Record<string, unknown>)
          : null,
      preGenerateImage: false,
    });
    sendStageTimings.prepare_artifact_context =
      elapsedMs(prepareArtifactContextStartedAt);
  } catch (artifactPreparationError) {
    console.error("Explicit artifact preparation failed:", artifactPreparationError);
  }

  if (runtimeTurnInput?.message?.metadata && preparedArtifactContext) {
    const imageArtifact = preparedArtifactContext.imageResult?.artifact ?? null;
    const imageReady = imageArtifact?.status === "ready";
    const imageFailed =
      preparedArtifactContext.intent.imageRequested && imageArtifact?.status === "failed";
    const audioRequested = preparedArtifactContext.intent.audioRequested;
    const clarifyBeforeAction =
      preparedArtifactContext.deliveryGate?.clarifyBeforeAction === true;
    const audioColonContent = audioRequested
      ? extractExplicitAudioContent(runtimeTurnInput.message.content)
      : null;
    const generationHints = [
      clarifyBeforeAction
        ? `The user's current request is not aligned yet${preparedArtifactContext.deliveryGate?.conflictHint ? ` (${preparedArtifactContext.deliveryGate.conflictHint})` : ""}. Ask one short clarifying question first. Do not continue with image delivery, advice expansion, or action-taking in this turn.`
        : "",
      preparedArtifactContext.intent.imageRequested && !clarifyBeforeAction
        ? "The user explicitly requested an image. Your text reply should stay brief and work as a lead-in to a separately generated image that may arrive shortly after this message. Do not claim the image is already attached unless you truly know that."
        : "",
      imageReady
        ? "The user explicitly requested an image. An image has already been prepared and will be delivered shortly after your text reply. Let the image lead. Keep your text to 1-3 short sentences. Open from the scene, atmosphere, or feeling of seeing it, not from agent-led delivery phrasing. For companion-style delivery, structure it like shared viewing: sentence one notices the scene, sentence two stays in quiet resonance or co-feeling, and an optional third sentence gently invites the user back into the moment. Let the cadence vary naturally by moment: sometimes one short line is enough, sometimes two beats, and only occasionally a third. Avoid turning the image copy into a polished takeaway, emotional summary, user-serving benefit statement, or image-review paragraph. Do not sound like a museum caption, travel brochure, curated mood board, or aesthetic commentary. Use one or two concrete visual details and keep the wording colloquial, as if speaking while looking at it together. Favor short spoken sentences, simple phrasing, and slight natural looseness over polished prose. Avoid stacked modifiers, balanced parallel phrases, abstract summary nouns, or neat concluding lines. Briefly acknowledge it naturally and do not say you cannot generate images."
        : "",
      imageFailed
        ? `The user explicitly requested an image, but image generation failed before your reply was written${imageArtifact?.error ? ` (${imageArtifact.error})` : ""}. Briefly acknowledge the failed attempt and avoid promising that an image is attached.`
        : "",
      audioRequested && audioColonContent
        ? `The user wants you to speak exactly this text as your audio reply: "${audioColonContent}". Your written reply should be that exact text verbatim, nothing more.`
        : audioRequested
        ? "The user explicitly requested an audio reply. Write a concise reply that works well when spoken aloud, and do not claim that you cannot send audio. Let the cadence feel like live speech rather than a neatly composed note."
        : "",
    ]
      .filter((line) => line.length > 0)
      .join("\n");

    if (generationHints.length > 0) {
      runtimeTurnInput.message.metadata = {
        ...runtimeTurnInput.message.metadata,
        assistant_generation_hint: generationHints,
      };
    }
  }

  try {
    const runAgentTurnStartedAt = nowMs();
    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput!,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: updatedMessages,
      assistantMessageId: assistantPlaceholder.id
    });
    sendStageTimings.run_agent_turn = elapsedMs(runAgentTurnStartedAt);

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime completed without an assistant message.");
    }

    const assistantReplyContent = runtimeTurnResult.assistant_message.content;

    const persistRequestPreviewsStartedAt = nowMs();
    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      activeNamespace:
        ((runtimeTurnResult.debug_metadata as {
          memory_namespace?: ActiveRuntimeMemoryNamespace | null;
        } | undefined)?.memory_namespace ?? null),
      runtimeTurnResult
    });
    sendStageTimings.persist_request_previews =
      elapsedMs(persistRequestPreviewsStartedAt);

    const activeMemoryNamespace =
      ((runtimeTurnResult.debug_metadata as {
        memory_namespace?: ActiveRuntimeMemoryNamespace | null;
      } | undefined)?.memory_namespace ?? null);

    const schedulePostProcessingStartedAt = nowMs();
    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          request_previews_persisted_at: new Date().toISOString(),
          post_processing_status: "scheduled"
        }
      })
    });
    sendStageTimings.schedule_post_processing =
      elapsedMs(schedulePostProcessingStartedAt);

    after(async () => {
      await runDeferredWebPostProcessing({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: user.id,
        agentId: thread.agent_id,
        sourceMessageId: insertedMessage.id,
        activeMemoryNamespace,
        runtimeTurnResult
      });
    });

    try {
      const scheduleArtifactsStartedAt = nowMs();
      const artifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "artifact_action"
      );
      const imageArtifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "image_artifact_action"
      );
      const audioArtifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "audio_artifact_action"
      );

      const allowImageDelivery = imageArtifactAction !== "block";
      const allowAudioDelivery = audioArtifactAction !== "block";
      const deliverableImageRequested =
        Boolean(preparedArtifactContext?.intent.imageRequested) && allowImageDelivery;
      const deliverableAudioRequested =
        Boolean(preparedArtifactContext?.intent.audioRequested) && allowAudioDelivery;
      const billingRetryEvents = preparedArtifactContext?.billingRetryEvents ?? [];

      if (
        preparedArtifactContext &&
        artifactAction !== "block" &&
        (deliverableImageRequested || deliverableAudioRequested)
      ) {
        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: user.id,
          updates: (currentMetadata) => ({
            web_delivery: {
              ...(currentMetadata?.web_delivery &&
              typeof currentMetadata.web_delivery === "object" &&
              !Array.isArray(currentMetadata.web_delivery)
                ? (currentMetadata.web_delivery as Record<string, unknown>)
                : {}),
              artifact_generation_started_at: new Date().toISOString(),
              artifact_generation_status: "running",
              explicit_media_delivery_mode: "artifact_first",
              explicit_audio_requested: deliverableAudioRequested,
              explicit_image_requested: deliverableImageRequested,
              billing_retry_events: billingRetryEvents,
            }
          })
        });

        const agentMetadata =
          agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
            ? (agent.metadata as Record<string, unknown>)
            : null;

        after(async () => {
          await runDeferredWebArtifactGeneration({
            supabase,
            assistantMessageId: assistantPlaceholder.id,
            threadId: thread.id,
            workspaceId: workspace.id,
            userId: user.id,
            agentId: thread.agent_id,
            userMessage: runtimeContent,
            assistantReply: assistantReplyContent,
            agentName: agent.name,
            personaSummary: agent.persona_summary,
            agentMetadata,
            preparedArtifactContext,
            deliverableImageRequested,
            deliverableAudioRequested,
          });
        });
      }
      sendStageTimings.schedule_artifacts = elapsedMs(scheduleArtifactsStartedAt);
    } catch (artifactError) {
      console.error("Assistant artifact scheduling failed:", artifactError);

      await updateAssistantPreviewMetadata({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: user.id,
        updates: (currentMetadata) => ({
          web_delivery: {
            ...(currentMetadata?.web_delivery &&
            typeof currentMetadata.web_delivery === "object" &&
            !Array.isArray(currentMetadata.web_delivery)
              ? (currentMetadata.web_delivery as Record<string, unknown>)
              : {}),
            artifact_generation_completed_at: new Date().toISOString(),
            artifact_generation_status: "failed",
            artifact_generation_error:
              artifactError instanceof Error
                ? artifactError.message
                : "web_artifact_generation_failed",
          }
        })
      });
      sendStageTimings.schedule_artifacts = 0;
    }

    logWebChatActionSuccess({
      event: "send_message",
      threadId: thread.id,
      agentId: thread.agent_id,
      userId: user.id,
      workspaceId: workspace.id,
      assistantMessageId: assistantPlaceholder.id,
      sourceMessageId: insertedMessage.id,
      durationMs: elapsedMs(sendStartedAt),
      stageTimings: sendStageTimings
    });
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);
    logWebChatActionFailure({
      event: "send_message",
      threadId: thread.id,
      agentId: thread.agent_id,
      userId: user.id,
      workspaceId: workspace.id,
      assistantMessageId: assistantPlaceholder.id,
      sourceMessageId: insertedMessage.id,
      durationMs: elapsedMs(sendStartedAt),
      stageTimings: sendStageTimings,
      assistantFailure,
      error
    });

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      agentId: thread.agent_id,
      userMessageId: insertedMessage.id,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

    return {
      ok: false,
      threadId: thread.id,
      message: assistantFailure.message
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id
  };
}

export async function retryAssistantReply(
  formData: FormData
): Promise<RetryAssistantReplyResult> {
  const retryStartedAt = nowMs();
  const retryStageTimings: Record<string, number> = {};
  const copy = await getChatActionCopy();
  const failedMessageId = formData.get("failed_message_id");
  const threadId = formData.get("thread_id");

  if (
    typeof failedMessageId !== "string" ||
    failedMessageId.trim().length === 0 ||
    typeof threadId !== "string" ||
    threadId.trim().length === 0
  ) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: copy.failedTurnMissing
    };
  }

  const resolveSessionStartedAt = nowMs();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  retryStageTimings.resolve_user_session = elapsedMs(resolveSessionStartedAt);

  if (!user) {
    return {
      ok: false,
      threadId,
      message: copy.sessionExpired
    };
  }

  const loadWorkspaceStartedAt = nowMs();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });
  retryStageTimings.load_workspace = elapsedMs(loadWorkspaceStartedAt);

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: copy.noWorkspace
    };
  }

  const loadThreadStartedAt = nowMs();
  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });
  retryStageTimings.load_thread = elapsedMs(loadThreadStartedAt);

  if (!thread || !thread.agent_id) {
    return {
      ok: false,
      threadId,
      message: copy.activeThreadOrAgentMissing
    };
  }

  const loadAgentStartedAt = nowMs();
  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId: thread.agent_id,
    workspaceId: workspace.id,
    userId: user.id
  });
  retryStageTimings.load_agent = elapsedMs(loadAgentStartedAt);

  if (!agent) {
    return {
      ok: false,
      threadId,
      message: copy.boundAgentMissing
    };
  }

  const loadMessagesStartedAt = nowMs();
  const { data: messages, error: messagesError } = await loadThreadMessages({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id
  });
  retryStageTimings.load_thread_messages = elapsedMs(loadMessagesStartedAt);

  if (messagesError || !messages) {
    return {
      ok: false,
      threadId,
      message: messagesError?.message ?? copy.loadThreadMessagesFailed
    };
  }

  const recoverRetryTurnStartedAt = nowMs();
  const retryTurn = recoverRetryRuntimeTurn({
    messages: messages as Array<{
      id: string;
      role: string;
      content: string;
      status: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>,
    failedMessageId
  });
  retryStageTimings.recover_retry_turn = elapsedMs(recoverRetryTurnStartedAt);

  if (retryTurn.status === "failed_message_not_found") {
    return {
      ok: false,
      threadId,
      message: copy.failedTurnUnavailable
    };
  }

  if (retryTurn.status === "source_user_message_not_found") {
    return {
      ok: false,
      threadId,
      message: copy.sourceUserMessageMissing
    };
  }

  const { failedMessage, promptMessages, latestUserMessage } = retryTurn;

  const markRetriedStartedAt = nowMs();
  await markAssistantMessageRetried({
    supabase,
    assistantMessageId: failedMessage.id,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    baseMetadata: failedMessage.metadata
  });
  retryStageTimings.mark_message_retried = elapsedMs(markRetriedStartedAt);

  try {
    const runtimeTurnInput = buildWebRuntimeTurnInput({
      userId: user.id,
      agentId: thread.agent_id,
      threadId: thread.id,
      workspaceId: workspace.id,
      content: latestUserMessage.content,
      timestamp: latestUserMessage.created_at,
      messageId: latestUserMessage.id,
      baseMetadata: latestUserMessage.metadata,
      trigger: "retry_assistant_reply",
      triggerKind: "retry"
    });

    const runAgentTurnStartedAt = nowMs();
    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: promptMessages,
      assistantMessageId: failedMessage.id
    });
    retryStageTimings.run_agent_turn = elapsedMs(runAgentTurnStartedAt);

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime retry completed without an assistant message.");
    }

    const activeMemoryNamespace =
      ((runtimeTurnResult.debug_metadata as {
        memory_namespace?: ActiveRuntimeMemoryNamespace | null;
      } | undefined)?.memory_namespace ?? null);

    const persistRequestPreviewsStartedAt = nowMs();
    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: failedMessage.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      activeNamespace: activeMemoryNamespace,
      runtimeTurnResult
    });
    retryStageTimings.persist_request_previews =
      elapsedMs(persistRequestPreviewsStartedAt);

    const schedulePostProcessingStartedAt = nowMs();
    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: failedMessage.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      updates: (currentMetadata) => ({
        web_delivery: {
          ...(currentMetadata?.web_delivery &&
          typeof currentMetadata.web_delivery === "object" &&
          !Array.isArray(currentMetadata.web_delivery)
            ? (currentMetadata.web_delivery as Record<string, unknown>)
            : {}),
          request_previews_persisted_at: new Date().toISOString(),
          post_processing_status: "scheduled"
        }
      })
    });
    retryStageTimings.schedule_post_processing =
      elapsedMs(schedulePostProcessingStartedAt);

    after(async () => {
      await runDeferredWebPostProcessing({
        supabase,
        assistantMessageId: failedMessage.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: user.id,
        agentId: thread.agent_id,
        sourceMessageId: latestUserMessage.id,
        activeMemoryNamespace,
        runtimeTurnResult
      });
    });

    logWebChatActionSuccess({
      event: "retry_assistant_reply",
      threadId: thread.id,
      agentId: thread.agent_id,
      userId: user.id,
      workspaceId: workspace.id,
      assistantMessageId: failedMessage.id,
      sourceMessageId: latestUserMessage.id,
      durationMs: elapsedMs(retryStartedAt),
      stageTimings: retryStageTimings
    });
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);
    logWebChatActionFailure({
      event: "retry_assistant_reply",
      threadId: thread.id,
      agentId: thread.agent_id,
      userId: user.id,
      workspaceId: workspace.id,
      assistantMessageId: failedMessage.id,
      sourceMessageId: latestUserMessage.id,
      durationMs: elapsedMs(retryStartedAt),
      stageTimings: retryStageTimings,
      assistantFailure,
      error
    });

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: failedMessage.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      baseMetadata: failedMessage.metadata,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

    return {
      ok: false,
      threadId,
      message: assistantFailure.message
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId
  };
}

export async function renameThread(
  formData: FormData
): Promise<RenameThreadResult> {
  const copy = await getChatActionCopy();
  const threadId = formData.get("thread_id");
  const title = formData.get("title");

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: copy.renameThreadMissing
    };
  }

  if (typeof title !== "string") {
    return {
      ok: false,
      threadId,
      message: copy.threadTitleRequired
    };
  }

  const normalizedTitle = normalizeThreadTitle(title);

  if (!normalizedTitle) {
    return {
      ok: false,
      threadId,
      message: copy.threadTitleRequired
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: copy.sessionExpired
    };
  }

  const { data: thread, error } = await updateOwnedThread({
    supabase,
    threadId,
    userId: user.id,
    patch: {
      title: normalizedTitle,
      updated_at: new Date().toISOString()
    },
    select: "id, title"
  }).single();

  if (error || !thread) {
    return {
      ok: false,
      threadId,
      message: error?.message ?? copy.renameThreadFailed
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id,
    title: thread.title
  };
}
