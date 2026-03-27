import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductRoleCollection } from "@/lib/product/roles";
import { createClient } from "@/lib/supabase/server";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No interaction yet";
  }

  return new Date(value).toLocaleString();
}

export default async function AppRolesPage() {
  const user = await requireUser("/app/roles");
  const supabase = await createClient();
  const [roleCollection, overview] = await Promise.all([
    loadProductRoleCollection({
      supabase,
      userId: user.id,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
    }),
  ]);

  if (!roleCollection) {
    return null;
  }

  const activeRoleId = overview?.currentRole?.agentId ?? roleCollection.recentRoleId;
  const consoleHref = activeRoleId
    ? `/app/${encodeURIComponent(activeRoleId)}`
    : "/app";

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link className="button button-primary" href="/create">
            Create role
          </Link>
          <Link className="button button-secondary" href={consoleHref}>
            Back to console
          </Link>
        </>
      }
      currentHref="/app/roles"
      description="Manage your role assets and jump directly into the role console you want to operate."
      eyebrow="Role Assets"
      shellContext={overview}
      title="Your relationship roles in one place."
    >
      <ProductEventTracker
        event="role_assets_view"
        payload={{ role_count: roleCollection.roles.length }}
      />

      <div className="product-glance-grid product-action-home-grid">
        <article className="site-card product-highlight-card product-action-card product-action-card-primary">
          <p className="product-inline-kicker">Role inventory</p>
          <h2>
            {roleCollection.roles.length > 0
              ? `${roleCollection.roles.length} role(s) available`
              : "No role created yet"}
          </h2>
          <p>
            {roleCollection.roles.length > 0
              ? "Choose the role you want to run now, then continue the same relationship loop in its dedicated console."
              : "Create your first role to establish a persistent relationship identity and canonical thread."}
          </p>
          <div className="toolbar">
            <Link className="button button-primary" href="/create">
              Create role
            </Link>
            {roleCollection.recentRoleId ? (
              <Link
                className="button button-secondary"
                href={`/app/${encodeURIComponent(roleCollection.recentRoleId)}`}
              >
                Open recent role
              </Link>
            ) : null}
          </div>
        </article>
      </div>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">All roles</p>
          <h2>Switch context without losing continuity.</h2>
          <p>
            Each role keeps its own thread context. Pick the one you want, then
            continue from that role console.
          </p>
        </div>

        <div className="site-card-grid product-jump-grid">
          {roleCollection.roles.map((role) => {
            const isActive = activeRoleId === role.agentId;

            return (
              <article className="site-card" key={role.agentId}>
                <div className="product-status-card-head">
                  <span className="product-inline-kicker">Role</span>
                  {isActive ? (
                    <span className="product-status-pill product-status-pill-ready">
                      Current
                    </span>
                  ) : null}
                </div>
                <h2>{role.name}</h2>
                <p>{role.personaSummary}</p>
                <p>Last interaction · {formatTimestamp(role.lastInteractionAt)}</p>
                <p>
                  Current thread · {role.currentThreadTitle ?? "not established yet"}
                </p>
                <Link
                  className="site-inline-link"
                  href={`/app/${encodeURIComponent(role.agentId)}`}
                >
                  Open role console
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </ProductConsoleShell>
  );
}
