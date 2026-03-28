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
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const appHomeHref = resolvedRoleId
    ? `/app/${encodeURIComponent(resolvedRoleId)}`
    : resolution?.href ?? "/app";

  if (!data) {
    return null;
  }

  const groups = splitMemoryGroups(data.items);
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
            Settings
          </Link>
          <Link className="button button-secondary" href={chatHref}>
            Continue chat
          </Link>
        </>
      }
      currentHref="/app/memory"
      description={`${activeMemoryCount} active rows${repairPressureCount > 0 ? ` · ${repairPressureCount} need review` : " · nothing pending"}`}
      eyebrow="Memory Center"
      shellContext={overview}
      title="Memory"
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

      {/* Status chips */}
      <div className="chat-status-bar">
        <span
          className={`product-status-pill ${
            repairPressureCount > 0
              ? "product-status-pill-warning"
              : "product-status-pill-ready"
          }`}
        >
          {repairPressureCount > 0
            ? `${repairPressureCount} rows need review`
            : "Queue clear"}
        </span>
        <span className="product-status-pill product-status-pill-neutral">
          {activeMemoryCount} active rows
        </span>
        {groups.hidden.length > 0 ? (
          <span className="product-status-pill product-status-pill-warning">
            {groups.hidden.length} hidden
          </span>
        ) : null}
      </div>

      {/* Repair queue */}
      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Repair queue</p>
          <h2>
            {repairPressureCount > 0
              ? "Rows that need attention."
              : "Nothing pending."}
          </h2>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Rows waiting for action</h2>
            <span
              className={`product-status-pill ${
                reviewQueue.length > 0
                  ? "product-status-pill-warning"
                  : "product-status-pill-ready"
              }`}
            >
              {reviewQueue.length > 0
                ? `${reviewQueue.length} pending`
                : "Nothing pending"}
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
      </section>

      {/* Live archive */}
      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Live archive</p>
          <h2>Active memory rows.</h2>
        </div>

        <section className="memory-group">
          <div className="memory-group-header">
            <h4>Long-term memory</h4>
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
