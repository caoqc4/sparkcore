import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/login/actions";
import { sendMessage } from "@/app/chat/actions";
import { getChatState } from "@/lib/chat/runtime";

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const chatState = await getChatState();

  if (!chatState) {
    redirect("/login");
  }

  if (!chatState.workspace || !chatState.thread || !chatState.agent) {
    redirect("/workspace");
  }

  const { user, workspace, thread, agent, messages } = chatState;

  return (
    <main className="shell">
      <div className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">Minimal chat</p>
            <h1 className="title">Single-thread chat is ready</h1>
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
          <h2>Chat foundation for issue #10</h2>
          <p>
            The first runtime loop is now active: each thread is bound to a
            single agent, user messages are persisted, and assistant replies are
            generated from the agent prompt plus thread history.
          </p>
        </section>

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <h2>Active thread</h2>
            <p className="lead chat-thread-title">{thread.title}</p>
            <ul className="list">
              <li>Workspace: {workspace.name}</li>
              <li>Thread status: {thread.status}</li>
              <li>Active agent: {agent.name}</li>
              <li>Signed in as: {user.email}</li>
              <li>Messages stored: {messages.length}</li>
            </ul>
          </aside>

          <section className="panel chat-panel">
            {params.error ? (
              <div className="notice notice-error">{params.error}</div>
            ) : null}

            <div className="message-list">
              {messages.length === 0 ? (
                <div className="message message-assistant">
                  <p className="message-role">Assistant</p>
                  <p className="message-content">
                    No messages yet. Send the first user message to create the
                    initial chat history for this thread.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    className={`message ${
                      message.role === "user"
                        ? "message-user"
                        : "message-assistant"
                    }`}
                    key={message.id}
                  >
                    <p className="message-role">{message.role}</p>
                    <p className="message-content">{message.content}</p>
                  </article>
                ))
              )}
            </div>

            <form action={sendMessage} className="composer">
              <input name="thread_id" type="hidden" value={thread.id} />
              <label className="field" htmlFor="content">
                <span className="label">Message</span>
                <textarea
                  className="input textarea"
                  id="content"
                  name="content"
                  placeholder="Send the first message for SparkCore..."
                  required
                  rows={4}
                />
              </label>

              <div className="composer-footer">
                <p className="helper-copy">
                  This thread stays bound to one agent instance. Sending a
                  message will also trigger an assistant reply through LiteLLM.
                </p>
                <FormSubmitButton
                  idleText="Send message"
                  pendingText="Sending..."
                />
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
