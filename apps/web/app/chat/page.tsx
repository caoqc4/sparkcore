import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/login/actions";
import { ChatThreadView } from "@/app/chat/chat-thread-view";
import { createThread, setDefaultAgent } from "@/app/chat/actions";
import { CreateAgentSheet } from "@/app/chat/create-agent-sheet";
import { ThreadUrlSync } from "@/app/chat/thread-url-sync";
import { getChatPageState } from "@/lib/chat/runtime";

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; thread?: string }>;
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
              <h1 className="title">Thread workspace is unavailable</h1>
            </div>

            <div className="toolbar">
              <Link className="button button-secondary" href="/workspace">
                Workspace
              </Link>
            </div>
          </div>

          <section className="panel thread-status-panel">
            <div className="thread-status-copy">
              <h2>Chat data could not be loaded</h2>
              <p className="helper-copy">
                This is a thread data load failure, not an empty workspace.
                Refresh the page to retry the current thread.
              </p>
            </div>

            <div className="notice notice-error">{fetchFailedMessage}</div>

            <div className="thread-status-actions">
              <Link className="button" href="/chat" prefetch={false}>
                Retry chat
              </Link>
              <Link className="button button-secondary" href="/workspace">
                Back to workspace
              </Link>
            </div>
          </section>
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
    availableAgents,
    defaultAgentId,
    visibleMemories,
    threads,
    thread,
    agent,
    messages,
    canonicalThreadId,
    shouldReplaceUrl,
    requestedThreadFallback
  } = chatState;

  return (
    <main className="shell">
      <div className="app-shell">
        <ThreadUrlSync
          canonicalThreadId={canonicalThreadId}
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

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <div className="thread-sidebar-header">
              <h2>Threads</h2>
              <p className="helper-copy">Workspace: {workspace.name}</p>
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

                <FormSubmitButton
                  className="button"
                  idleText="New chat"
                  pendingText="Creating..."
                />
              </form>
            ) : (
              <div className="notice notice-error">
                No active agent is available for this workspace yet. Add or
                restore an agent before creating a new thread.
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
                      <p className="thread-link-meta">
                        Updated {new Date(item.updated_at).toLocaleString()}
                      </p>
                    </Link>
                  );
                })}
              </nav>
            )}

            <section className="agent-panel">
              <div className="agent-panel-header">
                <h3>Agents</h3>
                <p className="helper-copy">
                  Visible here so new threads can bind to a known agent without
                  opening a separate management screen.
                </p>
              </div>

              <CreateAgentSheet personaPacks={availablePersonaPacks} />

              {availableAgents.length === 0 ? (
                <div className="empty-state">
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
                          <h4 className="agent-card-title">{availableAgent.name}</h4>
                          <div className="agent-card-badges">
                            {availableAgent.is_default_for_workspace ? (
                              <span className="thread-badge">Default</span>
                            ) : null}
                            {isCurrent ? (
                              <span className="thread-badge">Current thread</span>
                            ) : null}
                          </div>
                        </div>
                        <p className="thread-link-meta">
                          Persona pack:{" "}
                          {availableAgent.source_persona_pack_name ??
                            (availableAgent.is_custom ? "Custom" : "System preset")}
                        </p>
                        <p className="thread-link-meta">
                          Model profile:{" "}
                          {availableAgent.default_model_profile_name ?? "Unassigned"}
                        </p>
                        <form action={setDefaultAgent} className="agent-card-action">
                          <input name="agent_id" type="hidden" value={availableAgent.id} />
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
                            pendingText={
                              availableAgent.is_default_for_workspace
                                ? "Saving..."
                                : "Setting..."
                            }
                          />
                        </form>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="agent-panel memory-panel">
              <div className="agent-panel-header">
                <h3>Memory</h3>
                <p className="helper-copy">
                  Recent profile and preference memories stay visible inside the
                  chat workspace so users can understand what the system has
                  retained.
                </p>
              </div>

              {visibleMemories.length === 0 ? (
                <div className="empty-state">
                  <p className="helper-copy">
                    No long-term memory has been written yet. Once a clear
                    profile or preference is extracted, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="memory-list">
                  {visibleMemories.map((memory) => (
                    <article className="memory-card" key={memory.id}>
                      <div className="memory-card-row">
                        <span className="thread-badge">{memory.memory_type}</span>
                        <span className="memory-confidence">
                          Confidence {memory.confidence.toFixed(2)}
                        </span>
                      </div>
                      <p className="memory-content">{memory.content}</p>
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
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <section className="panel chat-panel">
            {requestedThreadFallback ? (
              <div className="notice notice-warning">
                The requested thread is unavailable in your current workspace, so
                the latest accessible thread is shown instead.
              </div>
            ) : null}

            {!thread ? (
              <div className="empty-state">
                <h2>
                  {requestedThreadFallback ? "Thread unavailable" : "No active thread"}
                </h2>
                <p className="helper-copy">
                  {requestedThreadFallback
                    ? "The thread in the URL is no longer available in this user scope. If another thread exists, it should appear in the sidebar."
                    : availableAgents.length > 0
                    ? "Create a thread from the sidebar to bind it to one agent and open it here."
                    : "There is no active thread and no available agent yet, so this workspace cannot open a chat thread."}
                </p>
              </div>
            ) : (
              <ChatThreadView
                agentName={agent?.name ?? null}
                initialError={params.error}
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
