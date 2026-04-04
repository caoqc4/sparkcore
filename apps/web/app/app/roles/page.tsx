import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadProductRoleCollection } from "@/lib/product/roles";
import { createClient } from "@/lib/supabase/server";

function formatTimestamp(value: string | null, isZh: boolean) {
  if (!value) {
    return isZh ? "还没有互动" : "No interaction yet";
  }

  return new Date(value).toLocaleString();
}

export default async function AppRolesPage() {
  const user = await requireUser("/app/roles");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
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
            {isZh ? "创建角色" : "Create role"}
          </Link>
          <Link className="button button-secondary" href={consoleHref}>
            {isZh ? "返回控制台" : "Back to console"}
          </Link>
        </>
      }
      currentHref="/app/roles"
      description={isZh ? "管理你的角色资产，并直接进入想操作的角色控制台。" : "Manage your role assets and jump directly into the role console you want to operate."}
      eyebrow={isZh ? "角色资产" : "Role Assets"}
      shellContext={overview}
      title={isZh ? "把你的关系角色集中管理" : "Your relationship roles in one place."}
    >
      <ProductEventTracker
        event="role_assets_view"
        payload={{ role_count: roleCollection.roles.length }}
      />

      <div className="product-glance-grid product-action-home-grid">
        <article className="site-card product-highlight-card product-action-card product-action-card-primary">
          <p className="product-inline-kicker">{isZh ? "角色清单" : "Role inventory"}</p>
          <h2>
            {roleCollection.roles.length > 0
              ? isZh ? `共有 ${roleCollection.roles.length} 个角色` : `${roleCollection.roles.length} role(s) available`
              : isZh ? "还没有创建角色" : "No role created yet"}
          </h2>
          <p>
            {roleCollection.roles.length > 0
              ? isZh ? "选择你现在要运行的角色，然后在它专属的控制台里继续同一段关系循环。" : "Choose the role you want to run now, then continue the same relationship loop in its dedicated console."
              : isZh ? "先创建你的第一个角色，建立持续存在的关系身份和主线程。" : "Create your first role to establish a persistent relationship identity and canonical thread."}
          </p>
          <div className="toolbar">
            <Link className="button button-primary" href="/create">
              {isZh ? "创建角色" : "Create role"}
            </Link>
            {roleCollection.recentRoleId ? (
              <Link
                className="button button-secondary"
                href={`/app/${encodeURIComponent(roleCollection.recentRoleId)}`}
              >
                {isZh ? "打开最近角色" : "Open recent role"}
              </Link>
            ) : null}
          </div>
        </article>
      </div>

      <section className="product-section">
        <div className="product-section-heading">
          <p className="home-kicker">{isZh ? "全部角色" : "All roles"}</p>
          <h2>{isZh ? "切换角色上下文，但不中断连续性。" : "Switch context without losing continuity."}</h2>
          <p>
            {isZh
              ? "每个角色都会保留自己的线程上下文。选中你想要的角色，然后继续在对应控制台里操作。"
              : "Each role keeps its own thread context. Pick the one you want, then continue from that role console."}
          </p>
        </div>

        <div className="site-card-grid product-jump-grid">
          {roleCollection.roles.map((role) => {
            const isActive = activeRoleId === role.agentId;

            return (
              <article className="site-card" key={role.agentId}>
                <div className="product-status-card-head">
                  <span className="product-inline-kicker">{isZh ? "角色" : "Role"}</span>
                  {isActive ? (
                    <span className="product-status-pill product-status-pill-ready">
                      {isZh ? "当前使用" : "Current"}
                    </span>
                  ) : null}
                </div>
                <h2>{role.name}</h2>
                <p>{role.personaSummary}</p>
                <p>{isZh ? "最近互动" : "Last interaction"} · {formatTimestamp(role.lastInteractionAt, isZh)}</p>
                <p>
                  {isZh ? "当前线程" : "Current thread"} · {role.currentThreadTitle ?? (isZh ? "尚未建立" : "not established yet")}
                </p>
                <Link
                  className="site-inline-link"
                  href={`/app/${encodeURIComponent(role.agentId)}`}
                >
                  {isZh ? "打开角色控制台" : "Open role console"}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </ProductConsoleShell>
  );
}
