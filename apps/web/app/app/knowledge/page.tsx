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
        {source.summary ? (
          <p className="knowledge-source-excerpt">{source.summary}</p>
        ) : null}
        {source.kind === "document" &&
        source.detail &&
        source.detail !== "Uploaded document" ? (
          <p className="knowledge-source-detail">{source.detail}</p>
        ) : null}
        {source.scopeLabel && source.scopeLabel !== "Current role" ? (
          <div className="knowledge-source-meta">
            <span className="knowledge-source-scope-badge">{source.scopeLabel}</span>
          </div>
        ) : null}
        {source.status === "failed" && (source.errorMessage || source.lastErrorCode) ? (
          <div className="knowledge-source-error-callout">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{flexShrink: 0, marginTop: "1px"}}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>{source.errorMessage ?? source.lastErrorCode}</span>
          </div>
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
                  className="button button-secondary knowledge-source-action-btn knowledge-source-action-delete"
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

      {/* ── Your references ── */}
      <section className="site-card knowledge-references-card">
        <div className="role-section-head">
          <div className="knowledge-section-title-row">
            <h2 className="role-section-title">
              Your references
              {totalCount > 0 ? (
                <span className="knowledge-count-badge">{totalCount}</span>
              ) : null}
            </h2>
            <p className="knowledge-section-hint">
              Knowledge shapes what the companion can draw from.
              Unlike Memory, it&rsquo;s content you add directly.
            </p>
          </div>
        </div>

        <div className="knowledge-create-grid">
          <form action={createKnowledgeNote} className="knowledge-create-card">
            <input name="role_id" type="hidden" value={resolvedRoleId ?? ""} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <div className="knowledge-create-header">
              <span className="knowledge-create-icon">
                {SOURCE_TYPES.find((t) => t.id === "note")?.icon}
              </span>
              <h3 className="knowledge-create-title">Quick note</h3>
            </div>
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
              placeholder="Paste guidance, briefs, or reminders here…"
              required
              rows={3}
            />
            <FormSubmitButton
              className="button button-secondary knowledge-create-btn"
              idleText="Save note"
              pendingText="Saving…"
            />
          </form>

          <form action={createKnowledgeUrl} className="knowledge-create-card">
            <input name="role_id" type="hidden" value={resolvedRoleId ?? ""} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <div className="knowledge-create-header">
              <span className="knowledge-create-icon">
                {SOURCE_TYPES.find((t) => t.id === "url")?.icon}
              </span>
              <h3 className="knowledge-create-title">Web reference</h3>
            </div>
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
              className="button button-secondary knowledge-create-btn"
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
            <div className="knowledge-create-header">
              <span className="knowledge-create-icon">
                {SOURCE_TYPES.find((t) => t.id === "document")?.icon}
              </span>
              <h3 className="knowledge-create-title">Document</h3>
            </div>
            <input
              className="site-input"
              name="title"
              placeholder="Document title"
              required
              type="text"
            />
            <label className="knowledge-file-upload-label">
              <input
                accept=".pdf,.docx,.txt,.csv,.xlsx,.json,.md"
                className="knowledge-file-upload-input"
                name="file"
                required
                type="file"
              />
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 11V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span>Choose file</span>
              <span className="knowledge-file-hint">.pdf .docx .txt .csv .xlsx</span>
            </label>
            <FormSubmitButton
              className="button button-secondary knowledge-create-btn"
              idleText="Upload document"
              pendingText="Uploading…"
            />
          </form>
        </div>

        {totalCount > 0 ? <div className="knowledge-list-divider" /> : null}

        {totalCount === 0 ? (
          /* ── Empty state ── */
          <div className="knowledge-empty">
            <div className="knowledge-empty-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 2l5 5v14a1.5 1.5 0 01-1.5 1.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 9h8M7 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="knowledge-empty-lead">
              No references yet. Use the forms above to add a note, link a web page, or upload a document.
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
