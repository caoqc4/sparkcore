import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountConfirm } from "@/components/delete-account-confirm";
import { SettingsModelCapabilityGrid } from "@/components/settings-model-capability-grid";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductSettingsPageData } from "@/lib/product/settings";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCurrentProductAccount,
  saveProductAppSettings,
  saveProductModelSettings,
  signOutAllProductSessions,
} from "@/app/app/settings/actions";
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

function buildRedirectHref(basePath: string, roleId: string | null, threadId: string | null) {
  const next = new URLSearchParams();
  if (roleId) next.set("role", roleId);
  if (threadId) next.set("thread", threadId);
  const query = next.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function SectionCard({
  title,
  children,
  badge,
  id,
}: {
  title: string;
  children: React.ReactNode;
  badge?: string | null;
  id?: string;
}) {
  return (
    <section className="site-card settings-card" id={id}>
      <div className="role-section-head">
        <h2 className="role-section-title">{title}</h2>
        {badge ? <span className="settings-soon-badge">{badge}</span> : null}
      </div>
      <div className="settings-row-list">{children}</div>
    </section>
  );
}



export default async function AppSettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  const roleId =
    typeof params.role === "string" && params.role.length > 0 ? params.role : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0 ? params.thread : null;

  if (params.tab === "role" || params.tab === "boundaries") {
    redirect(buildRedirectHref("/app/role", roleId, threadId));
  }
  if (params.tab === "channels") {
    redirect(buildRedirectHref("/app/channels", roleId, threadId));
  }

  const user = await requireUser("/app/settings");
  const supabase = await createClient();
  const [overview, resolution, settingsData] = await Promise.all([
    loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadProductSettingsPageData({ supabase, user }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const redirectTo = `/app/settings${roleQuerySuffix}`;

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

      {/* ── Account ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">Account</h2>
          <form action={signOut}>
            <FormSubmitButton
              className="button button-secondary settings-danger-btn"
              idleText="Sign out"
              pendingText="Signing out…"
            />
          </form>
        </div>
        <div className="settings-identity">
          <div
            className={`settings-identity-badge${
              settingsData.account.authLabel === "Google" ? " badge-google" : " badge-legacy"
            }`}
            aria-hidden="true"
          >
            {settingsData.account.authLabel === "Google" ? "G" : "@"}
          </div>
          <div className="settings-identity-body">
            <span className="settings-identity-email">{settingsData.account.email ?? "—"}</span>
            <div className="settings-identity-meta">
              <span className="settings-identity-provider-label">
                {settingsData.account.authLabel === "Google"
                  ? "Google account"
                  : settingsData.account.authLabel}
              </span>
              {settingsData.account.authLabel !== "Google" ? (
                <span className="settings-identity-legacy-tag">Legacy</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="settings-identity-id-row">
          <span className="settings-identity-id-label">ID</span>
          <span className="settings-identity-id-value">
            {settingsData.account.userId.slice(0, 16)}…
          </span>
        </div>
      </section>

      {/* ── AI Model ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">AI Model</h2>
        </div>
        <form action={saveProductModelSettings} className="settings-model-form">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          {/* Preserve custom API key flag — not user-editable, set via admin */}
          <input
            name="custom_api_key_present"
            type="hidden"
            value={settingsData.appSettings.customApiKeyPresent ? "true" : "false"}
          />

          {settingsData.modelSettings.capabilities.map((capability) => {
            const visible = capability.options.filter(
              (o) => o.accessLevel !== "hidden" && o.availabilityStatus === "active",
            );

            return (
              <div key={capability.capabilityType} className="settings-model-capability">
                <div className="settings-model-cap-head">
                  <span className="settings-model-cap-label">{capability.label}</span>
                  <span className="settings-model-cap-desc">{capability.description}</span>
                </div>

                <SettingsModelCapabilityGrid
                  capabilityType={capability.capabilityType}
                  options={visible}
                  selectedSlug={capability.selectedSlug}
                  subscriptionSectionId="settings-subscription"
                />
              </div>
            );
          })}

          <FormSubmitButton
            className="button button-primary settings-submit-btn"
            idleText="Save model settings"
            pendingText="Saving…"
          />
        </form>
      </section>

      <SectionCard id="settings-subscription" title="Subscription">
        <div className="settings-sub-compact">
          <div className="settings-sub-compact-top">
            <span
              className={`settings-plan-badge tier-${settingsData.subscriptionSummary.currentPlanSlug}`}
            >
              {settingsData.subscriptionSummary.currentPlanName}
            </span>
            {settingsData.subscriptionSummary.currentPlanSlug === "pro" &&
              settingsData.subscriptionSummary.renewalDateLabel && (
              <span className="settings-sub-renewal">
                Renews {formatDate(settingsData.subscriptionSummary.renewalDateLabel)}
              </span>
            )}
          </div>
          {settingsData.subscriptionSummary.currentPlanSlug === "pro" ? (
            <div className="settings-subscription-actions">
              <Link
                className="button button-secondary"
                href={settingsData.subscriptionSummary.upgradeHref}
              >
                Manage billing
              </Link>
              <Link className="button button-secondary" href="/app/credits">
                Credits
              </Link>
            </div>
          ) : (
            <Link className="button button-primary" href="/app/subscription">
              Upgrade to Pro
            </Link>
          )}
        </div>
      </SectionCard>

      <SectionCard title="App preferences">
        <form action={saveProductAppSettings} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <div className="settings-form-row">
            <label className="settings-field">
              <span className="settings-field-label">Theme</span>
              <select
                className="site-select settings-select-compact"
                defaultValue={settingsData.appSettings.theme}
                name="theme"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="settings-field">
              <span className="settings-field-label">Language</span>
              <select
                className="site-select settings-select-compact"
                defaultValue={settingsData.appSettings.interfaceLanguage ?? "en"}
                name="interface_language"
              >
                <option value="en">English</option>
              </select>
            </label>
          </div>

          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText="Save preferences"
            pendingText="Saving…"
          />
        </form>
      </SectionCard>

      <SectionCard title="Data & Privacy">
        <p className="settings-privacy-desc">
          Review how your data is handled and stored.
        </p>
        <div className="settings-privacy-links">
          <Link className="settings-privacy-link" href="/privacy" target="_blank">
            Privacy Policy ↗
          </Link>
          <Link className="settings-privacy-link" href="/terms" target="_blank">
            Terms of Service ↗
          </Link>
        </div>
      </SectionCard>

      <section className="site-card settings-danger-card">
        <div className="role-section-head">
          <h2 className="role-section-title settings-danger-title">Danger zone</h2>
        </div>
        <div className="settings-danger-list">
          <div className="settings-danger-row">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">Sign out all devices</span>
              <span className="settings-danger-row-desc">
                End all active sessions across every device.
              </span>
            </div>
            <form action={signOutAllProductSessions}>
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <FormSubmitButton
                className="button button-secondary settings-danger-btn"
                idleText="Sign out all"
                pendingText="Signing out…"
              />
            </form>
          </div>
          <div className="settings-danger-row">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">Delete account</span>
              <span className="settings-danger-row-desc">
                Permanently remove your account, all companions, memory, and chat
                history. This cannot be undone.
              </span>
            </div>
            <DeleteAccountConfirm
              action={deleteCurrentProductAccount}
              redirectTo={redirectTo}
            />
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
