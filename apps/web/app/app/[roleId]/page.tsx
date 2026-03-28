import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { createClient } from "@/lib/supabase/server";

function formatStateLabel(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.replace(/_/g, " ");
}

function getContinuityStatus(
  overview: Awaited<ReturnType<typeof loadDashboardOverview>>,
) {
  if (!overview?.currentThread) {
    return {
      tone: "warning",
      badge: "Setup needed",
      headline: "No canonical thread yet",
      detail:
        "Start the first real loop so continuity has a thread to carry forward.",
      href: overview?.nextStep.href ?? "/create",
      cta: "Finish setup",
    } as const;
  }

  if (overview.followUpSummary.pendingCount > 0) {
    return {
      tone: "warning",
      badge: "Queue active",
      headline: `${overview.followUpSummary.pendingCount} follow-up waiting`,
      detail:
        "The relationship already has pending pressure. Clear it before the thread drifts.",
      href: "/app/chat",
      cta: "Handle follow-up",
    } as const;
  }

  return {
    tone: "ready",
    badge: "Stable loop",
    headline: "Canonical thread is live",
    detail:
      "Continuity is established enough to keep using the same thread intentionally.",
    href: "/app/chat",
    cta: "Open web continuation",
  } as const;
}

type AppConsolePageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function AppConsolePage({ params }: AppConsolePageProps) {
  const { roleId } = await params;
  const user = await requireUser(`/app/${encodeURIComponent(roleId)}`);
  const supabase = await createClient();
  const overview = await loadDashboardOverview({
    supabase,
    userId: user.id,
    roleId,
  });

  if (!overview) {
    return null;
  }

  const roleQuerySuffix = `?role=${encodeURIComponent(roleId)}`;
  const settingsHref = `/app/settings${roleQuerySuffix}`;

  const withRoleContext = (href: string) => {
    if (!href.startsWith("/app/")) {
      return href;
    }

    if (href.includes("role=")) {
      return href;
    }

    if (href.startsWith("/app/settings")) {
      return `${href}${href.includes("?") ? "&" : "?"}role=${encodeURIComponent(roleId)}`;
    }

    if (href.startsWith("/app/chat") || href.startsWith("/app/memory")) {
      return `${href}${href.includes("?") ? "&" : "?"}role=${encodeURIComponent(roleId)}`;
    }

    return href;
  };

  const needsChannelAttention = overview.channelSummary.active === 0;
  const memoryAttentionCount =
    overview.memorySummary.hidden + overview.memorySummary.incorrect;
  const continuityStatus = getContinuityStatus(overview);
  const channelStatus = needsChannelAttention
    ? {
        tone: "warning",
        badge: "Web only",
        headline: "No live IM path",
        detail:
          "The relationship is still trapped inside the browser until a channel is attached.",
        href: "/connect-im",
        cta: "Finish IM connection",
      }
    : {
        tone: "ready",
        badge: "IM live",
        headline: `${overview.channelSummary.active} live binding(s)`,
        detail:
          "A real IM path exists, so the daily rhythm can continue outside the web console.",
        href: "/app/settings?tab=channels",
        cta: "Check channel health",
      };
  const memoryStatus =
    memoryAttentionCount > 0
      ? {
          tone: "warning",
          badge: "Repair queue",
          headline: `${memoryAttentionCount} row(s) need review`,
          detail:
            "Repair hidden or incorrect rows before they keep shaping the relationship.",
          href: "/app/memory",
          cta: "Open repair queue",
        }
      : {
          tone: "ready",
          badge: "Clean enough",
          headline: `${overview.memorySummary.active} active row(s)`,
          detail:
            "Memory is visible and stable enough to inspect without immediate repair pressure.",
          href: "/app/memory",
          cta: "Inspect memory",
        };
  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={withRoleContext(overview.nextStep.href)}>
            {overview.nextStep.title}
          </Link>
          <Link className="button button-secondary" href={settingsHref}>
            Open settings
          </Link>
        </>
      }
      currentHref={`/app/${encodeURIComponent(roleId)}`}
      description={overview.relationshipSummary.body}
      eyebrow="App Console"
      shellContext={overview}
      title={overview.relationshipSummary.headline}
    >
      <ProductEventTracker
        event="first_dashboard_view"
        payload={{ relationship_state: overview.relationshipState }}
      />
      <ProductEventTracker
        event="relationship_summary_view"
        payload={{ relationship_state: overview.relationshipState }}
      />

      <div className="product-glance-grid product-action-home-grid">
        <article className="site-card product-highlight-card product-action-card product-action-card-primary">
          <p className="product-inline-kicker">Do this now</p>
          <h2>{overview.nextStep.title}</h2>
          <p>{overview.nextStep.body}</p>
          <div className="product-meta-list">
            <p>
              {overview.currentRole
                ? `${overview.currentRole.name} is the active role carrying this relationship loop.`
                : "No role is attached to the active relationship loop yet."}
            </p>
            <p>
              {overview.currentThread
                ? `Current thread · ${overview.currentThread.title}`
                : "No canonical thread has been established yet."}
            </p>
          </div>
          <div className="toolbar">
            <Link
              className="button button-primary"
              href={withRoleContext(overview.nextStep.href)}
            >
              {overview.nextStep.title}
            </Link>
            <Link className="button button-secondary" href={settingsHref}>
              Open settings
            </Link>
          </div>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${continuityStatus.tone}`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Continuity</span>
            <span
              className={`product-status-pill product-status-pill-${continuityStatus.tone}`}
            >
              {continuityStatus.badge}
            </span>
          </div>
          <strong>{continuityStatus.headline}</strong>
          <p>{continuityStatus.detail}</p>
          <div className="product-status-meta">
            <span>
              Lifecycle ·{" "}
              {formatStateLabel(
                overview.threadState.lifecycleStatus,
                "not established",
              )}
            </span>
            <span>
              Focus mode ·{" "}
              {formatStateLabel(overview.threadState.focusMode, "not set")}
            </span>
          </div>
          <Link className="site-inline-link" href={withRoleContext(continuityStatus.href)}>
            {continuityStatus.cta}
          </Link>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${channelStatus.tone}`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Channels</span>
            <span
              className={`product-status-pill product-status-pill-${channelStatus.tone}`}
            >
              {channelStatus.badge}
            </span>
          </div>
          <strong>{channelStatus.headline}</strong>
          <p>{channelStatus.detail}</p>
          <div className="product-status-meta">
            <span>
              Platforms ·{" "}
              {overview.channelSummary.platforms.length > 0
                ? overview.channelSummary.platforms.join(", ")
                : "none connected"}
            </span>
            <span>Bindings total · {overview.channelSummary.total}</span>
          </div>
          <Link className="site-inline-link" href={withRoleContext(channelStatus.href)}>
            {channelStatus.cta}
          </Link>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${memoryStatus.tone}`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Memory</span>
            <span
              className={`product-status-pill product-status-pill-${memoryStatus.tone}`}
            >
              {memoryStatus.badge}
            </span>
          </div>
          <strong>{memoryStatus.headline}</strong>
          <p>{memoryStatus.detail}</p>
          <div className="product-status-meta">
            <span>
              Active · {overview.memorySummary.active} | Hidden ·{" "}
              {overview.memorySummary.hidden}
            </span>
            <span>Incorrect · {overview.memorySummary.incorrect}</span>
          </div>
          <Link className="site-inline-link" href={withRoleContext(memoryStatus.href)}>
            {memoryStatus.cta}
          </Link>
        </article>
      </div>

    </ProductConsoleShell>
  );
}
