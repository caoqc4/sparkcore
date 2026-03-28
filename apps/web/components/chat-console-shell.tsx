import Link from "next/link";
import { requireUser } from "@/lib/auth-redirect";
import {
  loadDashboardOverview,
  type DashboardOverview,
} from "@/lib/product/dashboard";
import { createClient } from "@/lib/supabase/server";

const productConsoleNavItems = [
  {
    href: "/app/chat",
    label: "Chat",
    description: "Continue the current relationship thread",
    match: ["/app/chat", "/chat"],
  },
  {
    href: "/app/role",
    label: "Role",
    description: "Define the companion and review memory",
    match: ["/app/role", "/app/memory", "/app/profile", "/app/privacy"],
  },
  {
    href: "/app/knowledge",
    label: "Knowledge",
    description: "Manage the sources the companion can use",
    match: ["/app/knowledge"],
  },
  {
    href: "/app/channels",
    label: "Channels",
    description: "Connect and maintain IM paths",
    match: ["/app/channels", "/connect-im"],
  },
  {
    href: "/app/settings",
    label: "Settings",
    description: "Account, model, and preferences",
    match: ["/app/settings"],
  },
] as const;

type ChatConsoleShellProps = {
  currentHref: string;
  roleHref: string;
  channelsHref: string;
  threadTitle?: string | null;
  followUpCount?: number;
  shellContext?: DashboardOverview | null;
  children: React.ReactNode;
};

function isActiveConsoleRoute(
  currentHref: string,
  matchers: readonly string[],
) {
  if (matchers.includes(currentHref)) return true;
  return matchers.some((m) => currentHref.startsWith(`${m}/`));
}

function buildConsoleNavHref(href: string, roleId: string | null) {
  if (!roleId) return href;
  if (
    href === "/app/chat" ||
    href === "/app/role" ||
    href === "/app/knowledge" ||
    href === "/app/channels" ||
    href === "/app/settings"
  ) {
    return `${href}?role=${encodeURIComponent(roleId)}`;
  }
  return href;
}

function buildConsoleSummary(overview: DashboardOverview | null) {
  const roleName = overview?.currentRole?.name ?? "No role yet";
  const activeChannels = overview?.channelSummary.active ?? 0;
  const statusTitle = activeChannels > 0 ? "IM live" : "Web only";

  return { roleName, activeChannels, statusTitle };
}

export async function ChatConsoleShell({
  currentHref,
  roleHref,
  channelsHref,
  threadTitle,
  followUpCount = 0,
  shellContext,
  children,
}: ChatConsoleShellProps) {
  let overview = shellContext ?? null;

  if (!overview) {
    const user = await requireUser(currentHref);
    const supabase = await createClient();
    overview = await loadDashboardOverview({ supabase, userId: user.id });
  }

  const summary = buildConsoleSummary(overview);
  const activeRoleId = overview?.currentRole?.agentId ?? null;

  return (
    <div className="app-console-shell">
      {/* ── Left Sidebar ── */}
      <aside className="app-console-sidebar">
        <div className="app-console-sidebar-inner">
          {/* Brand */}
          <div className="app-console-brand">
            <Link href="/?preview=landing" className="app-console-brand-link">
              <span className="app-console-brand-mark">SC</span>
              <span className="app-console-brand-name">SparkCore</span>
            </Link>
          </div>

          {/* Current role portrait + info */}
          <Link
            href={roleHref}
            className="chat-sidebar-portrait-link"
            aria-label="View role"
          >
            <div className="chat-sidebar-portrait">
              <div className="chat-sidebar-portrait-img" aria-hidden="true">
                {summary.roleName.slice(0, 1).toUpperCase()}
              </div>
              <div
                className={`chat-sidebar-portrait-status${summary.activeChannels > 0 ? " live" : ""}`}
                aria-hidden="true"
              />
            </div>
            <div className="chat-sidebar-portrait-name">{summary.roleName}</div>
            <div className="chat-sidebar-portrait-meta">{summary.statusTitle}</div>
          </Link>

          {/* Nav */}
          <nav className="app-console-nav" aria-label="Console">
            {productConsoleNavItems.map((item) => {
              const active = isActiveConsoleRoute(currentHref, item.match);
              return (
                <Link
                  key={item.href}
                  href={buildConsoleNavHref(item.href, activeRoleId)}
                  className={`app-console-nav-item${active ? " active" : ""}`}
                >
                  <span className="app-console-nav-label">{item.label}</span>
                  <span className="app-console-nav-desc">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="app-console-sidebar-footer">
          <Link href="/?preview=landing" className="app-console-exit-link">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* ── Chat Main ── */}
      <main className="chat-console-main">
        {/* Chat Topbar */}
        <div className="chat-console-topbar">
          <div className="chat-console-topbar-left">
            <div className="chat-console-topbar-info">
              <span className="chat-console-role-name">{summary.roleName}</span>
              {threadTitle ? (
                <span className="chat-console-thread-name">{threadTitle}</span>
              ) : null}
            </div>
            <span
              className={`chat-console-status-chip${
                summary.activeChannels > 0 ? " live" : ""
              }`}
            >
              <span
                className={`chat-console-status-dot${
                  summary.activeChannels > 0 ? " live" : ""
                }`}
                aria-hidden="true"
              />
              {summary.statusTitle}
            </span>
            {followUpCount > 0 ? (
              <span className="chat-console-status-chip attention">
                <span className="chat-console-status-dot attention" aria-hidden="true" />
                Needs attention
              </span>
            ) : null}
          </div>

          <nav className="chat-console-topbar-nav" aria-label="Quick links">
            <Link href={roleHref} className="chat-console-nav-link">
              Role
            </Link>
            <Link href={channelsHref} className="chat-console-nav-link">
              Channels
            </Link>
          </nav>
        </div>

        {/* Chat Thread fills the rest */}
        {children}
      </main>
    </div>
  );
}
