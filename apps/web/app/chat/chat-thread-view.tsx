"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AgentEditSheet } from "@/app/chat/agent-edit-sheet";
import {
  getAssistantGovernanceAvoidances,
  getAssistantGovernanceExpressionBrief,
  getAssistantGovernanceKnowledgeBrief,
  getAssistantGovernanceKnowledgeIntentLabel,
  getAssistantGovernanceKnowledgeRouteLabel,
  getAssistantGovernanceModalityRules,
  getAssistantGovernanceRelationalBrief,
  getAssistantGovernanceRoleIdentityArchetype,
  getAssistantGovernanceRoleMode,
  getAssistantGovernanceRoleProactivityLevel,
  getAssistantGovernanceRoleRelationshipMode,
  getAssistantGovernanceRoleTone,
  getAssistantGovernanceSceneBrief,
  getAssistantGovernanceSourceSignals,
  getAssistantGovernanceVolatileOverrideLabel,
  getAssistantGovernanceVolatileOverrideStrength,
  getAssistantHiddenMemoryExclusionCount,
  getAssistantMetadataBoolean,
  getAssistantExplanationMetadata,
  getAssistantIncorrectMemoryExclusionCount,
  getAssistantMemoryHitCount,
  getAssistantMemoryObservedSemanticLayers,
  getAssistantMemoryPrimarySemanticLayer,
  getAssistantMemoryTypesUsed,
  getAssistantMemoryUsed,
  getAssistantMetadataNumber,
  getAssistantModelProfileName,
  getAssistantModelProfileTierLabel,
  getAssistantModelProfileUsageNote,
  getAssistantNewMemoryCount,
  getAssistantThreadStateContinuityStatus,
  getAssistantThreadStateFocusMode,
  getAssistantUnderlyingModelLabel,
  getAssistantUpdatedMemoryCount,
  getAssistantMemoryWriteTypes,
  getPreferredAssistantMetadataBoolean,
  getPreferredAssistantMetadataNumber
} from "@/lib/chat/assistant-message-metadata-read";
import { AudioMessagePlayer } from "@/app/chat/audio-message-player";
import {
  hideMemory,
  markMemoryIncorrect,
  renameThread,
  retryAssistantReply,
  sendMessage,
  type RenameThreadResult,
  type RetryAssistantReplyResult,
  type SendMessageResult
} from "@/app/chat/actions";
import { getChatCopy, type ChatLocale } from "@/lib/i18n/chat-ui";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type MessageArtifact = {
  id: string;
  type: "image" | "audio";
  status: "ready" | "failed";
  source: "intent" | "ambient_context";
  modelSlug: string;
  url: string | null;
  alt?: string;
  voiceName?: string | null;
  provider?: string | null;
  transcript?: string;
  contentType?: string | null;
  error?: string | null;
  billing?: {
    mode?: string;
    debitedCredits?: number;
  };
};

type ChatThreadViewProps = {
  thread: {
    id: string;
    title: string;
    status: string;
    updated_at: string;
  };
  agentName: string | null;
  workspaceDefaultAgentName: string | null;
  currentAgentEditor: {
    id: string;
    name: string;
    persona_summary: string;
    background_summary: string | null;
    avatar_emoji: string | null;
    system_prompt_summary: string;
    default_model_profile_id: string | null;
    isWorkspaceDefaultAgent: boolean;
  } | null;
  modelProfiles: Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
    tier_label: string | null;
    usage_note: string | null;
    underlying_model: string | null;
  }>;
  memoryVisibility: {
    activeByCategory: Array<{
      key: string;
      label: string;
      count: number;
    }>;
    activeBySemanticTarget: Array<{
      key: string;
      label: string;
      count: number;
    }>;
    previewEntries: Array<{
      id: string;
      content: string;
      categoryLabel: string;
      scopeLabel: string;
      semanticTargetLabel: string;
    }>;
    threadLocalCount: number;
    hiddenCount: number;
    incorrectCount: number;
  };
  initialMessages: ChatMessage[];
  locale: ChatLocale;
  audioPlayback: {
    enabled: boolean;
    provider: string | null;
    voiceName: string | null;
  };
  showGovernanceDebug?: boolean;
};

type RuntimeSummary = {
  modelProfileName: string | null;
  modelProfileTierLabel: string | null;
  modelProfileUsageNote: string | null;
  underlyingModelLabel: string | null;
  memoryLabel: string | null;
  memoryActivityLabel: string | null;
  primaryReasonLabel: string | null;
  outcomeHints: string[];
};

function getExplanationMetadata(message: ChatMessage) {
  return getAssistantExplanationMetadata(message.metadata);
}

function getMessageArtifacts(message: ChatMessage) {
  const rawArtifacts = Array.isArray(message.metadata?.artifacts)
    ? message.metadata.artifacts
    : [];

  return rawArtifacts.filter((item): item is MessageArtifact => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Record<string, unknown>;
    return (
      (record.type === "image" || record.type === "audio") &&
      typeof record.id === "string"
    );
  });
}

function getVisibleMessageContent(message: ChatMessage) {
  const adapterMetadata =
    message.metadata?.adapter_metadata &&
    typeof message.metadata.adapter_metadata === "object" &&
    !Array.isArray(message.metadata.adapter_metadata)
      ? (message.metadata.adapter_metadata as Record<string, unknown>)
      : null;

  const displayContent =
    typeof adapterMetadata?.display_content === "string"
      ? adapterMetadata.display_content
      : typeof message.metadata?.display_content === "string"
        ? message.metadata.display_content
        : null;

  return displayContent ?? message.content;
}

function shouldHideArtifactPlaceholderText(args: {
  content: string;
  artifacts: MessageArtifact[];
}) {
  if (args.artifacts.length === 0) {
    return false;
  }

  const trimmed = args.content.trim();
  if (trimmed.length === 0) {
    return true;
  }

  return (
    trimmed === "Image" ||
    trimmed === "图片" ||
    trimmed === "Voice input" ||
    trimmed === "语音输入" ||
    trimmed === "Voice message" ||
    trimmed === "语音消息" ||
    trimmed === "Audio file" ||
    trimmed === "音频文件" ||
    /^\d+\s+张图片$/.test(trimmed) ||
    /^\d+\s+images$/i.test(trimmed)
  );
}

function shouldRenderArtifactsBeforeText(args: {
  role: "user" | "assistant";
  artifacts: MessageArtifact[];
}) {
  return (
    args.role === "assistant" &&
    args.artifacts.some((artifact) => artifact.source === "intent")
  );
}

function shouldHideAssistantTextForAudioArtifact(args: {
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  artifacts: MessageArtifact[];
}) {
  if (args.role !== "assistant") {
    return false;
  }

  const trimmedContent = args.content.trim();
  if (trimmedContent.length === 0) {
    return false;
  }

  const readyIntentAudio = args.artifacts.find(
    (artifact) =>
      artifact.type === "audio" &&
      artifact.status === "ready" &&
      artifact.source === "intent" &&
      typeof artifact.transcript === "string" &&
      artifact.transcript.trim().length > 0
  );

  if (readyIntentAudio?.transcript?.trim() === trimmedContent) {
    return true;
  }

  const imDelivery =
    args.metadata?.im_delivery &&
    typeof args.metadata.im_delivery === "object" &&
    !Array.isArray(args.metadata.im_delivery)
      ? (args.metadata.im_delivery as Record<string, unknown>)
      : null;
  const source = typeof args.metadata?.source === "string" ? args.metadata.source : null;
  const artifactGenerationStatus =
    typeof imDelivery?.artifact_generation_status === "string"
      ? imDelivery.artifact_generation_status
      : null;
  const artifactFirst =
    typeof imDelivery?.explicit_media_delivery_mode === "string" &&
    imDelivery.explicit_media_delivery_mode === "artifact_first";
  const explicitAudioRequested = imDelivery?.explicit_audio_requested === true;

  return (
    source === "im" &&
    artifactFirst &&
    explicitAudioRequested &&
    args.artifacts.every((artifact) => artifact.type !== "audio" || artifact.status !== "ready") &&
    (artifactGenerationStatus === "running" || artifactGenerationStatus === "scheduled")
  );
}

function formatMemoryTypeLabel(type: string, locale: ChatLocale) {
  const isZh = locale === "zh-CN";
  const labels: Record<string, string> = {
    profile: isZh ? "profile" : "profile",
    preference: isZh ? "preference" : "preference",
    relationship: isZh ? "relationship" : "relationship",
    goal: isZh ? "goal" : "goal"
  };

  return labels[type] ?? type;
}

function getProfileReasonLabel(
  tierLabel: string | null,
  usageNote: string | null,
  locale: ChatLocale
) {
  const normalizedTier = tierLabel?.trim().toLowerCase() ?? "";

  if (normalizedTier.includes("stable")) {
    return locale === "zh-CN"
      ? "用了默认日常配置，回答会更稳。"
      : "Used the balanced everyday profile for a steadier reply.";
  }

  if (normalizedTier.includes("memory")) {
    return locale === "zh-CN"
      ? "用了偏记忆配置，会更贴近已召回事实。"
      : "Used the memory-sensitive profile, so it leans harder on recalled facts.";
  }

  if (normalizedTier.includes("low-cost")) {
    return locale === "zh-CN"
      ? "用了低成本配置，更适合快速试跑。"
      : "Used the low-cost profile for quicker, lighter testing.";
  }

  if (usageNote && usageNote.trim().length > 0) {
    return usageNote;
  }

  return locale === "zh-CN"
    ? "这轮用了当前模型配置。"
    : "This turn used the current model profile.";
}

function getMemoryReasonLabel(params: {
  locale: ChatLocale;
  memoryTypesUsed: string[];
  memoryUsed: boolean | null;
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
}) {
  const {
    locale,
    memoryTypesUsed,
    memoryUsed,
    hiddenExclusionCount,
    incorrectExclusionCount
  } = params;

  const isZh = locale === "zh-CN";
  const typeList = memoryTypesUsed
    .map((type) => formatMemoryTypeLabel(type, locale))
    .join(" + ");

  if (memoryTypesUsed.length > 0) {
    return isZh
      ? `这轮用了 ${typeList} 记忆。`
      : `Used ${typeList} memory this turn.`;
  }

  if (memoryUsed === false && (hiddenExclusionCount > 0 || incorrectExclusionCount > 0)) {
    if (hiddenExclusionCount > 0 && incorrectExclusionCount > 0) {
      return isZh
        ? "这轮没用长期记忆：有的已隐藏，有的已标错。"
        : "No long-term memory used: some relevant memory was hidden and some was marked incorrect.";
    }

    if (hiddenExclusionCount > 0) {
      return isZh
        ? "这轮没用长期记忆：相关记忆已隐藏。"
        : "No long-term memory used: the relevant memory is hidden.";
    }

    return isZh
      ? "这轮没用长期记忆：相关记忆已标错。"
      : "No long-term memory used: the relevant memory is marked incorrect.";
  }

  if (memoryUsed === false) {
    return isZh
      ? "这轮没用到长期记忆。"
      : "No long-term memory was needed.";
  }

  return null;
}

function getRuntimeSummary(
  message: ChatMessage,
  locale: ChatLocale
): RuntimeSummary | null {
  if (message.role !== "assistant" || message.status !== "completed") {
    return null;
  }

  const isZh = locale === "zh-CN";
  const fallbackMetadata = message.metadata;

  const modelProfileName = getAssistantModelProfileName(fallbackMetadata);
  const modelProfileTierLabel =
    getAssistantModelProfileTierLabel(fallbackMetadata);
  const modelProfileUsageNote =
    getAssistantModelProfileUsageNote(fallbackMetadata);
  const underlyingModelLabel = getAssistantUnderlyingModelLabel(fallbackMetadata);
  const memoryHitCount = getAssistantMemoryHitCount(fallbackMetadata);
  const memoryUsed = getAssistantMemoryUsed(fallbackMetadata);
  const memoryPrimarySemanticLayer =
    getAssistantMemoryPrimarySemanticLayer(fallbackMetadata);
  const memoryObservedSemanticLayers =
    getAssistantMemoryObservedSemanticLayers(fallbackMetadata);
  const normalizedMemoryTypesUsed = getAssistantMemoryTypesUsed(fallbackMetadata);
  const memoryWriteTypes = getAssistantMemoryWriteTypes(fallbackMetadata);
  const hiddenExclusionCount =
    getAssistantHiddenMemoryExclusionCount(fallbackMetadata);
  const incorrectExclusionCount =
    getAssistantIncorrectMemoryExclusionCount(fallbackMetadata);
  const threadStateFocusMode =
    getAssistantThreadStateFocusMode(fallbackMetadata);
  const threadStateContinuityStatus =
    getAssistantThreadStateContinuityStatus(fallbackMetadata);
  const governanceExpressionBrief =
    getAssistantGovernanceExpressionBrief(fallbackMetadata);
  const governanceRelationalBrief =
    getAssistantGovernanceRelationalBrief(fallbackMetadata);
  const governanceSceneBrief =
    getAssistantGovernanceSceneBrief(fallbackMetadata);
  const governanceAvoidances =
    getAssistantGovernanceAvoidances(fallbackMetadata);
  const governanceModalityRules =
    getAssistantGovernanceModalityRules(fallbackMetadata);
  const newMemoryCount = getAssistantNewMemoryCount(fallbackMetadata);
  const updatedMemoryCount = getAssistantUpdatedMemoryCount(fallbackMetadata);

  const memoryLabel =
    memoryUsed === null
      ? null
      : memoryUsed
        ? typeof memoryHitCount === "number"
          ? isZh
            ? `命中 ${memoryHitCount} 条记忆`
            : `${memoryHitCount} memory hit${memoryHitCount === 1 ? "" : "s"}`
          : isZh
            ? "是"
            : "Yes"
        : isZh
          ? "否"
          : "No";
  const outcomeHints: string[] = [];
  const semanticLayerLabel =
    memoryPrimarySemanticLayer === "static_profile"
      ? isZh
        ? "主要依赖静态画像。"
        : "Primarily relied on static profile memory."
      : memoryPrimarySemanticLayer === "dynamic_profile"
        ? isZh
          ? "主要依赖动态画像。"
          : "Primarily relied on dynamic profile memory."
      : memoryPrimarySemanticLayer === "memory_record"
        ? isZh
          ? "主要依赖记忆记录。"
          : "Primarily relied on memory records."
        : memoryPrimarySemanticLayer === "thread_state"
          ? isZh
            ? "主要依赖线程状态。"
            : "Primarily relied on thread-state context."
          : null;
  const memoryActivityLabel =
    newMemoryCount > 0
      ? isZh
        ? `新增了${
            memoryWriteTypes.length > 0
              ? ` ${memoryWriteTypes
                  .map((type) => formatMemoryTypeLabel(type, locale))
                  .join(" + ")}`
              : ""
          }记忆`
        : `Saved new ${
            memoryWriteTypes.length > 0
              ? memoryWriteTypes
                  .map((type) => formatMemoryTypeLabel(type, locale))
                  .join(" + ")
              : "memory"
          }`
      : updatedMemoryCount > 0
        ? isZh
          ? `更新了${
              memoryWriteTypes.length > 0
                ? ` ${memoryWriteTypes
                    .map((type) => formatMemoryTypeLabel(type, locale))
                    .join(" + ")}`
                : ""
            }记忆`
          : `Updated ${
              memoryWriteTypes.length > 0
                ? memoryWriteTypes
                    .map((type) => formatMemoryTypeLabel(type, locale))
                    .join(" + ")
                : "memory"
            }`
        : null;

  if (hiddenExclusionCount > 0) {
    outcomeHints.push(
      isZh
        ? `${hiddenExclusionCount} 条已隐藏记忆被排除在 recall 之外。`
        : `${hiddenExclusionCount} hidden memor${hiddenExclusionCount === 1 ? "y was" : "ies were"} kept out of recall.`
    );
  }

  if (incorrectExclusionCount > 0) {
    outcomeHints.push(
      isZh
        ? `${incorrectExclusionCount} 条已标错记忆被排除在 recall 之外。`
        : `${incorrectExclusionCount} incorrect memor${incorrectExclusionCount === 1 ? "y was" : "ies were"} kept out of recall.`
    );
  }

  if (threadStateFocusMode) {
    outcomeHints.push(
      isZh
        ? `线程 focus：${threadStateFocusMode}`
        : `Thread focus: ${threadStateFocusMode}`
    );
  } else if (threadStateContinuityStatus) {
    outcomeHints.push(
      isZh
        ? `线程连续性：${threadStateContinuityStatus}`
        : `Thread continuity: ${threadStateContinuityStatus}`
    );
  }

  if (semanticLayerLabel) {
    outcomeHints.push(semanticLayerLabel);
  }

  if (governanceSceneBrief) {
    outcomeHints.push(
      isZh
        ? `治理场景：${governanceSceneBrief}`
        : `Governance scene: ${governanceSceneBrief}`
    );
  }

  if (governanceRelationalBrief) {
    outcomeHints.push(
      isZh
        ? `治理关系：${governanceRelationalBrief}`
        : `Governance relationship: ${governanceRelationalBrief}`
    );
  }

  if (governanceModalityRules.length > 0) {
    outcomeHints.push(
      isZh
        ? `治理模态：${governanceModalityRules[0]}`
        : `Governance modality: ${governanceModalityRules[0]}`
    );
  }

  if (governanceAvoidances.length > 0) {
    outcomeHints.push(
      isZh
        ? `治理避免：${governanceAvoidances[0]}`
        : `Governance avoid: ${governanceAvoidances[0]}`
    );
  }

  if (memoryObservedSemanticLayers.length > 1) {
    outcomeHints.push(
      isZh
        ? `注入层：${memoryObservedSemanticLayers.join(" + ")}`
        : `Injected layers: ${memoryObservedSemanticLayers.join(" + ")}`
    );
  }

  const memoryReasonLabel = getMemoryReasonLabel({
    locale,
    memoryTypesUsed: normalizedMemoryTypesUsed,
    memoryUsed,
    hiddenExclusionCount,
    incorrectExclusionCount
  });
  const profileReasonLabel = modelProfileName
    ? getProfileReasonLabel(modelProfileTierLabel, modelProfileUsageNote, locale)
    : null;
  const primaryReasonLabel =
    governanceExpressionBrief ?? memoryReasonLabel ?? profileReasonLabel;

  if (
    !modelProfileName &&
    !underlyingModelLabel &&
    !memoryLabel &&
    !memoryActivityLabel &&
    !primaryReasonLabel &&
    outcomeHints.length === 0
  ) {
    return null;
  }

  return {
    modelProfileName,
    modelProfileTierLabel,
    modelProfileUsageNote,
    underlyingModelLabel,
    memoryLabel,
    memoryActivityLabel,
    primaryReasonLabel,
    outcomeHints
  };
}

function getRuntimeSummaryHeadline(
  summary: RuntimeSummary,
  locale: ChatLocale
) {
  const copy = getChatCopy(locale);
  const hasPrimaryReason = Boolean(summary.primaryReasonLabel);
  const hasMemoryLabel = Boolean(summary.memoryLabel);
  const hasProfileLabel = Boolean(summary.modelProfileName);

  if (hasMemoryLabel && hasProfileLabel) {
    return copy.locale === "zh-CN"
      ? "这轮主要看记忆和当前配置。"
      : "Mainly shaped by memory and the current profile.";
  }

  if (hasMemoryLabel) {
    return copy.locale === "zh-CN"
      ? "这轮主要看记忆。"
      : "Mainly shaped by memory.";
  }

  if (hasProfileLabel || hasPrimaryReason) {
    return copy.locale === "zh-CN"
      ? "这轮主要看当前配置。"
      : "Mainly shaped by the current profile.";
  }

  return copy.locale === "zh-CN"
    ? "这条摘要只解释这轮。"
    : "This summary only explains this turn.";
}

function getGovernanceDebugPayload(message: ChatMessage) {
  const expressionBrief = getAssistantGovernanceExpressionBrief(message.metadata);
  const relationalBrief = getAssistantGovernanceRelationalBrief(message.metadata);
  const sceneBrief = getAssistantGovernanceSceneBrief(message.metadata);
  const knowledgeBrief = getAssistantGovernanceKnowledgeBrief(message.metadata);
  const roleMode = getAssistantGovernanceRoleMode(message.metadata);
  const roleIdentityArchetype =
    getAssistantGovernanceRoleIdentityArchetype(message.metadata);
  const roleTone = getAssistantGovernanceRoleTone(message.metadata);
  const roleProactivityLevel =
    getAssistantGovernanceRoleProactivityLevel(message.metadata);
  const roleRelationshipMode =
    getAssistantGovernanceRoleRelationshipMode(message.metadata);
  const volatileOverrideLabel =
    getAssistantGovernanceVolatileOverrideLabel(message.metadata);
  const volatileOverrideStrength =
    getAssistantGovernanceVolatileOverrideStrength(message.metadata);
  const knowledgeRouteLabel =
    getAssistantGovernanceKnowledgeRouteLabel(message.metadata);
  const knowledgeIntentLabel =
    getAssistantGovernanceKnowledgeIntentLabel(message.metadata);
  const avoidances = getAssistantGovernanceAvoidances(message.metadata);
  const modalityRules = getAssistantGovernanceModalityRules(message.metadata);
  const sourceSignals = getAssistantGovernanceSourceSignals(message.metadata);

  if (
    !expressionBrief &&
    !relationalBrief &&
    !sceneBrief &&
    !knowledgeBrief &&
    !roleMode &&
    !roleIdentityArchetype &&
    !roleTone &&
    !roleProactivityLevel &&
    !roleRelationshipMode &&
    !volatileOverrideLabel &&
    !volatileOverrideStrength &&
    !knowledgeRouteLabel &&
    !knowledgeIntentLabel &&
    avoidances.length === 0 &&
    modalityRules.length === 0 &&
    sourceSignals.length === 0
  ) {
    return null;
  }

  return {
    expressionBrief,
    relationalBrief,
    sceneBrief,
    knowledgeBrief,
    roleMode,
    roleIdentityArchetype,
    roleTone,
    roleProactivityLevel,
    roleRelationshipMode,
    volatileOverrideLabel,
    volatileOverrideStrength,
    knowledgeRouteLabel,
    knowledgeIntentLabel,
    avoidances,
    modalityRules,
    sourceSignals
  };
}

export function ChatThreadView({
  thread,
  agentName,
  workspaceDefaultAgentName,
  currentAgentEditor,
  modelProfiles,
  memoryVisibility,
  initialMessages,
  locale,
  audioPlayback,
  showGovernanceDebug = false
}: ChatThreadViewProps) {
  const router = useRouter();
  const copy = getChatCopy(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [optimisticMessages, setOptimisticMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [threadTitle, setThreadTitle] = useState(thread.title);
  const [draftTitle, setDraftTitle] = useState(thread.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSending, startSendTransition] = useTransition();
  const [isRetryPending, startRetryTransition] = useTransition();
  const [isRenamePending, startRenameTransition] = useTransition();
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticMessages(initialMessages);
    setFeedback(null);
    setThreadTitle(thread.title);
    setDraftTitle(thread.title);
    setIsRenaming(false);
  }, [initialMessages, thread.id, thread.title]);

  useEffect(() => {
    return () => {
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
      }
    };
  }, []);

  const isComposerDisabled = isSending || isRetryPending || isRenamePending;
  const isFirstTurn = optimisticMessages.length === 0;
  const threadAgentSummary = agentName ?? copy.sidebar.unassignedAgent;
  const defaultAgentCopy = workspaceDefaultAgentName
    ? workspaceDefaultAgentName === agentName
      ? copy.thread.defaultSameAgent
      : `${copy.thread.defaultDifferentAgentPrefix}${workspaceDefaultAgentName}${copy.thread.defaultDifferentAgentSuffix}`
    : copy.thread.noWorkspaceDefault;
  const firstTurnExamples = copy.thread.firstTurnExamples;

  const visibleMessages = useMemo(() => {
    if (!isSending && !retryingMessageId) {
      return optimisticMessages;
    }

    if (retryingMessageId) {
      return optimisticMessages.map((message) =>
        message.id === retryingMessageId
          ? {
              ...message,
              status: "pending",
              content: ""
            }
          : message
      );
    }

    return [
      ...optimisticMessages,
      {
        id: `assistant-thinking-${thread.id}`,
        role: "assistant" as const,
        content: "",
        status: "pending",
        metadata: {},
        created_at: new Date().toISOString()
      }
    ];
  }, [isSending, optimisticMessages, retryingMessageId, thread.id]);

  async function handleSubmit(formData: FormData) {
    if (isComposerDisabled) {
      return;
    }

    const content = formData.get("content");

    if (typeof content !== "string") {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFeedback({
        tone: "error",
        message: copy.thread.messageRequired
      });
      return;
    }

    setFeedback(null);
    const pendingMessageId = `pending-user-${Date.now()}`;

    setOptimisticMessages((current) => [
      ...current,
      {
        id: pendingMessageId,
        role: "user",
        content: trimmedContent,
        status: "completed",
        metadata: {},
        created_at: new Date().toISOString()
      }
    ]);

    formRef.current?.reset();

    startSendTransition(async () => {
      try {
        const result: SendMessageResult = await sendMessage(formData);

        if (!result.ok) {
          setOptimisticMessages((current) =>
            current.filter((message) => message.id !== pendingMessageId)
          );
          setFeedback({
            tone: "error",
            message: result.message
          });
          return;
        }

        router.refresh();
      } catch (error) {
        setOptimisticMessages((current) =>
          current.filter((message) => message.id !== pendingMessageId)
        );
        setFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : copy.thread.failureGeneric
        });
      }
    });
  }

  function handleRetry(failedMessageId: string) {
    if (isComposerDisabled || retryingMessageId) {
      return;
    }

    setFeedback(null);
    setRetryingMessageId(failedMessageId);

    startRetryTransition(async () => {
      const retryFormData = new FormData();
      retryFormData.set("thread_id", thread.id);
      retryFormData.set("failed_message_id", failedMessageId);

      const result: RetryAssistantReplyResult = await retryAssistantReply(retryFormData);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message
        });
        setRetryingMessageId(null);
        return;
      }

      setRetryingMessageId(null);
      router.refresh();
    });
  }

  function handleRenameCancel() {
    setDraftTitle(threadTitle);
    setIsRenaming(false);
    setFeedback(null);
  }

  function useFirstTurnPrompt(prompt: string) {
    if (isComposerDisabled) {
      return;
    }

    messageInputRef.current?.focus();
    messageInputRef.current?.setRangeText(
      prompt,
      0,
      messageInputRef.current.value.length,
      "end"
    );
  }

  async function handlePlayMessage(messageId: string) {
    if (!audioPlayback.enabled) {
      return;
    }

    setPlaybackError(null);

    if (playingMessageId === messageId && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);

    try {
      const response = await fetch("/api/audio/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          threadId: thread.id,
          messageId
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? copy.thread.playbackFailed);
      }

      const blob = await response.blob();
      if (playbackUrlRef.current) {
        URL.revokeObjectURL(playbackUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(blob);
      playbackUrlRef.current = objectUrl;

      if (!playbackAudioRef.current) {
        playbackAudioRef.current = new Audio();
        playbackAudioRef.current.addEventListener("ended", () => {
          setPlayingMessageId(null);
        });
      }

      playbackAudioRef.current.src = objectUrl;
      await playbackAudioRef.current.play();
    } catch (error) {
      setPlayingMessageId(null);
      setPlaybackError(error instanceof Error ? error.message : copy.thread.playbackFailed);
    }
  }

  async function handleRename(formData: FormData) {
    if (isComposerDisabled) {
      return;
    }

    startRenameTransition(async () => {
      const result: RenameThreadResult = await renameThread(formData);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: copy.thread.saveThreadNameSuccess
      });
      setThreadTitle(result.title);
      setDraftTitle(result.title);
      setIsRenaming(false);
      router.refresh();
    });
  }

  return (
    <>
      {feedback ? (
        <div className={`notice notice-${feedback.tone}`}>{feedback.message}</div>
      ) : null}

      <div className="thread-detail-header">
        <div className="thread-detail-copy">
          {isRenaming ? (
            <form action={handleRename} className="thread-rename-form">
              <input name="thread_id" type="hidden" value={thread.id} />
              <label className="sr-only" htmlFor={`thread-title-${thread.id}`}>
                Rename thread
              </label>
              <input
                className="input thread-rename-input"
                id={`thread-title-${thread.id}`}
                maxLength={80}
                name="title"
                onChange={(event) => setDraftTitle(event.target.value)}
                required
                value={draftTitle}
              />
              <div className="thread-rename-actions">
                <button className="button" disabled={isRenamePending} type="submit">
                  {isRenamePending ? copy.common.saving : copy.common.saveChanges}
                </button>
                <button
                  className="button button-secondary"
                  disabled={isRenamePending}
                  onClick={handleRenameCancel}
                  type="button"
                >
                  {copy.common.cancel}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="thread-title-row">
                <h2 className="thread-detail-title">{threadTitle}</h2>
                <button
                  className="button button-secondary thread-rename-trigger"
                  disabled={isComposerDisabled}
                  onClick={() => {
                    setDraftTitle(threadTitle);
                    setIsRenaming(true);
                  }}
                  type="button"
                >
                  {copy.thread.rename}
                </button>
              </div>
              <div className="thread-detail-meta">
                <p className="helper-copy">
                  {copy.thread.threadAgentPrefix}
                  {threadAgentSummary} · Updated{" "}
                  {new Date(thread.updated_at).toLocaleString()}
                </p>
                <p className="helper-copy">
                  {copy.thread.currentThreadViewFirst}
                </p>
                <p className="helper-copy">
                  {copy.thread.memoryHint}
                </p>
                <p className="helper-copy">{defaultAgentCopy}</p>
                <p className="section-hint">
                  {copy.thread.runtimeHint}
                </p>
              </div>

              <details className="thread-support-shell">
                <summary className="thread-support-summary">
                  <span className="thread-support-summary-title">
                    {copy.thread.supportSummaryTitle}
                  </span>
                  <span className="thread-support-summary-hint">
                    {copy.thread.supportSummaryHint}
                  </span>
                </summary>

                <div className="thread-support-body">
                  <section className="thread-continuity-strip">
                    <div className="thread-continuity-header">
                      <h3>{copy.thread.continuityTitle}</h3>
                      <p className="helper-copy">{copy.thread.continuityDescription}</p>
                    </div>

                    <div className="thread-continuity-grid">
                      <article className="thread-continuity-card">
                        <p className="thread-continuity-label">
                          {copy.thread.continuityRoleLabel}
                        </p>
                        <h4>{threadAgentSummary}</h4>
                        <p className="helper-copy">{defaultAgentCopy}</p>
                      </article>

                      <article className="thread-continuity-card">
                        <p className="thread-continuity-label">
                          {copy.thread.continuityThreadLabel}
                        </p>
                        <h4>{threadTitle}</h4>
                        <p className="helper-copy">{copy.thread.currentThreadViewFirst}</p>
                      </article>

                      <article className="thread-continuity-card">
                        <p className="thread-continuity-label">
                          {copy.thread.continuityMemoryLabel}
                        </p>
                        <h4>{copy.thread.memoryContext}</h4>
                        <p className="helper-copy">{copy.thread.memoryHint}</p>
                      </article>
                    </div>
                  </section>

                  <section className="thread-repair-strip">
                    <div className="thread-repair-header">
                      <h3>{copy.thread.repairTitle}</h3>
                      <p className="helper-copy">{copy.thread.repairDescription}</p>
                    </div>

                    <div className="thread-repair-actions">
                      {currentAgentEditor ? (
                        <AgentEditSheet
                          agent={{
                            id: currentAgentEditor.id,
                            name: currentAgentEditor.name,
                            persona_summary: currentAgentEditor.persona_summary,
                            background_summary:
                              currentAgentEditor.background_summary,
                            avatar_emoji: currentAgentEditor.avatar_emoji,
                            system_prompt_summary:
                              currentAgentEditor.system_prompt_summary
                          }}
                          isCurrentThreadAgent
                          isWorkspaceDefaultAgent={
                            currentAgentEditor.isWorkspaceDefaultAgent
                          }
                          locale={locale}
                          triggerLabel={copy.thread.repairRoleAction}
                        />
                      ) : (
                        <a className="button button-secondary" href="#agent-rail">
                          {copy.thread.repairRoleAction}
                        </a>
                      )}
                      <a className="button button-secondary" href="#memory-rail">
                        {copy.thread.repairMemoryAction}
                      </a>
                    </div>

                    <p className="section-hint">{copy.thread.repairHint}</p>
                  </section>

                  <section className="thread-memory-visibility">
                    <div className="thread-memory-visibility-header">
                      <h3>{copy.thread.memoryVisibilityTitle}</h3>
                      <p className="helper-copy">
                        {copy.thread.memoryVisibilityDescription}
                      </p>
                    </div>

                    {memoryVisibility.activeByCategory.length === 0 &&
                    memoryVisibility.activeBySemanticTarget.length === 0 &&
                    memoryVisibility.threadLocalCount === 0 ? (
                      <p className="helper-copy">{copy.thread.memoryVisibilityEmpty}</p>
                    ) : (
                      <div className="thread-memory-visibility-grid">
                        {memoryVisibility.activeByCategory.map((item) => (
                          <article className="thread-memory-pill" key={item.key}>
                            <p className="thread-memory-pill-label">{item.label}</p>
                            <h4>{item.count}</h4>
                            <p className="helper-copy">
                              {copy.thread.memoryVisibilityActiveSuffix}
                            </p>
                          </article>
                        ))}

                        {memoryVisibility.activeBySemanticTarget.map((item) => (
                          <article
                            className="thread-memory-pill"
                            key={`semantic-${item.key}`}
                          >
                            <p className="thread-memory-pill-label">{item.label}</p>
                            <h4>{item.count}</h4>
                            <p className="helper-copy">
                              {copy.thread.memoryVisibilityActiveSuffix}
                            </p>
                          </article>
                        ))}

                        {memoryVisibility.threadLocalCount > 0 ? (
                          <article className="thread-memory-pill" key="thread-local">
                            <p className="thread-memory-pill-label">
                              {copy.thread.memoryVisibilityThreadNotes}
                            </p>
                            <h4>{memoryVisibility.threadLocalCount}</h4>
                            <p className="helper-copy">
                              {copy.thread.memoryVisibilityActiveSuffix}
                            </p>
                          </article>
                        ) : null}
                      </div>
                    )}

                    {(memoryVisibility.hiddenCount > 0 ||
                      memoryVisibility.incorrectCount > 0) ? (
                      <p className="section-hint">
                        {copy.thread.memoryVisibilityHiddenHintPrefix}
                        {memoryVisibility.hiddenCount}
                        {copy.thread.memoryVisibilityHiddenHintMiddle}
                        {memoryVisibility.incorrectCount}
                        {copy.thread.memoryVisibilityHiddenHintSuffix}
                      </p>
                    ) : null}

                    {memoryVisibility.previewEntries.length > 0 ? (
                      <div className="thread-memory-preview-list">
                        {memoryVisibility.previewEntries.map((memory) => (
                          <article className="thread-memory-preview-card" key={memory.id}>
                            <div className="thread-memory-preview-badges">
                              <span className="thread-badge">{memory.categoryLabel}</span>
                              <span className="thread-badge thread-badge-muted">
                                {memory.scopeLabel}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {memory.semanticTargetLabel}
                              </span>
                            </div>
                            <p className="thread-memory-preview-content">
                              {memory.content}
                            </p>
                            <div className="thread-memory-preview-actions">
                              <form action={hideMemory}>
                                <input
                                  name="memory_id"
                                  type="hidden"
                                  value={memory.id}
                                />
                                <input
                                  name="redirect_thread_id"
                                  type="hidden"
                                  value={thread.id}
                                />
                                <button
                                  className="button button-secondary"
                                  type="submit"
                                >
                                  {copy.memory.hide}
                                </button>
                              </form>
                              <form action={markMemoryIncorrect}>
                                <input
                                  name="memory_id"
                                  type="hidden"
                                  value={memory.id}
                                />
                                <input
                                  name="redirect_thread_id"
                                  type="hidden"
                                  value={thread.id}
                                />
                                <button
                                  className="button button-secondary"
                                  type="submit"
                                >
                                  {copy.memory.incorrect}
                                </button>
                              </form>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    <div className="thread-repair-actions">
                      <a className="button button-secondary" href="#memory-rail">
                        {copy.thread.memoryVisibilityAction}
                      </a>
                    </div>
                  </section>
                </div>
              </details>
            </>
          )}
        </div>

        <div className="thread-detail-badges">
          <span className="thread-badge">
            {thread.status === "active" ? copy.thread.statusActive : thread.status}
          </span>
          <span className="thread-badge">
            {optimisticMessages.length} {copy.thread.messagesSuffix}
          </span>
        </div>
      </div>

      <div className="message-list" data-thread-id={thread.id}>
        {visibleMessages.length === 0 ? (
          <div className="message message-assistant">
            <p className="message-role">{copy.thread.assistantLabel}</p>
            <div className="first-turn-state">
              <p className="message-content">{copy.thread.firstTurnLead}</p>
              <p className="helper-copy">{copy.thread.firstTurnHelper}</p>
              <div className="first-turn-examples" aria-label="First-turn examples">
                {firstTurnExamples.map((example) => (
                  <button
                    className="first-turn-chip"
                    disabled={isComposerDisabled}
                    key={example}
                    onClick={() => useFirstTurnPrompt(example)}
                    type="button"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          visibleMessages.map((message) => {
            const isThinking =
              ((isSending && message.id === `assistant-thinking-${thread.id}`) ||
                retryingMessageId === message.id ||
                message.status === "pending") &&
              message.role === "assistant";
            const isFailed =
              !isThinking &&
              message.role === "assistant" &&
              message.status === "failed";
            const errorType =
              typeof message.metadata?.error_type === "string"
                ? message.metadata.error_type
                : "generation_failed";
            const failedReason =
              typeof message.metadata?.error_message === "string"
                ? message.metadata.error_message
                : locale === "zh-CN"
                  ? "这条 assistant 回复失败了，你可以在准备好后重试本轮。"
                  : "Assistant reply failed. Retry this turn when ready.";
            const failureLabel =
              errorType === "timeout"
                ? copy.thread.failureTimedOut
                : errorType === "provider_error"
                  ? copy.thread.failureProvider
                  : copy.thread.failureGeneric;
            const failureHint =
              errorType === "timeout"
                ? locale === "zh-CN"
                  ? "这条回复耗时过长。直接重试本轮即可，不需要重新发送用户消息。"
                  : "The reply took too long. Retry this turn without resending the user message."
                : errorType === "provider_error"
                  ? locale === "zh-CN"
                    ? "模型提供方返回了错误。等 provider 恢复后再重试。"
                    : "The model provider returned an error. Retry when the provider is available again."
                  : locale === "zh-CN"
                    ? "生成过程被中断了。准备好后可以直接重试本轮。"
                    : "Something interrupted generation. Retry this turn when ready.";
            const runtimeSummary = getRuntimeSummary(message, locale);
            const governanceDebug =
              showGovernanceDebug && message.role === "assistant"
                ? getGovernanceDebugPayload(message)
                : null;
            const artifacts = getMessageArtifacts(message);

            return (
              <article
                className={`message ${
                  message.role === "user" ? "message-user" : "message-assistant"
                } ${isThinking ? "message-thinking" : ""} ${
                  isFailed ? "message-failed" : ""
                }`}
                key={message.id}
              >
                <p className="message-role">
                  {isThinking
                    ? copy.thread.assistantThinking
                    : message.role === "assistant"
                      ? copy.thread.assistantLabel
                      : message.role}
                </p>
                {isThinking ? (
                  <div className="thinking-dots" aria-label="Assistant is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : isFailed ? (
                  <div className="message-failure">
                    <div className="message-failure-header">
                      <span className={`thread-badge failure-badge failure-${errorType}`}>
                        {failureLabel}
                      </span>
                      <p className="message-failure-hint">{failureHint}</p>
                    </div>
                    <p className="message-content">{failedReason}</p>
                    <button
                      className="button button-secondary retry-button"
                      disabled={isComposerDisabled || Boolean(retryingMessageId)}
                      onClick={() => handleRetry(message.id)}
                      type="button"
                    >
                      {retryingMessageId === message.id
                        ? copy.thread.retrying
                        : copy.thread.retryReply}
                    </button>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const visibleContent = getVisibleMessageContent(message);
                      const artifactFirst = shouldRenderArtifactsBeforeText({
                        role: "assistant",
                        artifacts
                      });
                      const hideText =
                        shouldHideAssistantTextForAudioArtifact({
                          role: "assistant",
                          content: visibleContent,
                          metadata: message.metadata,
                          artifacts
                        }) ||
                        shouldHideArtifactPlaceholderText({
                          content: visibleContent,
                          artifacts
                        });
                      const textNode =
                        visibleContent.trim().length > 0 && !hideText ? (
                          <p className="message-content">{visibleContent}</p>
                        ) : null;
                      const artifactNode = artifacts.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            marginTop: 12,
                          }}
                        >
                          {artifacts.map((artifact, artifactIndex) =>
                            artifact.type === "image" &&
                            artifact.status === "ready" &&
                            artifact.url ? (
                              <figure
                                key={`${message.id}:${artifact.id}:${artifactIndex}`}
                                style={{
                                  margin: 0,
                                  border: "1px solid rgba(148, 163, 184, 0.28)",
                                  borderRadius: 16,
                                  overflow: "hidden",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                <img
                                  alt={artifact.alt}
                                  src={artifact.url}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    maxWidth: 520,
                                    height: "auto",
                                  }}
                                />
                                <figcaption
                                  style={{
                                    padding: "10px 12px",
                                    fontSize: 12,
                                    opacity: 0.8,
                                  }}
                                >
                                  {artifact.modelSlug}
                                  {artifact.billing?.debitedCredits
                                    ? ` · ${artifact.billing.debitedCredits} credits`
                                    : ""}
                                </figcaption>
                              </figure>
                            ) : artifact.type === "audio" &&
                              artifact.status === "ready" &&
                              artifact.url ? (
                              <AudioMessagePlayer
                                key={`${message.id}:${artifact.id}:audio:${artifactIndex}`}
                                url={artifact.url}
                                provider={artifact.provider}
                                voiceName={artifact.voiceName ?? artifact.modelSlug}
                                transcript={
                                  artifact.transcript?.trim() === visibleContent.trim()
                                    ? undefined
                                    : artifact.transcript
                                }
                                credits={artifact.billing?.debitedCredits ?? null}
                              />
                            ) : (
                              <div
                                key={`${message.id}:${artifact.id}:failed:${artifactIndex}`}
                                style={{
                                  border: "1px solid rgba(239, 68, 68, 0.28)",
                                  borderRadius: 16,
                                  padding: 12,
                                }}
                              >
                                <strong style={{ display: "block", marginBottom: 6 }}>
                                  {artifact.type === "audio"
                                    ? locale === "zh-CN"
                                      ? "语音生成失败"
                                      : "Audio generation failed"
                                    : locale === "zh-CN"
                                      ? "图片生成失败"
                                      : "Image generation failed"}
                                </strong>
                                <span style={{ fontSize: 13, opacity: 0.82 }}>
                                  {artifact.error ??
                                    (artifact.type === "audio"
                                      ? locale === "zh-CN"
                                        ? "这次语音没有成功生成。"
                                        : "The audio could not be generated this time."
                                      : locale === "zh-CN"
                                        ? "这次图片没有成功生成。"
                                        : "The image could not be generated this time.")}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : null;

                      return (
                        <>
                          {artifactFirst ? artifactNode : textNode}
                          {artifactFirst ? textNode : artifactNode}
                        </>
                      );
                    })()}
                    {runtimeSummary ? (
                      <details className="runtime-summary">
                        <summary className="runtime-summary-toggle">
                          {copy.thread.howGenerated}
                        </summary>
                        <p className="runtime-summary-headline">
                          {getRuntimeSummaryHeadline(runtimeSummary, locale)}
                        </p>
                        {runtimeSummary.primaryReasonLabel ? (
                          <p className="runtime-summary-reason">
                            {runtimeSummary.primaryReasonLabel}
                          </p>
                        ) : null}
                        {runtimeSummary.outcomeHints.length > 0 ? (
                          <ul className="runtime-summary-outcomes">
                            {runtimeSummary.outcomeHints.map((hint) => (
                              <li key={hint}>{hint}</li>
                            ))}
                          </ul>
                        ) : null}
                        <dl className="runtime-summary-grid">
                          {runtimeSummary.modelProfileName ? (
                            <>
                              <dt>{copy.thread.modelProfileUsed}</dt>
                              <dd>
                                {runtimeSummary.modelProfileName}
                                {runtimeSummary.modelProfileTierLabel
                                  ? ` · ${runtimeSummary.modelProfileTierLabel}`
                                  : ""}
                              </dd>
                            </>
                          ) : null}
                          {runtimeSummary.underlyingModelLabel ? (
                            <>
                              <dt>{copy.thread.underlyingModelUsed}</dt>
                              <dd>{runtimeSummary.underlyingModelLabel}</dd>
                            </>
                          ) : null}
                          {runtimeSummary.memoryLabel ? (
                            <>
                              <dt>{copy.thread.memoryContext}</dt>
                              <dd>{runtimeSummary.memoryLabel}</dd>
                            </>
                          ) : null}
                          {runtimeSummary.memoryActivityLabel ? (
                            <>
                              <dt>{copy.thread.memoryActivity}</dt>
                              <dd>{runtimeSummary.memoryActivityLabel}</dd>
                            </>
                          ) : null}
                        </dl>
                      </details>
                    ) : null}
                    {governanceDebug ? (
                      <div
                        style={{
                          marginTop: 12,
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          borderRadius: 14,
                          background: "rgba(15, 23, 42, 0.04)",
                          padding: "10px 12px",
                          display: "grid",
                          gap: 8
                        }}
                      >
                        <details>
                          <summary
                            style={{
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: "rgba(71, 85, 105, 0.95)"
                            }}
                          >
                            Governance Debug
                          </summary>
                          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                            {governanceDebug.roleMode ||
                            governanceDebug.roleIdentityArchetype ||
                            governanceDebug.roleTone ||
                            governanceDebug.roleProactivityLevel ||
                            governanceDebug.roleRelationshipMode ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Role traits</strong>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    fontSize: 12
                                  }}
                                >
                                  {governanceDebug.roleMode ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      mode: {governanceDebug.roleMode}
                                    </span>
                                  ) : null}
                                  {governanceDebug.roleIdentityArchetype ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      archetype: {governanceDebug.roleIdentityArchetype}
                                    </span>
                                  ) : null}
                                  {governanceDebug.roleTone ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      tone: {governanceDebug.roleTone}
                                    </span>
                                  ) : null}
                                  {governanceDebug.roleProactivityLevel ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      proactive: {governanceDebug.roleProactivityLevel}
                                    </span>
                                  ) : null}
                                  {governanceDebug.roleRelationshipMode ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      relationship: {governanceDebug.roleRelationshipMode}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            {governanceDebug.volatileOverrideLabel ||
                            governanceDebug.volatileOverrideStrength ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Volatile override</strong>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    fontSize: 12
                                  }}
                                >
                                  {governanceDebug.volatileOverrideLabel ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(251, 191, 36, 0.14)",
                                        border: "1px solid rgba(251, 191, 36, 0.35)"
                                      }}
                                    >
                                      label: {governanceDebug.volatileOverrideLabel}
                                    </span>
                                  ) : null}
                                  {governanceDebug.volatileOverrideStrength ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(251, 191, 36, 0.14)",
                                        border: "1px solid rgba(251, 191, 36, 0.35)"
                                      }}
                                    >
                                      strength: {governanceDebug.volatileOverrideStrength}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            {governanceDebug.knowledgeRouteLabel ||
                            governanceDebug.knowledgeIntentLabel ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Knowledge route</strong>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    fontSize: 12
                                  }}
                                >
                                  {governanceDebug.knowledgeRouteLabel ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(56, 189, 248, 0.12)",
                                        border: "1px solid rgba(56, 189, 248, 0.32)"
                                      }}
                                    >
                                      route: {governanceDebug.knowledgeRouteLabel}
                                    </span>
                                  ) : null}
                                  {governanceDebug.knowledgeIntentLabel ? (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(56, 189, 248, 0.12)",
                                        border: "1px solid rgba(56, 189, 248, 0.32)"
                                      }}
                                    >
                                      intent: {governanceDebug.knowledgeIntentLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            {governanceDebug.expressionBrief ? (
                              <p className="message-content" style={{ margin: 0, fontSize: 13 }}>
                                <strong>Expression:</strong> {governanceDebug.expressionBrief}
                              </p>
                            ) : null}
                            {governanceDebug.relationalBrief ? (
                              <p className="message-content" style={{ margin: 0, fontSize: 13 }}>
                                <strong>Relationship:</strong> {governanceDebug.relationalBrief}
                              </p>
                            ) : null}
                            {governanceDebug.sceneBrief ? (
                              <p className="message-content" style={{ margin: 0, fontSize: 13 }}>
                                <strong>Scene:</strong> {governanceDebug.sceneBrief}
                              </p>
                            ) : null}
                            {governanceDebug.knowledgeBrief ? (
                              <p className="message-content" style={{ margin: 0, fontSize: 13 }}>
                                <strong>Knowledge:</strong> {governanceDebug.knowledgeBrief}
                              </p>
                            ) : null}
                            {governanceDebug.sourceSignals.length > 0 ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Source signals</strong>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    fontSize: 12
                                  }}
                                >
                                  {governanceDebug.sourceSignals.map((signal) => (
                                    <span
                                      key={signal}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(148, 163, 184, 0.18)",
                                        border: "1px solid rgba(148, 163, 184, 0.35)"
                                      }}
                                    >
                                      {signal}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {governanceDebug.modalityRules.length > 0 ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Modality rules</strong>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                  {governanceDebug.modalityRules.map((rule) => (
                                    <li key={rule}>{rule}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {governanceDebug.avoidances.length > 0 ? (
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 12 }}>Avoid</strong>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                                  {governanceDebug.avoidances.map((rule) => (
                                    <li key={rule}>{rule}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      </div>
                    ) : null}
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

      {playbackError ? (
        <div className="notice notice-error">{playbackError}</div>
      ) : null}

      <form action={handleSubmit} className="composer" ref={formRef}>
        <input name="thread_id" type="hidden" value={thread.id} />
        <label className="field" htmlFor={`content-${thread.id}`}>
          <span className="label">{copy.thread.messageLabel}</span>
          <textarea
            className="input textarea"
            disabled={isComposerDisabled}
            id={`content-${thread.id}`}
            name="content"
            placeholder={
              isFirstTurn
                ? copy.thread.placeholderFirstTurn
                : copy.thread.placeholderOngoing
            }
            ref={messageInputRef}
            required
            rows={4}
          />
        </label>

        <div className="composer-footer">
          <p className="helper-copy">
            {isFirstTurn
              ? copy.thread.firstTurnFooter
              : copy.thread.ongoingFooter}
          </p>
          <button className="button" disabled={isComposerDisabled} type="submit">
            {isSending ? copy.thread.assistantThinking : copy.thread.sendMessage}
          </button>
        </div>
      </form>
    </>
  );
}
