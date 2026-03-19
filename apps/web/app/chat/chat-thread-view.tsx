"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
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

type ChatThreadViewProps = {
  thread: {
    id: string;
    title: string;
    status: string;
    updated_at: string;
  };
  agentName: string | null;
  workspaceDefaultAgentName: string | null;
  initialMessages: ChatMessage[];
  locale: ChatLocale;
};

type RuntimeSummary = {
  modelProfileName: string | null;
  modelProfileTierLabel: string | null;
  modelProfileUsageNote: string | null;
  underlyingModelLabel: string | null;
  memoryLabel: string | null;
  memoryActivityLabel: string | null;
  memoryReasonLabel: string | null;
  profileReasonLabel: string | null;
  outcomeHints: string[];
};

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
      ? "这轮沿用了更均衡的日常对话配置，所以回答会更偏稳定、自然。"
      : "This turn used the balanced everyday-chat profile, so the answer stays more stable and natural.";
  }

  if (normalizedTier.includes("memory")) {
    return locale === "zh-CN"
      ? "这轮沿用了偏记忆敏感的配置，所以会更努力把已召回的事实直接体现在回答里。"
      : "This turn used the memory-sensitive profile, so it leans harder on recalled facts in the final answer.";
  }

  if (normalizedTier.includes("low-cost")) {
    return locale === "zh-CN"
      ? "这轮沿用了低成本测试配置，所以回答会更偏轻量、适合快速对比。"
      : "This turn used the low-cost testing profile, so the answer is lighter and tuned for faster comparisons.";
  }

  if (usageNote && usageNote.trim().length > 0) {
    return usageNote;
  }

  return locale === "zh-CN"
    ? "这轮沿用了当前模型配置来平衡回答质量与成本。"
    : "This turn used the selected model profile to balance quality and cost.";
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
      ? `这轮用了 ${typeList} 记忆，因为它和你刚刚的问题最相关。`
      : `This turn used ${typeList} memory because it was the most relevant stored context for your latest question.`;
  }

  if (memoryUsed === false && (hiddenExclusionCount > 0 || incorrectExclusionCount > 0)) {
    if (hiddenExclusionCount > 0 && incorrectExclusionCount > 0) {
      return isZh
        ? "这轮没有使用长期记忆，因为相关记忆里有一部分已隐藏，另一部分已被标记为错误。"
        : "This turn did not use long-term memory because some relevant memory was hidden and some was marked incorrect.";
    }

    if (hiddenExclusionCount > 0) {
      return isZh
        ? "这轮没有使用长期记忆，因为相关记忆目前处于隐藏状态。"
        : "This turn did not use long-term memory because the relevant memory is currently hidden.";
    }

    return isZh
      ? "这轮没有使用长期记忆，因为相关记忆目前被标记为错误。"
      : "This turn did not use long-term memory because the relevant memory is currently marked incorrect.";
  }

  if (memoryUsed === false) {
    return isZh
      ? "这轮没有用到长期记忆，因为当前问题不需要它。"
      : "This turn did not use long-term memory because the current question did not need it.";
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

  const modelProfileName =
    typeof message.metadata?.model_profile_name === "string" &&
    message.metadata.model_profile_name.trim().length > 0
      ? message.metadata.model_profile_name
      : null;
  const modelProfileTierLabel =
    typeof message.metadata?.model_profile_tier_label === "string" &&
    message.metadata.model_profile_tier_label.trim().length > 0
      ? message.metadata.model_profile_tier_label
      : null;
  const modelProfileUsageNote =
    typeof message.metadata?.model_profile_usage_note === "string" &&
    message.metadata.model_profile_usage_note.trim().length > 0
      ? message.metadata.model_profile_usage_note
      : null;
  const underlyingModelLabel =
    typeof message.metadata?.underlying_model_label === "string" &&
    message.metadata.underlying_model_label.trim().length > 0
      ? message.metadata.underlying_model_label
      : typeof message.metadata?.model === "string" &&
          message.metadata.model.trim().length > 0
        ? message.metadata.model
        : null;
  const memoryHitCount =
    typeof message.metadata?.memory_hit_count === "number"
      ? message.metadata.memory_hit_count
      : Array.isArray(message.metadata?.recalled_memories)
        ? message.metadata.recalled_memories.length
        : null;
  const memoryUsed =
    typeof message.metadata?.memory_used === "boolean"
      ? message.metadata.memory_used
      : typeof memoryHitCount === "number"
        ? memoryHitCount > 0
        : null;

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
  const memoryTypesUsed = Array.isArray(message.metadata?.memory_types_used)
    ? message.metadata.memory_types_used.filter(
        (type): type is string => typeof type === "string" && type.length > 0
      )
    : [];
  const memoryWriteTypes = Array.isArray(message.metadata?.memory_write_types)
    ? message.metadata.memory_write_types.filter(
        (type): type is string => typeof type === "string" && type.length > 0
      )
    : [];
  const hiddenExclusionCount =
    typeof message.metadata?.hidden_memory_exclusion_count === "number"
      ? message.metadata.hidden_memory_exclusion_count
      : 0;
  const incorrectExclusionCount =
    typeof message.metadata?.incorrect_memory_exclusion_count === "number"
      ? message.metadata.incorrect_memory_exclusion_count
      : 0;
  const outcomeHints: string[] = [];
  const newMemoryCount =
    typeof message.metadata?.new_memory_count === "number"
      ? message.metadata.new_memory_count
      : 0;
  const updatedMemoryCount =
    typeof message.metadata?.updated_memory_count === "number"
      ? message.metadata.updated_memory_count
      : 0;
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

  const memoryReasonLabel = getMemoryReasonLabel({
    locale,
    memoryTypesUsed,
    memoryUsed,
    hiddenExclusionCount,
    incorrectExclusionCount
  });
  const profileReasonLabel = modelProfileName
    ? getProfileReasonLabel(modelProfileTierLabel, modelProfileUsageNote, locale)
    : null;

  if (
    !modelProfileName &&
    !underlyingModelLabel &&
    !memoryLabel &&
    !memoryActivityLabel &&
    !memoryReasonLabel &&
    !profileReasonLabel &&
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
    memoryReasonLabel,
    profileReasonLabel,
    outcomeHints
  };
}

function getRuntimeSummaryHeadline(
  summary: RuntimeSummary,
  locale: ChatLocale
) {
  const copy = getChatCopy(locale);
  const hasMemoryReason = Boolean(summary.memoryReasonLabel);
  const hasProfileReason = Boolean(summary.profileReasonLabel);

  if (hasMemoryReason && hasProfileReason) {
    return copy.locale === "zh-CN"
      ? "这轮主要受记忆和当前配置共同影响。"
      : "This turn was shaped mainly by memory plus the current profile.";
  }

  if (hasMemoryReason) {
    return copy.locale === "zh-CN"
      ? "这轮主要受已命中的记忆影响。"
      : "This turn was shaped mainly by recalled memory.";
  }

  if (hasProfileReason) {
    return copy.locale === "zh-CN"
      ? "这轮主要受当前模型配置影响。"
      : "This turn was shaped mainly by the current profile.";
  }

  return copy.locale === "zh-CN"
    ? "这条摘要解释了这轮回答的主要原因。"
    : "This summary explains the main reason behind the turn.";
}

export function ChatThreadView({
  thread,
  agentName,
  workspaceDefaultAgentName,
  initialMessages,
  locale
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

  useEffect(() => {
    setOptimisticMessages(initialMessages);
    setFeedback(null);
    setThreadTitle(thread.title);
    setDraftTitle(thread.title);
    setIsRenaming(false);
  }, [initialMessages, thread.id, thread.title]);

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
        message: "Type a message before sending."
      });
      return;
    }

    setFeedback(null);
    setOptimisticMessages((current) => [
      ...current,
      {
        id: `pending-user-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        status: "completed",
        metadata: {},
        created_at: new Date().toISOString()
      }
    ]);

    formRef.current?.reset();

    startSendTransition(async () => {
      const result: SendMessageResult = await sendMessage(formData);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message
        });
      }

      router.refresh();
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
                    <p className="message-content">{message.content}</p>
                    {runtimeSummary ? (
                      <details className="runtime-summary">
                        <summary className="runtime-summary-toggle">
                          {copy.thread.howGenerated}
                        </summary>
                        <p className="runtime-summary-headline">
                          {getRuntimeSummaryHeadline(runtimeSummary, locale)}
                        </p>
                        {runtimeSummary.memoryReasonLabel ? (
                          <p className="runtime-summary-reason">
                            {runtimeSummary.memoryReasonLabel}
                          </p>
                        ) : null}
                        {runtimeSummary.profileReasonLabel ? (
                          <p className="runtime-summary-reason">
                            {runtimeSummary.profileReasonLabel}
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
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

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
