import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductProfilePageData } from "@/lib/product/profile";
import { loadProductMemoryPageData, getMemoryEffectHint, type ProductMemoryItem } from "@/lib/product/memory";
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
      (item) =>
        item.status === "active" &&
        (item.scope === "user_global" || item.scope === "user_agent"),
    ),
    activeThreadLocal: items.filter(
      (item) => item.status === "active" && item.scope === "thread_local",
    ),
    hidden: items.filter((item) => item.status === "hidden"),
    incorrect: items.filter((item) => item.status === "incorrect"),
    superseded: items.filter((item) => item.status === "superseded"),
  };
}

function getMemoryPlacementLabel(item: ProductMemoryItem) {
  if (item.scope === "thread_local") {
    return "From this conversation";
  }

  return "Long-term memory";
}

function getRestoreActionLabel(item: ProductMemoryItem) {
  if (item.status === "hidden") {
    return "Use again";
  }

  if (item.status === "incorrect") {
    return "Restore anyway";
  }

  return "Restore";
}

function MemoryCard({
  item,
  action,
  redirectTo,
}: {
  item: ProductMemoryItem;
  action?: "hide" | "incorrect" | "restore";
  redirectTo: string;
}) {
  return (
    <article className="memory-card">
      <div className="memory-card-row">
        <div className="memory-badges">
          <span className="thread-badge">{item.categoryLabel}</span>
          <span className="thread-badge thread-badge-muted">
            {getMemoryPlacementLabel(item)}
          </span>
        </div>
      </div>
      <p className="memory-content">{item.content}</p>
      <p className="memory-effect-copy">{getMemoryEffectHint(item)}</p>
      {item.sourceThreadTitle ? (
        <p className="thread-link-meta">
          From conversation: {item.sourceThreadTitle}
          {item.sourceTimestamp
            ? ` · ${new Date(item.sourceTimestamp).toLocaleString()}`
            : ""}
        </p>
      ) : null}
      {item.sourceThreadId ? (
        <a className="memory-trace-link" href={`/app/chat?thread=${item.sourceThreadId}`}>
          View source thread
        </a>
      ) : null}
      {action === "hide" ? (
        <form action={hideProductMemory} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_hide"
            eventPayload={{ memory_id: item.id }}
            idleText="Hide from memory"
            pendingText="Hiding..."
          />
        </form>
      ) : null}
      {action === "incorrect" ? (
        <form action={markProductMemoryIncorrect} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_incorrect"
            eventPayload={{ memory_id: item.id }}
            idleText="Mark as wrong"
            pendingText="Saving..."
          />
        </form>
      ) : null}
      {action === "restore" ? (
        <form action={restoreProductMemory} className="memory-card-actions">
          <input name="memory_id" type="hidden" value={item.id} />
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <FormSubmitButton
            className="button button-secondary memory-hide-button"
            eventName="memory_action_restore"
            eventPayload={{ memory_id: item.id }}
            idleText={getRestoreActionLabel(item)}
            pendingText="Restoring..."
          />
        </form>
      ) : null}
    </article>
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
      loadDashboardOverview({
        supabase,
        userId: user.id,
        roleId,
        threadId,
      }),
      loadProductProfilePageData({
        supabase,
        userId: user.id,
        agentId: roleId,
      }),
      loadProductMemoryPageData({
        supabase,
        userId: user.id,
        roleId,
        threadId,
      }),
      resolveProductAppRoute({
        supabase,
        userId: user.id,
      }),
      loadProductRoleCollection({
        supabase,
        userId: user.id,
      }),
    ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const knowledgeHref = `/app/knowledge${roleQuerySuffix}`;
  const channelsHref = `/app/channels${roleQuerySuffix}`;
  const createHref = resolvedRoleId
    ? `/create?from=app&role=${encodeURIComponent(resolvedRoleId)}`
    : "/create?from=app";

  const groups = splitMemoryGroups(memoryData?.items ?? []);
  const repairPressureCount = groups.hidden.length + groups.incorrect.length;
  const activeMemoryCount =
    groups.activeLongTerm.length + groups.activeThreadLocal.length;
  const visibleRoles = roleCollection?.roles ?? [];
  const redirectTo = `/app/role${roleQuerySuffix}`;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={chatHref}>
            Continue chat
          </Link>
          <Link className="button button-secondary" href={knowledgeHref}>
            Review knowledge
          </Link>
          <Link className="button button-secondary" href={channelsHref}>
            Review channels
          </Link>
        </>
      }
      currentHref="/app/role"
      description="Define who this companion is and review what the relationship remembers."
      eyebrow="Role"
      shellContext={overview}
      title="Role"
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

      <div className="chat-status-bar">
        <span className="product-status-pill product-status-pill-ready">
          {profileData?.role ? "Ready" : "Not set up yet"}
        </span>
        <span
          className={`product-status-pill ${
            repairPressureCount > 0
              ? "product-status-pill-warning"
              : "product-status-pill-neutral"
          }`}
        >
          {repairPressureCount > 0
            ? "Needs attention"
            : "Memory looks stable"}
        </span>
      </div>

      <section className="product-section settings-console-section">
        <div className="product-section-heading">
          <p className="home-kicker">Profile</p>
          <h2>Shape who this companion is.</h2>
          <p>
            Use this page when the companion feels off, the relationship memory
            needs correction, or you want to make the long-term tone more
            intentional.
          </p>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Start here</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Role guide
            </span>
          </div>
          <div className="product-route-list">
            <article className="product-route-item">
              <strong>Change the companion when the vibe feels wrong.</strong>
              <p>
                Update name, tone, relationship mode, or boundaries when you want
                a durable behavioral shift.
              </p>
            </article>
            <article className="product-route-item">
              <strong>Check memory only when continuity feels off.</strong>
              <p>
                Most of the time you can leave memory alone. Come back here when
                the companion starts recalling something incorrectly or missing
                something important.
              </p>
            </article>
          </div>
        </section>

        <div className="product-dual-grid">
          <section className="site-card product-form-card">
            <div className="product-status-card-head">
              <h2>Companion settings</h2>
              <Link className="site-inline-link" href={createHref}>
                New role
              </Link>
            </div>
            {profileData?.role ? (
              <form action={updateProductRoleProfile} className="stack settings-role-form">
                <input name="agent_id" type="hidden" value={profileData.role.agentId} />
                <input name="redirect_to" type="hidden" value={redirectTo} />

                <section className="settings-role-group">
                  <div className="settings-role-group-header">
                    <h3>Identity</h3>
                    <p>These stable knobs make the companion recognizable over time.</p>
                  </div>
                  <div className="settings-role-grid settings-role-grid-identity">
                    <div className="field">
                      <label className="label" htmlFor="name">
                        Name
                      </label>
                      <input
                        className="input"
                        defaultValue={profileData.role.name}
                        id="name"
                        name="name"
                      />
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="mode">
                        Mode
                      </label>
                      <select
                        className="input"
                        defaultValue={profileData.role.config.mode}
                        id="mode"
                        name="mode"
                      >
                        <option value="companion">Companion</option>
                        <option value="girlfriend">Girlfriend</option>
                        <option value="boyfriend">Boyfriend</option>
                      </select>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="tone">
                        Tone
                      </label>
                      <select
                        className="input"
                        defaultValue={profileData.role.config.tone}
                        id="tone"
                        name="tone"
                      >
                        <option value="warm">Warm</option>
                        <option value="playful">Playful</option>
                        <option value="steady">Steady</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="settings-role-group">
                  <div className="settings-role-group-header">
                    <h3>How the relationship should feel</h3>
                    <p>Adjust these when you want future replies to feel noticeably different.</p>
                  </div>
                  <div className="settings-role-grid">
                    <div className="field">
                      <label className="label" htmlFor="relationship_mode">
                        Relationship mode
                      </label>
                      <input
                        className="input"
                        defaultValue={profileData.role.config.relationshipMode}
                        id="relationship_mode"
                        name="relationship_mode"
                      />
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="proactivity_level">
                        Proactivity
                      </label>
                      <select
                        className="input"
                        defaultValue={profileData.role.config.proactivityLevel}
                        id="proactivity_level"
                        name="proactivity_level"
                      >
                        <option value="low">Low</option>
                        <option value="balanced">Balanced</option>
                        <option value="active">Active</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="settings-role-group">
                  <div className="settings-role-group-header">
                    <h3>Boundaries</h3>
                    <p>Keep the guardrails explicit so future memory and follow-up feel coherent.</p>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="boundaries">
                      Boundary note
                    </label>
                    <textarea
                      className="input textarea"
                      defaultValue={profileData.role.config.boundaries}
                      id="boundaries"
                      name="boundaries"
                      rows={5}
                    />
                  </div>
                </section>

                <div className="settings-role-actions">
                  <p className="helper-copy">
                    Save here when you want the companion to behave differently
                    going forward, not just in one reply.
                  </p>
                  <FormSubmitButton idleText="Save companion" pendingText="Saving..." />
                </div>
              </form>
            ) : (
              <div className="product-empty-state">
                <strong>No companion yet</strong>
                <p>Create a companion first, then come back here to shape long-term behavior and memory.</p>
              </div>
            )}
          </section>

          <section className="site-card product-preview-card product-role-summary-card">
            <h2>Quick summary</h2>
            <div className="product-setting-metrics">
              <article className="product-setting-metric">
                <span>Current conversation</span>
                <strong>
                  {profileData?.role?.currentThreadTitle ??
                    overview?.currentThread?.title ??
                    "Not attached yet"}
                </strong>
                <p>Where this companion is currently carrying the relationship.</p>
              </article>
              <article className="product-setting-metric">
                <span>Style</span>
                <strong>{profileData?.role?.config.mode ?? "Unknown"}</strong>
                <p>Tone: {profileData?.role?.config.tone ?? "Unknown"}</p>
              </article>
              <article className="product-setting-metric">
                <span>Memory health</span>
                <strong>
                  {repairPressureCount > 0 ? "Needs attention" : "Stable"}
                </strong>
                <p>
                  {repairPressureCount > 0
                    ? `${repairPressureCount} items need attention.`
                    : "Nothing urgent needs fixing right now."}
                </p>
              </article>
            </div>
            <div className="stack">
              <div className="field">
                <span className="label">Companion summary</span>
                <p className="helper-copy">
                  {profileData?.role?.personaSummary ?? "No companion summary yet."}
                </p>
              </div>
              <div className="field">
                <span className="label">What changes here affect</span>
                <p className="helper-copy">
                  Identity, tone, and boundaries shape future replies and how new
                  memory is interpreted. They do not rewrite old messages.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      {visibleRoles.length > 1 ? (
        <section className="product-section">
          <div className="product-section-heading">
            <p className="home-kicker">Other roles</p>
            <h2>Switch when you want a different companion context.</h2>
          </div>
          <section className="site-card">
            <div className="product-route-list">
              {visibleRoles
                .filter((role) => role.agentId !== resolvedRoleId)
                .slice(0, 4)
                .map((role) => (
                  <article className="product-route-item" key={role.agentId}>
                    <strong>{role.name}</strong>
                    <p>
                      {role.currentThreadTitle ??
                        role.personaSummary ??
                        "No thread attached yet."}
                    </p>
                    <Link
                      className="site-inline-link"
                      href={`/app/role?role=${encodeURIComponent(role.agentId)}`}
                    >
                      Review role
                    </Link>
                  </article>
                ))}
            </div>
          </section>
        </section>
      ) : null}

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">Memory</p>
          <h2>Review what the relationship currently remembers.</h2>
          <p>
            Only step in here when something looks wrong, incomplete, or stale.
            Most users should not need to manage memory item by item very often.
          </p>
        </div>

        <section className="site-card product-role-memory-overview">
          <div className="product-status-card-head">
            <h2>Memory overview</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Relationship context
            </span>
          </div>
          <div className="product-setting-metrics">
            <article className="product-setting-metric">
              <span>Review now</span>
              <strong>{repairPressureCount}</strong>
              <p>
                {repairPressureCount > 0
                  ? "Items that may need another look."
                  : "Nothing urgent needs review."}
              </p>
            </article>
            <article className="product-setting-metric">
              <span>Saved details</span>
              <strong>{groups.activeLongTerm.length}</strong>
              <p>Longer-term details the companion can keep using.</p>
            </article>
            <article className="product-setting-metric">
              <span>Recent notes</span>
              <strong>{groups.activeThreadLocal.length}</strong>
              <p>Context that mainly matters to the current conversation.</p>
            </article>
          </div>
        </section>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Review now</h2>
            <span
              className={`product-status-pill ${
                repairPressureCount > 0
                  ? "product-status-pill-warning"
                  : "product-status-pill-ready"
              }`}
            >
              {repairPressureCount > 0
                ? "Needs attention"
                : "Ready"}
            </span>
          </div>
          {repairPressureCount > 0 ? (
            <div className="memory-list">
              {[...groups.incorrect, ...groups.hidden].map((item) => (
                <MemoryCard
                  key={item.id}
                  action="restore"
                  item={item}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          ) : (
            <div className="product-empty-state">
              <strong>Nothing needs attention right now</strong>
              <p>The current memory looks steady.</p>
            </div>
          )}
        </section>

        <section className="site-card product-role-memory-card memory-group">
          <div className="memory-group-header">
            <h4>Saved details</h4>
          </div>
          {groups.activeLongTerm.length > 0 ? (
            <div className="memory-list">
              {groups.activeLongTerm.map((item) => (
                <MemoryCard
                  key={item.id}
                  item={item}
                  action="hide"
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state section-empty-state memory-group-empty">
              <p className="helper-copy">No saved details are visible yet.</p>
            </div>
          )}
        </section>

        {groups.activeThreadLocal.length > 0 ? (
          <section className="site-card product-role-memory-card memory-group">
            <div className="memory-group-header">
              <h4>Recent notes</h4>
            </div>
            <div className="memory-list">
              {groups.activeThreadLocal.map((item) => (
                <MemoryCard
                  key={item.id}
                  item={item}
                  action="incorrect"
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </section>
        ) : null}

        {groups.superseded.length > 0 ? (
          <section className="site-card product-role-memory-card">
            <details className="memory-hidden-shell">
              <summary className="memory-hidden-summary">
                Older items ({groups.superseded.length})
              </summary>
              <div className="memory-list memory-list-hidden">
                {groups.superseded.map((item) => (
                  <MemoryCard key={item.id} item={item} redirectTo={redirectTo} />
                ))}
              </div>
            </details>
          </section>
        ) : null}
      </section>
    </ProductConsoleShell>
  );
}
