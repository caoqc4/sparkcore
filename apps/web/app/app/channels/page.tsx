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
    loadPrimaryWorkspace({
      supabase,
      userId: user.id,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      roleId,
      threadId,
    }),
    resolveProductAppRoute({
      supabase,
      userId: user.id,
    }),
  ]);

  if (!workspace) {
    return null;
  }

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const roleHref = `/app/role${roleQuerySuffix}`;
  const connectImHref = resolvedRoleId
    ? `/connect-im?agent=${encodeURIComponent(resolvedRoleId)}`
    : "/connect-im";

  const bindings = await loadOwnedChannelBindings({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
  });

  const scopedBindings = bindings.filter((binding) => {
    if (threadId) {
      return binding.threadId === threadId;
    }

    if (resolvedRoleId) {
      return binding.agentId === resolvedRoleId;
    }

    return true;
  });

  const activeBindings = scopedBindings.filter(
    (binding) => binding.status === "active",
  );
  const inactiveBindings = scopedBindings.filter(
    (binding) => binding.status !== "active",
  );
  const selectedBinding =
    activeBindings.find((binding) =>
      overview?.currentThread
        ? binding.threadId === overview.currentThread.threadId
        : false,
    ) ??
    activeBindings[0] ??
    null;
  const otherActiveBindings = activeBindings.filter(
    (binding) => binding.id !== selectedBinding?.id,
  );
  const platformLabel =
    scopedBindings.length > 0
      ? Array.from(new Set(scopedBindings.map((binding) => binding.platform))).join(", ")
      : "None";

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={connectImHref}>
            Connect IM
          </Link>
          <Link className="button button-secondary" href={chatHref}>
            Continue chat
          </Link>
        </>
      }
      currentHref="/app/channels"
      description="Connect this relationship to the right IM path and keep channel state clear."
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

      <div className="chat-status-bar">
        <span
          className={`product-status-pill ${
            activeBindings.length > 0
              ? "product-status-pill-ready"
              : "product-status-pill-warning"
          }`}
        >
          {activeBindings.length > 0 ? "Connected" : "Not set up yet"}
        </span>
        <span className="product-status-pill product-status-pill-neutral">
          {activeBindings.length > 0 ? "Primary path ready" : "Needs attention"}
        </span>
      </div>

      <section className="product-section settings-console-section">
        <div className="product-section-heading">
          <p className="home-kicker">Connection overview</p>
          <h2>Keep one clear path into daily conversation.</h2>
          <p>
            This page is mainly for one decision: is the right IM path attached,
            healthy, and easy to trust. Older paths can stay visible, but they
            should not compete with the primary one.
          </p>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Start here</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Channel guide
            </span>
          </div>
          <div className="product-route-list">
            <article className="product-route-item">
              <strong>Check whether the right IM path is connected.</strong>
              <p>
                Most of the time you only need to answer one question here: can
                this companion be reached in the right place?
              </p>
            </article>
            <article className="product-route-item">
              <strong>Only change bindings when the path is wrong or missing.</strong>
              <p>
                If the companion behavior feels wrong but the path is already
                correct, go back to Role instead of changing channels.
              </p>
            </article>
          </div>
        </section>

        <div className="product-dual-grid">
          <section className="site-card product-preview-card">
            <div className="product-status-card-head">
              <h2>Connection summary</h2>
              <span
                className={`product-status-pill ${
                  activeBindings.length > 0
                    ? "product-status-pill-ready"
                    : "product-status-pill-warning"
                }`}
              >
                {activeBindings.length > 0 ? "Connected" : "Needs attention"}
              </span>
            </div>
            <p className="helper-copy">
              Start here to see whether the companion is reachable in the right
              place, or whether you still need to bind an IM account.
            </p>
            <div className="product-setting-metrics">
              <article className="product-setting-metric">
                <span>Live paths</span>
                <strong>{activeBindings.length}</strong>
                <p>
                  {activeBindings.length > 0
                    ? "At least one IM path is active."
                    : "The relationship is still web-first."}
                </p>
              </article>
              <article className="product-setting-metric">
                <span>Platforms</span>
                <strong>{platformLabel}</strong>
                <p>Where this relationship can currently be reached.</p>
              </article>
              <article className="product-setting-metric">
                <span>Current conversation</span>
                <strong>{overview?.currentThread?.title ?? "Not attached yet"}</strong>
                <p>This is the conversation the current companion should stay connected to.</p>
              </article>
            </div>
            <div className="product-route-list">
              <article className="product-route-item">
                <strong>
                  {activeBindings.length > 0
                    ? "A live path already exists."
                    : "This relationship still needs its first live IM path."}
                </strong>
                <p>
                  {activeBindings.length > 0
                    ? "Use the connect flow when you need to attach a different identity or inspect the current binding more closely."
                    : "Open the connect flow to bind Telegram to the existing role and canonical thread without restarting the relationship."}
                </p>
                <Link className="site-inline-link" href={connectImHref}>
                  Connect IM
                </Link>
              </article>
              <article className="product-route-item">
                <strong>Need to fix the companion instead?</strong>
                <p>
                  If the channel is fine but the behavior feels wrong, adjust the
                  companion in Role instead of changing the transport layer.
                </p>
                <Link className="site-inline-link" href={roleHref}>
                  Review role
                </Link>
              </article>
            </div>
          </section>

          <div className="product-boundary-stack">
            <section className="site-card product-preview-card">
              <div className="product-status-card-head">
                <h2>Main channel</h2>
                <span
                  className={`product-status-pill ${
                    selectedBinding
                      ? "product-status-pill-ready"
                      : "product-status-pill-warning"
                  }`}
                >
                  {selectedBinding ? "Attached" : "Missing"}
                </span>
              </div>
              {selectedBinding ? (
                <article className="memory-card connect-im-binding-card connect-im-binding-card-active">
                  <div className="memory-card-row">
                    <div className="memory-badges">
                      <span className="thread-badge">{selectedBinding.platform}</span>
                      <span className="thread-badge thread-badge-live">active</span>
                    </div>
                  </div>
                  <p className="memory-content">
                    {selectedBinding.agentName ?? "Attached role"}
                  </p>
                  <p className="helper-copy">
                    {selectedBinding.threadTitle ??
                      selectedBinding.threadId ??
                      "Unknown thread"}
                  </p>
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      Connection details
                    </summary>
                    <div className="connect-im-binding-meta">
                      <span>Channel ID: {selectedBinding.channelId}</span>
                      <span>Peer ID: {selectedBinding.peerId}</span>
                    </div>
                  </details>
                  <div className="toolbar">
                    <Link
                      className="site-inline-link"
                      href={
                        selectedBinding.threadId
                          ? `/connect-im?thread=${encodeURIComponent(selectedBinding.threadId)}&agent=${encodeURIComponent(selectedBinding.agentId)}`
                          : `/connect-im?agent=${encodeURIComponent(selectedBinding.agentId)}`
                      }
                    >
                      Rebind or inspect
                    </Link>
                  </div>
                  <form action={unbindProductChannel} className="memory-card-actions">
                    <input name="binding_id" type="hidden" value={selectedBinding.id} />
                    <input
                      name="redirect_to"
                      type="hidden"
                      value={`/app/channels${roleQuerySuffix}`}
                    />
                    <FormSubmitButton
                      className="button button-secondary memory-hide-button"
                      idleText="Set inactive"
                      pendingText="Updating..."
                    />
                  </form>
                </article>
              ) : (
                <div className="product-empty-state">
                  <strong>No IM path connected</strong>
                  <p>
                    No IM path is attached yet. The relationship can stay web-first
                    for now, but connecting IM is the next durable continuity step.
                  </p>
                </div>
              )}
            </section>

            <section className="site-card">
              <div className="product-status-card-head">
                <h2>Other saved channels</h2>
                <span className="product-status-pill product-status-pill-neutral">
                  {scopedBindings.length} total
                </span>
              </div>
              {otherActiveBindings.length > 0 ? (
                <details className="memory-hidden-shell" open>
                  <summary className="memory-hidden-summary">
                    Other active channels ({otherActiveBindings.length})
                  </summary>
                  <div className="memory-list memory-list-hidden">
                    {otherActiveBindings.map((binding) => (
                      <article className="memory-card" key={binding.id}>
                        <div className="memory-card-row">
                          <div className="memory-badges">
                            <span className="thread-badge">{binding.platform}</span>
                            <span className="thread-badge thread-badge-live">active</span>
                          </div>
                        </div>
                        <p className="memory-content">
                          {binding.agentName ?? "Attached role"}
                        </p>
                        <p className="thread-link-meta">
                          {binding.threadTitle ?? binding.threadId ?? "Unknown thread"}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              ) : null}

              {inactiveBindings.length > 0 ? (
                <details className="memory-hidden-shell">
                  <summary className="memory-hidden-summary">
                    Inactive paths ({inactiveBindings.length})
                  </summary>
                  <div className="memory-list memory-list-hidden">
                    {inactiveBindings.map((binding) => (
                      <article className="memory-card" key={binding.id}>
                        <div className="memory-card-row">
                          <div className="memory-badges">
                            <span className="thread-badge">{binding.platform}</span>
                            <span className="thread-badge thread-badge-muted">inactive</span>
                          </div>
                        </div>
                        <p className="memory-content">
                          {binding.agentName ?? "Attached role"}
                        </p>
                        <p className="thread-link-meta">
                          {binding.threadTitle ?? binding.threadId ?? "Unknown thread"}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="product-empty-state">
                  <strong>No other saved paths</strong>
                  <p>No other saved paths are visible for this relationship.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
