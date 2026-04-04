import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountConfirm } from "@/components/delete-account-confirm";
import { SettingsModelCapabilityGrid } from "@/components/settings-model-capability-grid";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { saveLanguagePreferences } from "@/app/actions/language";
import { requireUser } from "@/lib/auth-redirect";
import {
  getLanguagePreferenceCopy,
  getSiteChromeCopy,
  getSiteLanguageState,
} from "@/lib/i18n/site";
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

function getCapabilityCopy(
  capabilityType: "text" | "image" | "audio",
  language: "en" | "zh-CN"
) {
  const isZh = language === "zh-CN";

  switch (capabilityType) {
    case "text":
      return {
        label: isZh ? "文本模型" : "Text model",
        description: isZh
          ? "决定主要对话的回复质量、推理深度和整体语气。"
          : "Used for primary chat quality, reasoning depth, and response tone.",
      };
    case "image":
      return {
        label: isZh ? "图片模型" : "Image model",
        description: isZh
          ? "用于生成或编辑角色头像与图片内容。"
          : "Used when the companion generates or transforms images.",
      };
    case "audio":
      return {
        label: isZh ? "语音模型" : "Audio model",
        description: isZh
          ? "用于生成语音回复和音频消息。"
          : "Used when the companion replies with generated voice or audio messages.",
      };
  }
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
  const {
    contentLanguage,
    effectiveSystemLanguage,
  } = await getSiteLanguageState();
  const chromeCopy = getSiteChromeCopy(effectiveSystemLanguage);
  const settingsCopy = chromeCopy.settings;
  const consoleCopy = chromeCopy.console;
  const languageCopy = getLanguagePreferenceCopy(effectiveSystemLanguage);

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={chatHref}>
          {consoleCopy.status.backToChat}
        </Link>
      }
      currentHref="/app/settings"
      description={settingsCopy.pageDescription}
      eyebrow={settingsCopy.pageEyebrow}
      shellContext={overview}
      title={settingsCopy.pageTitle}
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
          <h2 className="role-section-title">{settingsCopy.account}</h2>
          <form action={signOut}>
            <FormSubmitButton
              className="button button-secondary settings-danger-btn"
              idleText={settingsCopy.signOut}
              pendingText={settingsCopy.signingOut}
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
                  ? settingsCopy.googleAccount
                  : settingsData.account.authLabel}
              </span>
              {settingsData.account.authLabel !== "Google" ? (
                <span className="settings-identity-legacy-tag">{settingsCopy.legacy}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="settings-identity-id-row">
          <span className="settings-identity-id-label">{settingsCopy.id}</span>
          <span className="settings-identity-id-value">
            {settingsData.account.userId.slice(0, 16)}…
          </span>
        </div>
      </section>

      {/* ── AI Model ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{settingsCopy.aiModel}</h2>
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
                  <span className="settings-model-cap-label">
                    {getCapabilityCopy(capability.capabilityType, effectiveSystemLanguage).label}
                  </span>
                  <span className="settings-model-cap-desc">
                    {getCapabilityCopy(capability.capabilityType, effectiveSystemLanguage).description}
                  </span>
                </div>

                <SettingsModelCapabilityGrid
                  capabilityType={capability.capabilityType}
                  language={effectiveSystemLanguage}
                  options={visible}
                  selectedSlug={capability.selectedSlug}
                  subscriptionSectionId="settings-subscription"
                />
              </div>
            );
          })}

          <FormSubmitButton
            className="button button-primary settings-submit-btn"
            idleText={settingsCopy.saveModelSettings}
            pendingText={settingsCopy.saving}
          />
        </form>
      </section>

      <SectionCard id="settings-subscription" title={settingsCopy.subscription}>
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
                {settingsCopy.renewsOn} {formatDate(settingsData.subscriptionSummary.renewalDateLabel)}
              </span>
            )}
          </div>
          {settingsData.subscriptionSummary.currentPlanSlug === "pro" ? (
            <div className="settings-subscription-actions">
              <Link
                className="button button-secondary"
                href={settingsData.subscriptionSummary.upgradeHref}
              >
                {settingsCopy.manageBilling}
              </Link>
              <Link className="button button-secondary" href="/app/credits">
                {settingsCopy.credits}
              </Link>
            </div>
          ) : (
            <Link className="button button-primary" href="/app/subscription">
              {settingsCopy.upgradeToPro}
            </Link>
          )}
        </div>
      </SectionCard>

      <SectionCard title={settingsCopy.appPreferences}>
        <form action={saveProductAppSettings} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <div className="settings-form-row">
            <label className="settings-field">
              <span className="settings-field-label">{settingsCopy.theme}</span>
              <select
                className="site-select settings-select-compact"
                defaultValue={settingsData.appSettings.theme}
                name="theme"
              >
                <option value="system">{settingsCopy.systemDefault}</option>
                <option value="light">{settingsCopy.light}</option>
                <option value="dark">{settingsCopy.dark}</option>
              </select>
            </label>
          </div>

          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText={languageCopy.savePreferences}
            pendingText={languageCopy.savingPreferences}
          />
        </form>
      </SectionCard>

      <SectionCard title={languageCopy.contentLanguageLabel}>
        <form action={saveLanguagePreferences} className="settings-form-grid">
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <div className="settings-form-row">
            <label className="settings-field">
              <span className="settings-field-label">{languageCopy.contentLanguageLabel}</span>
              <select
                className="site-select settings-select-compact"
                defaultValue={contentLanguage}
                name="language"
              >
                <option value="en">{languageCopy.languageOptions.en}</option>
                <option value="zh-CN">{languageCopy.languageOptions["zh-CN"]}</option>
              </select>
              <span className="settings-field-help">{languageCopy.contentLanguageHint}</span>
            </label>
          </div>

          <FormSubmitButton
            className="button button-secondary settings-submit-btn"
            idleText={languageCopy.savePreferences}
            pendingText={languageCopy.savingPreferences}
          />
        </form>
      </SectionCard>

      <SectionCard title={settingsCopy.dataPrivacy}>
        <p className="settings-privacy-desc">
          {settingsCopy.privacyDescription}
        </p>
        <div className="settings-privacy-links">
          <Link className="settings-privacy-link" href="/privacy" target="_blank">
            {settingsCopy.privacyPolicy}
          </Link>
          <Link className="settings-privacy-link" href="/terms" target="_blank">
            {settingsCopy.terms}
          </Link>
        </div>
      </SectionCard>

      <section className="site-card settings-danger-card">
        <div className="role-section-head">
          <h2 className="role-section-title settings-danger-title">{settingsCopy.dangerZone}</h2>
        </div>
        <div className="settings-danger-list">
          <div className="settings-danger-row">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">{settingsCopy.signOutAllDevices}</span>
              <span className="settings-danger-row-desc">
                {settingsCopy.signOutAllDevicesHint}
              </span>
            </div>
            <form action={signOutAllProductSessions}>
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <FormSubmitButton
                className="button button-secondary settings-danger-btn"
                idleText={settingsCopy.signOutAllDevices}
                pendingText={settingsCopy.signingOut}
              />
            </form>
          </div>
          <div className="settings-danger-row">
            <div className="settings-danger-row-info">
              <span className="settings-danger-row-label">{settingsCopy.deleteAccount}</span>
              <span className="settings-danger-row-desc">
                {settingsCopy.deleteAccountHint}
              </span>
            </div>
            <DeleteAccountConfirm
              action={deleteCurrentProductAccount}
              language={effectiveSystemLanguage}
              redirectTo={redirectTo}
            />
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
