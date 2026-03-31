import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { TelegramBindingForm } from "@/components/telegram-binding-form";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotConfig } from "@/lib/env";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductConnectImPageData } from "@/lib/product/connect-im";
import {
  getCharacterChannelLabel,
  recommendCharacterChannel
} from "@/lib/product/character-channels";
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

  if (!data) {
    return null;
  }

  const recommendedCharacterChannel =
    data.role
      ? recommendCharacterChannel({
          mode: data.role.mode,
          avatarGender: data.role.avatarGender
        })
      : null;
  const telegramBot =
    recommendedCharacterChannel &&
    process.env[`TELEGRAM_BOT_TOKEN_${recommendedCharacterChannel.toUpperCase()}`]
      ? getTelegramBotConfig(recommendedCharacterChannel)
      : null;

  const activeBindings = data.bindings.filter((b) => b.status === "active");
  const hasBindingSuccess =
    params.feedback_type === "success" &&
    params.feedback?.includes("binding saved");
  const existingBinding =
    activeBindings.find((b) =>
      data.thread ? b.threadId === data.thread.threadId : false,
    ) ?? activeBindings[0] ?? null;

  const botUsername = telegramBot?.botUsername ?? null;
  const recommendedBotName = recommendedCharacterChannel
    ? getCharacterChannelLabel(recommendedCharacterChannel)
    : null;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href="/app/channels">
            View channels
          </Link>
          <Link className="button button-secondary" href="/app/chat">
            Back to chat
          </Link>
        </>
      }
      currentHref="/connect-im"
      description="Link your Telegram account to this companion."
      eyebrow="Telegram"
      shellContext={overview}
      title="Connect Telegram"
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

      {/* ── Feedback notices ── */}
      {params.created === "1" ? (
        <div className="notice notice-success">
          Role created. Connect Telegram to reach this companion from your phone.
        </div>
      ) : null}

      {params.feedback && !hasBindingSuccess ? (
        <div
          className={`notice ${
            params.feedback_type === "error" ? "notice-error" : "notice-success"
          }`}
        >
          {params.feedback}
        </div>
      ) : null}

      {/* ── Success state ── */}
      {hasBindingSuccess ? (
        <div className="notice notice-success">
          {params.feedback}
        </div>
      ) : null}

      {/* ── Context strip: who you're connecting ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Companion</span>
          <span className="role-state-value">
            {data.role?.name ?? "No role selected"}
          </span>
        </div>
        {data.thread ? (
          <>
            <div className="role-state-divider" />
            <div className="role-state-item">
              <span className="role-state-label">Thread</span>
              <span className="role-state-value">{data.thread.title}</span>
            </div>
          </>
        ) : null}
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span
            className={`role-state-badge${existingBinding ? "" : " attention"}`}
          >
            {existingBinding ? "Already connected" : "Not connected yet"}
          </span>
        </div>
      </div>

      {/* ── Main card ── */}
      {data.role && data.thread ? (
        <section className="site-card connect-im-card">
          {/* Steps */}
          <div className="connect-im-steps">
            <div className="connect-im-step">
              <span className="connect-im-step-num">1</span>
              <span className="connect-im-step-text">
                {botUsername
                  ? <>Open Telegram and message{" "}
                      <a
                        className="site-inline-link"
                        href={`https://t.me/${botUsername}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        @{botUsername}
                      </a>
                    </>
                  : recommendedBotName
                    ? `Open the ${recommendedBotName} bot in Telegram`
                    : "Open your Telegram bot"}
              </span>
            </div>
            <div className="connect-im-step">
              <span className="connect-im-step-num">2</span>
              <span className="connect-im-step-text">
                Send any message — the bot will reply with your <strong>Chat ID</strong> and <strong>User ID</strong>
              </span>
            </div>
            <div className="connect-im-step">
              <span className="connect-im-step-num">3</span>
              <span className="connect-im-step-text">
                Paste those values below and save
              </span>
            </div>
          </div>

          {/* Already connected warning — shown before the form so user sees it first */}
          {existingBinding ? (
            <p className="connect-im-rebind-note">
              Already connected via &ldquo;{existingBinding.threadTitle ?? existingBinding.threadId}&rdquo;.
              Saving new values will replace the current connection.{" "}
              <Link className="site-inline-link" href="/app/channels">
                View current →
              </Link>
            </p>
          ) : null}

          {data.role && recommendedCharacterChannel && recommendedBotName ? (
            <p className="connect-im-rebind-note">
              Your role {data.role.name} will talk to you through {recommendedBotName} on
              Telegram.
            </p>
          ) : null}

          {/* Form */}
          <div className="connect-im-form-wrap">
            <form action={connectTelegramBinding}>
              <TelegramBindingForm
                agentId={data.role.agentId}
                characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                hasExistingBinding={Boolean(existingBinding)}
                threadId={data.thread.threadId}
              />
            </form>
          </div>
        </section>
      ) : (
        <section className="site-card">
          <div className="product-empty-state">
            <strong>No companion yet</strong>
            <p>
              Create a companion and start a conversation first, then come back
              to connect Telegram.
            </p>
            <Link className="site-inline-link" href="/create">
              Create a companion →
            </Link>
          </div>
        </section>
      )}
    </ProductConsoleShell>
  );
}
