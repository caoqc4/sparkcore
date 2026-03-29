import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductKnowledgePageData } from "@/lib/product/knowledge";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";
import {
  archiveKnowledgeSource,
  createKnowledgeDocument,
  createKnowledgeNote,
  createKnowledgeUrl,
  deleteKnowledgeSource,
  retryKnowledgeSource,
} from "@/app/app/knowledge/actions";

// ─── Source type config ───────────────────────────────────────────────────────

const SOURCE_TYPES = [
  {
    id: "document" as const,
    label: "Documents",
    hint: "PDFs, Word files, text files",
    exts: [".pdf", ".docx", ".txt", ".csv", ".xlsx"],
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 1l3 3v10a1 1 0 01-1 1H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5 6h5M5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "url" as const,
    label: "Web references",
    hint: "Articles, pages, online docs",
    exts: ["URL"],
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1.7C8 1.7 6 4.5 6 8s2 6.3 2 6.3M8 1.7C8 1.7 10 4.5 10 8s-2 6.3-2 6.3M1.7 8h12.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "note" as const,
    label: "Notes",
    hint: "Pasted text, quick references",
    exts: [".md", ".txt"],
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

type SourceType = (typeof SOURCE_TYPES)[number]["id"];

type KnowledgePageSource = NonNullable<
  Awaited<ReturnType<typeof loadProductKnowledgePageData>>
>["sources"][number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function StatusBadge({ status }: { status: KnowledgePageSource["status"] }) {
  const map = {
    active: { label: "Ready", cls: "knowledge-status-indexed" },
    processing: { label: "Processing…", cls: "knowledge-status-processing" },
    failed: { label: "Failed", cls: "knowledge-status-failed" },
    placeholder: { label: "Not set up yet", cls: "knowledge-status-placeholder" },
  };
  const { label, cls } = map[status];
  return <span className={`knowledge-status-badge ${cls}`}>{label}</span>;
}

function SourceRow({
  source,
  redirectTo,
}: {
  source: KnowledgePageSource;
  redirectTo: string;
}) {
  const typeConfig = SOURCE_TYPES.find((t) => t.id === source.kind);
  const updatedLabel = formatDate(source.updatedAt);
  const latestRunLabel = formatDate(source.latestRun?.createdAt ?? null);

  return (
    <div className="knowledge-source-row">
      <span className="knowledge-source-type-icon" aria-label={typeConfig?.label}>
        {typeConfig?.icon}
      </span>
      <div className="knowledge-source-row-body">
        <div className="knowledge-source-row-head">
          <span className="knowledge-source-title">{source.title}</span>
          <StatusBadge status={source.status} />
          {updatedLabel ? (
            <span className="knowledge-source-date">{updatedLabel}</span>
          ) : null}
        </div>
        <p className="knowledge-source-excerpt">{source.summary}</p>
        {source.detail ? (
          <p className="knowledge-source-detail">{source.detail}</p>
        ) : null}
        <div className="knowledge-source-meta">
          <span>{source.scopeLabel}</span>
          {source.processingStatus ? <span>{source.processingStatus}</span> : null}
          {source.attemptCount > 0 ? <span>{source.attemptCount} attempt{source.attemptCount > 1 ? "s" : ""}</span> : null}
        </div>
        {source.latestRun ? (
          <p className="knowledge-source-run">
            Latest run: {source.latestRun.stage} · {source.latestRun.status}
            {latestRunLabel ? ` · ${latestRunLabel}` : ""}
            {source.latestRun.message ? ` · ${source.latestRun.message}` : ""}
          </p>
        ) : null}
        {source.errorMessage || source.lastErrorCode ? (
          <p className="knowledge-source-error">
            {source.errorMessage ?? source.lastErrorCode}
          </p>
        ) : null}
        {source.canRetry || source.canArchive || source.canDelete ? (
          <div className="knowledge-source-actions">
            {source.canRetry ? (
              <form action={retryKnowledgeSource}>
                <input name="source_id" type="hidden" value={source.id} />
                <input name="redirect_to" type="hidden" value={redirectTo} />
                <FormSubmitButton
                  className="button button-secondary knowledge-source-action-btn"
                  idleText="Retry"
                  pendingText="Retrying…"
                />
              </form>
            ) : null}
            {source.canArchive ? (
              <form action={archiveKnowledgeSource}>
                <input name="source_id" type="hidden" value={source.id} />
                <input name="redirect_to" type="hidden" value={redirectTo} />
                <FormSubmitButton
                  className="button button-secondary knowledge-source-action-btn"
                  idleText="Archive"
                  pendingText="Archiving…"
                />
              </form>
            ) : null}
            {source.canDelete ? (
              <form action={deleteKnowledgeSource}>
                <input name="source_id" type="hidden" value={source.id} />
                <input name="redirect_to" type="hidden" value={redirectTo} />
                <FormSubmitButton
                  className="button button-secondary knowledge-source-action-btn"
                  idleText="Delete"
                  pendingText="Deleting…"
                />
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SourceGroup({
  type,
  sources,
  redirectTo,
}: {
  type: (typeof SOURCE_TYPES)[number];
  sources: KnowledgePageSource[];
  redirectTo: string;
}) {
  return (
    <div className="knowledge-group">
      <div className="knowledge-group-label">
        <span className="knowledge-group-icon">{type.icon}</span>
        {type.label}
      </div>
      {sources.length > 0 ? (
        <div className="knowledge-source-list">
          {sources.map((s) => (
            <SourceRow key={s.id} redirectTo={redirectTo} source={s} />
          ))}
        </div>
      ) : (
        <p className="knowledge-group-empty">{type.hint}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadProductKnowledgePageData({ supabase, userId: user.id, roleId }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;

  const roleName =
    knowledgeData?.roleName ?? overview?.currentRole?.name ?? null;
  const redirectTo = `/app/knowledge${roleQuerySuffix}`;
  const userSources = (knowledgeData?.sources ?? []).filter(
    (source) =>
      source.kind === "document" ||
      source.kind === "url" ||
      source.kind === "note",
  );

  const groupedSources = SOURCE_TYPES.map((type) => ({
    type,
    sources: userSources.filter((s) => s.kind === type.id),
  }));

  const totalCount = userSources.length;

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-primary" href={chatHref}>
          Back to chat
        </Link>
      }
      currentHref="/app/knowledge"
      description="Add reference material to give this companion domain expertise."
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

      {/* ── Overview strip ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Companion</span>
          <span className="role-state-value">{roleName ?? "No role yet"}</span>
        </div>
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span className={`role-state-badge${totalCount === 0 ? " attention" : ""}`}>
            {totalCount > 0
              ? `${totalCount} reference${totalCount > 1 ? "s" : ""}`
              : "No references yet"}
          </span>
        </div>
      </div>

      {/* ── Knowledge vs. Memory explanation ── */}
      <div className="knowledge-explainer">
        <p>
          <strong>Knowledge vs. Memory</strong> — Knowledge is reference
          material you add to give this companion domain expertise: industry
          reports, style guides, documentation, or any external content it
          should draw from. Memory is what it learns automatically from your
          conversations. Both shape how it responds, but they are managed
          separately.
        </p>
      </div>

      {/* ── Your references ── */}
      <section className="site-card knowledge-references-card">
        <div className="role-section-head">
          <h2 className="role-section-title">
            Your references
            {totalCount > 0 ? (
              <span className="knowledge-count-badge">{totalCount}</span>
            ) : null}
          </h2>
          <span className="knowledge-add-hint">Add a note, URL, or document below</span>
        </div>

        <div className="knowledge-create-grid">
          <form action={createKnowledgeNote} className="knowledge-create-card">
            <input name="role_id" type="hidden" value={resolvedRoleId ?? ""} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <h3 className="knowledge-create-title">Quick note</h3>
            <p className="knowledge-create-copy">
              Save pasted guidance, small briefs, or reminders for this companion.
            </p>
            <input
              className="site-input"
              name="title"
              placeholder="Reference title"
              required
              type="text"
            />
            <textarea
              className="site-textarea knowledge-create-textarea"
              name="note_content"
              placeholder="Paste the note content here..."
              required
              rows={4}
            />
            <FormSubmitButton
              className="button button-secondary"
              idleText="Save note"
              pendingText="Saving…"
            />
          </form>

          <form action={createKnowledgeUrl} className="knowledge-create-card">
            <input name="role_id" type="hidden" value={resolvedRoleId ?? ""} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <h3 className="knowledge-create-title">Web reference</h3>
            <p className="knowledge-create-copy">
              Queue a URL so the system can fetch and process the page.
            </p>
            <input
              className="site-input"
              name="title"
              placeholder="Reference title"
              required
              type="text"
            />
            <input
              className="site-input"
              name="source_url"
              placeholder="https://example.com/article"
              required
              type="url"
            />
            <FormSubmitButton
              className="button button-secondary"
              idleText="Add URL"
              pendingText="Queueing…"
            />
          </form>

          <form
            action={createKnowledgeDocument}
            className="knowledge-create-card"
          >
            <input name="role_id" type="hidden" value={resolvedRoleId ?? ""} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <h3 className="knowledge-create-title">Document</h3>
            <p className="knowledge-create-copy">
              Upload a file to process. Text-like formats work best right now.
            </p>
            <input
              className="site-input"
              name="title"
              placeholder="Document title"
              required
              type="text"
            />
            <input
              accept=".pdf,.docx,.txt,.csv,.xlsx,.json,.md"
              className="site-input"
              name="file"
              required
              type="file"
            />
            <FormSubmitButton
              className="button button-secondary"
              idleText="Upload document"
              pendingText="Uploading…"
            />
          </form>
        </div>

        {totalCount === 0 ? (
          /* ── Empty state ── */
          <div className="knowledge-empty">
            <p className="knowledge-empty-lead">
              Add reference material to give this companion domain expertise.
              Supported types:
            </p>
            <div className="knowledge-type-list">
              {SOURCE_TYPES.map((t) => (
                <div key={t.id} className="knowledge-type-row">
                  <span className="knowledge-type-row-icon">{t.icon}</span>
                  <span className="knowledge-type-row-label">{t.label}</span>
                  <div className="knowledge-type-row-exts">
                    {t.exts.map((ext) => (
                      <code key={ext} className="knowledge-ext-tag">{ext}</code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="knowledge-coming-soon">
              You can already add notes, URLs, and text-friendly files here.
            </p>
          </div>
        ) : (
          /* ── Grouped source list ── */
          <div className="knowledge-groups">
            {groupedSources
              .filter((g) => g.sources.length > 0)
              .map(({ type, sources }) => (
                <SourceGroup
                  key={type.id}
                  redirectTo={redirectTo}
                  type={type}
                  sources={sources}
                />
              ))}
          </div>
        )}
      </section>
    </ProductConsoleShell>
  );
}
