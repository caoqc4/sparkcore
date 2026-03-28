import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { MemoryCategoryFilter } from "@/components/memory-category-filter";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductProfilePageData } from "@/lib/product/profile";
import {
  loadProductMemoryPageData,
  type ProductMemoryItem,
} from "@/lib/product/memory";
import { loadProductRoleCollection } from "@/lib/product/roles";
import { updateProductRoleProfile } from "@/app/app/profile/actions";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
  restoreProductMemory,
} from "@/app/app/memory/actions";

type RolePageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

function splitMemoryGroups(items: ProductMemoryItem[]) {
  return {
    activeLongTerm: items.filter(
      (i) =>
        i.status === "active" &&
        (i.scope === "user_global" || i.scope === "user_agent"),
    ),
    activeThreadLocal: items.filter(
      (i) => i.status === "active" && i.scope === "thread_local",
    ),
    hidden: items.filter((i) => i.status === "hidden"),
    incorrect: items.filter((i) => i.status === "incorrect"),
    superseded: items.filter((i) => i.status === "superseded"),
  };
}

function RoleMemItem({
  item,
  action,
  redirectTo,
}: {
  item: ProductMemoryItem;
  action?: "hide" | "incorrect" | "restore";
  redirectTo: string;
}) {
  const actionFn =
    action === "hide"
      ? hideProductMemory
      : action === "incorrect"
        ? markProductMemoryIncorrect
        : restoreProductMemory;

  const actionLabel =
    action === "hide"
      ? "Hide"
      : action === "incorrect"
        ? "Mark wrong"
        : item.status === "hidden"
          ? "Use again"
          : "Restore";

  const actionPending =
    action === "hide" || action === "incorrect" ? "Hiding..." : "Restoring...";

  return (
    <div className="role-mem-item">
      <div className="role-mem-item-body">
        <span className="role-mem-category">{item.categoryLabel}</span>
        <p className="role-mem-text">{item.content}</p>
        {item.sourceThreadId ? (
          <a
            className="role-mem-source"
            href={`/app/chat?thread=${item.sourceThreadId}`}
          >
            {item.sourceThreadTitle ?? "View source thread"}
          </a>
        ) : null}
      </div>
      {action ? (
        <form action={actionFn} className="role-mem-action">
          <input name="memory_id" type="hidden" value={item.id} />
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <FormSubmitButton
            className="button button-secondary role-mem-btn"
            idleText={actionLabel}
            pendingText={actionPending}
          />
        </form>
      ) : null}
    </div>
  );
}

export default async function AppRolePage({ searchParams }: RolePageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/role");
  const supabase = await createClient();

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  const [overview, profileData, memoryData, resolution, roleCollection] =
    await Promise.all([
      loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
      loadProductProfilePageData({ supabase, userId: user.id, agentId: roleId }),
      loadProductMemoryPageData({ supabase, userId: user.id, roleId, threadId }),
      resolveProductAppRoute({ supabase, userId: user.id }),
      loadProductRoleCollection({ supabase, userId: user.id }),
    ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const redirectTo = `/app/role${roleQuerySuffix}`;

  const groups = splitMemoryGroups(memoryData?.items ?? []);
  const repairCount = groups.hidden.length + groups.incorrect.length;
  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;
  const visibleRoles = roleCollection?.roles ?? [];
  const currentThreadTitle =
    profileData?.role?.currentThreadTitle ??
    overview?.currentThread?.title ??
    null;

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-primary" href={chatHref}>
          Back to chat
        </Link>
      }
      currentHref="/app/role"
      description="Define this companion and review what the relationship remembers."
      eyebrow="Role"
      shellContext={overview}
      title={profileData?.role?.name ?? "Role"}
    >
      <ProductEventTracker
        event="role_assets_view"
        payload={{ surface: "dashboard_role" }}
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

      {/* ── 0. Role switcher ── */}
      {visibleRoles.length > 0 ? (
        <section className="role-switcher-section">
          <div className="role-switcher-section-head">
            <span className="role-switcher-section-label">My roles</span>
          </div>
          <div className="role-switcher-cards">
            {visibleRoles.map((role) => {
              const isActive = role.agentId === resolvedRoleId;
              return (
                <Link
                  key={role.agentId}
                  className={`role-switcher-card${isActive ? " active" : ""}`}
                  href={`/app/role?role=${encodeURIComponent(role.agentId)}`}
                >
                  <div className="role-switcher-card-portrait" aria-hidden="true">
                    <span className="role-switcher-card-portrait-initial">
                      {role.name.slice(0, 1).toUpperCase()}
                    </span>
                    {isActive ? (
                      <span className="role-switcher-card-status-dot live" />
                    ) : null}
                  </div>
                  {isActive ? (
                    <span className="role-switcher-card-badge">Active</span>
                  ) : null}
                  <span className="role-switcher-card-name">{role.name}</span>
                  <span className="role-switcher-card-last">
                    {role.lastInteractionAt
                      ? new Date(role.lastInteractionAt).toLocaleDateString()
                      : "No activity"}
                  </span>
                </Link>
              );
            })}
            <Link className="role-switcher-card role-switcher-card-new" href="/app/create">
              <div className="role-switcher-card-portrait role-switcher-card-portrait-new" aria-hidden="true">
                <span className="role-switcher-card-portrait-plus">+</span>
              </div>
              <span className="role-switcher-card-name">New role</span>
              <span className="role-switcher-card-last">Create</span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Relationship state bar ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Thread</span>
          <span className="role-state-value">
            {currentThreadTitle ?? "No thread yet"}
          </span>
        </div>
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span
            className={`role-state-badge${repairCount > 0 ? " attention" : ""}`}
          >
            {repairCount > 0
              ? `${repairCount} memory item${repairCount > 1 ? "s" : ""} need attention`
              : "Memory stable"}
          </span>
        </div>
        {followUpCount > 0 ? (
          <>
            <div className="role-state-divider" />
            <div className="role-state-item">
              <span className="role-state-badge attention">
                {followUpCount} follow-up{followUpCount > 1 ? "s" : ""} pending
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── 1. Profile ── */}
      <section className="site-card role-profile-card">
        <div className="role-section-head">
          <h2 className="role-section-title">Companion</h2>
        </div>

        {profileData?.role ? (
          <form
            action={updateProductRoleProfile}
            className="role-profile-form"
          >
            <input
              name="agent_id"
              type="hidden"
              value={profileData.role.agentId}
            />
            <input name="redirect_to" type="hidden" value={redirectTo} />

            {/* Row 1: Name · Mode · Tone */}
            <div className="role-form-grid-3">
              <div className="field">
                <label className="label" htmlFor="rp-name">
                  Name
                </label>
                <input
                  className="input"
                  defaultValue={profileData.role.name}
                  id="rp-name"
                  name="name"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="rp-mode">
                  Mode
                </label>
                <select
                  className="input"
                  defaultValue={profileData.role.config.mode}
                  id="rp-mode"
                  name="mode"
                >
                  <option value="companion">Companion</option>
                  <option value="girlfriend">Girlfriend</option>
                  <option value="boyfriend">Boyfriend</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="rp-tone">
                  Tone
                </label>
                <select
                  className="input"
                  defaultValue={profileData.role.config.tone}
                  id="rp-tone"
                  name="tone"
                >
                  <option value="warm">Warm</option>
                  <option value="playful">Playful</option>
                  <option value="steady">Steady</option>
                </select>
              </div>
            </div>

            {/* Row 2: Relationship mode · Proactivity */}
            <div className="role-form-grid-2">
              <div className="field">
                <label className="label" htmlFor="rp-rel-mode">
                  Relationship mode
                </label>
                <input
                  className="input"
                  defaultValue={profileData.role.config.relationshipMode}
                  id="rp-rel-mode"
                  name="relationship_mode"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="rp-proactivity">
                  Proactivity
                </label>
                <select
                  className="input"
                  defaultValue={profileData.role.config.proactivityLevel}
                  id="rp-proactivity"
                  name="proactivity_level"
                >
                  <option value="low">Low</option>
                  <option value="balanced">Balanced</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>

            {/* Boundaries */}
            <div className="field">
              <label className="label" htmlFor="rp-boundaries">
                Boundaries
              </label>
              <textarea
                className="input textarea"
                defaultValue={profileData.role.config.boundaries}
                id="rp-boundaries"
                name="boundaries"
                rows={3}
              />
            </div>

            {/* Persona summary preview */}
            {profileData.role.personaSummary ? (
              <p className="role-persona-preview">
                {profileData.role.personaSummary}
              </p>
            ) : null}

            <div className="role-form-footer">
              <FormSubmitButton idleText="Save" pendingText="Saving..." />
            </div>
          </form>
        ) : (
          <div className="product-empty-state">
            <strong>No companion yet</strong>
            <p>
              Create a companion first, then come back here to shape long-term
              behavior and memory.
            </p>
          </div>
        )}
      </section>

      {/* ── 2. Memory ── */}
      <section className="role-memory-section">
        <div className="role-section-head">
          <h2 className="role-section-title">Memory</h2>
          <div className="role-memory-stats">
            <span
              className={repairCount > 0 ? "role-memory-stat-warn" : undefined}
            >
              {repairCount} to review
            </span>
            <span className="role-memory-stats-dot">·</span>
            <span>{groups.activeLongTerm.length} saved</span>
            <span className="role-memory-stats-dot">·</span>
            <span>{groups.activeThreadLocal.length} recent</span>
          </div>
        </div>

        {/* Needs attention */}
        {repairCount > 0 ? (
          <div className="site-card role-attention-card">
            <p className="role-attention-label">Needs attention</p>
            <div className="role-mem-list">
              {[...groups.incorrect, ...groups.hidden].map((item) => (
                <RoleMemItem
                  key={item.id}
                  action="restore"
                  item={item}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Categorized memory with filter tabs */}
        <div className="site-card role-mem-filter-card">
          <MemoryCategoryFilter
            redirectTo={redirectTo}
            items={[...groups.activeLongTerm, ...groups.activeThreadLocal].map((i) => ({
              id: i.id,
              categoryLabel: i.categoryLabel,
              content: i.content,
              status: i.status,
              scope: i.scope ?? "",
              createdAt: i.created_at,
              sourceThreadTitle: i.sourceThreadTitle,
              sourceThreadId: i.sourceThreadId,
            }))}
          />
        </div>

        {/* Older items — collapsed */}
        {groups.superseded.length > 0 ? (
          <details className="site-card role-mem-older">
            <summary className="role-mem-older-summary">
              Older items ({groups.superseded.length})
            </summary>
            <div className="role-mem-list role-mem-list-older">
              {groups.superseded.map((item) => (
                <RoleMemItem
                  key={item.id}
                  item={item}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </details>
        ) : null}
      </section>

    </ProductConsoleShell>
  );
}
