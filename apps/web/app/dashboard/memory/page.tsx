import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { ProductMemoryItem } from "@/lib/product/memory";
import { loadProductMemoryPageData, getMemoryEffectHint } from "@/lib/product/memory";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
  restoreProductMemory
} from "@/app/dashboard/memory/actions";

type DashboardMemoryPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
  }>;
};

function splitMemoryGroups(items: ProductMemoryItem[]) {
  const list = items;

  return {
    activeLongTerm: list.filter(
      (item) =>
        item.status === "active" &&
        (item.scope === "user_global" || item.scope === "user_agent")
    ),
    activeThreadLocal: list.filter(
      (item) => item.status === "active" && item.scope === "thread_local"
    ),
    hidden: list.filter((item) => item.status === "hidden"),
    incorrect: list.filter((item) => item.status === "incorrect"),
    superseded: list.filter((item) => item.status === "superseded")
  };
}

function MemoryCard({
  item,
  action
}: {
  item: ProductMemoryItem;
  action?: "hide" | "incorrect" | "restore";
}) {
  return (
    <article className="memory-card">
      <div className="memory-card-row">
        <div className="memory-badges">
          <span className="thread-badge">{item.categoryLabel}</span>
          <span className="thread-badge thread-badge-muted">{item.scopeLabel}</span>
          <span className="thread-badge thread-badge-muted">{item.statusLabel}</span>
          <span className="thread-badge thread-badge-muted">{item.semanticTargetLabel}</span>
        </div>
        <span className="memory-confidence memory-confidence-medium">
          confidence · {item.confidence.toFixed(2)}
        </span>
      </div>
      <p className="memory-content">{item.content}</p>
      <p className="memory-effect-copy">{getMemoryEffectHint(item)}</p>
      {item.targetAgentName ? (
        <p className="thread-link-meta">Applies to role: {item.targetAgentName}</p>
      ) : null}
      {item.sourceThreadTitle ? (
        <p className="thread-link-meta">
          From: {item.sourceThreadTitle}
          {item.sourceTimestamp ? ` · ${new Date(item.sourceTimestamp).toLocaleString()}` : ""}
        </p>
      ) : null}
      {item.sourceThreadId ? (
        <a className="memory-trace-link" href={`/chat?thread=${item.sourceThreadId}`}>
          View source thread
        </a>
      ) : null}
      {action === "hide" ? (
        <form action={hideProductMemory} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            idleText="Hide"
            pendingText="Hiding..."
          />
        </form>
      ) : null}
      {action === "incorrect" ? (
        <form action={markProductMemoryIncorrect} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
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
            idleText="Restore"
            pendingText="Restoring..."
          />
        </form>
      ) : null}
    </article>
  );
}

export default async function DashboardMemoryPage({
  searchParams
}: DashboardMemoryPageProps) {
  const params = await searchParams;
  const user = await requireUser("/dashboard/memory");
  const supabase = await createClient();
  const data = await loadProductMemoryPageData({
    supabase,
    userId: user.id
  });

  if (!data) {
    return null;
  }

  const groups = splitMemoryGroups(data.items);

  return (
    <main className="shell">
      <section className="card card-wide">
        <p className="eyebrow">Dashboard Memory</p>
        <h1 className="title">Long-term memory is now visible from the product control center.</h1>
        <p className="lead">
          This page surfaces real memory rows, grouped by active and non-active states, with
          direct repair actions.
        </p>

        {params.feedback ? (
          <div
            className={`notice ${
              params.feedback_type === "error" ? "notice-error" : "notice-success"
            }`}
          >
            {params.feedback}
          </div>
        ) : null}

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Overview</h2>
            <p>{groups.activeLongTerm.length + groups.activeThreadLocal.length} active memory item(s)</p>
            <p>
              {groups.hidden.length} hidden · {groups.incorrect.length} incorrect ·{" "}
              {groups.superseded.length} superseded
            </p>
          </article>
          <article className="site-card">
            <h2>Route naming</h2>
            <p>Public explainer: `/features/memory-center`</p>
            <p>Product control page: `/dashboard/memory`</p>
          </article>
        </div>

        <section className="memory-group">
          <div className="memory-group-header">
            <h4>Long-term memory</h4>
            <p className="helper-copy">
              These entries are the main visible layer of “remembering you” and “remembering us”.
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
              <p className="helper-copy">No long-term memory has been written yet.</p>
            </div>
          )}
        </section>

        {groups.activeThreadLocal.length > 0 ? (
          <section className="memory-group">
            <div className="memory-group-header">
              <h4>Current-thread notes</h4>
              <p className="helper-copy">
                These entries mainly affect the current thread rather than the relationship globally.
              </p>
            </div>
            <div className="memory-list">
              {groups.activeThreadLocal.map((item) => (
                <MemoryCard key={item.id} item={item} action="incorrect" />
              ))}
            </div>
          </section>
        ) : null}

        {groups.hidden.length > 0 ? (
          <details className="memory-hidden-shell">
            <summary className="memory-hidden-summary">
              Hidden ({groups.hidden.length})
            </summary>
            <div className="memory-list memory-list-hidden">
              {groups.hidden.map((item) => (
                <MemoryCard key={item.id} item={item} action="restore" />
              ))}
            </div>
          </details>
        ) : null}

        {groups.incorrect.length > 0 ? (
          <details className="memory-hidden-shell">
            <summary className="memory-hidden-summary">
              Incorrect ({groups.incorrect.length})
            </summary>
            <div className="memory-list memory-list-hidden">
              {groups.incorrect.map((item) => (
                <MemoryCard key={item.id} item={item} action="restore" />
              ))}
            </div>
          </details>
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
    </main>
  );
}
