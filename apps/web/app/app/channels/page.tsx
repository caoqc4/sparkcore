import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { unbindProductChannel } from "@/app/app/channels/actions";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductChannelsPageData } from "@/lib/product/channels";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

type ChannelsPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

const PLATFORM_VISUALS = {
  telegram: {
    iconBg: "hsl(207 89% 94%)",
    iconColor: "hsl(207 89% 42%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.64-.203-.654-.64.136-.954l11.57-4.461c.537-.194 1.006.131.838.94l-.53-.85z" />
      </svg>
    ),
  },
  wechat: {
    iconBg: "hsl(134 52% 93%)",
    iconColor: "hsl(134 52% 36%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 0 0 .166-.054l1.938-1.106a.595.595 0 0 1 .469-.054 10.416 10.416 0 0 0 2.886.445c-.43-.953-.688-1.998-.688-3.073 0-3.99 3.731-7.229 8.332-7.229.085 0 .167.004.25.006C15.633 4.049 12.437 2.188 8.691 2.188zM5.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5.9 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        <path d="M23.714 17.37c0-3.498-3.37-6.341-7.524-6.341-4.155 0-7.525 2.843-7.525 6.341 0 3.498 3.37 6.342 7.525 6.342.989 0 1.932-.165 2.805-.463a.526.526 0 0 1 .414.047l1.614.921a.29.29 0 0 0 .146.047.26.26 0 0 0 .26-.26c0-.063-.025-.122-.042-.183l-.344-1.304a.52.52 0 0 1 .188-.586c1.62-1.181 2.483-2.868 2.483-4.561zm-10.06-1a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm5.07 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" />
      </svg>
    ),
  },
  feishu: {
    iconBg: "linear-gradient(135deg, hsl(197 100% 92%), hsl(225 100% 95%))",
    iconColor: "hsl(211 88% 48%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 8.2c0-1 .95-1.72 1.9-1.42l5.15 1.63c.86.27.99 1.41.22 1.87l-5.63 3.41c-.95.57-2.14-.11-2.14-1.22V8.2Z" />
        <path d="M11.32 12.05c0-.53.43-.96.96-.96h3.56c1.05 0 1.5 1.33.67 1.96l-3.56 2.72a.96.96 0 0 1-1.63-.76v-2.96Z" opacity="0.92" />
      </svg>
    ),
  },
  discord: {
    iconBg: "hsl(235 86% 94%)",
    iconColor: "hsl(235 86% 54%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
} as const;

function formatStatusLabel(status: string, isZh: boolean) {
  switch (status) {
    case "connected":
      return isZh ? "已连接" : "Connected";
    case "needs_attention":
      return isZh ? "需要处理" : "Needs attention";
    case "not_connected":
      return isZh ? "未连接" : "Not connected";
    case "coming_soon":
      return isZh ? "即将上线" : "Coming soon";
    case "disabled":
      return isZh ? "不可用" : "Unavailable";
    default:
      return status;
  }
}

function getPlatformActionLabel(args: {
  actionMode: "connect" | "rebind" | "unavailable";
  availabilityStatus: "active" | "coming_soon" | "disabled";
  isZh: boolean;
}) {
  if (args.actionMode === "rebind") {
    return args.isZh ? "重新连接" : "Reconnect";
  }

  if (args.actionMode === "connect") {
    return args.isZh ? "连接" : "Connect";
  }

  return args.availabilityStatus === "coming_soon"
    ? args.isZh ? "即将上线" : "Soon"
    : args.isZh ? "不可用" : "Unavailable";
}

function getPlatformDiscoveryLabel(platform: string, isConnected: boolean, isZh: boolean) {
  switch (platform) {
    case "wechat":
      return isConnected ? (isZh ? "在这里继续" : "Continue here") : isZh ? "从这里开始" : "Start here";
    default:
      return isConnected ? (isZh ? "打开聊天" : "Open the chat") : isZh ? "从这里开始" : "Start here";
  }
}

function getPlatformDiscoveryHint(platform: string, isConnected: boolean, isZh: boolean) {
  switch (platform) {
    case "telegram":
      return isConnected
        ? isZh ? "打开 Telegram，在那里继续和你的 Lagun 机器人聊天。" : "Open Telegram and continue chatting with your Lagun bot there."
        : isZh ? "连接完成后，打开 Telegram 并给你的 Lagun 机器人发一条消息。" : "After connecting, open Telegram and send a message to your Lagun bot.";
    case "discord":
      return isConnected
        ? isZh ? "打开 Discord，在你的 Lagun 私信里继续对话。" : "Open Discord and continue the conversation in your Lagun DM."
        : isZh ? "连接完成后，打开 Discord，找到 Lagun 并发送任意消息开始对话。" : "After connecting, open Discord, find Lagun, and send it any message to start the thread.";
    case "feishu":
      return isConnected
        ? isZh ? "打开飞书，在你的工作区里继续和 Lagun 聊天。" : "Open Feishu and continue chatting with Lagun in your workspace."
        : isZh ? "连接完成后，打开飞书，搜索 Lagun 并发送任意消息获取你的 ID。" : "After connecting, open Feishu, search for Lagun, and send it any message to get your IDs.";
    case "wechat":
      return isConnected
        ? isZh ? "打开扫码登录后创建的微信机器人会话，并在那里继续聊天。" : "Open the WeChat bot thread created by your QR login and continue chatting there."
        : isZh ? "先完成微信扫码登录流程，再给生成的机器人会话发送任意消息。" : "Start the WeChat QR login flow first, then send the generated bot thread any message.";
    default:
      return isConnected
        ? isZh ? "通过这个应用继续聊天。" : "Continue chatting through this app."
        : isZh ? "先连接这个应用，再在那里开始聊天。" : "Connect this app first to start chatting there.";
  }
}

export default async function AppChannelsPage({
  searchParams,
}: ChannelsPageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/channels");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";

  const roleId =
    typeof params.role === "string" && params.role.length > 0 ? params.role : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0 ? params.thread : null;

  const [overview, resolution, channelsData] = await Promise.all([
    loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadProductChannelsPageData({ supabase, userId: user.id, roleId, threadId }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const redirectTo = `/app/channels${roleQuerySuffix}`;

  const platforms = channelsData?.platforms ?? [];

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={chatHref}>
          {isZh ? "返回聊天" : "Back to chat"}
        </Link>
      }
      currentHref="/app/channels"
      description={isZh ? "把这位伴侣连接到合适的 IM 渠道。" : "Connect this companion to the right IM path."}
      eyebrow={isZh ? "渠道" : "Channels"}
      shellContext={overview}
      title={isZh ? "渠道" : "Channels"}
    >
      <ProductEventTracker
        event="first_privacy_view"
        payload={{ surface: "dashboard_channels" }}
      />

      {params.feedback ? (
        <div
          className={`notice ${
            params.feedback_type === "error" ? "notice-error" : "notice-success"
          }`}
        >
          {params.feedback}
        </div>
      ) : null}

      <section className="site-card channel-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "IM 连接" : "IM Connections"}</h2>
        </div>

        <div className="channel-platform-list">
          {platforms.map((platform) => {
            const visual =
              PLATFORM_VISUALS[platform.platform as keyof typeof PLATFORM_VISUALS] ??
              PLATFORM_VISUALS.telegram;
            const baseConnectParams = new URLSearchParams();

            if (resolvedRoleId) {
              baseConnectParams.set("agent", resolvedRoleId);
            }

            if (threadId) {
              baseConnectParams.set("thread", threadId);
            }

            baseConnectParams.set("platform", platform.platform);
            const activeBinding = platform.activeBinding;
            const connectHref = `/connect-im?${baseConnectParams.toString()}`;
            const hasScopedContext = Boolean(resolvedRoleId || threadId);
            const rebindHref =
              hasScopedContext
                ? connectHref
                : activeBinding?.threadId && activeBinding?.agentId
                ? `/connect-im?thread=${encodeURIComponent(
                    activeBinding.threadId,
                  )}&agent=${encodeURIComponent(activeBinding.agentId)}&platform=${encodeURIComponent(
                    platform.platform,
                  )}`
                : connectHref;

            return (
              <div
                key={platform.platform}
                className={`channel-platform-row${
                  activeBinding ? " channel-platform-row-connected" : ""
                }`}
              >
                <div className="channel-platform-main">
                  <span
                    className="channel-platform-icon-wrap"
                    style={{ background: visual.iconBg, color: visual.iconColor }}
                    aria-hidden="true"
                  >
                    {visual.icon}
                  </span>
                  <div className="channel-platform-info">
                    <span className="channel-platform-name">{platform.label}</span>
                    <span className="channel-platform-status">
                      <span
                        className={`channel-platform-dot${
                          platform.displayStatus === "connected"
                            ? " channel-platform-dot-live"
                            : platform.displayStatus === "needs_attention"
                              ? " channel-platform-dot-warning"
                              : ""
                        }`}
                      />
                      {formatStatusLabel(platform.displayStatus, isZh)}
                    </span>
                  </div>

                  {platform.actionMode === "unavailable" && platform.platform !== "feishu" ? (
                    <span className="channel-platform-soon-tag">
                      {getPlatformActionLabel({
                        actionMode: platform.actionMode,
                        availabilityStatus: platform.availabilityStatus,
                        isZh,
                      })}
                    </span>
                  ) : (
                    <Link
                      className={`button ${
                        platform.actionMode === "rebind"
                          ? "button-secondary"
                          : "button-primary"
                      } channel-platform-btn`}
                      href={platform.actionMode === "rebind" ? rebindHref : connectHref}
                    >
                      {getPlatformActionLabel({
                        actionMode: platform.actionMode,
                        availabilityStatus: platform.availabilityStatus,
                        isZh,
                      })}
                    </Link>
                  )}
                </div>

                {activeBinding ? (
                  <div className="channel-connection-detail">
                    <div className="channel-connection-body">
                      <div className="channel-connection-meta">
                        <span className="channel-connection-role">
                          {activeBinding.agentName ?? (isZh ? "角色" : "Companion")}
                        </span>
                        <span className="channel-connection-thread">
                          {activeBinding.threadTitle ??
                            activeBinding.threadId ??
                            (isZh ? "未知对话" : "Unknown conversation")}
                        </span>
                        {(activeBinding.channelId || activeBinding.peerId) ? (
                          <span className="channel-connection-ids">
                            {activeBinding.channelId ? `${isZh ? "会话 ID" : "Chat ID"}: ${activeBinding.channelId}` : ""}
                            {activeBinding.channelId && activeBinding.peerId ? "  ·  " : ""}
                            {activeBinding.peerId ? `${isZh ? "用户 ID" : "User ID"}: ${activeBinding.peerId}` : ""}
                          </span>
                        ) : null}
                        <span className="channel-connection-hint-label">
                          {getPlatformDiscoveryLabel(platform.platform, true, isZh)}
                        </span>
                        <span className="channel-connection-hint">
                          {getPlatformDiscoveryHint(platform.platform, true, isZh)}
                        </span>
                      </div>
                      <form action={unbindProductChannel}>
                        <input name="binding_id" type="hidden" value={activeBinding.id} />
                        <input name="redirect_to" type="hidden" value={redirectTo} />
                        <FormSubmitButton
                          className="channel-unbind-btn"
                          idleText={isZh ? "断开连接" : "Disconnect"}
                          pendingText={isZh ? "断开中…" : "Disconnecting…"}
                        />
                      </form>
                    </div>
                  </div>
                ) : null}

                {!activeBinding &&
                (platform.invalidBindingCount > 0 || platform.inactiveBindingCount > 0) ? (
                  <div className="channel-connection-detail">
                    <div className="channel-connection-summary">
                      {platform.invalidBindingCount > 0 ? (
                        <span>{isZh ? `${platform.invalidBindingCount} 个失效连接` : `${platform.invalidBindingCount} invalid connection(s)`}</span>
                      ) : null}
                      {platform.invalidBindingCount > 0 &&
                      platform.inactiveBindingCount > 0 ? (
                        <span className="channel-connection-sep">·</span>
                      ) : null}
                      {platform.inactiveBindingCount > 0 ? (
                        <span>{isZh ? `${platform.inactiveBindingCount} 个未激活连接` : `${platform.inactiveBindingCount} inactive connection(s)`}</span>
                      ) : null}
                    </div>
                    <div className="channel-connection-hint-label">
                      {getPlatformDiscoveryLabel(platform.platform, false, isZh)}
                    </div>
                    <div className="channel-connection-hint">
                      {getPlatformDiscoveryHint(platform.platform, false, isZh)}
                    </div>
                  </div>
                ) : !activeBinding ? (
                  <div className="channel-connection-detail">
                    <div className="channel-connection-hint-label">
                      {getPlatformDiscoveryLabel(platform.platform, false, isZh)}
                    </div>
                    <div className="channel-connection-hint">
                      {getPlatformDiscoveryHint(platform.platform, false, isZh)}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </ProductConsoleShell>
  );
}
