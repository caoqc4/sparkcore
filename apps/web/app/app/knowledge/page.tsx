import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductKnowledgePageData } from "@/lib/product/knowledge";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

// ─── Placeholder type definitions ────────────────────────────────────────────
// These mirror what the backend will eventually return.
// Replace the empty array below with real API data when the upload pipeline is ready.

type UserKnowledgeSource = {
  id: string;
  title: string;
  type: "document" | "url" | "note";
  status: "indexed" | "processing" | "failed";
  excerpt: string | null;
  addedAt: string | null;
};

const USER_SOURCES_PLACEHOLDER: UserKnowledgeSource[] = [];
// When the backend is ready, load from API and replace the above.

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UserKnowledgeSource["status"] }) {
  const map = {
    indexed: { label: "Indexed", cls: "knowledge-status-indexed" },
    processing: { label: "Processing…", cls: "knowledge-status-processing" },
    failed: { label: "Failed", cls: "knowledge-status-failed" },
  };
  const { label, cls } = map[status];
  return <span className={`knowledge-status-badge ${cls}`}>{label}</span>;
}

function SourceRow({ source }: { source: UserKnowledgeSource }) {
  const typeConfig = SOURCE_TYPES.find((t) => t.id === source.type);
  return (
    <div className="knowledge-source-row">
      <span className="knowledge-source-type-icon" aria-label={typeConfig?.label}>
        {typeConfig?.icon}
      </span>
      <div className="knowledge-source-row-body">
        <div className="knowledge-source-row-head">
          <span className="knowledge-source-title">{source.title}</span>
          <StatusBadge status={source.status} />
          {source.addedAt ? (
            <span className="knowledge-source-date">
              {new Date(source.addedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        {source.excerpt ? (
          <p className="knowledge-source-excerpt">{source.excerpt}</p>
        ) : null}
      </div>
    </div>
  );
}

function SourceGroup({
  type,
  sources,
}: {
  type: (typeof SOURCE_TYPES)[number];
  sources: UserKnowledgeSource[];
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
            <SourceRow key={s.id} source={s} />
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

  // User-submitted sources only — persona packs and product seeds are part of
  // the role definition (visible in Role page) and should not appear here.
  const userSources: UserKnowledgeSource[] = USER_SOURCES_PLACEHOLDER;

  const groupedSources = SOURCE_TYPES.map((type) => ({
    type,
    sources: userSources.filter((s) => s.type === type.id),
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
          <button
            className="button button-secondary knowledge-add-btn"
            disabled
            aria-disabled="true"
            title="Upload and manage sources coming soon"
          >
            + Add source
          </button>
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
              Upload support is coming soon.
            </p>
          </div>
        ) : (
          /* ── Grouped source list ── */
          <div className="knowledge-groups">
            {groupedSources
              .filter((g) => g.sources.length > 0)
              .map(({ type, sources }) => (
                <SourceGroup key={type.id} type={type} sources={sources} />
              ))}
          </div>
        )}
      </section>
    </ProductConsoleShell>
  );
}
