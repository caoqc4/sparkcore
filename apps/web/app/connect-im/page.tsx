import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { DiscordBindingForm } from "@/components/discord-binding-form";
import { FeishuBindingForm } from "@/components/feishu-binding-form";
import { TelegramBindingForm } from "@/components/telegram-binding-form";
import { WeChatBindingForm } from "@/components/wechat-binding-form";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotConfig } from "@/lib/env";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductConnectImPageData } from "@/lib/product/connect-im";
import { loadChannelPlatformCapabilities } from "@/lib/product/channels";
import {
  getCharacterChannelLabel,
  recommendCharacterChannel
} from "@/lib/product/character-channels";
import { buildLocalizedPageMetadata } from "@/lib/site";
import {
  connectDiscordBinding,
  connectFeishuBinding,
  connectTelegramBinding,
  connectWeChatBinding
} from "@/app/connect-im/actions";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Connect an IM Channel", "zh-CN": "连接 IM 渠道" },
    description: {
      en: "Protected Lagun onboarding flow for binding an existing relationship thread to an IM channel.",
      "zh-CN": "用于把现有关系线程绑定到 IM 渠道的 Lagun 受保护引导流程。",
    },
    path: "/connect-im",
    noIndex: true,
    languageSource: "system",
  });
}

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

function renderPlatformSetupLead(platform: SupportedPlatform, isZh: boolean) {
  switch (platform) {
    case "discord":
      return {
        title: isZh ? "先发起 Discord 私信" : "Start the Discord DM first",
        copy:
          isZh
            ? "在 Discord 里找到 Lagun 并发送任意消息。多数情况下，第一条未绑定回复就会返回你需要的 ID，开发者模式只是备用方案。"
            : "Find Lagun in Discord and send it any message. In most cases the first unbound reply will give you the IDs you need, so Developer Mode is only a fallback.",
      };
    case "feishu":
      return {
        title: isZh ? "先发起飞书聊天" : "Start the Feishu chat first",
        copy:
          isZh
            ? "在你的飞书工作区搜索 Lagun，打开那个机器人会话并发送任意消息。第一条未绑定回复会返回绑定所需的 ID。"
            : "Search for Lagun in your Feishu workspace, open that bot thread, and send it any message. The first unbound reply will return the IDs for binding.",
      };
    case "wechat":
      return {
        title: isZh ? "开始微信会话" : "Start your WeChat session",
        copy:
          isZh
            ? "Lagun 会打开二维码页面，请在微信中扫码，然后发送任意消息完成自动绑定。"
            : "Lagun will open a QR page — scan it in WeChat, then send any message to finish binding automatically.",
      };
    case "telegram":
    default:
      return null;
  }
}

function renderPlatformStepOne(
  platform: SupportedPlatform,
  args: { botUsername: string | null; recommendedBotName: string | null; isZh: boolean }
) {
  if (platform === "telegram") {
    return args.botUsername ? (
      <>
        {args.isZh ? "打开 Telegram 并给" : "Open Telegram and message"}{" "}
        <a
          className="site-inline-link"
          href={`https://t.me/${args.botUsername}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          @{args.botUsername}
        </a>
        {args.isZh ? "发送任意消息。" : ". Send it "}<strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
      </>
    ) : args.recommendedBotName ? (
      <>
        {args.isZh ? `打开 Telegram 里的 ${args.recommendedBotName} 机器人，并发送` : `Open the ${args.recommendedBotName} bot in Telegram and send it `}<strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
      </>
    ) : (
      <>
        {args.isZh ? "打开你的 Telegram 机器人并发送" : "Open your Telegram bot and send it "} <strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
      </>
    );
  }

  if (platform === "discord") {
    return (
      <>
        {args.isZh ? "打开 Discord，找到" : "Open Discord, find "}<strong>Lagun</strong>{args.isZh ? "并发送" : ", and send it "} <strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
      </>
    );
  }

  if (platform === "feishu") {
    return (
      <>
        {args.isZh ? "打开飞书，在工作区里搜索" : "Open Feishu, search for "} <strong>Lagun</strong>{args.isZh ? "并发送" : " in your workspace, and send it "} <strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
      </>
    );
  }

  return (
    <>
      {args.isZh ? "开始微信登录流程，扫描" : "Start the WeChat login flow, scan the QR code for "} <strong>{args.isZh ? "你自己的 WeChat ClawBot 会话" : "your own WeChat ClawBot session"}</strong>{args.isZh ? "，然后发送" : ", then send it "} <strong>{args.isZh ? "任意" : "any"}</strong>{args.isZh ? "消息。" : " message."}
    </>
  );
}

function renderPlatformStepTwo(platform: SupportedPlatform, isZh: boolean) {
  if (platform === "telegram") {
    return (
      <>
        {isZh ? "发送第一条消息后，从第一条未绑定机器人回复中复制" : "After that first message, copy the "} <strong>Chat ID</strong>{isZh ? "和你的" : " and your "} <strong>User ID</strong>{isZh ? "。" : " from the first unbound bot reply."}
      </>
    );
  }

  if (platform === "discord") {
    return (
      <>
        {isZh ? "发送第一条消息后，从第一条未绑定机器人回复中复制" : "After that first message, copy the "} <strong>DM Channel ID</strong>{isZh ? "和你的" : " and your "} <strong>User ID</strong>{isZh ? "。如有需要，也可以在 Discord 开发者模式里获取。" : " from the first unbound bot reply. If needed, you can also get them from Discord Developer Mode."}
      </>
    );
  }

  if (platform === "feishu") {
    return (
      <>
        {isZh ? "发送第一条消息后，从第一条未绑定机器人回复中复制" : "After that first message, copy the "} <strong>Chat ID</strong>{isZh ? "和你的" : " and your "} <strong>Open ID</strong>{isZh ? "。" : " from the first unbound bot reply."}
      </>
    );
  }

  return (
    <>
      {isZh ? "发送第一条消息后，从第一条未绑定机器人回复中复制" : "After that first message, copy the "} <strong>Session ID</strong>{isZh ? "和你的" : " and your "} <strong>User ID</strong>{isZh ? "。" : " from the first unbound bot reply."}
    </>
  );
}

export default async function ConnectImPage({
  searchParams,
}: ConnectImPageProps) {
  const params = await searchParams;
  const user = await requireUser("/connect-im");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
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
  const platformSetupLead = renderPlatformSetupLead(selectedPlatform, isZh);
  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href="/app/channels">
            {isZh ? "查看渠道" : "View channels"}
          </Link>
          <Link className="button button-secondary" href="/app/chat">
            {isZh ? "返回聊天" : "Back to chat"}
          </Link>
        </>
      }
      currentHref="/connect-im"
      description={isZh ? "为这个角色连接一个或多个 IM 应用，同时保持各自对话独立。" : "Connect one or more IM apps to this companion while keeping each conversation separate."}
      eyebrow={isZh ? "IM 设置" : "IM Setup"}
      shellContext={overview}
      title={isZh ? `连接 ${selectedPlatformLabel}` : `Connect ${selectedPlatformLabel}`}
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
          {isZh ? "角色已创建。连接一个 IM 应用后，你就可以在手机上找到这个角色。" : "Role created. Connect an IM app to reach this companion from your phone."}
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
          <span className="role-state-label">{isZh ? "角色" : "Companion"}</span>
          <span className="role-state-value">
            {data.role?.name ?? (isZh ? "未选择角色" : "No role selected")}
          </span>
        </div>
        {data.thread ? (
          <>
            <div className="role-state-divider" />
            <div className="role-state-item">
              <span className="role-state-label">{isZh ? "对话线程" : "Thread"}</span>
              <span className="role-state-value">{data.thread.title}</span>
            </div>
          </>
        ) : null}
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span
            className={`role-state-badge${existingBinding ? "" : " attention"}`}
          >
            {existingBinding ? (isZh ? "已连接" : "Already connected") : isZh ? "尚未连接" : "Not connected yet"}
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
                    {isZh ? "点击下方按钮打开二维码页面，然后在微信中扫码。" : "Click the button below to open the QR page, then scan it in WeChat."}
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">2</span>
                  <span className="connect-im-step-text">
                    {isZh ? "给机器人发送" : "Send the bot "} <strong>{isZh ? "任意" : "any"}</strong>{isZh ? "消息，Lagun 会自动完成绑定。" : " message — Lagun will finish binding automatically."}
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
                      recommendedBotName,
                      isZh,
                    })}
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">2</span>
                  <span className="connect-im-step-text">
                    {renderPlatformStepTwo(selectedPlatform, isZh)}
                  </span>
                </div>
                <div className="connect-im-step">
                  <span className="connect-im-step-num">3</span>
                  <span className="connect-im-step-text">
                    {isZh ? "把这些值粘贴到下面并保存。" : "Paste those values below and save."}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Already connected warning — shown before the form so user sees it first */}
          {existingBinding ? (
            <p className="connect-im-rebind-note">
              {isZh
                ? `当前已通过 “${existingBinding.threadTitle ?? existingBinding.threadId}” 连接。保存新的值会替换现有连接。`
                : `Already connected via “${existingBinding.threadTitle ?? existingBinding.threadId}”. Saving new values will replace the current connection. `}
              <Link className="site-inline-link" href="/app/channels">
                {isZh ? "查看当前连接 →" : "View current →"}
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
                  language={effectiveSystemLanguage}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : selectedPlatform === "discord" ? (
              <form action={connectDiscordBinding}>
                <DiscordBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  language={effectiveSystemLanguage}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : selectedPlatform === "feishu" ? (
              <form action={connectFeishuBinding}>
                <FeishuBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  language={effectiveSystemLanguage}
                  threadId={data.thread.threadId}
                />
              </form>
            ) : (
              <form action={connectWeChatBinding}>
                <WeChatBindingForm
                  agentId={data.role.agentId}
                  characterChannelSlug={recommendedCharacterChannel ?? "caria"}
                  hasExistingBinding={Boolean(existingBinding)}
                  language={effectiveSystemLanguage}
                  sessionStatus={data.wechatSession?.status ?? null}
                  threadId={data.thread.threadId}
                />
              </form>
            )}
          </div>

          {data.role && recommendedCharacterChannel && recommendedBotName ? (
            <p className="connect-im-rebind-note">
              {selectedPlatform === "telegram"
                ? isZh
                  ? `角色 ${data.role.name} 会通过 Telegram 上的 ${recommendedBotName} 和你交流。`
                  : `Your role ${data.role.name} will talk to you through ${recommendedBotName} on Telegram.`
                : selectedPlatform === "discord"
                  ? isZh
                    ? `角色 ${data.role.name} 会在 Discord 中使用同样的语音，同时保持 Discord 对话与其他应用分开。`
                    : `Your role ${data.role.name} will use the same voice on Discord, while keeping the Discord conversation separate from your other apps.`
                  : selectedPlatform === "feishu"
                    ? isZh
                      ? `角色 ${data.role.name} 会在飞书中使用同样的语音，同时保持飞书对话与其他应用分开。`
                      : `Your role ${data.role.name} will use the same voice in Feishu, while keeping the Feishu conversation separate from your other apps.`
                    : isZh
                      ? `角色 ${data.role.name} 会在微信中使用同样的语音，同时保持微信对话与其他应用分开。`
                      : `Your role ${data.role.name} will use the same voice in WeChat, while keeping the WeChat conversation separate from your other apps.`}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="site-card">
          <div className="product-empty-state">
            <strong>{isZh ? "还没有伴侣角色" : "No companion yet"}</strong>
            <p>
              {isZh
                ? "请先创建一个角色并开始对话，然后再回来连接 IM。"
                : "Create a companion and start a conversation first, then come back to connect Telegram."}
            </p>
            <Link className="site-inline-link" href="/create">
              {isZh ? "创建角色 →" : "Create a companion →"}
            </Link>
          </div>
        </section>
      )}
    </ProductConsoleShell>
  );
}
