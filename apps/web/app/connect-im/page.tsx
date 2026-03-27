import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { TelegramBindingForm } from "@/components/telegram-binding-form";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotEnv } from "@/lib/env";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductConnectImPageData } from "@/lib/product/connect-im";
import { buildPageMetadata } from "@/lib/site";
import { connectTelegramBinding } from "@/app/connect-im/actions";

export const metadata = buildPageMetadata({
  title: "Connect an IM Channel",
  description:
    "Protected SparkCore onboarding flow for binding an existing relationship thread to an IM channel.",
  path: "/connect-im",
  noIndex: true,
});

type ConnectImPageProps = {
  searchParams: Promise<{
    thread?: string;
    agent?: string;
    created?: string;
    feedback?: string;
    feedback_type?: string;
  }>;
};

export default async function ConnectImPage({
  searchParams,
}: ConnectImPageProps) {
  const params = await searchParams;
  const user = await requireUser("/connect-im");
  const supabase = await createClient();
  const [data, overview] = await Promise.all([
    loadProductConnectImPageData({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      agentId: typeof params.agent === "string" ? params.agent : null,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
    }),
  ]);
  const telegramBot = process.env.TELEGRAM_BOT_TOKEN
    ? getTelegramBotEnv()
    : null;

  if (!data) {
    return null;
  }

  const activeBindings = data.bindings.filter(
    (item) => item.status === "active",
  );
  const inactiveBindings = data.bindings.filter(
    (item) => item.status !== "active",
  );
  const hasBindingSuccess =
    params.feedback_type === "success" &&
    params.feedback?.includes("binding saved");
  const selectedBinding =
    activeBindings.find((binding) =>
      data.thread ? binding.threadId === data.thread.threadId : false,
    ) ??
    activeBindings[0] ??
    null;
  const otherActiveBindings = activeBindings.filter(
    (binding) => binding.id !== selectedBinding?.id,
  );

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link
            className="button button-primary"
            href="/app/settings?tab=channels"
          >
            Open channel settings
          </Link>
          <Link className="button button-secondary" href="/app">
            Skip for now
          </Link>
        </>
      }
      currentHref="/connect-im"
      description="Use this optional second step to attach Telegram after the role and canonical thread already exist. The goal is to move continuity into IM without leaving the same relationship loop."
      eyebrow="Connect IM"
      shellContext={overview}
      title="Attach the same relationship to a real IM channel."
    >
      {params.created === "1" ? (
        <ProductEventTracker
          event="create_completed"
          payload={{ surface: "connect_im", hasThread: Boolean(data.thread) }}
        />
      ) : null}
      {hasBindingSuccess ? (
        <ProductEventTracker
          event="im_bind_success"
          payload={{ surface: "connect_im", platform: "telegram" }}
        />
      ) : null}

      {params.created === "1" ? (
        <div className="notice notice-success">
          Role and thread created. You can now move into channel setup.
        </div>
      ) : null}

      {params.feedback ? (
        <div
          className={`notice ${
            params.feedback_type === "error" ? "notice-error" : "notice-success"
          }`}
        >
          {params.feedback}
        </div>
      ) : null}

      {hasBindingSuccess ? (
        <div className="site-card-grid">
          <article className="site-card">
            <h2>Binding saved</h2>
            <p>
              Your Telegram identity is now attached to the selected role and
              canonical thread.
            </p>
            <div className="toolbar">
              <Link className="button" href="/app/chat">
                Open web continuation
              </Link>
              <Link
                className="button button-secondary"
                href="/app/settings?tab=channels"
              >
                Review channel settings
              </Link>
            </div>
          </article>
        </div>
      ) : null}

      <div className="connect-im-body">
        <section className="site-card connect-im-primary-card">
          <div className="connect-im-primary-header">
            <div className="connect-im-primary-copy">
              <p className="home-kicker">Binding task</p>
              <h2>Bind Telegram identity</h2>
              <p>
                This is the one focused job on this page: take the existing role
                thread and attach it to a real Telegram identity. In most 1:1
                chats you only need the values the bot returns after your first
                message.
              </p>
            </div>
            <div className="toolbar">
              <Link
                className="button button-secondary"
                href="/app/settings?tab=channels"
              >
                Review channel posture
              </Link>
            </div>
          </div>

          <div className="connect-im-step-list">
            <article className="connect-im-step-card">
              <span className="site-inline-pill">Step 1</span>
              <p>
                {telegramBot?.botUsername
                  ? `Open Telegram and message @${telegramBot.botUsername} from the account you want to bind.`
                  : "Open your Telegram bot from the account you want to bind."}
              </p>
            </article>
            <article className="connect-im-step-card">
              <span className="site-inline-pill">Step 2</span>
              <p>
                Send any message first. The bot will reply with the identity
                values you need for binding.
              </p>
            </article>
            <article className="connect-im-step-card">
              <span className="site-inline-pill">Step 3</span>
              <p>
                Paste those values below and save. In most 1:1 chats, only
                `channel_id` and `peer_id` need your attention.
              </p>
            </article>
          </div>

          {data.role && data.thread ? (
            <form action={connectTelegramBinding} className="stack">
              <TelegramBindingForm
                agentId={data.role.agentId}
                threadId={data.thread.threadId}
              />
            </form>
          ) : (
            <div className="product-empty-state">
              <p>
                Create a role and canonical thread first so Telegram has a
                target to bind.
              </p>
            </div>
          )}
        </section>

        <aside className="connect-im-aside">
          <section className="site-card connect-im-context-card">
            <div className="product-status-card-head">
              <h2>Selected loop</h2>
              <span
                className={`product-status-pill ${
                  selectedBinding
                    ? "product-status-pill-ready"
                    : "product-status-pill-warning"
                }`}
              >
                {selectedBinding ? "Already attached" : "Ready to bind"}
              </span>
            </div>
            <div className="product-compact-metrics">
              <article className="product-setting-metric">
                <span>Role</span>
                <strong>{data.role?.name ?? "No role selected"}</strong>
                <p>
                  {data.role?.personaSummary ??
                    "Create a role first to continue."}
                </p>
              </article>
              <article className="product-setting-metric">
                <span>Thread</span>
                <strong>{data.thread?.title ?? "No thread selected"}</strong>
                <p>
                  {data.thread?.threadId ??
                    "A canonical thread is created during role setup."}
                </p>
              </article>
              <article className="product-setting-metric">
                <span>Live paths</span>
                <strong>{activeBindings.length}</strong>
                <p>
                  {data.bindings.length > 0
                    ? data.bindings.map((item) => item.platform).join(", ")
                    : "No channel is attached yet."}
                </p>
              </article>
            </div>
            <div className="product-route-list">
              <article className="product-route-item">
                <strong>
                  {selectedBinding
                    ? "This role and thread already have a live Telegram path."
                    : "Saving this form will create the first live IM path for the selected loop."}
                </strong>
                <p>
                  {selectedBinding
                    ? "Use this page when you need to inspect or reattach the current loop, not when the active path is already healthy."
                    : "The role and canonical thread are already selected. The only remaining job is binding the Telegram identity returned by the bot."}
                </p>
              </article>
              <article className="product-route-item">
                <strong>
                  {otherActiveBindings.length > 0
                    ? "Multiple live paths already exist."
                    : "One live path is enough for most relationships."}
                </strong>
                <p>
                  {otherActiveBindings.length > 0
                    ? "If the wrong live path is carrying continuity, review the full channel catalog in settings."
                    : "Stay here for binding. Use settings only when you need to compare or retire older paths."}
                </p>
                <Link
                  className="site-inline-link"
                  href="/app/settings?tab=channels"
                >
                  Open channel settings
                </Link>
              </article>
            </div>
          </section>

          <section className="site-card">
            <div className="product-status-card-head">
              <h2>Binding inventory</h2>
              <span className="product-status-pill product-status-pill-neutral">
                {data.bindings.length} total
              </span>
            </div>
            {selectedBinding ? (
              <div className="stack">
                <article className="memory-card connect-im-binding-card connect-im-binding-card-active">
                  <div className="memory-card-row">
                    <div className="memory-badges">
                      <span className="thread-badge">
                        {selectedBinding.platform}
                      </span>
                      <span className="thread-badge thread-badge-live">
                        active
                      </span>
                    </div>
                  </div>
                  <p className="memory-content">
                    {selectedBinding.agentName ?? "Attached role"}
                  </p>
                  <p className="helper-copy">
                    {selectedBinding.threadTitle ??
                      selectedBinding.threadId ??
                      "No canonical thread recorded"}
                  </p>
                  <div className="connect-im-binding-meta">
                    <span>Channel: {selectedBinding.channelId}</span>
                    <span>Peer: {selectedBinding.peerId}</span>
                  </div>
                  <Link
                    className="site-inline-link"
                    href={
                      selectedBinding.threadId
                        ? `/connect-im?thread=${encodeURIComponent(selectedBinding.threadId)}&agent=${encodeURIComponent(selectedBinding.agentId)}`
                        : `/connect-im?agent=${encodeURIComponent(selectedBinding.agentId)}`
                    }
                  >
                    Inspect this binding
                  </Link>
                </article>
              </div>
            ) : (
              <p className="helper-copy">
                No live IM binding is attached yet. Once saved, the active path
                will appear here first.
              </p>
            )}

            {otherActiveBindings.length > 0 ? (
              <details className="memory-hidden-shell">
                <summary className="memory-hidden-summary">
                  Other live paths ({otherActiveBindings.length})
                </summary>
                <div className="stack">
                  {otherActiveBindings.map((binding) => (
                    <article
                      className="memory-card connect-im-binding-card connect-im-binding-card-active"
                      key={binding.id}
                    >
                      <div className="memory-card-row">
                        <div className="memory-badges">
                          <span className="thread-badge">
                            {binding.platform}
                          </span>
                          <span className="thread-badge thread-badge-live">
                            active
                          </span>
                        </div>
                      </div>
                      <p className="memory-content">
                        {binding.agentName ?? "Attached role"}
                      </p>
                      <p className="helper-copy">
                        {binding.threadTitle ??
                          binding.threadId ??
                          "No canonical thread recorded"}
                      </p>
                      <div className="connect-im-binding-meta">
                        <span>Channel: {binding.channelId}</span>
                        <span>Peer: {binding.peerId}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}

            {inactiveBindings.length > 0 ? (
              <details className="memory-hidden-shell">
                <summary className="memory-hidden-summary">
                  Previous bindings ({inactiveBindings.length})
                </summary>
                <div className="stack">
                  {inactiveBindings.map((binding) => (
                    <article
                      className="memory-card connect-im-binding-card"
                      key={binding.id}
                    >
                      <div className="memory-card-row">
                        <div className="memory-badges">
                          <span className="thread-badge">
                            {binding.platform}
                          </span>
                          <span className="thread-badge thread-badge-muted">
                            {binding.status}
                          </span>
                        </div>
                      </div>
                      <p className="memory-content">
                        {binding.agentName ?? "Attached role"}
                      </p>
                      <p className="helper-copy">
                        {binding.threadTitle ??
                          binding.threadId ??
                          "No canonical thread recorded"}
                      </p>
                      <div className="connect-im-binding-meta">
                        <span>Channel: {binding.channelId}</span>
                        <span>Peer: {binding.peerId}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </aside>
      </div>
    </ProductConsoleShell>
  );
}
