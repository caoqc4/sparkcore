import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { createClient } from "@/lib/supabase/server";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not recorded yet";
  }

  return new Date(value).toLocaleString();
}

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

export default async function AppConsolePage() {
  const user = await requireUser("/app");
  const supabase = await createClient();
  const overview = await loadDashboardOverview({
    supabase,
    userId: user.id,
  });

  if (!overview) {
    return null;
  }

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
  const jumpCards = [
    {
      title: "Review memory quality",
      body:
        memoryAttentionCount > 0
          ? `${memoryAttentionCount} memory row(s) already need attention. Repair drift before it compounds.`
          : "Memory is stable enough to inspect without repair pressure right now.",
      href: "/app/memory",
      cta: "Open memory center",
    },
    {
      title: needsChannelAttention
        ? "Finish IM connection"
        : "Check channel health",
      body: needsChannelAttention
        ? "The loop is still web-first. Attach Telegram so the daily rhythm can move into IM."
        : "Bindings are live. Verify the active channel stays healthy and ready for follow-up continuity.",
      href: needsChannelAttention
        ? "/connect-im"
        : "/app/settings?tab=channels",
      cta: needsChannelAttention
        ? "Open connect flow"
        : "Open channel settings",
    },
    {
      title: "Continue the same thread on web",
      body: "Use supplementary chat when you need corrective continuation or a controlled web-side follow-up on the canonical thread.",
      href: "/app/chat",
      cta: "Open supplementary chat",
    },
    {
      title: "Refine role behavior",
      body: "Adjust tone, relationship mode, and boundaries when the relationship feel needs to shift without starting over.",
      href: "/app/settings?tab=role",
      cta: "Edit role core",
    },
  ] as const;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={overview.nextStep.href}>
            {overview.nextStep.title}
          </Link>
          <Link className="button button-secondary" href="/app/settings">
            Open settings
          </Link>
        </>
      }
      currentHref="/app"
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
              href={overview.nextStep.href}
            >
              {overview.nextStep.title}
            </Link>
            <Link className="button button-secondary" href="/app/settings">
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
          <Link className="site-inline-link" href={continuityStatus.href}>
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
          <Link className="site-inline-link" href={channelStatus.href}>
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
          <Link className="site-inline-link" href={memoryStatus.href}>
            {memoryStatus.cta}
          </Link>
        </article>
      </div>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Recent signals</p>
          <h2>See what changed recently before you decide where to work.</h2>
          <p>
            This is the lightweight operator view: recent interaction, follow-up
            pressure, and the current thread posture without forcing you into a
            long settings page first.
          </p>
        </div>

        <div className="site-card-grid product-signal-grid">
          <article className="site-card">
            <h2>Last interaction</h2>
            <p>{formatTimestamp(overview.lastInteractionAt)}</p>
            <p>
              {overview.recentActivity.userMessage ??
                "No recent user message has been recorded yet for this relationship loop."}
            </p>
          </article>

          <article className="site-card">
            <h2>Latest assistant turn</h2>
            <p>
              {overview.recentActivity.assistantMessage ??
                "No assistant reply preview is available yet. The next interaction will populate this view."}
            </p>
          </article>

          <article className="site-card">
            <h2>Follow-up queue</h2>
            <p>
              {overview.followUpSummary.pendingCount > 0
                ? `${overview.followUpSummary.pendingCount} pending follow-up action(s).`
                : "No queued follow-up actions right now."}
            </p>
            <p>
              Next trigger ·{" "}
              {formatTimestamp(overview.followUpSummary.nextTriggerAt)}
            </p>
          </article>

          <article className="site-card">
            <h2>Thread posture</h2>
            <p>
              Language ·{" "}
              {overview.threadState.currentLanguageHint?.toUpperCase() ??
                "not specified"}
            </p>
            <p>
              Thread ID ·{" "}
              {overview.currentThread?.threadId ?? "not established yet"}
            </p>
          </article>
        </div>
      </section>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Jump into work</p>
          <h2>
            Choose the surface that matches the job you actually need to do.
          </h2>
          <p>
            Keep the console task-oriented: repair memory, check channel health,
            continue the same thread, or refine the role core.
          </p>
        </div>

        <div className="site-card-grid product-jump-grid">
          {jumpCards.map((card) => (
            <article className="site-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <Link className="site-inline-link" href={card.href}>
                {card.cta}
              </Link>
            </article>
          ))}
          <article className="site-card">
            <h2>Open the deeper workspace</h2>
            <p>
              Branch into the full chat environment only when you need agent
              tooling, raw thread access, or a more advanced operator surface.
            </p>
            <Link
              className="site-inline-link"
              href={
                overview.currentThread
                  ? `/chat?thread=${encodeURIComponent(overview.currentThread.threadId)}`
                  : "/chat"
              }
            >
              Open advanced workspace
            </Link>
          </article>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
