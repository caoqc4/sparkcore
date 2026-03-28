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
    match: [
      "/app/settings",
    ],
  },
] as const;

type ProductConsoleShellProps = {
  currentHref: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  shellContext?: DashboardOverview | null;
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
  const personaSummary =
    overview?.currentRole?.personaSummary ??
    "Create a role to start the relationship loop.";
  const relationshipLabel = overview?.relationshipSummary.label ?? "Setup needed";
  const currentThread = overview?.currentThread;
  const activeChannels = overview?.channelSummary.active ?? 0;
  const memoryCount = overview?.memorySummary.active ?? 0;
  const platformLabel = overview?.channelSummary.platforms.length
    ? overview.channelSummary.platforms.join(", ")
    : "No IM connected";
  const statusTitle = activeChannels > 0 ? "IM live" : "Web only";

  return {
    roleName,
    personaSummary,
    relationshipLabel,
    currentThread,
    activeChannels,
    memoryCount,
    statusTitle,
    platformLabel,
  };
}

export async function ProductConsoleShell({
  currentHref,
  eyebrow,
  title,
  description,
  actions,
  children,
  shellContext,
}: ProductConsoleShellProps) {
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

          {/* Current role info */}
          <div className="app-console-role-context" aria-label="Current role">
            <div className="app-console-role-avatar" aria-hidden="true">
              {summary.roleName.slice(0, 1).toUpperCase()}
            </div>
            <div className="app-console-role-info">
              <span className="app-console-role-label">Current role</span>
              <h2 className="app-console-role-name">{summary.roleName}</h2>
              <div className="app-console-role-meta">
                <span
                  className={`app-console-role-dot${
                    summary.activeChannels > 0 ? " live" : ""
                  }`}
                  aria-hidden="true"
                />
                <span className="app-console-role-desc">{summary.statusTitle}</span>
              </div>
            </div>
          </div>

          {/* Nav — 3 modules */}
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
                  <span className="app-console-nav-desc">{item.description}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer — IM status + metrics */}
        <div className="app-console-sidebar-footer">
          <div className="app-console-status-card">
            <div className="app-console-status-row">
              <span className="app-console-status-label">
                {summary.statusTitle}
              </span>
              <span
                className={`app-console-status-dot${
                  summary.activeChannels > 0 ? " live" : ""
                }`}
                aria-hidden="true"
              />
            </div>
            <p className="app-console-platform-label">
              {summary.platformLabel}
            </p>
            <div className="app-console-metrics">
              <div className="app-console-metric">
                <span>Memory</span>
                <strong>{summary.memoryCount}</strong>
              </div>
              <div className="app-console-metric">
                <span>Channels</span>
                <strong>{summary.activeChannels}</strong>
              </div>
            </div>
          </div>
          <Link href="/?preview=landing" className="app-console-exit-link">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="app-console-main">
        {/* Topbar */}
        <div className="app-console-topbar">
          <div className="app-console-topbar-left">
            <span className="app-console-eyebrow">{eyebrow}</span>
            {summary.currentThread ? (
              <span className="app-console-thread-chip">
                {summary.currentThread.title}
              </span>
            ) : null}
          </div>
          {actions ? (
            <div className="app-console-topbar-actions">{actions}</div>
          ) : null}
        </div>

        {/* Scrollable content */}
        <div className="app-console-content">
          <div className="app-console-content-header">
            <h1 className="app-console-page-title">{title}</h1>
            <p className="app-console-page-desc">{description}</p>
          </div>
          <div className="app-console-body">{children}</div>
        </div>
      </main>
    </div>
  );
}
