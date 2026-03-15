import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { signOut } from "@/app/login/actions";
import { sendMessage } from "@/app/chat/actions";
import { createClient } from "@/lib/supabase/server";

async function getChatState() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  let { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!thread) {
    const { data: createdThread, error } = await supabase
      .from("threads")
      .insert({
        workspace_id: workspace.id,
        owner_user_id: user.id,
        title: "New chat"
      })
      .select("id, title, status, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`Failed to create default chat thread: ${error.message}`);
    }

    thread = createdThread;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  return {
    user,
    workspace,
    thread,
    messages: messages ?? []
  };
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { user, workspace, thread, messages } = await getChatState();

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
            This page keeps the first chat flow intentionally narrow: one active
            thread, user-authenticated reads and writes, and a composer that
            saves messages into Supabase. Agent replies will be added next.
          </p>
        </section>

        <section className="chat-layout">
          <aside className="panel chat-sidebar">
            <h2>Active thread</h2>
            <p className="lead chat-thread-title">{thread.title}</p>
            <ul className="list">
              <li>Workspace: {workspace.name}</li>
              <li>Thread status: {thread.status}</li>
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
                  Messages are saved to Supabase now. Agent responses will be
                  added in the next runtime issue.
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
