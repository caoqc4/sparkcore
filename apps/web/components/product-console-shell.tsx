import Link from "next/link";
import { requireUser } from "@/lib/auth-redirect";
import {
  loadDashboardOverview,
  type DashboardOverview,
} from "@/lib/product/dashboard";
import { createClient } from "@/lib/supabase/server";

const productConsoleNavItems = [
  {
    href: "/app",
    label: "Console Home",
    description: "State, next step, and operator signals",
    match: ["/app"],
  },
  {
    href: "/app/chat",
    label: "Web Continuation",
    description: "Use web as the supporting thread lane",
    match: ["/app/chat", "/chat"],
  },
  {
    href: "/app/roles",
    label: "Role Assets",
    description: "Manage and switch role identities",
    match: ["/app/roles"],
  },
  {
    href: "/app/memory",
    label: "Memory Center",
    description: "Inspect, repair, and restore memory",
    match: ["/app/memory"],
  },
  {
    href: "/app/settings",
    label: "Integrations & Settings",
    description: "Role core, channels, and boundaries",
    match: [
      "/app/settings",
      "/app/profile",
      "/app/channels",
      "/app/privacy",
      "/connect-im",
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
  if (matchers.includes(currentHref)) {
    return true;
  }

  return matchers.some((matcher) => {
    if (matcher === "/app") {
      return currentHref.startsWith("/app/");
    }

    return currentHref.startsWith(`${matcher}/`);
  });
}

function buildConsoleSummary(overview: DashboardOverview | null) {
  const roleName = overview?.currentRole?.name ?? "No role yet";
  const personaSummary =
    overview?.currentRole?.personaSummary ??
    "Create a role first so the relationship system has a persistent identity to manage.";
  const relationshipLabel =
    overview?.relationshipSummary.label ?? "Setup needed";
  const currentThread = overview?.currentThread;
  const activeChannels = overview?.channelSummary.active ?? 0;
  const memoryCount = overview?.memorySummary.active ?? 0;
  const platformLabel = overview?.channelSummary.platforms.length
    ? overview.channelSummary.platforms.join(", ")
    : "No live IM channel attached";

  const statusTitle = activeChannels > 0 ? "IM loop live" : "Web-only loop";
  const threadLabel = currentThread
    ? `Canonical thread · ${currentThread.title}`
    : "No canonical thread is active yet.";

  return {
    roleName,
    personaSummary,
    relationshipLabel,
    currentThread,
    activeChannels,
    memoryCount,
    statusTitle,
    threadLabel,
    platformLabel,
  };
}

function buildConsoleNavHref(href: string, roleId: string | null) {
  if (!roleId) {
    return href;
  }

  if (href === "/app") {
    return `/app/${encodeURIComponent(roleId)}`;
  }

  if (
    href === "/app/chat" ||
    href === "/app/memory" ||
    href === "/app/settings"
  ) {
    return `${href}?role=${encodeURIComponent(roleId)}`;
  }

  return href;
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
    overview = await loadDashboardOverview({
      supabase,
      userId: user.id,
    });
  }

  const summary = buildConsoleSummary(overview);
  const landingPreviewHref = "/?preview=landing";
  const activeRoleId = overview?.currentRole?.agentId ?? null;

  return (
    <main className="shell">
      <section className="card card-wide product-console-shell">
        <div className="product-console-layout">
          <aside className="product-console-sidebar">
            <div className="product-console-sidebar-top">
              <div className="product-console-brand-row">
                <Link
                  className="product-console-home"
                  href={landingPreviewHref}
                >
                  SparkCore Public
                </Link>
                <span className="product-console-status">App Console</span>
              </div>

              <section className="product-console-role-card">
                <div className="product-console-role-avatar" aria-hidden="true">
                  {summary.roleName.slice(0, 1).toUpperCase()}
                </div>
                <div className="product-console-role-copy">
                  <p className="product-console-role-kicker">
                    {summary.relationshipLabel}
                  </p>
                  <h2>{summary.roleName}</h2>
                  <p>{summary.personaSummary}</p>
                </div>
              </section>

              <nav aria-label="Product console" className="product-console-nav">
                {productConsoleNavItems.map((item) => (
                  <Link
                    className={`product-console-nav-link ${
                      isActiveConsoleRoute(currentHref, item.match)
                        ? "product-console-nav-link-active"
                        : ""
                    }`}
                    href={buildConsoleNavHref(item.href, activeRoleId)}
                    key={item.href}
                  >
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="product-console-sidebar-bottom">
              <section className="product-console-sidebar-card">
                <div className="product-console-status-row">
                  <p className="product-console-sidebar-label">
                    {summary.statusTitle}
                  </p>
                  <span
                    aria-hidden="true"
                    className={`product-console-status-dot ${
                      summary.activeChannels > 0
                        ? "product-console-status-dot-live"
                        : "product-console-status-dot-muted"
                    }`}
                  />
                </div>
                <p className="product-console-thread-label">
                  {summary.threadLabel}
                </p>
                <p className="product-console-platform-label">
                  {summary.platformLabel}
                </p>
                <div className="product-console-sidebar-metrics">
                  <div>
                    <span>Memory</span>
                    <strong>{summary.memoryCount}</strong>
                  </div>
                  <div>
                    <span>Channels</span>
                    <strong>{summary.activeChannels}</strong>
                  </div>
                </div>
              </section>

              <div className="product-console-utility-links">
                {summary.currentThread ? (
                  <Link
                    className="product-console-utility-link"
                    href={`/chat?thread=${encodeURIComponent(summary.currentThread.threadId)}`}
                  >
                    Open advanced workspace
                  </Link>
                ) : null}
                <Link
                  className="product-console-utility-link"
                  href={landingPreviewHref}
                >
                  Back to landing
                </Link>
              </div>
            </div>
          </aside>

          <div className="product-console-main">
            <div className="product-console-main-topbar">
              <span className="product-console-main-chip">{eyebrow}</span>
              {summary.currentThread ? (
                <span className="product-console-main-chip product-console-main-chip-muted">
                  {summary.currentThread.title}
                </span>
              ) : null}
            </div>

            <div className="product-console-hero">
              <div className="product-console-hero-copy">
                <h1 className="title">{title}</h1>
                <p className="lead">{description}</p>
              </div>

              {actions ? (
                <div className="product-console-hero-actions">{actions}</div>
              ) : null}
            </div>

            <div className="product-console-body">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
