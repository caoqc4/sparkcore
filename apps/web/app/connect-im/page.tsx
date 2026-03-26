import Link from "next/link";
import { TelegramBindingForm } from "@/components/telegram-binding-form";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotEnv } from "@/lib/env";
import { loadProductConnectImPageData } from "@/lib/product/connect-im";
import { connectTelegramBinding } from "@/app/connect-im/actions";

type ConnectImPageProps = {
  searchParams: Promise<{
    thread?: string;
    agent?: string;
    created?: string;
    feedback?: string;
    feedback_type?: string;
  }>;
};

export default async function ConnectImPage({ searchParams }: ConnectImPageProps) {
  const params = await searchParams;
  const user = await requireUser("/connect-im");
  const supabase = await createClient();
  const data = await loadProductConnectImPageData({
    supabase,
    userId: user.id,
    threadId: typeof params.thread === "string" ? params.thread : null,
    agentId: typeof params.agent === "string" ? params.agent : null
  });
  const telegramBot = process.env.TELEGRAM_BOT_TOKEN ? getTelegramBotEnv() : null;

  if (!data) {
    return null;
  }
  const activeBindings = data.bindings.filter((item) => item.status === "active");

  return (
    <main className="shell">
      <section className="card card-wide">
        {params.created === "1" ? (
          <ProductEventTracker
            event="create_completed"
            payload={{ surface: "connect_im", hasThread: Boolean(data.thread) }}
          />
        ) : null}
        {params.feedback_type === "success" &&
        params.feedback?.includes("binding saved") ? (
          <ProductEventTracker
            event="im_bind_success"
            payload={{ surface: "connect_im", platform: "telegram" }}
          />
        ) : null}
        <p className="eyebrow">Connect IM</p>
        <h1 className="title">Attach your relationship thread to a real channel.</h1>
        <p className="lead">
          This flow now supports a real Telegram binding write. It keeps the product layer focused
          on relationship setup while the webhook runtime continues to live in the integration layer.
        </p>

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

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Current role</h2>
            <p>{data.role?.name ?? "No role selected."}</p>
            <p>{data.role?.personaSummary ?? "Create a role first to continue."}</p>
          </article>

          <article className="site-card">
            <h2>Canonical thread</h2>
            <p>{data.thread?.title ?? "No thread selected."}</p>
            <p>{data.thread?.threadId ?? "Create a role to generate a thread."}</p>
          </article>

          <article className="site-card">
            <h2>Active bindings</h2>
            <p>{activeBindings.length} active channel(s)</p>
            <p>
              {data.bindings.length > 0
                ? data.bindings.map((item) => item.platform).join(", ")
                : "No channel bound yet."}
            </p>
          </article>
        </div>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Telegram setup</h2>
            {telegramBot?.botUsername ? (
              <>
                <p>1. Open Telegram and message @{telegramBot.botUsername} from the account you want to bind.</p>
                <p>2. Send any message before binding. The bot will reply with your Telegram identity values.</p>
                <p>3. Paste those values below to attach that identity to this role thread.</p>
              </>
            ) : (
              <>
                <p>1. Open your Telegram bot and send it a message from the account you want to bind.</p>
                <p>2. The unbound reply now includes your `channel_id`, `peer_id`, and `platform_user_id`.</p>
                <p>3. Paste those values below to attach the binding.</p>
              </>
            )}
          </article>

          <article className="site-card">
            <h2>Where to go next</h2>
            <p>
              Once Telegram is saved, incoming messages on that identity can resolve to the
              selected role and canonical thread.
            </p>
            <Link className="site-inline-link" href="/dashboard">
              Open dashboard
            </Link>
          </article>
        </div>

        <div className="page-frame-body">
          <section className="site-card">
            <h2>Bind Telegram identity</h2>
            {data.role && data.thread ? (
              <form action={connectTelegramBinding} className="stack">
                <TelegramBindingForm
                  agentId={data.role.agentId}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : (
              <p className="helper-copy">Create a role and canonical thread first so Telegram has a target to bind.</p>
            )}
          </section>

          <section className="site-card">
            <h2>Existing bindings</h2>
            {data.bindings.length > 0 ? (
              <div className="stack">
                {data.bindings.map((binding) => (
                  <article className="memory-card" key={binding.id}>
                    <div className="memory-card-row">
                      <div className="memory-badges">
                        <span className="thread-badge">{binding.platform}</span>
                        <span className="thread-badge thread-badge-muted">{binding.status}</span>
                      </div>
                    </div>
                    <p className="helper-copy">Channel: {binding.channelId}</p>
                    <p className="helper-copy">Peer: {binding.peerId}</p>
                    <p className="helper-copy">
                      Attached thread: {binding.threadId ?? "No canonical thread recorded"}
                    </p>
                    <p className="helper-copy">Updated: {binding.updatedAt ?? "Unknown"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="helper-copy">
                No IM binding is attached yet. Once saved, this section will reflect the real
                channel rows from `channel_bindings`.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
