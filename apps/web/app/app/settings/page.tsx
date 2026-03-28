import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

type SettingsPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    tab?: string;
    thread?: string;
  }>;
};

function buildRedirectHref(
  basePath: string,
  roleId: string | null,
  threadId: string | null,
) {
  const next = new URLSearchParams();
  if (roleId) next.set("role", roleId);
  if (threadId) next.set("thread", threadId);
  const query = next.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingRow({
  label,
  value,
  note,
  comingSoon,
  mono,
}: {
  label: string;
  value?: string | null;
  note?: string;
  comingSoon?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`settings-row${comingSoon ? " settings-row-dim" : ""}`}>
      <div className="settings-row-label-wrap">
        <span className="settings-row-label">{label}</span>
        {note ? <span className="settings-row-note">{note}</span> : null}
      </div>
      <span
        className={[
          "settings-row-value",
          !value && !comingSoon ? "settings-row-value-empty" : "",
          mono ? "settings-row-value-mono" : "",
          comingSoon ? "settings-row-value-soon" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {comingSoon ? "Coming soon" : (value ?? "—")}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  comingSoon,
  children,
}: {
  title: string;
  comingSoon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="site-card settings-card">
      <div className="role-section-head">
        <h2 className="role-section-title">{title}</h2>
        {comingSoon ? (
          <span className="settings-soon-badge">Coming soon</span>
        ) : null}
      </div>
      <div className="settings-row-list">{children}</div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AppSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  // Legacy tab redirects
  if (params.tab === "role" || params.tab === "boundaries") {
    redirect(buildRedirectHref("/app/role", roleId, threadId));
  }
  if (params.tab === "channels") {
    redirect(buildRedirectHref("/app/channels", roleId, threadId));
  }

  const user = await requireUser("/app/settings");
  const supabase = await createClient();
  const [overview, resolution] = await Promise.all([
    loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
    resolveProductAppRoute({ supabase, userId: user.id }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={chatHref}>
          Back to chat
        </Link>
      }
      currentHref="/app/settings"
      description="Manage your account, model, subscription, and app preferences."
      eyebrow="Settings"
      shellContext={overview}
      title="Settings"
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

      {/* ── Account strip ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Signed in as</span>
          <span className="role-state-value">{user.email ?? "—"}</span>
        </div>
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span className="role-state-label">Auth</span>
          <span className="role-state-value">Magic link</span>
        </div>
      </div>

      {/* ── 1. Account ── */}
      <SectionCard title="Account">
        <SettingRow label="Email" value={user.email} />
        <SettingRow
          label="Sign-in method"
          value="Magic link"
          note="Passwordless — sent to your email"
        />
        <SettingRow
          label="User ID"
          value={user.id}
          note="Internal identifier"
          mono
        />
      </SectionCard>

      {/* ── 2. AI Model ── */}
      <SectionCard title="AI Model" comingSoon>
        <SettingRow
          label="SparkCore model"
          note="Default model included with your plan — higher tiers unlock more capable models"
          comingSoon
        />
        <SettingRow
          label="Custom API key"
          note="Bring your own key (OpenAI, Anthropic, DeepSeek) to override the plan model"
          comingSoon
        />
        <SettingRow
          label="Custom model ID"
          note="Specify which model to use when a custom API key is set"
          comingSoon
        />
      </SectionCard>

      {/* ── 3. Subscription ── */}
      <SectionCard title="Subscription" comingSoon>
        <SettingRow
          label="Current plan"
          note="Determines which AI model and how many messages are included"
          comingSoon
        />
        <SettingRow
          label="Message quota"
          note="Monthly message allowance for the current plan"
          comingSoon
        />
        <SettingRow
          label="Renewal date"
          comingSoon
        />
        <SettingRow
          label="Upgrade"
          note="Unlock more capable models and higher message limits"
          comingSoon
        />
      </SectionCard>

      {/* ── 4. App preferences ── */}
      <SectionCard title="App preferences" comingSoon>
        <SettingRow label="Theme" note="Light or dark mode" comingSoon />
        <SettingRow
          label="Language"
          note="Interface and response language"
          comingSoon
        />
        <SettingRow
          label="Notifications"
          note="Email digests and follow-up reminders"
          comingSoon
        />
      </SectionCard>

      {/* ── 5. Data & Privacy ── */}
      <SectionCard title="Data & Privacy" comingSoon>
        <SettingRow
          label="Memory retention"
          note="How long conversation memories are kept"
          comingSoon
        />
        <SettingRow
          label="Export my data"
          note="Download a copy of your companions, memory, and chat history"
          comingSoon
        />
        <SettingRow
          label="Data region"
          note="Where your data is stored and processed"
          comingSoon
        />
      </SectionCard>

      {/* ── 6. Danger zone ── */}
      <section className="site-card settings-danger-card">
        <div className="role-section-head">
          <h2 className="role-section-title settings-danger-title">
            Danger zone
          </h2>
        </div>
        <div className="settings-danger-list">
          <div className="settings-danger-row">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">Sign out</span>
              <span className="settings-danger-row-desc">
                End your current session on this device.
              </span>
            </div>
            <form action={signOut}>
              <FormSubmitButton
                className="button button-secondary settings-danger-btn"
                idleText="Sign out"
                pendingText="Signing out…"
              />
            </form>
          </div>
          <div className="settings-danger-row settings-danger-row-dim">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">
                Sign out all devices
              </span>
              <span className="settings-danger-row-desc">
                End all active sessions across every device.
              </span>
            </div>
            <button
              className="button button-secondary settings-danger-btn"
              disabled
              aria-disabled="true"
            >
              Sign out all
            </button>
          </div>
          <div className="settings-danger-row settings-danger-row-dim">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">Delete account</span>
              <span className="settings-danger-row-desc">
                Permanently remove your account, all companions, memory, and
                chat history. This cannot be undone.
              </span>
            </div>
            <button
              className="button button-secondary settings-danger-btn"
              disabled
              aria-disabled="true"
            >
              Delete account
            </button>
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
