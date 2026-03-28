import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { unbindProductChannel } from "@/app/app/channels/actions";
import { updateProductRoleProfile } from "@/app/app/profile/actions";
import { requireUser } from "@/lib/auth-redirect";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductPrivacyPageData } from "@/lib/product/privacy";
import { loadProductProfilePageData } from "@/lib/product/profile";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

type SettingsTabId = "role" | "channels" | "boundaries";

type DashboardSettingsPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    tab?: string;
    role?: string;
    thread?: string;
  }>;
};

const settingsTabs: Array<{
  id: SettingsTabId;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "role",
    label: "Role Core",
    title: "Shape the identity rules that drive continuity.",
    description:
      "Name, tone, relationship mode, proactivity, and boundaries should be editable together instead of hiding inside disconnected forms.",
  },
  {
    id: "channels",
    label: "Channels",
    title: "Keep IM binding explicit and easy to maintain.",
    description:
      "The role should attach to a real Telegram identity after creation, and channel status should stay legible without turning into a separate admin app.",
  },
  {
    id: "boundaries",
    label: "Boundaries",
    title: "Make memory visible enough to inspect and repair.",
    description:
      "This tab is for operator trust: memory rows, source drill-down, and concrete repair actions rather than vague promises.",
  },
];

function resolveSettingsTab(value: string | undefined): SettingsTabId {
  if (value === "channels" || value === "boundaries") {
    return value;
  }

  return "role";
}

function buildSettingsTabHref(tab: SettingsTabId, roleQuerySuffix: string) {
  return `/app/settings${roleQuerySuffix}${roleQuerySuffix ? "&" : "?"}tab=${tab}`;
}

function truncateCopy(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default async function DashboardSettingsPage({
  searchParams,
}: DashboardSettingsPageProps) {
  const params = await searchParams;
  const activeTab = resolveSettingsTab(params.tab);
  const activeTabMeta =
    settingsTabs.find((item) => item.id === activeTab) ?? settingsTabs[0];
  const user = await requireUser("/app/settings");
  const supabase = await createClient();

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  const [{ data: workspace }, overview, profileData, privacyData, resolution] =
    await Promise.all([
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
      loadProductProfilePageData({
        supabase,
        userId: user.id,
        agentId: roleId,
      }),
      loadProductPrivacyPageData({
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

  if (!workspace || !privacyData) {
    return null;
  }

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const memoryHref = `/app/memory${roleQuerySuffix}`;
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
  const roleTabRedirect = buildSettingsTabHref("role", roleQuerySuffix);
  const channelTabRedirect = buildSettingsTabHref("channels", roleQuerySuffix);
  const memoryRepairCount =
    privacyData.memory.hidden + privacyData.memory.incorrect;
  const selectedChannelBinding =
    activeBindings.find((binding) =>
      overview?.currentThread
        ? binding.threadId === overview.currentThread.threadId
        : false,
    ) ??
    activeBindings[0] ??
    null;
  const otherActiveBindings = activeBindings.filter(
    (binding) => binding.id !== selectedChannelBinding?.id,
  );

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={connectImHref}>
            Open IM bind flow
          </Link>
          <Link className="button button-secondary" href={chatHref}>
            Open supplementary chat
          </Link>
        </>
      }
      currentHref="/app/settings"
      description="Use one console for role core, channel binding, and memory boundaries instead of splitting those operating tasks across disconnected admin pages."
      eyebrow="Integrations & Settings"
      shellContext={overview}
      title="Choose one operating lane, make the change, and stay in context."
    >
      <ProductEventTracker
        event="settings_console_view"
        payload={{ surface: "dashboard_settings" }}
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

      <nav className="settings-console-tabs" aria-label="Settings sections">
        {settingsTabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`settings-console-tab ${isActive ? "settings-console-tab-active" : ""}`}
              href={buildSettingsTabHref(tab.id, roleQuerySuffix)}
              key={tab.id}
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </Link>
          );
        })}
      </nav>

      {activeTab === "role" ? (
        <section className="product-section settings-console-section">
          <div className="product-section-heading">
            <p className="home-kicker">Role core</p>
            <h2>Set the identity rules before you expect better continuity.</h2>
            <p>
              The role core is still the highest-leverage layer. It shapes how
              new memories are interpreted, how supplementary chat feels, and
              whether future follow-up feels coherent.
            </p>
          </div>

          <div className="product-dual-grid">
            <section className="site-card product-form-card">
              <h2>Role profile</h2>
              {profileData?.role ? (
                <form
                  action={updateProductRoleProfile}
                  className="stack settings-role-form"
                >
                  <input
                    name="agent_id"
                    type="hidden"
                    value={profileData.role.agentId}
                  />
                  <input
                    name="redirect_to"
                    type="hidden"
                    value={roleTabRedirect}
                  />

                  <section className="settings-role-group">
                    <div className="settings-role-group-header">
                      <h3>Identity</h3>
                      <p>
                        These are the stable knobs that make the role
                        recognizable over time.
                      </p>
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
                      <h3>Relationship behavior</h3>
                      <p>
                        Use these fields when the relationship should feel
                        different without restarting.
                      </p>
                    </div>
                    <div className="settings-role-grid">
                      <div className="field">
                        <label className="label" htmlFor="relationship_mode">
                          Relationship mode
                        </label>
                        <input
                          className="input"
                          defaultValue={
                            profileData.role.config.relationshipMode
                          }
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
                          defaultValue={
                            profileData.role.config.proactivityLevel
                          }
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
                      <p>
                        Keep the guardrails explicit so future memory and
                        follow-up feel coherent.
                      </p>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="boundaries">
                        Operator boundary note
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
                      Save updates here when the role core needs a lasting
                      behavioral shift, not just a one-off thread correction.
                    </p>
                    <FormSubmitButton
                      idleText="Save role core"
                      pendingText="Saving..."
                    />
                  </div>
                </form>
              ) : (
                <div className="product-empty-state">
                  <p>
                    Create a role first. This tab becomes the role core editor
                    once one exists.
                  </p>
                </div>
              )}
            </section>

            <section className="site-card product-preview-card">
              <h2>Current role snapshot</h2>
              <div className="product-setting-metrics">
                <article className="product-setting-metric">
                  <span>Current thread</span>
                  <strong>
                    {profileData?.role?.currentThreadTitle ??
                      overview?.currentThread?.title ??
                      "Not attached yet"}
                  </strong>
                  <p>The canonical thread this role is currently carrying.</p>
                </article>
                <article className="product-setting-metric">
                  <span>Mode</span>
                  <strong>{profileData?.role?.config.mode ?? "Unknown"}</strong>
                  <p>Tone: {profileData?.role?.config.tone ?? "Unknown"}</p>
                </article>
                <article className="product-setting-metric">
                  <span>Proactivity</span>
                  <strong>
                    {profileData?.role?.config.proactivityLevel ?? "Unknown"}
                  </strong>
                  <p>
                    Relationship mode:{" "}
                    {profileData?.role?.config.relationshipMode ?? "Unknown"}
                  </p>
                </article>
              </div>
              <div className="stack">
                <div className="field">
                  <span className="label">Persona summary</span>
                  <p className="helper-copy">
                    {profileData?.role?.personaSummary ??
                      "No role summary yet."}
                  </p>
                </div>
                <div className="field">
                  <span className="label">System prompt preview</span>
                  <p className="helper-copy">
                    {truncateCopy(profileData?.role?.systemPrompt, 260) ??
                      "No system prompt available yet."}
                  </p>
                </div>
                <Link className="site-inline-link" href={chatHref}>
                  Continue in supplementary chat
                </Link>
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "channels" ? (
        <section className="product-section settings-console-section">
          <div className="product-section-heading">
            <p className="home-kicker">Channel operations</p>
            <h2>Attach the canonical relationship to a real IM entry.</h2>
            <p>
              IM belongs after role creation, not before it. This tab keeps
              channel state visible without letting connection setup overwhelm
              the rest of the console.
            </p>
          </div>

          <div className="product-dual-grid">
            <section className="site-card product-preview-card">
              <div className="product-status-card-head">
                <h2>Connection posture</h2>
                <span
                  className={`product-status-pill ${
                    activeBindings.length > 0
                      ? "product-status-pill-ready"
                      : "product-status-pill-warning"
                  }`}
                >
                  {activeBindings.length > 0 ? "IM live" : "Web only"}
                </span>
              </div>
              <p className="helper-copy">
                This tab is for channel posture, not setup sprawl: is there a
                live IM path, is it attached to the right loop, and should older
                paths be retired?
              </p>
              <div className="product-setting-metrics">
                <article className="product-setting-metric">
                  <span>Live channels</span>
                  <strong>{activeBindings.length}</strong>
                  <p>
                    {activeBindings.length > 0
                      ? "At least one IM path is active."
                      : "Still web-only."}
                  </p>
                </article>
                <article className="product-setting-metric">
                  <span>Platforms</span>
                  <strong>
                    {scopedBindings.length > 0
                      ? privacyData.channels.platforms.join(", ")
                      : "None"}
                  </strong>
                  <p>Current platforms attached to this account.</p>
                </article>
                <article className="product-setting-metric">
                  <span>Canonical thread</span>
                  <strong>{overview?.currentThread?.title ?? "Missing"}</strong>
                  <p>The same thread should stay attached across channels.</p>
                </article>
              </div>
              <div className="product-route-list">
                <article className="product-route-item">
                  <strong>
                    {activeBindings.length > 0
                      ? "A live path already exists."
                      : "The relationship still needs its first live IM path."}
                  </strong>
                  <p>
                    {activeBindings.length > 0
                      ? "Use connect flow when you need to attach a different Telegram identity or inspect the current binding more closely."
                      : "Open connect flow to bind Telegram to the existing role and canonical thread without restarting the relationship."}
                  </p>
                  <Link className="site-inline-link" href={connectImHref}>
                    Open connect flow
                  </Link>
                </article>
                <article className="product-route-item">
                  <strong>
                    {inactiveBindings.length > 0
                      ? "Older paths are still preserved below."
                      : "Supplementary chat stays available on web."}
                  </strong>
                  <p>
                    {inactiveBindings.length > 0
                      ? "Keep history visible here, but retire stale live paths when the wrong one is still active."
                      : "Use web continuation when you need a careful corrective turn on the same thread."}
                  </p>
                  <Link className="site-inline-link" href={chatHref}>
                    Continue on web
                  </Link>
                </article>
              </div>
            </section>

            <div className="product-boundary-stack">
              <section className="site-card product-preview-card">
                <div className="product-status-card-head">
                  <h2>Active path for this relationship</h2>
                  <span
                    className={`product-status-pill ${
                      selectedChannelBinding
                        ? "product-status-pill-ready"
                        : "product-status-pill-warning"
                    }`}
                  >
                    {selectedChannelBinding ? "Attached" : "Missing"}
                  </span>
                </div>
                {selectedChannelBinding ? (
                  <article className="memory-card connect-im-binding-card connect-im-binding-card-active">
                    <div className="memory-card-row">
                      <div className="memory-badges">
                        <span className="thread-badge">
                          {selectedChannelBinding.platform}
                        </span>
                        <span className="thread-badge thread-badge-live">
                          active
                        </span>
                      </div>
                    </div>
                    <p className="memory-content">
                      {selectedChannelBinding.agentName ?? "Attached role"}
                    </p>
                    <p className="helper-copy">
                      {selectedChannelBinding.threadTitle ??
                        selectedChannelBinding.threadId ??
                        "Unknown thread"}
                    </p>
                    <div className="connect-im-binding-meta">
                      <span>Channel: {selectedChannelBinding.channelId}</span>
                      <span>Peer: {selectedChannelBinding.peerId}</span>
                    </div>
                    <div className="toolbar">
                      <Link
                        className="site-inline-link"
                        href={
                          selectedChannelBinding.threadId
                            ? `/connect-im?thread=${encodeURIComponent(selectedChannelBinding.threadId)}&agent=${encodeURIComponent(selectedChannelBinding.agentId)}`
                            : `/connect-im?agent=${encodeURIComponent(selectedChannelBinding.agentId)}`
                        }
                      >
                        Rebind or inspect
                      </Link>
                    </div>
                    <form
                      action={unbindProductChannel}
                      className="memory-card-actions"
                    >
                      <input
                        name="binding_id"
                        type="hidden"
                        value={selectedChannelBinding.id}
                      />
                      <input
                        name="redirect_to"
                        type="hidden"
                        value={channelTabRedirect}
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
                    <p>
                      No channel is attached yet. The relationship can stay
                      web-first for now, but Telegram binding is the next
                      durable continuity step.
                    </p>
                  </div>
                )}
              </section>

              <section className="site-card">
                <div className="product-status-card-head">
                  <h2>Binding catalog</h2>
                  <span className="product-status-pill product-status-pill-neutral">
                    {scopedBindings.length} total
                  </span>
                </div>
                {otherActiveBindings.length > 0 ? (
                  <details className="memory-hidden-shell" open>
                    <summary className="memory-hidden-summary">
                      Other live paths ({otherActiveBindings.length})
                    </summary>
                    <div className="stack">
                      {otherActiveBindings.map((binding) => (
                        <article
                          className="memory-card connect-im-binding-card connect-im-binding-card-active"
                          key={binding.id}
                        >
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {binding.platform}
                              </span>
                              <span className="thread-badge thread-badge-live">
                                active
                              </span>
                            </div>
                          </div>
                          <p className="memory-content">
                            {binding.agentName ?? "Attached role"}
                          </p>
                          <p className="helper-copy">
                            {binding.threadTitle ??
                              binding.threadId ??
                              "Unknown thread"}
                          </p>
                          <div className="connect-im-binding-meta">
                            <span>Channel: {binding.channelId}</span>
                            <span>Peer: {binding.peerId}</span>
                          </div>
                          <div className="toolbar">
                            <Link
                              className="site-inline-link"
                              href={
                                binding.threadId
                                  ? `/connect-im?thread=${encodeURIComponent(binding.threadId)}&agent=${encodeURIComponent(binding.agentId)}`
                                  : `/connect-im?agent=${encodeURIComponent(binding.agentId)}`
                              }
                            >
                              Re-open this path
                            </Link>
                          </div>
                          <form
                            action={unbindProductChannel}
                            className="memory-card-actions"
                          >
                            <input
                              name="binding_id"
                              type="hidden"
                              value={binding.id}
                            />
                            <input
                              name="redirect_to"
                              type="hidden"
                              value={channelTabRedirect}
                            />
                            <FormSubmitButton
                              className="button button-secondary memory-hide-button"
                              idleText="Set inactive"
                              pendingText="Updating..."
                            />
                          </form>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : activeBindings.length === 0 ? null : (
                  <div className="product-empty-state">
                    <p>
                      No additional live paths exist beyond the current active
                      relationship path.
                    </p>
                  </div>
                )}

                {inactiveBindings.length > 0 ? (
                  <details className="memory-hidden-shell">
                    <summary className="memory-hidden-summary">
                      Previous bindings ({inactiveBindings.length})
                    </summary>
                    <div className="stack">
                      {inactiveBindings.map((binding) => (
                        <article
                          className="memory-card connect-im-binding-card"
                          key={binding.id}
                        >
                          <div className="memory-card-row">
                            <div className="memory-badges">
                              <span className="thread-badge">
                                {binding.platform}
                              </span>
                              <span className="thread-badge thread-badge-muted">
                                {binding.status}
                              </span>
                            </div>
                          </div>
                          <p className="memory-content">
                            {binding.agentName ?? "Attached role"}
                          </p>
                          <p className="helper-copy">
                            {binding.threadTitle ??
                              binding.threadId ??
                              "Unknown thread"}
                          </p>
                          <div className="connect-im-binding-meta">
                            <span>Channel: {binding.channelId}</span>
                            <span>Peer: {binding.peerId}</span>
                          </div>
                          <Link
                            className="site-inline-link"
                            href={
                              binding.threadId
                                ? `/connect-im?thread=${encodeURIComponent(binding.threadId)}&agent=${encodeURIComponent(binding.agentId)}`
                                : `/connect-im?agent=${encodeURIComponent(binding.agentId)}`
                            }
                          >
                            Re-open this path
                          </Link>
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}
              </section>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "boundaries" ? (
        <section className="product-section settings-console-section">
          <div className="product-section-heading">
            <p className="home-kicker">Boundary review</p>
            <h2>
              Keep memory visible enough to repair, not mystical enough to hide
              behind.
            </h2>
            <p>
              If a memory can affect the relationship, the operator should be
              able to inspect it, correct it, or restore it without leaving the
              current console context.
            </p>
          </div>

          <div className="product-dual-grid">
            <section className="site-card product-preview-card">
              <div className="product-status-card-head">
                <h2>Current memory posture</h2>
                <span
                  className={`product-status-pill ${
                    memoryRepairCount > 0
                      ? "product-status-pill-warning"
                      : "product-status-pill-ready"
                  }`}
                >
                  {memoryRepairCount > 0 ? "Repair needed" : "Stable enough"}
                </span>
              </div>
              <p className="helper-copy">
                This tab is for trust posture only: is memory visible,
                repairable, and traceable enough for the operator to trust the
                loop?
              </p>
              <div className="product-setting-metrics">
                <article className="product-setting-metric">
                  <span>Visible rows</span>
                  <strong>{privacyData.memory.active}</strong>
                  <p>Rows currently affecting relationship continuity.</p>
                </article>
                <article className="product-setting-metric">
                  <span>Needs review</span>
                  <strong>{memoryRepairCount}</strong>
                  <p>
                    Hidden and incorrect rows waiting for operator attention.
                  </p>
                </article>
                <article className="product-setting-metric">
                  <span>Traceable rows</span>
                  <strong>{privacyData.memory.traceAvailable}</strong>
                  <p>Rows that already retain source-thread drill-down.</p>
                </article>
              </div>
              <div className="toolbar">
                <Link
                  className="button button-primary"
                  href={memoryHref}
                >
                  Open memory center
                </Link>
                <Link
                  className="button button-secondary"
                  href={chatHref}
                >
                  Open supplementary chat
                </Link>
              </div>
            </section>

            <div className="product-boundary-stack">
              <section className="site-card product-preview-card">
                <h2>Boundary notes</h2>
                <div className="product-route-list">
                  {privacyData.boundaries.map((item) => (
                    <article className="product-route-item" key={item.title}>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="site-card product-preview-card">
                <h2>Route the next action</h2>
                <div className="product-route-list">
                  <article className="product-route-item">
                    <strong>Need to repair a specific row?</strong>
                    <p>
                      Go to memory center for row-level hide, restore, correct,
                      and source review.
                    </p>
                    <Link className="site-inline-link" href={memoryHref}>
                      Go to memory center
                    </Link>
                  </article>
                  <article className="product-route-item">
                    <strong>Need to fix where continuity enters?</strong>
                    <p>
                      Open channels when the relationship is attached to the
                      wrong IM path.
                    </p>
                    <Link
                      className="site-inline-link"
                      href={channelTabRedirect}
                    >
                      Open channels tab
                    </Link>
                  </article>
                </div>
                <div className="notice notice-warning">
                  Heavier account-level privacy tooling is still downstream.
                  Keep this tab honest about today&apos;s live boundary
                  controls.
                </div>
              </section>
            </div>
          </div>

          <section className="site-card product-boundary-summary">
            <div className="product-status-card-head">
              <h2>Use this tab to answer two questions quickly</h2>
              <span className="product-status-pill product-status-pill-neutral">
                Trust posture
              </span>
            </div>
            <div className="product-boundary-checklist">
              <article className="product-route-item">
                <strong>
                  Can the operator see what memory is shaping the relationship?
                </strong>
                <p>
                  Visible rows, source traces, and review counts should stay
                  legible at a glance.
                </p>
              </article>
              <article className="product-route-item">
                <strong>
                  Is the next step a posture decision or a row repair task?
                </strong>
                <p>
                  Stay here for posture. Move into memory center or channels
                  only when a concrete fix is needed.
                </p>
              </article>
            </div>
          </section>
        </section>
      ) : null}
    </ProductConsoleShell>
  );
}
