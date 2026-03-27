import Link from "next/link";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import type { ProductMemoryItem } from "@/lib/product/memory";
import {
  loadProductMemoryPageData,
  getMemoryEffectHint,
} from "@/lib/product/memory";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
  restoreProductMemory,
} from "@/app/app/memory/actions";

type DashboardMemoryPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

function splitMemoryGroups(items: ProductMemoryItem[]) {
  const list = items;

  return {
    activeLongTerm: list.filter(
      (item) =>
        item.status === "active" &&
        (item.scope === "user_global" || item.scope === "user_agent"),
    ),
    activeThreadLocal: list.filter(
      (item) => item.status === "active" && item.scope === "thread_local",
    ),
    hidden: list.filter((item) => item.status === "hidden"),
    incorrect: list.filter((item) => item.status === "incorrect"),
    superseded: list.filter((item) => item.status === "superseded"),
  };
}

function MemoryCard({
  item,
  action,
}: {
  item: ProductMemoryItem;
  action?: "hide" | "incorrect" | "restore";
}) {
  return (
    <article className="memory-card">
      <div className="memory-card-row">
        <div className="memory-badges">
          <span className="thread-badge">{item.categoryLabel}</span>
          <span className="thread-badge thread-badge-muted">
            {item.scopeLabel}
          </span>
          <span className="thread-badge thread-badge-muted">
            {item.statusLabel}
          </span>
          <span className="thread-badge thread-badge-muted">
            {item.semanticTargetLabel}
          </span>
        </div>
        <span className="memory-confidence memory-confidence-medium">
          confidence · {item.confidence.toFixed(2)}
        </span>
      </div>
      <p className="memory-content">{item.content}</p>
      <p className="memory-effect-copy">{getMemoryEffectHint(item)}</p>
      {item.targetAgentName ? (
        <p className="thread-link-meta">
          Applies to role: {item.targetAgentName}
        </p>
      ) : null}
      {item.sourceThreadTitle ? (
        <p className="thread-link-meta">
          From: {item.sourceThreadTitle}
          {item.sourceTimestamp
            ? ` · ${new Date(item.sourceTimestamp).toLocaleString()}`
            : ""}
        </p>
      ) : null}
      {item.sourceThreadId ? (
        <a
          className="memory-trace-link"
          href={`/chat?thread=${item.sourceThreadId}`}
        >
          View source thread
        </a>
      ) : null}
      {action === "hide" ? (
        <form action={hideProductMemory} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_hide"
            eventPayload={{ memory_id: item.id }}
            idleText="Hide"
            pendingText="Hiding..."
          />
        </form>
      ) : null}
      {action === "incorrect" ? (
        <form
          action={markProductMemoryIncorrect}
          className="memory-card-actions"
        >
          <input name="memory_id" type="hidden" value={item.id} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_incorrect"
            eventPayload={{ memory_id: item.id }}
            idleText="Mark incorrect"
            pendingText="Saving..."
          />
        </form>
      ) : null}
      {action === "restore" ? (
        <form action={restoreProductMemory} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_restore"
            eventPayload={{ memory_id: item.id }}
            idleText="Restore"
            pendingText="Restoring..."
          />
        </form>
      ) : null}
    </article>
  );
}

export default async function AppMemoryPage({
  searchParams,
}: DashboardMemoryPageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/memory");
  const supabase = await createClient();
  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const [data, overview, resolution] = await Promise.all([
    loadProductMemoryPageData({
      supabase,
      userId: user.id,
      roleId,
      threadId: typeof params.thread === "string" ? params.thread : null,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      roleId,
      threadId: typeof params.thread === "string" ? params.thread : null,
    }),
    resolveProductAppRoute({
      supabase,
      userId: user.id,
    }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const settingsHref = `/app/settings${roleQuerySuffix}`;
  const settingsBoundariesHref = `${settingsHref}${
    roleQuerySuffix ? "&" : "?"
  }tab=boundaries`;
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const appHomeHref = resolvedRoleId
    ? `/app/${encodeURIComponent(resolvedRoleId)}`
    : resolution?.href ?? "/app";

  if (!data) {
    return null;
  }

  const groups = splitMemoryGroups(data.items);
  const traceCoverageCount = data.items.filter(
    (item) => item.sourceThreadId,
  ).length;
  const repairPressureCount = groups.hidden.length + groups.incorrect.length;
  const activeMemoryCount =
    groups.activeLongTerm.length + groups.activeThreadLocal.length;
  const reviewQueue = [
    ...groups.incorrect.map((item) => ({ item })),
    ...groups.hidden.map((item) => ({ item })),
  ];

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={settingsHref}>
            Open settings
          </Link>
          <Link className="button button-secondary" href={appHomeHref}>
            Back to app home
          </Link>
        </>
      }
      currentHref="/app/memory"
      description="This page surfaces real memory rows, grouped by active and non-active states, with direct repair actions."
      eyebrow="Memory Center"
      shellContext={overview}
      title="Long-term memory is now visible from the product control center."
    >
      <ProductEventTracker
        event="first_memory_view"
        payload={{
          active_memory_count:
            groups.activeLongTerm.length + groups.activeThreadLocal.length,
        }}
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

      <div className="product-glance-grid product-action-home-grid">
        <article className="site-card product-highlight-card product-action-card product-action-card-primary">
          <p className="product-inline-kicker">Memory console</p>
          <h2>
            {repairPressureCount > 0
              ? "Repair the rows that are already distorting continuity."
              : "The archive is stable enough to inspect before you touch anything."}
          </h2>
          <p>
            {repairPressureCount > 0
              ? "Hidden and incorrect rows are the clearest signs of drift. Clear that queue first, then browse the live archive."
              : "There is no urgent repair backlog, so you can inspect the active archive and trace coverage without pressure."}
          </p>
          <div className="product-meta-list">
            <p>Active rows · {activeMemoryCount}</p>
            <p>
              Long-term · {groups.activeLongTerm.length} | Current thread ·{" "}
              {groups.activeThreadLocal.length}
            </p>
            <p>Superseded archive · {groups.superseded.length}</p>
          </div>
          <div className="toolbar">
            <Link
              className="button button-primary"
              href={settingsBoundariesHref}
            >
              Review boundary posture
            </Link>
            <Link className="button button-secondary" href={chatHref}>
              Continue the canonical thread
            </Link>
          </div>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${
            repairPressureCount > 0 ? "warning" : "ready"
          }`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Repair queue</span>
            <span
              className={`product-status-pill ${
                repairPressureCount > 0
                  ? "product-status-pill-warning"
                  : "product-status-pill-ready"
              }`}
            >
              {repairPressureCount > 0 ? "Attention needed" : "Queue clear"}
            </span>
          </div>
          <strong>
            {repairPressureCount > 0
              ? `${repairPressureCount} row(s) are waiting for review`
              : "No hidden or incorrect rows are waiting right now"}
          </strong>
          <p>
            Hidden rows stop applying. Incorrect rows flag drift without erasing
            provenance.
          </p>
          <div className="product-status-meta">
            <span>Hidden · {groups.hidden.length}</span>
            <span>Incorrect · {groups.incorrect.length}</span>
          </div>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${
            traceCoverageCount > 0 ? "ready" : "warning"
          }`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Source trace</span>
            <span
              className={`product-status-pill ${
                traceCoverageCount > 0
                  ? "product-status-pill-ready"
                  : "product-status-pill-warning"
              }`}
            >
              {traceCoverageCount > 0 ? "Traceable" : "Thin trace"}
            </span>
          </div>
          <strong>{traceCoverageCount} row(s) can jump back to source</strong>
          <p>
            Use source links to verify where a memory came from before you trust
            or repair it.
          </p>
          <div className="product-status-meta">
            <span>Active rows · {activeMemoryCount}</span>
            <span>Trace coverage · {traceCoverageCount}</span>
          </div>
        </article>
      </div>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Repair queue</p>
          <h2>
            Handle the rows that already need attention before browsing the
            archive.
          </h2>
          <p>
            Hidden and incorrect rows are the clearest signals of drift. Review
            them first, then move into the live memory archive once the queue is
            under control.
          </p>
        </div>

        <div className="product-dual-grid">
          <section className="site-card product-form-card">
            <div className="product-status-card-head">
              <h2>Rows waiting for operator action</h2>
              <span
                className={`product-status-pill ${
                  reviewQueue.length > 0
                    ? "product-status-pill-warning"
                    : "product-status-pill-ready"
                }`}
              >
                {reviewQueue.length > 0 ? "Work queue" : "Nothing pending"}
              </span>
            </div>
            {reviewQueue.length > 0 ? (
              <div className="memory-list">
                {reviewQueue.map(({ item }) => (
                  <MemoryCard key={item.id} action="restore" item={item} />
                ))}
              </div>
            ) : (
              <div className="product-empty-state">
                <p>No hidden or incorrect rows are waiting right now.</p>
              </div>
            )}
          </section>

          <section className="site-card product-preview-card">
            <div className="product-status-card-head">
              <h2>Repair guide</h2>
              <span className="product-status-pill product-status-pill-neutral">
                Decision aid
              </span>
            </div>
            <div className="product-route-list">
              <article className="product-route-item">
                <strong>
                  Restore a row when it was hidden too aggressively.
                </strong>
                <p>
                  Bring it back only if it should resume shaping continuity for
                  the current relationship.
                </p>
              </article>
              <article className="product-route-item">
                <strong>
                  Use the live archive below when a still-active row is wrong.
                </strong>
                <p>
                  Hide or mark active memory there instead of trying to solve
                  every case from the repair queue.
                </p>
              </article>
              <article className="product-route-item">
                <strong>
                  Step out to posture review when the problem is broader than
                  one row.
                </strong>
                <p>
                  Use boundaries for trust posture and supplementary chat for
                  continuity repair on the same thread.
                </p>
              </article>
            </div>
            <div className="stack">
              <Link
                className="site-inline-link"
                href={settingsBoundariesHref}
              >
                Review boundary posture
              </Link>
              <Link className="site-inline-link" href={chatHref}>
                Continue the canonical thread
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Live archive</p>
          <h2>Browse the memory that is actively shaping the relationship.</h2>
          <p>
            Active long-term rows are the main continuity layer. Thread-local
            rows stay separated so you can distinguish global relationship
            memory from local thread state.
          </p>
        </div>

        <section className="memory-group">
          <div className="memory-group-header">
            <h4>Long-term memory</h4>
            <p className="helper-copy">
              These entries are the main visible layer of remembering you and
              remembering the relationship.
            </p>
          </div>
          {groups.activeLongTerm.length > 0 ? (
            <div className="memory-list">
              {groups.activeLongTerm.map((item) => (
                <MemoryCard key={item.id} item={item} action="hide" />
              ))}
            </div>
          ) : (
            <div className="empty-state section-empty-state memory-group-empty">
              <p className="helper-copy">
                No long-term memory has been written yet.
              </p>
            </div>
          )}
        </section>

        {groups.activeThreadLocal.length > 0 ? (
          <section className="memory-group">
            <div className="memory-group-header">
              <h4>Current-thread notes</h4>
              <p className="helper-copy">
                These entries mainly affect the current thread rather than the
                relationship globally.
              </p>
            </div>
            <div className="memory-list">
              {groups.activeThreadLocal.map((item) => (
                <MemoryCard key={item.id} item={item} action="incorrect" />
              ))}
            </div>
          </section>
        ) : null}

        {groups.superseded.length > 0 ? (
          <details className="memory-hidden-shell">
            <summary className="memory-hidden-summary">
              Superseded ({groups.superseded.length})
            </summary>
            <div className="memory-list memory-list-hidden">
              {groups.superseded.map((item) => (
                <MemoryCard key={item.id} item={item} />
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </ProductConsoleShell>
  );
}
