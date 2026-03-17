import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/login/actions";
import { ChatThreadView } from "@/app/chat/chat-thread-view";
import {
  createThread,
  hideMemory,
  markMemoryIncorrect,
  restoreMemory,
  setDefaultAgent
} from "@/app/chat/actions";
import { CreateAgentSheet } from "@/app/chat/create-agent-sheet";
import { AgentEditSheet } from "@/app/chat/agent-edit-sheet";
import { ThreadUrlSync } from "@/app/chat/thread-url-sync";
import { getChatPageState } from "@/lib/chat/runtime";

function getMemoryConfidenceView(confidence: number) {
  if (confidence >= 0.9) {
    return {
      tone: "strong",
      label: "High confidence"
    } as const;
  }

  if (confidence >= 0.8) {
    return {
      tone: "medium",
      label: "Moderate confidence"
    } as const;
  }

  return {
    tone: "low",
    label: "Low confidence"
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

function getMemoryTrustHint({
  confidence,
  metadata
}: {
  confidence: number;
  metadata: Record<string, unknown> | undefined;
}) {
  if (hasMetadataFlag(metadata, "restored_at")) {
    return "Restored memory. It is visible again and can be used in recall.";
  }

  if (confidence >= 0.9) {
    return "Strong signal from a clear, stable user statement.";
  }

  if (confidence >= 0.8) {
    return "Useful signal, but shown with slightly lighter emphasis.";
  }

  return "Lower-confidence memory. It stays readable, but is visually softened.";
}

function formatThreadUpdatedAt(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = timestamp - now;
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const relativeFormatter = new Intl.RelativeTimeFormat("en", {
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

  return new Date(dateString).toLocaleDateString();
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
  let chatState;

  try {
    chatState = await getChatPageState({
      requestedThreadId: params.thread
    });
  } catch (error) {
    const fetchFailedMessage =
      error instanceof Error
        ? error.message
        : "Chat data could not be loaded right now.";

    return (
      <main className="shell">
        <div className="app-shell">
          <div className="topbar">
            <div>
              <p className="eyebrow">Chat</p>
              <h1 className="title">Chat workspace is unavailable</h1>
            </div>

            <div className="toolbar">
              <Link className="button button-secondary" href="/workspace">
                Workspace
              </Link>
            </div>
          </div>

          <ChatStateCard
            actions={
              <>
                <Link className="button" href="/chat" prefetch={false}>
                  Retry chat
                </Link>
                <Link className="button button-secondary" href="/workspace">
                  Back to workspace
                </Link>
              </>
            }
            description="This is a chat data load failure, not an empty workspace. Refresh to retry the current chat view."
            eyebrow="Fetch failed"
            notice={{
              tone: "error",
              message: fetchFailedMessage
            }}
            title="Chat data could not be loaded"
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
            <p className="eyebrow">Chat</p>
            <h1 className="title">Thread workspace is ready</h1>
          </div>

          <div className="toolbar">
            <Link className="button button-secondary" href="/workspace">
              Workspace
            </Link>
            <form action={signOut}>
              <FormSubmitButton
                className="button button-secondary"
                idleText="Sign out"
                pendingText="Signing out..."
              />
            </form>
          </div>
        </div>

        <section className="hero">
          <h2>Chat foundation for multi-thread work</h2>
          <p>
            Threads now resolve from the URL, the sidebar stays aligned with the
            active conversation, and each thread keeps its own agent binding and
            message history.
          </p>
        </section>

        {pageFeedback ? (
          <div className={`notice notice-${pageFeedback.tone} chat-page-feedback`}>
            {pageFeedback.message}
          </div>
        ) : null}

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <div className="thread-sidebar-header">
              <h2>Threads</h2>
              <p className="helper-copy">Workspace: {workspace.name}</p>
              <p className="section-hint">
                Each thread keeps its own URL, bound agent, and message history.
              </p>
            </div>

            {availableAgents.length > 0 ? (
              <form action={createThread} className="thread-create-form">
                <label className="field" htmlFor="agent_id">
                  <span className="label">Start a new chat</span>
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
                    ? `Workspace default agent: ${workspaceDefaultAgent.name}. This only preselects the agent for future new threads. It does not switch the agent already bound to the thread you are viewing.`
                    : "No workspace default agent is set yet. Choose the active agent you want for the next thread. This choice does not change the current thread."}
                </p>

                <FormSubmitButton
                  className="button"
                  idleText="New chat"
                  pendingText="Creating..."
                />
              </form>
            ) : (
              <div className="empty-state section-empty-state">
                <p className="lead chat-thread-title">No active agent available</p>
                <p className="helper-copy">
                  Add or restore an agent before creating a new thread. Once an
                  active agent is available, it can be selected here.
                </p>
              </div>
            )}

            {threads.length === 0 ? (
              <div className="empty-state">
                <p className="lead chat-thread-title">No threads yet</p>
                <p className="helper-copy">
                  {availableAgents.length > 0
                    ? "Choose an agent above to create the first thread. Once it exists, it will appear here and stay synced with the URL."
                    : "Create or restore an agent first, then come back here to open the first thread."}
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
                        {item.agent_name ?? "Unassigned agent"}
                      </p>
                      <p className="thread-link-preview">
                        {item.latest_message_preview ??
                          "No messages yet. Start the first turn in this thread."}
                      </p>
                      <p className="thread-link-meta">
                        Updated {formatThreadUpdatedAt(item.updated_at)}
                      </p>
                    </Link>
                  );
                })}
              </nav>
            )}

            <details className="sidebar-section" open>
              <summary className="sidebar-section-summary">
                <div className="agent-panel-header">
                  <h3>Agents</h3>
                  <p className="helper-copy">
                    Visible here so new threads can bind to a known agent without
                    opening a separate management screen.
                  </p>
                  <p className="section-hint">
                    Create or adjust agents here, then use them when starting the
                    next thread.
                  </p>
                </div>
              </summary>

              <div className="sidebar-section-body agent-panel">
                <CreateAgentSheet personaPacks={availablePersonaPacks} />

                {availableAgents.length === 0 ? (
                  <div className="empty-state section-empty-state">
                    <p className="helper-copy">
                      No active agent is available yet. Create one from a persona
                      pack here, then it will appear with its model profile and
                      become selectable for new threads.
                    </p>
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
                                <span className="thread-badge">Workspace default</span>
                              ) : null}
                              {isCurrent ? (
                                <span className="thread-badge">This thread</span>
                              ) : null}
                            </div>
                          </div>
                          <p className="thread-link-meta">
                            Persona pack:{" "}
                            {availableAgent.source_persona_pack_name ??
                              (availableAgent.is_custom ? "Custom" : "System preset")}
                          </p>
                          <p className="thread-link-meta">
                            Persona:{" "}
                            {availableAgent.persona_summary ||
                              "No persona summary is available yet."}
                          </p>
                          {availableAgent.background_summary ? (
                            <p className="agent-background-copy">
                              Background: {availableAgent.background_summary}
                            </p>
                          ) : null}
                          <p className="thread-link-meta">
                            Model profile:{" "}
                            {availableAgent.default_model_profile_name ?? "Unassigned"}
                            {availableAgent.default_model_profile_tier_label
                              ? ` · ${availableAgent.default_model_profile_tier_label}`
                              : ""}
                          </p>
                          <p className="agent-impact-copy">
                            {isCurrent
                              ? "This agent is bound to the current thread. It can reference long-term memory when relevant, and any edits here only affect future replies from this thread."
                              : availableAgent.is_default_for_workspace
                                ? "This agent is the workspace default for future new threads. It does not replace the thread agent that is already replying here."
                                : "This agent is available for future threads when you choose it, but it is not the one replying in the current thread right now."}
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
                                    ? "Default agent"
                                    : "Set as default"
                                }
                                pendingText="Saving..."
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
                                  availableAgent.system_prompt_summary,
                                default_model_profile_id:
                                  availableAgent.default_model_profile_id
                              }}
                              modelProfiles={availableModelProfiles}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>

            <details className="sidebar-section sidebar-section-memory" open>
              <summary className="sidebar-section-summary">
                <div className="agent-panel-header">
                  <h3>Memory</h3>
                  <p className="helper-copy">
                    Recent profile and preference memories stay visible inside the
                    chat workspace so users can understand what the system has
                    retained.
                  </p>
                  <p className="section-hint">
                    Use this panel to see what long-term memory is available,
                    hidden, or marked incorrect.
                  </p>
                </div>
              </summary>

              <div className="sidebar-section-body agent-panel memory-panel">
                <div className="memory-trust-note">
                  <p className="helper-copy">
                    Trust cues stay lightweight here: lower-confidence memories
                    are softened visually, hidden memories stay out of recall
                    until restored, and incorrect memories send a stronger
                    correction signal.
                  </p>
                </div>

                <div className="memory-policy-note">
                  <p className="helper-copy">
                    SparkCore is more likely to remember clear, stable profile
                    facts and preferences. It is less likely to keep one-off
                    moods, temporary plans, or vague guesses as long-term
                    memory.
                  </p>
                  <p className="helper-copy">
                    Hidden memory stays out of recall until restored. Lower-confidence
                    memory can still appear, but it is shown with lighter emphasis.
                  </p>
                </div>

                {visibleMemories.length === 0 ? (
                  <div className="empty-state section-empty-state">
                    <p className="helper-copy">
                      No long-term memory has been written yet. Once a clear
                      profile or preference is extracted, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="memory-list">
                    {visibleMemories.map((memory) => {
                      const confidenceView = getMemoryConfidenceView(memory.confidence);
                      const trustHint = getMemoryTrustHint({
                        confidence: memory.confidence,
                        metadata: memory.metadata
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
                              <span className="thread-badge">{memory.memory_type}</span>
                              {isRestored ? (
                                <span className="thread-badge thread-badge-muted">
                                  Restored
                                </span>
                              ) : null}
                            </div>
                            <span
                              className={`memory-confidence memory-confidence-${confidenceView.tone}`}
                            >
                              {confidenceView.label} · {memory.confidence.toFixed(2)}
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">{trustHint}</p>
                          <p className="thread-link-meta">
                            Stored {new Date(memory.created_at).toLocaleString()}
                          </p>
                          <div className="memory-trace">
                            <p className="memory-trace-copy">
                              {memory.source_thread_id ? (
                                <>
                                  From{" "}
                                  <span className="memory-trace-emphasis">
                                    {memory.source_thread_title ?? "Untitled thread"}
                                  </span>
                                  {memory.source_timestamp
                                    ? ` · ${new Date(memory.source_timestamp).toLocaleString()}`
                                    : ""}
                                </>
                              ) : (
                                "Source trace is unavailable for this memory."
                              )}
                            </p>
                            {memory.source_thread_id ? (
                              <Link
                                className="memory-trace-link"
                                href={`/chat?thread=${memory.source_thread_id}`}
                                prefetch={false}
                              >
                                View context
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
                              idleText="Hide"
                              pendingText="Hiding..."
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
                                idleText="Incorrect"
                                pendingText="Saving..."
                              />
                            </form>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}

                {hiddenMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      Hidden memories ({hiddenMemories.length})
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {hiddenMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <span className="thread-badge">{memory.memory_type}</span>
                            <span className="memory-confidence memory-confidence-low">
                              Hidden
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">
                            Hidden memories stay out of recall until you restore
                            them. Use this when you do not want to see a memory
                            right now, but are not marking it as wrong.
                          </p>
                          <p className="thread-link-meta">
                            Hidden from{" "}
                            {memory.source_thread_title ?? "an older thread"}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString()}`
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
                              idleText="Restore"
                              pendingText="Restoring..."
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}

                {incorrectMemories.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      Incorrect memories ({incorrectMemories.length})
                    </summary>

                    <div className="memory-list memory-list-hidden">
                      {incorrectMemories.map((memory) => (
                        <article className="memory-card memory-card-hidden" key={memory.id}>
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">{memory.memory_type}</span>
                              <span className="thread-badge thread-badge-muted">
                                Incorrect
                              </span>
                            </div>
                            <span className="memory-confidence memory-confidence-low">
                              Removed from recall
                            </span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                          <p className="memory-trust-copy">
                            Marked incorrect. This is stronger than hide and keeps
                            the memory out of recall until you restore it.
                          </p>
                          <p className="thread-link-meta">
                            Flagged from{" "}
                            {memory.source_thread_title ?? "an older thread"}
                            {memory.source_timestamp
                              ? ` · ${new Date(memory.source_timestamp).toLocaleString()}`
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
                              idleText="Restore"
                              pendingText="Restoring..."
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </details>
          </aside>

          <section className="panel chat-panel">
            {requestedThreadFallback ? (
              <div className="notice notice-warning chat-inline-notice">
                The requested thread is unavailable in your current workspace, so
                the latest accessible thread is shown instead.
              </div>
            ) : null}

            {!thread ? (
              <ChatStateCard
                actions={
                  availableAgents.length > 0 ? (
                    <Link className="button" href="/chat" prefetch={false}>
                      Refresh thread view
                    </Link>
                  ) : (
                    <Link className="button button-secondary" href="/workspace">
                      Back to workspace
                    </Link>
                  )
                }
                description={
                  requestedThreadFallback
                    ? "The thread in the URL is no longer available in this user scope. If another accessible thread exists, it will appear in the sidebar."
                    : availableAgents.length > 0
                      ? "Create a thread from the sidebar to bind it to one agent and open the conversation here."
                      : "There is no active thread yet, and this workspace also needs an active agent before chat can start."
                }
                eyebrow={requestedThreadFallback ? "Thread unavailable" : "Empty state"}
                title={
                  requestedThreadFallback
                    ? "This thread is not available"
                    : "No active thread yet"
                }
              />
            ) : (
              <ChatThreadView
                agentName={agent?.name ?? null}
                workspaceDefaultAgentName={workspaceDefaultAgent?.name ?? null}
                initialMessages={messages}
                key={thread.id}
                thread={thread}
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
