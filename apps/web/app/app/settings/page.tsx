import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

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

  if (roleId) {
    next.set("role", roleId);
  }

  if (threadId) {
    next.set("thread", threadId);
  }

  const query = next.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

export default async function AppSettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  if (params.tab === "role" || params.tab === "boundaries") {
    redirect(buildRedirectHref("/app/role", roleId, threadId));
  }

  if (params.tab === "channels") {
    redirect(buildRedirectHref("/app/channels", roleId, threadId));
  }

  const user = await requireUser("/app/settings");
  const supabase = await createClient();
  const [overview, resolution] = await Promise.all([
    loadDashboardOverview({
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

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const roleHref = `/app/role${roleQuerySuffix}`;
  const comingSoon = [
    {
      title: "Plan and billing",
      copy:
        "Billing, plan limits, and upgrade actions should live here once the subscription surface is exposed.",
    },
    {
      title: "Default model behavior",
      copy:
        "Provider choice and model routing should stay app-level unless we later support per-companion model selection.",
    },
    {
      title: "App preferences",
      copy:
        "Theme, notifications, and formatting preferences belong here so the relationship pages stay focused on conversation work.",
    },
  ];

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href={chatHref}>
            Continue chat
          </Link>
          <Link className="button button-secondary" href={roleHref}>
            Review role
          </Link>
        </>
      }
      currentHref="/app/settings"
      description="Manage your account, subscription, model preferences, and app behavior."
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

      <div className="chat-status-bar">
        <span className="product-status-pill product-status-pill-neutral">
          Account
        </span>
        <span className="product-status-pill product-status-pill-neutral">
          Preferences
        </span>
      </div>

      <section className="product-section settings-console-section">
        <div className="product-section-heading">
          <p className="home-kicker">Account and app</p>
          <h2>Manage your account and app defaults.</h2>
          <p>
            Come here for account details, billing, default model behavior, and
            app-wide preferences.
          </p>
        </div>

        <section className="site-card">
          <div className="product-status-card-head">
            <h2>Start here</h2>
            <span className="product-status-pill product-status-pill-neutral">
              Settings guide
            </span>
          </div>
          <div className="product-route-list">
            <article className="product-route-item">
              <strong>Use this page for your account, not the companion.</strong>
              <p>
                Billing, sign-in, default model behavior, and app-wide preferences
                belong here so the relationship pages stay focused.
              </p>
            </article>
            <article className="product-route-item">
              <strong>If you want to fix behavior, leave this page.</strong>
              <p>
                Companion identity, memory, knowledge, and channels are managed
                in their own pages.
              </p>
            </article>
          </div>
        </section>

        <div className="product-dual-grid">
          <section className="site-card product-form-card">
            <h2>Your account</h2>
            <div className="stack">
              <div className="field">
                <span className="label">Signed-in email</span>
                <p className="helper-copy">{user.email ?? "No email available."}</p>
              </div>
              <div className="field">
                <span className="label">Sign-in method</span>
                <p className="helper-copy">Managed by your current auth provider.</p>
              </div>
              <div className="field">
                <span className="label">What belongs here</span>
                <p className="helper-copy">
                  Your account, sign-in, billing, model defaults, and app-wide
                  preferences.
                </p>
              </div>
            </div>
          </section>

          <section className="site-card product-preview-card">
            <h2>Coming next</h2>
            <div className="product-route-list">
              {comingSoon.map((item) => (
                <article className="product-route-item" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

      </section>
    </ProductConsoleShell>
  );
}
