import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProductEventTracker } from "@/components/product-event-tracker";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
  restoreProductMemory
} from "@/app/dashboard/memory/actions";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadProductPrivacyPageData } from "@/lib/product/privacy";

function PrivacyMemoryAction({
  action,
  memoryId
}: {
  action: "hide" | "incorrect" | "restore" | null;
  memoryId: string;
}) {
  if (action === "hide") {
    return (
      <form action={hideProductMemory} className="memory-card-actions">
        <input name="memory_id" type="hidden" value={memoryId} />
        <FormSubmitButton
          className="button button-secondary memory-hide-button"
          eventName="memory_action_hide"
          eventPayload={{ memory_id: memoryId, surface: "dashboard_privacy" }}
          idleText="Hide"
          pendingText="Hiding..."
        />
      </form>
    );
  }

  if (action === "incorrect") {
    return (
      <form action={markProductMemoryIncorrect} className="memory-card-actions">
        <input name="memory_id" type="hidden" value={memoryId} />
        <FormSubmitButton
          className="button button-secondary memory-hide-button"
          eventName="memory_action_incorrect"
          eventPayload={{ memory_id: memoryId, surface: "dashboard_privacy" }}
          idleText="Mark incorrect"
          pendingText="Saving..."
        />
      </form>
    );
  }

  if (action === "restore") {
    return (
      <form action={restoreProductMemory} className="memory-card-actions">
        <input name="memory_id" type="hidden" value={memoryId} />
        <FormSubmitButton
          className="button button-secondary memory-hide-button"
          eventName="memory_action_restore"
          eventPayload={{ memory_id: memoryId, surface: "dashboard_privacy" }}
          idleText="Restore"
          pendingText="Restoring..."
        />
      </form>
    );
  }

  return null;
}

export default async function DashboardPrivacyPage() {
  const user = await requireUser("/dashboard/privacy");
  const supabase = await createClient();
  const data = await loadProductPrivacyPageData({
    supabase,
    userId: user.id
  });

  if (!data) {
    return null;
  }

  return (
    <main className="shell">
      <section className="card card-wide">
        <ProductEventTracker event="first_privacy_view" payload={{ surface: "dashboard_privacy" }} />
        <p className="eyebrow">Dashboard Privacy</p>
        <h1 className="title">See what you can control now, without pretending hidden systems already exist.</h1>
        <p className="lead">
          This page only surfaces privacy controls that are already real in the product layer:
          memory visibility and repair, source trace review, and channel management.
        </p>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Memory controls</h2>
            <p>{data.memory.active} active memory item(s)</p>
            <p>
              {data.memory.hidden} hidden · {data.memory.incorrect} incorrect ·{" "}
              {data.memory.traceAvailable} with visible source trace
            </p>
          </article>
          <article className="site-card">
            <h2>Channel boundaries</h2>
            <p>{data.channels.active} active / {data.channels.total} total binding(s)</p>
            <p>
              {data.channels.platforms.length > 0
                ? data.channels.platforms.join(", ")
                : "No IM channels attached yet."}
            </p>
          </article>
          <article className="site-card">
            <h2>Boundary model</h2>
            <p>Available now: visible memory, correction flows, source trace, channel state.</p>
            <p>Not shown yet: fake export, delete, or automation toggles.</p>
          </article>
        </div>

        <section className="privacy-section">
          <div className="privacy-section-header">
            <h2>Memory source drill-down</h2>
            <p className="helper-copy">
              Start with real memory rows and shallow trace, then branch to the deeper memory page
              when you need a fuller repair workflow.
            </p>
          </div>
          <div className="privacy-memory-list">
            {data.drillDownItems.map((item) => (
              <article className="memory-card" key={item.id}>
                <div className="memory-card-row">
                  <div className="memory-badges">
                    <span className="thread-badge">{item.categoryLabel}</span>
                    <span className="thread-badge thread-badge-muted">{item.scopeLabel}</span>
                    <span className="thread-badge thread-badge-muted">{item.statusLabel}</span>
                  </div>
                  <span className="memory-confidence memory-confidence-medium">
                    confidence · {item.confidence.toFixed(2)}
                  </span>
                </div>
                <p className="memory-content">{item.content}</p>
                <p className="memory-effect-copy">{item.effectHint}</p>
                <p className="thread-link-meta">
                  Source time:{" "}
                  {item.sourceTimestamp
                    ? new Date(item.sourceTimestamp).toLocaleString()
                    : "Not linked yet"}
                </p>
                <p className="thread-link-meta">
                  Source thread: {item.sourceThreadTitle ?? "No source thread recorded"}
                </p>
                {item.targetAgentName ? (
                  <p className="thread-link-meta">Affects role: {item.targetAgentName}</p>
                ) : null}
                <details className="privacy-trace-shell">
                  <summary className="privacy-trace-summary">Open source drill-down</summary>
                  <div className="privacy-trace-details">
                    <p>
                      {item.sourceRole
                        ? `Extracted from a ${item.sourceRole} message.`
                        : "The exact source message role is not currently available."}
                    </p>
                    <p>
                      {item.sourceExcerpt
                        ? `Excerpt: ${item.sourceExcerpt}`
                        : "No source excerpt is currently stored for this row."}
                    </p>
                    <p>Current effect: {item.effectHint}</p>
                    {item.sourceThreadId ? (
                      <Link
                        className="memory-trace-link"
                        href={`/chat?thread=${encodeURIComponent(item.sourceThreadId)}`}
                      >
                        Open source thread
                      </Link>
                    ) : null}
                  </div>
                </details>
                <PrivacyMemoryAction action={item.action} memoryId={item.id} />
              </article>
            ))}
          </div>
          <div className="toolbar">
            <Link className="site-inline-link" href="/dashboard/memory">
              Open full memory center
            </Link>
          </div>
        </section>

        <section className="privacy-section">
          <div className="privacy-section-header">
            <h2>Boundary notes</h2>
            <p className="helper-copy">
              This is where we set expectations instead of drawing unusable controls.
            </p>
          </div>
          <div className="site-card-grid">
            {data.boundaries.map((item) => (
              <article className="site-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="notice notice-warning">
          For now, if you need heavier data handling than these controls provide, use the current
          memory and channel tools first rather than expecting a broader account-level privacy
          console to already exist.
        </div>
      </section>
    </main>
  );
}
