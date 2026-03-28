import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductKnowledgePageData } from "@/lib/product/knowledge";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

type KnowledgePageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

export default async function AppKnowledgePage({
  searchParams,
}: KnowledgePageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/knowledge");
  const supabase = await createClient();

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  const [overview, resolution, knowledgeData] = await Promise.all([
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
    loadProductKnowledgePageData({
      supabase,
      userId: user.id,
      roleId,
    }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const roleHref = `/app/role${roleQuerySuffix}`;
  const hasVisibleSources =
    knowledgeData?.sources?.some((source) => source.status === "active") ?? false;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={chatHref}>
            Continue chat
          </Link>
          <Link className="button button-secondary" href={roleHref}>
            Review role
          </Link>
        </>
      }
      currentHref="/app/knowledge"
      description="Manage the sources this companion can draw from."
      eyebrow="Knowledge"
      shellContext={overview}
      title="Knowledge"
    >
      <ProductEventTracker
        event="knowledge_console_view"
        payload={{ surface: "dashboard_knowledge" }}
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
            hasVisibleSources
              ? "product-status-pill-ready"
              : "product-status-pill-neutral"
          }`}
        >
          {hasVisibleSources ? "Ready" : "Coming next"}
        </span>
        <span className="product-status-pill product-status-pill-neutral">
          {knowledgeData?.roleName ? "Scoped to this companion" : "No companion yet"}
        </span>
      </div>

      <section className="product-section settings-console-section">
        <div className="product-section-heading">
          <p className="home-kicker">Knowledge overview</p>
          <h2>Keep source material separate from relationship memory.</h2>
          <p>
            Use this page for background material, reference packs, and future
            uploaded sources. Memories formed through direct interaction still
            belong in Role.
          </p>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Start here</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Knowledge guide
            </span>
          </div>
          <div className="product-route-list">
            <article className="product-route-item">
              <strong>Come here when the companion needs reference material.</strong>
              <p>
                Use knowledge for source material, world-building, reusable notes,
                or preset guidance the companion should be able to draw from.
              </p>
            </article>
            <article className="product-route-item">
              <strong>Do not use this page for relationship fixes.</strong>
              <p>
                If the companion remembered something about you incorrectly or the
                relationship tone feels off, go back to Role instead.
              </p>
            </article>
          </div>
        </section>

        <div className="product-dual-grid">
          <section className="site-card product-preview-card">
            <div className="product-status-card-head">
              <h2>Visible now</h2>
              <span
                className={`product-status-pill ${
                  hasVisibleSources
                    ? "product-status-pill-ready"
                    : "product-status-pill-neutral"
                }`}
              >
                {hasVisibleSources ? "Ready" : "Coming next"}
              </span>
            </div>
            <p className="helper-copy">
              This section shows the source material currently available to this
              companion.
            </p>
            {knowledgeData?.sources?.length ? (
              <div className="product-route-list">
                {knowledgeData.sources.map((source) => (
                  <article className="product-route-item" key={source.id}>
                    <strong>{source.title}</strong>
                    <p>{source.summary}</p>
                    <p className="helper-copy">
                      {source.scopeLabel}
                      {source.detail ? ` · ${source.detail}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="product-empty-state">
                <strong>No source material yet</strong>
                <p>No source material is visible for this companion yet.</p>
              </div>
            )}
          </section>

          <section className="site-card product-preview-card">
            <div className="product-status-card-head">
              <h2>At a glance</h2>
              <span className="product-status-pill product-status-pill-neutral">
                Coming next
              </span>
            </div>
            <p className="helper-copy">
              This page is scoped to the current companion, with room to support
              shared source libraries later.
            </p>
            <div className="product-setting-metrics">
              <article className="product-setting-metric">
                <span>Current companion</span>
                <strong>
                  {knowledgeData?.roleName ?? overview?.currentRole?.name ?? "No role yet"}
                </strong>
                <p>The companion this page is currently scoped to.</p>
              </article>
              <article className="product-setting-metric">
                <span>Shared source groups</span>
                <strong>{knowledgeData?.sharedSourceCount ?? 0}</strong>
                <p>Source groups currently visible across active companions.</p>
              </article>
            </div>
          </section>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Not available yet</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Phase 1
            </span>
          </div>
          <div className="product-route-list">
            <article className="product-route-item">
              <strong>Next step for this page</strong>
              <p>
                Add source, enable or disable source, remove source, and review
                which role can use which knowledge set.
              </p>
            </article>
            <article className="product-route-item">
              <strong>What we are not faking</strong>
              <p>
                Upload flows and retrieval controls stay out of the UI until the
                real knowledge pipeline is ready.
              </p>
            </article>
          </div>
        </section>
      </section>
    </ProductConsoleShell>
  );
}
