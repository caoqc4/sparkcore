import { ProductRoleSetup } from "@/components/product-role-setup";
import { SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Create Your Companion",
  description: "Protected SparkCore onboarding flow for creating a relationship role and canonical thread.",
  path: "/create",
  noIndex: true
});

type CreatePageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const defaultMode =
    params.mode === "girlfriend" || params.mode === "boyfriend" ? params.mode : "companion";

  return (
    <SiteShell>
      <section className="page-frame onboarding-frame">
        <div className="page-frame-header onboarding-frame-header">
          <div className="onboarding-copy">
            <div className="onboarding-step-chip">Step 1 of 2</div>
            <p className="eyebrow">Create Role</p>
            <h1 className="title">Create the relationship core before you think about channels.</h1>
            <p className="lead">
              This step creates the real role and the real canonical thread. IM binding comes next
              as an optional continuation step, not as the first thing a user has to solve.
            </p>
          </div>

          <div className="site-card-grid onboarding-summary-grid">
            <article className="site-card onboarding-summary-card">
              <span className="site-inline-pill">01</span>
              <h2>Define the role</h2>
              <p>Name, tone, relationship mode, and boundaries become the base continuity layer.</p>
            </article>
            <article className="site-card onboarding-summary-card">
              <span className="site-inline-pill">02</span>
              <h2>Connect IM after</h2>
              <p>Attach Telegram once the role exists, or skip it and enter web control mode first.</p>
            </article>
          </div>

          {!user ? (
            <div className="notice notice-warning">
              You can review the setup flow now. Sign in is required when you submit.
            </div>
          ) : null}
          {params.error ? <div className="notice notice-error">{params.error}</div> : null}
        </div>

        <div className="page-frame-body">
          <ProductRoleSetup
            defaultMode={defaultMode}
            loginNext="/create"
            shellClassName="product-role-shell product-role-shell-onboarding"
            reviewHref="/how-it-works"
            surface="create_page"
            user={user ? { id: user.id } : null}
          />
        </div>
      </section>
    </SiteShell>
  );
}
