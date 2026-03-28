import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { unbindProductChannel } from "@/app/app/channels/actions";
import { requireUser } from "@/lib/auth-redirect";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import { loadDashboardOverview } from "@/lib/product/dashboard";
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

type Binding = {
  id: string;
  platform: string;
  status: string;
  agentId: string;
  agentName: string | null;
  threadId: string | null;
  threadTitle: string | null;
  channelId: string | null;
  peerId: string | null;
};

// ─── Platform definitions ─────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "telegram",
    label: "Telegram",
    available: true,
    iconBg: "hsl(207 89% 94%)",
    iconColor: "hsl(207 89% 42%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.64-.203-.654-.64.136-.954l11.57-4.461c.537-.194 1.006.131.838.94l-.53-.85z"/>
      </svg>
    ),
  },
  {
    id: "wechat",
    label: "WeChat",
    available: false,
    iconBg: "hsl(134 52% 93%)",
    iconColor: "hsl(134 52% 36%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 0 0 .166-.054l1.938-1.106a.595.595 0 0 1 .469-.054 10.416 10.416 0 0 0 2.886.445c-.43-.953-.688-1.998-.688-3.073 0-3.99 3.731-7.229 8.332-7.229.085 0 .167.004.25.006C15.633 4.049 12.437 2.188 8.691 2.188zM5.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5.9 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        <path d="M23.714 17.37c0-3.498-3.37-6.341-7.524-6.341-4.155 0-7.525 2.843-7.525 6.341 0 3.498 3.37 6.342 7.525 6.342.989 0 1.932-.165 2.805-.463a.526.526 0 0 1 .414.047l1.614.921a.29.29 0 0 0 .146.047.26.26 0 0 0 .26-.26c0-.063-.025-.122-.042-.183l-.344-1.304a.52.52 0 0 1 .188-.586c1.62-1.181 2.483-2.868 2.483-4.561zm-10.06-1a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm5.07 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z"/>
      </svg>
    ),
  },
  {
    id: "discord",
    label: "Discord",
    available: false,
    iconBg: "hsl(235 86% 94%)",
    iconColor: "hsl(235 86% 54%)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlatformRow({
  platform,
  binding,
  connectHref,
  redirectTo,
}: {
  platform: (typeof PLATFORMS)[number];
  binding: Binding | null;
  connectHref: string;
  redirectTo: string;
}) {
  const isConnected = binding !== null;
  const rebindHref = binding?.threadId
    ? `/connect-im?thread=${encodeURIComponent(binding.threadId)}&agent=${encodeURIComponent(binding.agentId)}`
    : `/connect-im?agent=${binding?.agentId ?? ""}`;

  return (
    <div className={`channel-platform-row${isConnected ? " channel-platform-row-connected" : ""}`}>
      {/* Top row: icon + name + status + action */}
      <div className="channel-platform-main">
        <span
          className="channel-platform-icon-wrap"
          style={{ background: platform.iconBg, color: platform.iconColor }}
          aria-hidden="true"
        >
          {platform.icon}
        </span>
        <div className="channel-platform-info">
          <span className="channel-platform-name">{platform.label}</span>
          <span className="channel-platform-status">
            <span className={`channel-platform-dot${isConnected ? " channel-platform-dot-live" : ""}`} />
            {platform.available
              ? isConnected ? "Connected" : "Not connected"
              : "Coming soon"}
          </span>
        </div>
        {platform.available ? (
          <Link
            className={`button ${isConnected ? "button-secondary" : "button-primary"} channel-platform-btn`}
            href={isConnected ? rebindHref : connectHref}
          >
            {isConnected ? "Rebind" : "Connect"}
          </Link>
        ) : (
          <span className="channel-platform-soon-tag">Soon</span>
        )}
      </div>

      {/* Expanded connection details (only when connected) */}
      {isConnected ? (
        <div className="channel-connection-detail">
          <div className="channel-connection-summary">
            <span className="channel-connection-role">{binding.agentName ?? "Companion"}</span>
            <span className="channel-connection-sep">·</span>
            <span className="channel-connection-thread">
              {binding.threadTitle ?? binding.threadId ?? "Unknown thread"}
            </span>
          </div>
          <div className="channel-connection-actions">
            {(binding.channelId || binding.peerId) ? (
              <details className="channel-binding-details">
                <summary className="channel-binding-details-summary">Connection details</summary>
                <div className="channel-binding-meta">
                  {binding.channelId ? <span>Chat ID: {binding.channelId}</span> : null}
                  {binding.peerId ? <span>User ID: {binding.peerId}</span> : null}
                </div>
              </details>
            ) : null}
            <form action={unbindProductChannel} style={{ display: "inline" }}>
              <input name="binding_id" type="hidden" value={binding.id} />
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <FormSubmitButton
                className="button button-secondary channel-unbind-btn"
                idleText="Disconnect"
                pendingText="Updating…"
              />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistoryRow({ binding }: { binding: Binding }) {
  return (
    <div className="channel-history-row">
      <span className="channel-active-platform-badge channel-active-platform-badge-dim">
        {binding.platform}
      </span>
      <div className="channel-history-info">
        <span className="channel-history-role">{binding.agentName ?? "Companion"}</span>
        <span className="channel-history-thread">
          {binding.threadTitle ?? binding.threadId ?? "Unknown thread"}
        </span>
      </div>
      <span className="channel-status-badge channel-status-inactive">
        {binding.status}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AppChannelsPage({
  searchParams,
}: ChannelsPageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/channels");
  const supabase = await createClient();

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  const [{ data: workspace }, overview, resolution] = await Promise.all([
    loadPrimaryWorkspace({ supabase, userId: user.id }),
    loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
    resolveProductAppRoute({ supabase, userId: user.id }),
  ]);

  if (!workspace) {
    return null;
  }

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const connectImHref = resolvedRoleId
    ? `/connect-im?agent=${encodeURIComponent(resolvedRoleId)}`
    : "/connect-im";
  const redirectTo = `/app/channels${roleQuerySuffix}`;

  const bindings = await loadOwnedChannelBindings({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
  });

  const scopedBindings = bindings.filter((b) => {
    if (threadId) return b.threadId === threadId;
    if (resolvedRoleId) return b.agentId === resolvedRoleId;
    return true;
  });

  const activeBindings = scopedBindings.filter((b) => b.status === "active");
  const inactiveBindings = scopedBindings.filter((b) => b.status !== "active");

  const primaryBinding =
    activeBindings.find((b) =>
      overview?.currentThread
        ? b.threadId === overview.currentThread.threadId
        : false,
    ) ?? activeBindings[0] ?? null;

  // Map platform id → primary active binding for that platform
  const bindingByPlatform: Record<string, Binding | null> = {
    telegram:
      activeBindings.find((b) => b.platform.toLowerCase() === "telegram") ?? null,
    wechat:
      activeBindings.find((b) => b.platform.toLowerCase() === "wechat") ?? null,
    discord:
      activeBindings.find((b) => b.platform.toLowerCase() === "discord") ?? null,
  };

  const hasAnyActive = activeBindings.length > 0;
  const activePlatformNames = Array.from(
    new Set(activeBindings.map((b) => b.platform)),
  );

  // History = inactive + other active bindings not shown in main platform rows
  const shownBindingIds = new Set(
    Object.values(bindingByPlatform)
      .filter(Boolean)
      .map((b) => b!.id),
  );
  const historyBindings = [
    ...activeBindings.filter((b) => !shownBindingIds.has(b.id)),
    ...inactiveBindings,
  ];

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={chatHref}>
          Back to chat
        </Link>
      }
      currentHref="/app/channels"
      description="Connect this companion to the right IM path."
      eyebrow="Channels"
      shellContext={overview}
      title="Channels"
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

      {/* ── Overview strip ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Status</span>
          <span className={`role-state-badge${!hasAnyActive ? " attention" : ""}`}>
            {hasAnyActive ? "IM live" : "Web only"}
          </span>
        </div>
        {hasAnyActive ? (
          <>
            <div className="role-state-divider" />
            <div className="role-state-item">
              <span className="role-state-label">Via</span>
              <span className="role-state-value">
                {activePlatformNames.join(", ")}
              </span>
            </div>
            {primaryBinding?.threadTitle ? (
              <>
                <div className="role-state-divider" />
                <div className="role-state-item">
                  <span className="role-state-label">Thread</span>
                  <span className="role-state-value">{primaryBinding.threadTitle}</span>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ── IM Connections ── */}
      <section className="site-card channel-connections-card">
        <div className="role-section-head">
          <h2 className="role-section-title">IM Connections</h2>
        </div>
        <div className="channel-platform-list">
          {PLATFORMS.map((platform) => (
            <PlatformRow
              key={platform.id}
              platform={platform}
              binding={bindingByPlatform[platform.id] ?? null}
              connectHref={connectImHref}
              redirectTo={redirectTo}
            />
          ))}
        </div>
      </section>

      {/* ── History (inactive + overflow active) ── */}
      {historyBindings.length > 0 ? (
        <section className="site-card channel-card">
          <div className="role-section-head">
            <h2 className="role-section-title">Previous connections</h2>
            <span className="channel-count-badge">{historyBindings.length}</span>
          </div>
          <div className="channel-history-list">
            {historyBindings.map((b) => (
              <HistoryRow key={b.id} binding={b} />
            ))}
          </div>
        </section>
      ) : null}
    </ProductConsoleShell>
  );
}
