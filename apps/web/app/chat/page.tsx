import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/login/actions";
import { ChatThreadView } from "@/app/chat/chat-thread-view";
import {
  createThread,
  hideMemory,
  markMemoryIncorrect,
  restoreMemory,
  setChatUiLanguage,
  setDefaultAgent
} from "@/app/chat/actions";
import { CreateAgentSheet } from "@/app/chat/create-agent-sheet";
import { AgentEditSheet } from "@/app/chat/agent-edit-sheet";
import { LanguageSwitch } from "@/app/chat/language-switch";
import { ThreadUrlSync } from "@/app/chat/thread-url-sync";
import { classifyStoredMemorySemanticTarget } from "@/lib/chat/memory-records";
import type { StoredMemory } from "@/lib/chat/memory-shared";
import { getMemoryCategory, getMemoryScope } from "@/lib/chat/memory-v2";
import { getChatPageState } from "@/lib/chat/runtime";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  getChatCopy,
  resolveChatLocale
} from "@/lib/i18n/chat-ui";
import {
  loadActiveAudioAssetById,
  loadOwnedRoleMediaProfile
} from "@/lib/product/role-media";
import { buildPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "Chat Workspace",
  description: "Protected SparkCore chat workspace for supplementary web conversation, memory review, and agent controls.",
  path: "/chat",
  noIndex: true
});

function getMemoryConfidenceView(confidence: number) {
  if (confidence >= 0.9) {
    return {
      tone: "strong",
      labelKey: "highConfidence"
    } as const;
  }

  if (confidence >= 0.8) {
    return {
      tone: "medium",
      labelKey: "mediumConfidence"
    } as const;
  }

  return {
    tone: "low",
    labelKey: "lowConfidence"
  } as const;
}

function hasMetadataFlag(
  metadata: Record<string, unknown> | undefined,
  key: string
) {
  return typeof metadata?.[key] === "string" && metadata[key] !== "";
}

function isMemoryIncorrect(metadata: Record<string, unknown> | undefined) {
  return metadata?.is_incorrect === true;
}

function getMemoryCategoryLabel(
  category: string,
  locale: "en" | "zh-CN"
) {
  const memoryCopy = getChatCopy(locale).memory;

  switch (category) {
    case "profile":
      return memoryCopy.categoryProfile;
    case "preference":
      return memoryCopy.categoryPreference;
    case "relationship":
      return memoryCopy.categoryRelationship;
    case "goal":
      return memoryCopy.categoryGoal;
    default:
      return category.replace(/_/g, " ");
  }
}

function getMemoryScopeLabel(scope: string, locale: "en" | "zh-CN") {
  const memoryCopy = getChatCopy(locale).memory;

  switch (scope) {
    case "user_global":
      return memoryCopy.scopeGlobal;
    case "user_agent":
      return memoryCopy.scopeThisAgent;
    case "thread_local":
      return memoryCopy.scopeThisThread;
    default:
      return scope.replace(/_/g, " ");
  }
}

function getMemoryStatusLabel(status: string, locale: "en" | "zh-CN") {
  const memoryCopy = getChatCopy(locale).memory;

  switch (status) {
    case "active":
      return memoryCopy.statusActive;
    case "hidden":
      return memoryCopy.statusHidden;
    case "incorrect":
      return memoryCopy.statusIncorrect;
    case "superseded":
      return memoryCopy.statusSuperseded;
    default:
      return status.replace(/_/g, " ");
  }
}

function isThreadLocalMemory(memory: StoredMemory) {
  return getMemoryScope(memory) === "thread_local";
}

function getMemorySemanticTargetLabel(
  target: ReturnType<typeof classifyStoredMemorySemanticTarget>,
  locale: "en" | "zh-CN"
) {
  const isZh = locale === "zh-CN";

  switch (target) {
    case "static_profile":
      return isZh ? "静态画像" : "static profile";
    case "dynamic_profile":
      return isZh ? "动态画像" : "dynamic profile";
    case "memory_record":
      return isZh ? "记忆记录" : "memory record";
    case "thread_state_candidate":
      return isZh ? "线程状态候选" : "thread state";
    default:
      return isZh ? "未分类" : "unclassified";
  }
}

function getStoredMemorySemanticTargetLabel(
  memory: StoredMemory,
  locale: "en" | "zh-CN"
) {
  return getMemorySemanticTargetLabel(
    classifyStoredMemorySemanticTarget(memory),
    locale
  );
}

function getMemoryTrustHint({
  confidence,
  metadata,
  locale
}: {
  confidence: number;
  metadata: Record<string, unknown> | undefined;
  locale: "en" | "zh-CN";
}) {
  const memoryCopy = getChatCopy(locale).memory;

  if (hasMetadataFlag(metadata, "restored_at")) {
    return memoryCopy.restoredHint;
  }

  if (confidence >= 0.9) {
    return memoryCopy.highHint;
  }

  if (confidence >= 0.8) {
    return memoryCopy.mediumHint;
  }

  return memoryCopy.lowHint;
}

function getMemoryEffectHint({
  scope,
  status,
  targetAgentId,
  currentThreadAgentId,
  locale
}: {
  scope: string;
  status: string;
  targetAgentId: string | null;
  currentThreadAgentId: string | null;
  locale: "en" | "zh-CN";
}) {
  const memoryCopy = getChatCopy(locale).memory;
  const appliesToAgent = scope === "user_agent";
  const appliesToCurrentAgent =
    appliesToAgent &&
    targetAgentId !== null &&
    currentThreadAgentId !== null &&
    targetAgentId === currentThreadAgentId;

  if (status === "hidden") {
    if (scope === "thread_local") {
      return memoryCopy.effectHiddenThisThread;
    }

    if (appliesToAgent) {
      return memoryCopy.effectHiddenThisAgent;
    }

    return memoryCopy.effectHiddenGlobal;
  }

  if (status === "incorrect") {
    if (scope === "thread_local") {
      return memoryCopy.effectIncorrectThisThread;
    }

    if (appliesToAgent) {
      return memoryCopy.effectIncorrectThisAgent;
    }

    return memoryCopy.effectIncorrectGlobal;
  }

  if (status === "superseded") {
    if (scope === "thread_local") {
      return memoryCopy.effectSupersededThisThread;
    }

    if (appliesToAgent) {
      return memoryCopy.effectSupersededThisAgent;
    }

    return memoryCopy.effectSupersededGlobal;
  }

  if (scope === "thread_local") {
    return memoryCopy.effectActiveThisThread;
  }

  if (appliesToAgent) {
    return appliesToCurrentAgent
      ? memoryCopy.effectActiveThisAgentCurrent
      : memoryCopy.effectActiveThisAgentOther;
  }

  return memoryCopy.effectActiveGlobal;
}

function formatThreadUpdatedAt(dateString: string, locale: string) {
  const timestamp = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = timestamp - now;
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto"
  });

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 7) {
    return relativeFormatter.format(diffDays, "day");
  }

  return new Date(dateString).toLocaleDateString(locale);
}

function ChatStateCard({
  eyebrow,
  title,
  description,
  notice,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  notice?: {
    tone: "error" | "warning" | "success";
    message: string;
  } | null;
  actions?: React.ReactNode;
}) {
  return (
    <section className="panel thread-state-card">
      <div className="thread-state-copy">
        <p className="eyebrow thread-state-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="helper-copy">{description}</p>
      </div>

      {notice ? (
        <div className={`notice notice-${notice.tone}`}>{notice.message}</div>
      ) : null}

      {actions ? <div className="thread-status-actions">{actions}</div> : null}
    </section>
  );
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{
    error?: string;
    feedback?: string;
    feedback_type?: string;
    thread?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const locale = resolveChatLocale(
    cookieStore.get(CHAT_UI_LANGUAGE_COOKIE)?.value
  );
  const copy = getChatCopy(locale);

  function getProfilePositioning(tierLabel: string | null) {
    const tier = tierLabel?.toLowerCase() ?? "";

    if (tier.includes("stable")) {
      return {
        bestFor: copy.sheets.profilePositioningStable,
        recommendation: copy.sheets.profileRecommendationStableHelper
      };
    }

    if (tier.includes("memory")) {
      return {
        bestFor: copy.sheets.profilePositioningMemory,
        recommendation: copy.sheets.profileRecommendationMemoryHelper
      };
    }

    if (tier.includes("low-cost") || tier.includes("low cost")) {
      return {
        bestFor: copy.sheets.profilePositioningLowCost,
        recommendation: copy.sheets.profileRecommendationLowCostHelper
      };
    }

    return {
      bestFor: copy.sheets.profilePositioningGeneric,
      recommendation: copy.sheets.profileRecommendationGenericHelper
    };
  }
  let chatState;

  try {
    chatState = await getChatPageState({
      requestedThreadId: params.thread
    });
  } catch (error) {
    const fetchFailedMessage =
      error instanceof Error
        ? error.message
        : copy.states.fetchFailedTitle;

    return (
      <main className="shell">
        <div className="app-shell">
          <div className="topbar">
            <div>
              <p className="eyebrow">{copy.page.eyebrow}</p>
              <h1 className="title">{copy.page.titleUnavailable}</h1>
            </div>

            <div className="toolbar">
              <Link className="button button-secondary" href="/workspace">
                {copy.common.workspace}
              </Link>
            </div>
          </div>

          <ChatStateCard
            actions={
              <>
                <Link className="button" href="/chat" prefetch={false}>
                  {copy.states.retryChat}
                </Link>
                <Link className="button button-secondary" href="/workspace">
                  {copy.states.backToWorkspace}
                </Link>
              </>
            }
            description={copy.states.fetchFailedDescription}
            eyebrow={copy.states.fetchFailedEyebrow}
            notice={{
              tone: "error",
              message: fetchFailedMessage
            }}
            title={copy.states.fetchFailedTitle}
          />
        </div>
      </main>
    );
  }

  if (!chatState) {
    redirect("/login");
  }

  if (!chatState.workspace) {
    redirect("/workspace");
  }

  const {
    user,
    workspace,
    availablePersonaPacks,
    availableModelProfiles,
    availableAgents,
    defaultAgentId,
    visibleMemories,
    hiddenMemories,
    incorrectMemories,
    supersededMemories,
    threads,
    thread,
    agent,
    messages,
    canonicalThreadId,
    shouldReplaceUrl,
    requestedThreadFallback
  } = chatState;
  const workspaceDefaultAgent =
    availableAgents.find((availableAgent) => availableAgent.is_default_for_workspace) ??
    null;
  const currentThreadAvailableAgent =
    thread?.agent_id
      ? availableAgents.find((availableAgent) => availableAgent.id === thread.agent_id) ??
        null
      : null;
  const pageSupabase = await createClient();
  const { data: currentRoleMedia } =
    thread?.agent_id
      ? await loadOwnedRoleMediaProfile({
          supabase: pageSupabase,
          agentId: thread.agent_id,
          workspaceId: workspace.id,
          userId: user.id
        })
      : { data: null };
  const currentAudioAssetId =
    typeof currentRoleMedia?.audio_asset_id === "string" &&
    currentRoleMedia.audio_asset_id.length > 0
      ? currentRoleMedia.audio_asset_id
      : typeof currentRoleMedia?.audio_voice_option_id === "string" &&
          currentRoleMedia.audio_voice_option_id.length > 0
        ? currentRoleMedia.audio_voice_option_id
        : null;
  const { data: currentAudioAsset } = currentAudioAssetId
    ? await loadActiveAudioAssetById({
        supabase: pageSupabase,
        audioAssetId: currentAudioAssetId
      })
    : { data: null };
  const audioPlayback = {
    enabled:
      currentAudioAsset?.provider === "Azure" ||
      currentAudioAsset?.provider === "ElevenLabs",
    provider: typeof currentAudioAsset?.provider === "string" ? currentAudioAsset.provider : null,
    voiceName:
      typeof currentAudioAsset?.display_name === "string"
        ? currentAudioAsset.display_name
        : null
  };
  const pageFeedback = params.feedback
    ? {
        tone: params.feedback_type === "success" ? "success" : "error",
        message: params.feedback
      }
    : params.error
      ? {
          tone: "error",
          message: params.error
        }
      : null;
  const redirectPath = params.thread
    ? `/chat?thread=${encodeURIComponent(params.thread)}`
    : "/chat";
  const visibleLongTermMemories = visibleMemories.filter(
    (memory) => !isThreadLocalMemory(memory)
  );
  const visibleThreadLocalMemories = visibleMemories.filter((memory) =>
    isThreadLocalMemory(memory)
  );
  const hiddenLongTermMemories = hiddenMemories.filter(
    (memory) => !isThreadLocalMemory(memory)
  );
  const hiddenThreadLocalMemories = hiddenMemories.filter((memory) =>
    isThreadLocalMemory(memory)
  );
  const incorrectLongTermMemories = incorrectMemories.filter(
    (memory) => !isThreadLocalMemory(memory)
  );
  const incorrectThreadLocalMemories = incorrectMemories.filter((memory) =>
    isThreadLocalMemory(memory)
  );
  const supersededLongTermMemories = supersededMemories.filter(
    (memory) => !isThreadLocalMemory(memory)
  );
  const supersededThreadLocalMemories = supersededMemories.filter((memory) =>
    isThreadLocalMemory(memory)
  );
  const activeLongTermMemoryCategoryCounts = visibleLongTermMemories.reduce<
    Record<string, number>
  >((accumulator, memory) => {
    const category = getMemoryCategory(memory);
    accumulator[category] = (accumulator[category] ?? 0) + 1;
    return accumulator;
  }, {});
  const activeSemanticTargetCounts = [
    ...visibleThreadLocalMemories,
    ...visibleLongTermMemories
  ].reduce<Record<string, number>>((accumulator, memory) => {
    const target = classifyStoredMemorySemanticTarget(memory);
    accumulator[target] = (accumulator[target] ?? 0) + 1;
    return accumulator;
  }, {});
  const memoryVisibility = {
    activeByCategory: Object.entries(activeLongTermMemoryCategoryCounts).map(
      ([key, count]) => ({
        key,
        label: getMemoryCategoryLabel(key, locale),
        count
      })
    ),
    activeBySemanticTarget: Object.entries(activeSemanticTargetCounts).map(
      ([key, count]) => ({
        key,
        label: getMemorySemanticTargetLabel(
          key as ReturnType<typeof classifyStoredMemorySemanticTarget>,
          locale
        ),
        count
      })
    ),
    previewEntries: [...visibleThreadLocalMemories, ...visibleLongTermMemories]
      .slice(0, 3)
      .map((memory) => ({
        id: memory.id,
        content: memory.content,
        categoryLabel: getMemoryCategoryLabel(getMemoryCategory(memory), locale),
        scopeLabel: getMemoryScopeLabel(getMemoryScope(memory), locale),
        semanticTargetLabel: getStoredMemorySemanticTargetLabel(memory, locale)
      })),
    threadLocalCount: visibleThreadLocalMemories.length,
    hiddenCount: hiddenMemories.length,
    incorrectCount: incorrectMemories.length
  };

  return (
    <main className="shell">
      <div className="app-shell">
        <ThreadUrlSync
          canonicalThreadId={canonicalThreadId}
          clearTransientFeedback={Boolean(params.feedback || params.error)}
          enabled={shouldReplaceUrl}
        />

        <div className="topbar">
          <div>
            <p className="eyebrow">{copy.page.eyebrow}</p>
            <h1 className="title">{copy.page.titleReady}</h1>
          </div>

          <div className="toolbar">
            <LanguageSwitch
              action={setChatUiLanguage}
              currentLocale={locale}
              label={copy.languageSwitchLabel}
              languages={copy.languages}
              redirectPath={redirectPath}
            />
            <Link className="button button-secondary" href="/workspace">
              {copy.common.workspace}
            </Link>
            <form action={signOut}>
              <FormSubmitButton
                className="button button-secondary"
                idleText={copy.common.signOut}
                pendingText={copy.common.signingOut}
              />
            </form>
          </div>
        </div>

        <section className="hero">
          <h2>{copy.page.heroTitle}</h2>
          <p>{copy.page.heroDescription}</p>
        </section>

        {pageFeedback ? (
          <div className={`notice notice-${pageFeedback.tone} chat-page-feedback`}>
            {pageFeedback.message}
          </div>
        ) : null}

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <div className="thread-sidebar-header">
              <h2>{copy.sidebar.threadsTitle}</h2>
              <p className="helper-copy">
                {copy.sidebar.workspaceLabel}: {workspace.name}
              </p>
              <p className="section-hint">{copy.sidebar.threadHint}</p>
            </div>

            {availableAgents.length > 0 ? (
              <form action={createThread} className="thread-create-form">
                <label className="field" htmlFor="agent_id">
                  <span className="label">{copy.sidebar.startNewChat}</span>
                  <select
                    className="input"
                    defaultValue={defaultAgentId ?? availableAgents[0]?.id ?? ""}
                    id="agent_id"
                    name="agent_id"
                    required
                  >
                    {availableAgents.map((availableAgent) => (
                      <option key={availableAgent.id} value={availableAgent.id}>
                        {availableAgent.name}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="helper-copy">
                  {workspaceDefaultAgent
                    ? `${copy.sidebar.workspaceDefaultPrefix}${workspaceDefaultAgent.name}${copy.sidebar.workspaceDefaultSuffix}`
                    : copy.sidebar.noWorkspaceDefault}
                </p>

                <FormSubmitButton
                  className="button"
                  idleText={copy.sidebar.newChat}
                  pendingText={copy.sidebar.creating}
                />
              </form>
            ) : (
              <div className="empty-state section-empty-state">
                <p className="lead chat-thread-title">{copy.states.noActiveAgentTitle}</p>
                <p className="helper-copy">{copy.states.noActiveAgentDescription}</p>
              </div>
            )}

            {threads.length === 0 ? (
              <div className="empty-state">
                <p className="lead chat-thread-title">{copy.states.noThreadsTitle}</p>
                <p className="helper-copy">
                  {availableAgents.length > 0
                    ? copy.states.noThreadsWithAgent
                    : copy.states.noThreadsWithoutAgent}
                </p>
              </div>
            ) : (
              <nav aria-label="Thread list" className="thread-list">
                {threads.map((item) => {
                  const isActive = item.id === thread?.id;

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`thread-link ${isActive ? "thread-link-active" : ""}`}
                      href={`/chat?thread=${item.id}`}
                      key={item.id}
                      prefetch={false}
                    >
                      <p className="thread-link-title">{item.title}</p>
                      <p className="thread-link-meta">
                        {item.agent_name ?? copy.sidebar.unassignedAgent}
                      </p>
                      <p className="thread-link-preview">
                        {item.latest_message_preview ??
                          copy.sidebar.noMessagesYet}
                      </p>
                      <p className="thread-link-meta">
                        {copy.sidebar.updatedPrefix}
                        {formatThreadUpdatedAt(item.updated_at, locale)}
                      </p>
                    </Link>
                  );
                })}
              </nav>
            )}

            <details className="sidebar-section" id="agent-rail" open>
              <summary className="sidebar-section-summary">
                <div className="agent-panel-header">
                  <h3>{copy.sidebar.agentsTitle}</h3>
                  <p className="helper-copy">{copy.sidebar.agentsHelper}</p>
                  <p className="section-hint">{copy.sidebar.agentsHint}</p>
                </div>
              </summary>

              <div className="sidebar-section-body agent-panel">
                <CreateAgentSheet
                  locale={locale}
                  personaPacks={availablePersonaPacks}
                />

                {availableAgents.length === 0 ? (
                  <div className="empty-state section-empty-state">
                    <p className="helper-copy">{copy.sidebar.noAgentDescription}</p>
                  </div>
                ) : (
                  <div className="agent-list">
                    {availableAgents.map((availableAgent) => {
                      const isCurrent = availableAgent.id === thread?.agent_id;

                      return (
                        <article
                          className={`agent-card ${isCurrent ? "agent-card-active" : ""}`}
                          key={availableAgent.id}
                        >
                          <div className="agent-card-row">
                            <div className="agent-card-identity">
                              <span className="agent-avatar-chip" aria-hidden="true">
                                {availableAgent.avatar_emoji ?? "✨"}
                              </span>
                              <h4 className="agent-card-title">{availableAgent.name}</h4>
                            </div>
                            <div className="agent-card-badges">
                              {availableAgent.is_default_for_workspace ? (
                                <span className="thread-badge">
                                  {copy.sidebar.workspaceDefaultBadge}
                                </span>
                              ) : null}
                              {isCurrent ? (
                                <span className="thread-badge">
                                  {copy.sidebar.thisThreadBadge}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="thread-link-meta">
                            {copy.sidebar.personaPackPrefix}
                            {availableAgent.source_persona_pack_name ??
                              (availableAgent.is_custom
                                ? copy.sidebar.customPreset
                                : copy.sidebar.systemPreset)}
                          </p>
                          <p className="thread-link-meta">
                            {copy.sidebar.personaPrefix}
                            {availableAgent.persona_summary ||
                              copy.sidebar.noPersonaSummary}
                          </p>
                          {availableAgent.background_summary ? (
                            <p className="agent-background-copy">
                              {copy.sidebar.backgroundPrefix}
                              {availableAgent.background_summary}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.sidebar.modelProfilePrefix}
                            {availableAgent.default_model_profile_name ??
                              copy.sidebar.modelProfileUnassigned}
                            {availableAgent.default_model_profile_tier_label
                              ? ` · ${availableAgent.default_model_profile_tier_label}`
                              : ""}
                          </p>
                          {availableAgent.default_model_profile_name ? (
                            <>
                              <p className="thread-link-meta">
                                {copy.sidebar.profileBestForPrefix}
                                {getProfilePositioning(
                                  availableAgent.default_model_profile_tier_label
                                ).bestFor}
                              </p>
                              <p className="agent-impact-copy">
                                {copy.sidebar.profileRecommendationPrefix}
                                {getProfilePositioning(
                                  availableAgent.default_model_profile_tier_label
                                ).recommendation}
                              </p>
                            </>
                          ) : null}
                          <p className="agent-impact-copy">
                            {isCurrent
                              ? copy.sidebar.currentAgentImpact
                              : availableAgent.is_default_for_workspace
                                ? copy.sidebar.defaultAgentImpact
                                : copy.sidebar.availableAgentImpact}
                          </p>
                          <div className="agent-card-actions">
                            <form action={setDefaultAgent} className="agent-card-action">
                              <input
                                name="agent_id"
                                type="hidden"
                                value={availableAgent.id}
                              />
                              <input
                                name="redirect_thread_id"
                                type="hidden"
                                value={thread?.id ?? ""}
                              />
                              <FormSubmitButton
                                className="button button-secondary agent-default-button"
                                idleText={
                                  availableAgent.is_default_for_workspace
                                    ? copy.sidebar.workspaceDefaultBadge
                                    : copy.sidebar.setAsDefault
                                }
                                pendingText={copy.common.saving}
                              />
                            </form>

                            <AgentEditSheet
                              agent={{
                                id: availableAgent.id,
                                name: availableAgent.name,
                                persona_summary: availableAgent.persona_summary,
                                background_summary:
                                  availableAgent.background_summary,
                                avatar_emoji: availableAgent.avatar_emoji,
                                system_prompt_summary:
                                  availableAgent.system_prompt_summary
                              }}
                              isCurrentThreadAgent={isCurrent}
                              isWorkspaceDefaultAgent={
                                availableAgent.is_default_for_workspace
                              }
                              locale={locale}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>

            <details
              className="sidebar-section sidebar-section-memory"
              id="memory-rail"
              open
            >
              <summary className="sidebar-section-summary">
                <div className="agent-panel-header">
                  <h3>{copy.memory.title}</h3>
                  <p className="helper-copy">{copy.memory.helper}</p>
                  <p className="section-hint">{copy.memory.hint}</p>
                </div>
              </summary>

              <div className="sidebar-section-body agent-panel memory-panel">
                <div className="memory-trust-note">
                  <p className="helper-copy">{copy.memory.trustNote}</p>
                </div>

                <div className="memory-policy-note">
                  <p className="helper-copy">{copy.memory.policyTitle1}</p>
                  <p className="helper-copy">{copy.memory.policyTitle2}</p>
                  <p className="helper-copy">{copy.memory.policyHint}</p>
                </div>

                {visibleMemories.length === 0 ? (
                  <div className="empty-state section-empty-state">
                    <p className="helper-copy">{copy.memory.empty}</p>
                  </div>
                ) : (
                  <>
                    <section className="memory-group">
                      <div className="memory-group-header">
                        <h4>{copy.memory.longTermTitle}</h4>
                        <p className="helper-copy">{copy.memory.longTermHelper}</p>
                      </div>
                      {visibleLongTermMemories.length === 0 ? (
                        <div className="empty-state section-empty-state memory-group-empty">
                          <p className="helper-copy">{copy.memory.empty}</p>
                        </div>
                      ) : (
                        <div className="memory-list">
                          {visibleLongTermMemories.map((memory) => {
                            const confidenceView = getMemoryConfidenceView(memory.confidence);
                            const trustHint = getMemoryTrustHint({
                              confidence: memory.confidence,
                              metadata: memory.metadata,
                              locale
                            });
                            const effectHint = getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            });
                            const isRestored = hasMetadataFlag(
                              memory.metadata,
                              "restored_at"
                            );

                            return (
                              <article
                                className={`memory-card memory-card-${confidenceView.tone}`}
                                key={memory.id}
                              >
                                <div className="memory-card-row">
                                  <div className="memory-badges">
                                    <span className="thread-badge">
                                      {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                                    </span>
                                    <span className="thread-badge thread-badge-muted">
                                      {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                                    </span>
                                    <span className="thread-badge thread-badge-muted">
                                      {getMemoryStatusLabel(memory.status, locale)}
                                    </span>
                                    <span className="thread-badge thread-badge-muted">
                                      {getStoredMemorySemanticTargetLabel(memory, locale)}
                                    </span>
                                    {isRestored ? (
                                      <span className="thread-badge thread-badge-muted">
                                        {copy.memory.restoredBadge}
                                      </span>
                                    ) : null}
                                  </div>
                                  <span
                                    className={`memory-confidence memory-confidence-${confidenceView.tone}`}
                                  >
                                    {copy.memory[confidenceView.labelKey]} ·{" "}
                                    {memory.confidence.toFixed(2)}
                                  </span>
                                </div>
                                <p className="memory-content">{memory.content}</p>
                                <p className="memory-trust-copy">{trustHint}</p>
                                <p className="memory-effect-copy">{effectHint}</p>
                                {getMemoryScope(memory) === "user_agent" &&
                                  memory.target_agent_name ? (
                                  <p className="thread-link-meta">
                                    {copy.memory.appliesToAgentPrefix}
                                    {memory.target_agent_name}
                                  </p>
                                ) : null}
                                <p className="thread-link-meta">
                                  {copy.memory.storedPrefix}
                                  {new Date(memory.created_at).toLocaleString(locale)}
                                </p>
                                <div className="memory-trace">
                                  <p className="memory-trace-copy">
                                    {memory.source_thread_id ? (
                                      <>
                                        {copy.memory.traceFromPrefix}
                                        <span className="memory-trace-emphasis">
                                          {memory.source_thread_title ?? copy.states.noThreadsTitle}
                                        </span>
                                        {memory.source_timestamp
                                          ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                                          : ""}
                                      </>
                                    ) : (
                                      copy.memory.traceUnavailable
                                    )}
                                  </p>
                                  {memory.source_thread_id ? (
                                    <Link
                                      className="memory-trace-link"
                                      href={`/chat?thread=${memory.source_thread_id}`}
                                      prefetch={false}
                                    >
                                      {copy.memory.viewContext}
                                    </Link>
                                  ) : null}
                                </div>
                                <form action={hideMemory} className="memory-card-actions">
                                  <input name="memory_id" type="hidden" value={memory.id} />
                                  <input
                                    name="redirect_thread_id"
                                    type="hidden"
                                    value={thread?.id ?? ""}
                                  />
                                  <FormSubmitButton
                                    className="button button-secondary memory-hide-button"
                                    idleText={copy.memory.hide}
                                    pendingText={copy.memory.hiding}
                                  />
                                </form>
                                {!isMemoryIncorrect(memory.metadata) ? (
                                  <form
                                    action={markMemoryIncorrect}
                                    className="memory-card-actions"
                                  >
                                    <input name="memory_id" type="hidden" value={memory.id} />
                                    <input
                                      name="redirect_thread_id"
                                      type="hidden"
                                      value={thread?.id ?? ""}
                                    />
                                    <FormSubmitButton
                                      className="button button-secondary memory-hide-button"
                                      idleText={copy.memory.incorrect}
                                      pendingText={copy.common.saving}
                                    />
                                  </form>
                                ) : null}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {visibleThreadLocalMemories.length > 0 ? (
                      <section className="memory-group">
                        <div className="memory-group-header">
                          <h4>{copy.memory.threadLocalTitle}</h4>
                          <p className="helper-copy">{copy.memory.threadLocalHelper}</p>
                        </div>
                        <div className="memory-list">
                          {visibleThreadLocalMemories.map((memory) => {
                            const confidenceView = getMemoryConfidenceView(memory.confidence);
                            const trustHint = getMemoryTrustHint({
                              confidence: memory.confidence,
                              metadata: memory.metadata,
                              locale
                            });
                            const effectHint = getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            });
                            const isRestored = hasMetadataFlag(
                              memory.metadata,
                              "restored_at"
                            );

                            return (
                              <article
                                className={`memory-card memory-card-${confidenceView.tone}`}
                                key={memory.id}
                              >
                                <div className="memory-card-row">
                                  <div className="memory-badges">
                                    <span className="thread-badge">
                                      {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                                    </span>
                                    <span className="thread-badge thread-badge-muted">
                                      {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                                    </span>
                                    <span className="thread-badge thread-badge-muted">
                                      {getMemoryStatusLabel(memory.status, locale)}
                                    </span>
                                    {isRestored ? (
                                      <span className="thread-badge thread-badge-muted">
                                        {copy.memory.restoredBadge}
                                      </span>
                                    ) : null}
                                  </div>
                                  <span
                                    className={`memory-confidence memory-confidence-${confidenceView.tone}`}
                                  >
                                    {copy.memory[confidenceView.labelKey]} ·{" "}
                                    {memory.confidence.toFixed(2)}
                                  </span>
                                </div>
                                <p className="memory-content">{memory.content}</p>
                                <p className="memory-trust-copy">{trustHint}</p>
                                <p className="memory-effect-copy">{effectHint}</p>
                                {getMemoryScope(memory) === "user_agent" &&
                                  memory.target_agent_name ? (
                                  <p className="thread-link-meta">
                                    {copy.memory.appliesToAgentPrefix}
                                    {memory.target_agent_name}
                                  </p>
                                ) : null}
                                <p className="thread-link-meta">
                                  {copy.memory.storedPrefix}
                                  {new Date(memory.created_at).toLocaleString(locale)}
                                </p>
                                <div className="memory-trace">
                                  <p className="memory-trace-copy">
                                    {memory.source_thread_id ? (
                                      <>
                                        {copy.memory.traceFromPrefix}
                                        <span className="memory-trace-emphasis">
                                          {memory.source_thread_title ?? copy.states.noThreadsTitle}
                                        </span>
                                        {memory.source_timestamp
                                          ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                                          : ""}
                                      </>
                                    ) : (
                                      copy.memory.traceUnavailable
                                    )}
                                  </p>
                                  {memory.source_thread_id ? (
                                    <Link
                                      className="memory-trace-link"
                                      href={`/chat?thread=${memory.source_thread_id}`}
                                      prefetch={false}
                                    >
                                      {copy.memory.viewContext}
                                    </Link>
                                  ) : null}
                                </div>
                                <form action={hideMemory} className="memory-card-actions">
                                  <input name="memory_id" type="hidden" value={memory.id} />
                                  <input
                                    name="redirect_thread_id"
                                    type="hidden"
                                    value={thread?.id ?? ""}
                                  />
                                  <FormSubmitButton
                                    className="button button-secondary memory-hide-button"
                                    idleText={copy.memory.hide}
                                    pendingText={copy.memory.hiding}
                                  />
                                </form>
                                {!isMemoryIncorrect(memory.metadata) ? (
                                  <form
                                    action={markMemoryIncorrect}
                                    className="memory-card-actions"
                                  >
                                    <input name="memory_id" type="hidden" value={memory.id} />
                                    <input
                                      name="redirect_thread_id"
                                      type="hidden"
                                      value={thread?.id ?? ""}
                                    />
                                    <FormSubmitButton
                                      className="button button-secondary memory-hide-button"
                                      idleText={copy.memory.incorrect}
                                      pendingText={copy.common.saving}
                                    />
                                  </form>
                                ) : null}
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    ) : null}
                  </>
                )}

                {hiddenLongTermMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.hiddenTitle} ({hiddenLongTermMemories.length})
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {hiddenLongTermMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                            </div>
                            <span className="memory-confidence memory-confidence-low">
                              {copy.memory.hiddenStatus}
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">{copy.memory.hiddenHint}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          {getMemoryScope(memory) === "user_agent" && memory.target_agent_name ? (
                            <p className="thread-link-meta">
                              {copy.memory.appliesToAgentPrefix}
                              {memory.target_agent_name}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.memory.hiddenFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                          <form
                            action={restoreMemory}
                            className="memory-card-actions"
                          >
                            <input name="memory_id" type="hidden" value={memory.id} />
                            <input
                              name="redirect_thread_id"
                              type="hidden"
                              value={thread?.id ?? ""}
                            />
                            <FormSubmitButton
                              className="button button-secondary memory-hide-button"
                              idleText={copy.memory.restore}
                              pendingText={copy.memory.restoring}
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {hiddenThreadLocalMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.hiddenTitle} ({hiddenThreadLocalMemories.length}) ·{" "}
                      {copy.memory.threadLocalTitle}
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {hiddenThreadLocalMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                            </div>
                            <span className="memory-confidence memory-confidence-low">
                              {copy.memory.hiddenStatus}
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">{copy.memory.hiddenHint}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          {getMemoryScope(memory) === "user_agent" && memory.target_agent_name ? (
                            <p className="thread-link-meta">
                              {copy.memory.appliesToAgentPrefix}
                              {memory.target_agent_name}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.memory.hiddenFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                          <form
                            action={restoreMemory}
                            className="memory-card-actions"
                          >
                            <input name="memory_id" type="hidden" value={memory.id} />
                            <input
                              name="redirect_thread_id"
                              type="hidden"
                              value={thread?.id ?? ""}
                            />
                            <FormSubmitButton
                              className="button button-secondary memory-hide-button"
                              idleText={copy.memory.restore}
                              pendingText={copy.memory.restoring}
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {incorrectLongTermMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.incorrectTitle} ({incorrectLongTermMemories.length})
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {incorrectLongTermMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {copy.memory.incorrectBadge}
                              </span>
                            </div>
                            <span className="memory-confidence memory-confidence-low">
                              {copy.memory.removedFromRecall}
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">{copy.memory.incorrectHint}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          {getMemoryScope(memory) === "user_agent" && memory.target_agent_name ? (
                            <p className="thread-link-meta">
                              {copy.memory.appliesToAgentPrefix}
                              {memory.target_agent_name}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.memory.incorrectFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                          <form
                            action={restoreMemory}
                            className="memory-card-actions"
                          >
                            <input name="memory_id" type="hidden" value={memory.id} />
                            <input
                              name="redirect_thread_id"
                              type="hidden"
                              value={thread?.id ?? ""}
                            />
                            <FormSubmitButton
                              className="button button-secondary memory-hide-button"
                              idleText={copy.memory.restore}
                              pendingText={copy.memory.restoring}
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {incorrectThreadLocalMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.incorrectTitle} ({incorrectThreadLocalMemories.length}) ·{" "}
                      {copy.memory.threadLocalTitle}
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {incorrectThreadLocalMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {copy.memory.incorrectBadge}
                              </span>
                            </div>
                            <span className="memory-confidence memory-confidence-low">
                              {copy.memory.removedFromRecall}
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">{copy.memory.incorrectHint}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          {getMemoryScope(memory) === "user_agent" && memory.target_agent_name ? (
                            <p className="thread-link-meta">
                              {copy.memory.appliesToAgentPrefix}
                              {memory.target_agent_name}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.memory.incorrectFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                          <form
                            action={restoreMemory}
                            className="memory-card-actions"
                          >
                            <input name="memory_id" type="hidden" value={memory.id} />
                            <input
                              name="redirect_thread_id"
                              type="hidden"
                              value={thread?.id ?? ""}
                            />
                            <FormSubmitButton
                              className="button button-secondary memory-hide-button"
                              idleText={copy.memory.restore}
                              pendingText={copy.memory.restoring}
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {supersededLongTermMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.supersededTitle} ({supersededLongTermMemories.length})
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {supersededLongTermMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                            </div>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          {getMemoryScope(memory) === "user_agent" && memory.target_agent_name ? (
                            <p className="thread-link-meta">
                              {copy.memory.appliesToAgentPrefix}
                              {memory.target_agent_name}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            {copy.memory.traceFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {supersededThreadLocalMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      {copy.memory.supersededTitle} ({supersededThreadLocalMemories.length}) ·{" "}
                      {copy.memory.threadLocalTitle}
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {supersededThreadLocalMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {getMemoryCategoryLabel(getMemoryCategory(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryScopeLabel(getMemoryScope(memory), locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getMemoryStatusLabel(memory.status, locale)}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {getStoredMemorySemanticTargetLabel(memory, locale)}
                              </span>
                            </div>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-effect-copy">
                            {getMemoryEffectHint({
                              scope: getMemoryScope(memory),
                              status: memory.status,
                              targetAgentId: memory.target_agent_id,
                              currentThreadAgentId: thread?.agent_id ?? null,
                              locale
                            })}
                          </p>
                          <p className="thread-link-meta">
                            {copy.memory.traceFromPrefix}
                            {memory.source_thread_title ?? copy.states.noThreadsTitle}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString(locale)}`
                              : ""}
                          </p>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </details>
          </aside>

          <section className="panel chat-panel">
            <section className="companion-session-shell">
              <div className="companion-session-shell-copy">
                <p className="eyebrow">{copy.page.shellEyebrow}</p>
                <h2>{copy.page.shellTitle}</h2>
                <p className="helper-copy">{copy.page.shellDescription}</p>
              </div>

              <div className="companion-session-shell-grid">
                <article className="session-shell-card">
                  <p className="session-shell-label">{copy.page.shellRoleLabel}</p>
                  <h3>{agent?.name ?? copy.page.shellRoleFallback}</h3>
                  <p className="helper-copy">
                    {agent?.persona_summary || copy.sidebar.noPersonaSummary}
                  </p>
                </article>

                <article className="session-shell-card">
                  <p className="session-shell-label">{copy.page.shellThreadLabel}</p>
                  <h3>{thread?.title ?? copy.page.shellThreadFallback}</h3>
                  <p className="helper-copy">
                    {thread
                      ? `${copy.sidebar.updatedPrefix}${formatThreadUpdatedAt(
                          thread.updated_at,
                          locale
                        )}`
                      : copy.states.noThreadsTitle}
                  </p>
                </article>

                <article className="session-shell-card">
                  <p className="session-shell-label">{copy.page.shellRailLabel}</p>
                  <h3>
                    {copy.sidebar.threadsTitle} · {copy.sidebar.agentsTitle} ·{" "}
                    {copy.memory.title}
                  </h3>
                  <p className="helper-copy">{copy.page.shellRailDescription}</p>
                </article>
              </div>
            </section>

            {requestedThreadFallback ? (
              <div className="notice notice-warning chat-inline-notice">
                {copy.states.requestedThreadFallback}
              </div>
            ) : null}

            {!thread ? (
              <ChatStateCard
                actions={
                  availableAgents.length > 0 ? (
                    <Link className="button" href="/chat" prefetch={false}>
                      {copy.states.retryChat}
                    </Link>
                  ) : (
                    <Link className="button button-secondary" href="/workspace">
                      {copy.states.backToWorkspace}
                    </Link>
                  )
                }
                description={
                  requestedThreadFallback
                    ? copy.states.threadUnavailableDescription
                    : availableAgents.length > 0
                      ? copy.states.noActiveThreadWithAgent
                      : copy.states.noActiveThreadWithoutAgent
                }
                eyebrow={
                  requestedThreadFallback
                    ? copy.states.threadUnavailableEyebrow
                    : copy.states.emptyStateEyebrow
                }
                title={
                  requestedThreadFallback
                    ? copy.states.threadUnavailableTitle
                    : copy.states.noActiveThreadTitle
                }
              />
            ) : (
              <ChatThreadView
                agentName={agent?.name ?? null}
                currentAgentEditor={
                  currentThreadAvailableAgent
                    ? {
                        id: currentThreadAvailableAgent.id,
                        name: currentThreadAvailableAgent.name,
                        persona_summary:
                          currentThreadAvailableAgent.persona_summary,
                        background_summary:
                          currentThreadAvailableAgent.background_summary,
                        avatar_emoji: currentThreadAvailableAgent.avatar_emoji,
                        system_prompt_summary:
                          currentThreadAvailableAgent.system_prompt_summary,
                        default_model_profile_id:
                          currentThreadAvailableAgent.default_model_profile_id,
                        isWorkspaceDefaultAgent:
                          currentThreadAvailableAgent.is_default_for_workspace
                      }
                    : null
                }
                workspaceDefaultAgentName={workspaceDefaultAgent?.name ?? null}
                initialMessages={messages}
                key={thread.id}
                locale={locale}
                modelProfiles={availableModelProfiles}
                memoryVisibility={memoryVisibility}
                audioPlayback={audioPlayback}
                thread={thread}
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
