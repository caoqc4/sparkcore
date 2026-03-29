import Link from "next/link";
import { redirect } from "next/navigation";
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
  exportCurrentProductData,
  saveProductAppSettings,
  saveProductDataPrivacySettings,
  saveProductModelSettings,
  saveProductSubscriptionSnapshot,
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
}: {
  title: string;
  children: React.ReactNode;
  badge?: string | null;
}) {
  return (
    <section className="site-card settings-card">
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

      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">Signed in as</span>
          <span className="role-state-value">{settingsData.account.email ?? "—"}</span>
        </div>
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span className="role-state-label">Auth</span>
          <span className="role-state-value">{settingsData.account.authLabel}</span>
        </div>
      </div>

      <SectionCard title="Account">
        <div className="settings-row">
          <div className="settings-row-label-wrap">
            <span className="settings-row-label">Email</span>
          </div>
          <span className="settings-row-value">{settingsData.account.email ?? "—"}</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-label-wrap">
            <span className="settings-row-label">Sign-in method</span>
            <span className="settings-row-note">Passwordless login for this account</span>
          </div>
          <span className="settings-row-value">{settingsData.account.authLabel}</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-label-wrap">
            <span className="settings-row-label">User ID</span>
            <span className="settings-row-note">Internal identifier</span>
          </div>
          <span className="settings-row-value settings-row-value-mono">
            {settingsData.account.userId}
          </span>
        </div>
      </SectionCard>

      <SectionCard title="AI Model">
        <form action={saveProductModelSettings} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <label className="settings-field">
            <span className="settings-field-label">Provider</span>
            <input
              className="site-input"
              defaultValue={settingsData.appSettings.defaultModelProvider ?? ""}
              name="default_model_provider"
              placeholder="openai"
              type="text"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Model ID</span>
            <input
              className="site-input"
              defaultValue={settingsData.appSettings.defaultModelId ?? ""}
              name="default_model_id"
              placeholder="gpt-5.4"
              type="text"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Custom model ID</span>
            <input
              className="site-input"
              defaultValue={settingsData.appSettings.customModelId ?? ""}
              name="custom_model_id"
              placeholder="Optional override"
              type="text"
            />
          </label>
          <label className="settings-checkbox">
            <input
              defaultChecked={settingsData.appSettings.customApiKeyPresent}
              name="custom_api_key_present"
              type="checkbox"
              value="true"
            />
            <span>Custom API key is already configured</span>
          </label>
          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText="Save model settings"
            pendingText="Saving…"
          />
        </form>
      </SectionCard>

      <SectionCard title="Subscription">
        <form action={saveProductSubscriptionSnapshot} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <label className="settings-field">
            <span className="settings-field-label">Plan name</span>
            <input
              className="site-input"
              defaultValue={settingsData.subscription.planName ?? ""}
              name="plan_name"
              placeholder="Starter"
              type="text"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Plan status</span>
            <select
              className="site-select"
              defaultValue={settingsData.subscription.planStatus}
              name="plan_status"
            >
              <option value="inactive">Inactive</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Message quota</span>
            <input
              className="site-input"
              defaultValue={settingsData.subscription.messageQuota ?? ""}
              name="message_quota"
              placeholder="1000"
              type="number"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Renewal date</span>
            <input
              className="site-input"
              defaultValue={settingsData.subscription.renewalDate ?? ""}
              name="renewal_date"
              type="datetime-local"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Upgrade URL</span>
            <input
              className="site-input"
              defaultValue={settingsData.subscription.upgradeUrl ?? ""}
              name="upgrade_url"
              placeholder="https://..."
              type="url"
            />
          </label>
          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText="Save subscription"
            pendingText="Saving…"
          />
        </form>
      </SectionCard>

      <SectionCard title="App preferences">
        <form action={saveProductAppSettings} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <label className="settings-field">
            <span className="settings-field-label">Theme</span>
            <select
              className="site-select"
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
            <input
              className="site-input"
              defaultValue={settingsData.appSettings.interfaceLanguage}
              name="interface_language"
              placeholder="en"
              type="text"
            />
          </label>
          <label className="settings-checkbox">
            <input
              defaultChecked={settingsData.appSettings.notificationsEnabled}
              name="notifications_enabled"
              type="checkbox"
              value="true"
            />
            <span>Enable notifications and follow-up reminders</span>
          </label>
          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText="Save preferences"
            pendingText="Saving…"
          />
        </form>
      </SectionCard>

      <SectionCard title="Data & Privacy">
        <form action={saveProductDataPrivacySettings} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <label className="settings-field">
            <span className="settings-field-label">Memory retention</span>
            <select
              className="site-select"
              defaultValue={settingsData.appSettings.memoryRetentionPolicy}
              name="memory_retention_policy"
            >
              <option value="standard">Standard</option>
              <option value="extended">Extended</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
          <label className="settings-field">
            <span className="settings-field-label">Data region</span>
            <input
              className="site-input"
              defaultValue={settingsData.appSettings.dataRegion}
              name="data_region"
              placeholder="global"
              type="text"
            />
          </label>
          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText="Save privacy settings"
            pendingText="Saving…"
          />
        </form>
        <div className="settings-inline-actions settings-inline-actions-spaced">
          <form action={exportCurrentProductData}>
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <FormSubmitButton
              className="button button-secondary settings-submit-btn"
              idleText="Export my data"
              pendingText="Exporting…"
            />
          </form>
        </div>
        <div className="settings-meta-panel">
          <div className="settings-meta-card">
            <span className="settings-meta-label">Latest export</span>
            <span className="settings-meta-value">
              {settingsData.latestExport
                ? `${settingsData.latestExport.status} · ${formatDate(
                    settingsData.latestExport.createdAt,
                  )}`
                : "No export yet"}
            </span>
          </div>
          <div className="settings-meta-card">
            <span className="settings-meta-label">Recent operations</span>
            <div className="settings-ops-list">
              {settingsData.recentOperations.length > 0 ? (
                settingsData.recentOperations.slice(0, 4).map((item) => (
                  <div key={item.id} className="settings-op-item">
                    <span>{item.action.replaceAll("_", " ")}</span>
                    <span>{item.status}</span>
                  </div>
                ))
              ) : (
                <span className="settings-row-note">No recent settings activity</span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="site-card settings-danger-card">
        <div className="role-section-head">
          <h2 className="role-section-title settings-danger-title">Danger zone</h2>
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
            <form action={deleteCurrentProductAccount}>
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <FormSubmitButton
                className="button button-secondary settings-danger-btn"
                idleText="Delete account"
                pendingText="Deleting…"
              />
            </form>
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
