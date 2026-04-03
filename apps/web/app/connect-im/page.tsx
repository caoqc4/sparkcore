import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { DiscordBindingForm } from "@/components/discord-binding-form";
import { FeishuBindingForm } from "@/components/feishu-binding-form";
import { TelegramBindingForm } from "@/components/telegram-binding-form";
import { WeChatBindingForm } from "@/components/wechat-binding-form";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotConfig } from "@/lib/env";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductConnectImPageData } from "@/lib/product/connect-im";
import { loadChannelPlatformCapabilities } from "@/lib/product/channels";
import {
  getCharacterChannelLabel,
  recommendCharacterChannel
} from "@/lib/product/character-channels";
import { buildPageMetadata } from "@/lib/site";
import {
  connectDiscordBinding,
  connectFeishuBinding,
  connectTelegramBinding,
  connectWeChatBinding
} from "@/app/connect-im/actions";

export const metadata = buildPageMetadata({
  title: "Connect an IM Channel",
  description:
    "Protected Lagun onboarding flow for binding an existing relationship thread to an IM channel.",
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
    platform?: string;
  }>;
};

const PLATFORM_LABELS = {
  telegram: "Telegram",
  discord: "Discord",
  feishu: "Feishu",
  wechat: "WeChat",
} as const;

type SupportedPlatform = keyof typeof PLATFORM_LABELS;

function isSupportedPlatform(value: string | undefined): value is SupportedPlatform {
  return (
    value === "telegram" ||
    value === "discord" ||
    value === "feishu" ||
    value === "wechat"
  );
}

function renderPlatformSetupLead(platform: SupportedPlatform) {
  switch (platform) {
    case "discord":
      return {
        title: "Start the Discord DM first",
        copy:
          "Find Lagun in Discord and send it any message. In most cases the first unbound reply will give you the IDs you need, so Developer Mode is only a fallback.",
      };
    case "feishu":
      return {
        title: "Start the Feishu chat first",
        copy:
          "Search for Lagun in your Feishu workspace, open that bot thread, and send it any message. The first unbound reply will return the IDs for binding.",
      };
    case "wechat":
      return {
        title: "Start your WeChat session",
        copy:
          "Lagun will open a QR page — scan it in WeChat, then send any message to finish binding automatically.",
      };
    case "telegram":
    default:
      return null;
  }
}

function renderPlatformStepOne(
  platform: SupportedPlatform,
  args: { botUsername: string | null; recommendedBotName: string | null }
) {
  if (platform === "telegram") {
    return args.botUsername ? (
      <>
        Open Telegram and message{" "}
        <a
          className="site-inline-link"
          href={`https://t.me/${args.botUsername}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          @{args.botUsername}
        </a>
        . Send it <strong>any</strong> message.
      </>
    ) : args.recommendedBotName ? (
      <>
        Open the {args.recommendedBotName} bot in Telegram and send it <strong>any</strong>{" "}
        message.
      </>
    ) : (
      <>
        Open your Telegram bot and send it <strong>any</strong> message.
      </>
    );
  }

  if (platform === "discord") {
    return (
      <>
        Open Discord, find <strong>Lagun</strong>, and send it <strong>any</strong> message.
      </>
    );
  }

  if (platform === "feishu") {
    return (
      <>
        Open Feishu, search for <strong>Lagun</strong> in your workspace, and send it{" "}
        <strong>any</strong> message.
      </>
    );
  }

  return (
    <>
      Start the WeChat login flow, scan the QR code for <strong>your own WeChat ClawBot session</strong>, then send it <strong>any</strong>{" "}
      message.
    </>
  );
}

function renderPlatformStepTwo(platform: SupportedPlatform) {
  if (platform === "telegram") {
    return (
      <>
        After that first message, copy the <strong>Chat ID</strong> and your{" "}
        <strong>User ID</strong> from the first unbound bot reply.
      </>
    );
  }

  if (platform === "discord") {
    return (
      <>
        After that first message, copy the <strong>DM Channel ID</strong> and your{" "}
        <strong>User ID</strong> from the first unbound bot reply. If needed, you can also get
        them from Discord Developer Mode.
      </>
    );
  }

  if (platform === "feishu") {
    return (
      <>
        After that first message, copy the <strong>Chat ID</strong> and your{" "}
        <strong>Open ID</strong> from the first unbound bot reply.
      </>
    );
  }

  return (
    <>
      After that first message, copy the <strong>Session ID</strong> and your{" "}
      <strong>User ID</strong> from the first unbound bot reply.
    </>
  );
}

export default async function ConnectImPage({
  searchParams,
}: ConnectImPageProps) {
  const params = await searchParams;
  const user = await requireUser("/connect-im");
  const supabase = await createClient();
  const [data, overview, capabilities] = await Promise.all([
    loadProductConnectImPageData({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      agentId: typeof params.agent === "string" ? params.agent : null,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      roleId: typeof params.agent === "string" ? params.agent : null,
      threadId: typeof params.thread === "string" ? params.thread : null,
    }),
    loadChannelPlatformCapabilities({
      supabase,
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
  const preferredPlatformOrder: SupportedPlatform[] = [
    "telegram",
    "discord",
    "feishu",
    "wechat"
  ];
  const connectablePlatforms = capabilities
    .filter((capability) =>
      (capability.availabilityStatus === "active" && capability.supportsBinding) ||
      capability.platform === "feishu" ||
      capability.platform === "wechat"
    )
    .map((capability) => capability.platform)
    .filter(isSupportedPlatform)
    .sort(
      (left, right) =>
        preferredPlatformOrder.indexOf(left) - preferredPlatformOrder.indexOf(right)
    );
  const selectedPlatform =
    (typeof params.platform === "string" && isSupportedPlatform(params.platform)
      ? params.platform
      : null) ??
    connectablePlatforms[0] ??
    "telegram";
  const telegramBot =
    selectedPlatform === "telegram" &&
    recommendedCharacterChannel &&
    process.env[`TELEGRAM_BOT_TOKEN_${recommendedCharacterChannel.toUpperCase()}`]
      ? getTelegramBotConfig(recommendedCharacterChannel)
      : null;

  const activeBindings = data.bindings.filter(
    (b) => b.status === "active" && b.platform === selectedPlatform
  );
  const hasBindingSuccess =
    params.feedback_type === "success" &&
    typeof params.feedback === "string" &&
    params.feedback.length > 0;
  const existingBinding =
    activeBindings.find((b) =>
      data.thread ? b.threadId === data.thread.threadId : false,
    ) ?? activeBindings[0] ?? null;

  const botUsername = telegramBot?.botUsername ?? null;
  const recommendedBotName = recommendedCharacterChannel
    ? getCharacterChannelLabel(recommendedCharacterChannel)
    : null;
  const selectedPlatformLabel = PLATFORM_LABELS[selectedPlatform];
  const platformSetupLead = renderPlatformSetupLead(selectedPlatform);
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
      description="Connect one or more IM apps to this companion while keeping each conversation separate."
      eyebrow="IM Setup"
      shellContext={overview}
      title={`Connect ${selectedPlatformLabel}`}
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
          payload={{ surface: "connect_im", platform: selectedPlatform }}
        />
      ) : null}

      {/* ── Feedback notices ── */}
      {params.created === "1" ? (
        <div className="notice notice-success">
          Role created. Connect an IM app to reach this companion from your phone.
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
          {platformSetupLead ? (
            <div className="connect-im-platform-setup">
              <p className="connect-im-platform-setup-title">
                {platformSetupLead.title}
              </p>
              <p className="connect-im-platform-setup-copy">
                {platformSetupLead.copy}
              </p>
            </div>
          ) : null}

          {/* Steps */}
          <div className="connect-im-steps">
            {selectedPlatform === "wechat" ? (
              <>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">1</span>
                  <span className="connect-im-step-text">
                    Click the button below to open the QR page, then scan it in WeChat.
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">2</span>
                  <span className="connect-im-step-text">
                    Send the bot <strong>any</strong> message — Lagun will finish binding automatically.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">1</span>
                  <span className="connect-im-step-text">
                    {renderPlatformStepOne(selectedPlatform, {
                      botUsername,
                      recommendedBotName
                    })}
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">2</span>
                  <span className="connect-im-step-text">
                    {renderPlatformStepTwo(selectedPlatform)}
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">3</span>
                  <span className="connect-im-step-text">
                    Paste those values below and save.
                  </span>
                </div>
              </>
            )}
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

          {/* Form */}
          <div className="connect-im-form-wrap">
            {selectedPlatform === "telegram" ? (
              <form action={connectTelegramBinding}>
                <TelegramBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : selectedPlatform === "discord" ? (
              <form action={connectDiscordBinding}>
                <DiscordBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : selectedPlatform === "feishu" ? (
              <form action={connectFeishuBinding}>
                <FeishuBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : (
              <form action={connectWeChatBinding}>
                <WeChatBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  sessionStatus={data.wechatSession?.status ?? null}
                  threadId={data.thread.threadId}
                />
              </form>
            )}
          </div>

          {data.role && recommendedCharacterChannel && recommendedBotName ? (
            <p className="connect-im-rebind-note">
              {selectedPlatform === "telegram"
                ? `Your role ${data.role.name} will talk to you through ${recommendedBotName} on Telegram.`
                : selectedPlatform === "discord"
                  ? `Your role ${data.role.name} will use the same voice on Discord, while keeping the Discord conversation separate from your other apps.`
                  : selectedPlatform === "feishu"
                    ? `Your role ${data.role.name} will use the same voice in Feishu, while keeping the Feishu conversation separate from your other apps.`
                    : `Your role ${data.role.name} will use the same voice in WeChat, while keeping the WeChat conversation separate from your other apps.`}
            </p>
          ) : null}
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
