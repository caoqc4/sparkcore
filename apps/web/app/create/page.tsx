import { ProductRoleSetup } from "@/components/product-role-setup";
import { SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";

type CreatePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();

  return (
    <SiteShell>
      <section className="page-frame">
        <div className="page-frame-header">
          <p className="eyebrow">Create</p>
          <h1 className="title">Create your companion and move straight into IM setup.</h1>
          <p className="lead">
            This flow now creates a real role and a real canonical thread. Browsing
            stays public, but submission is gated by login.
          </p>
          {!user ? (
            <div className="notice notice-warning">
              You can review the setup form now. Sign in is required when you submit.
            </div>
          ) : null}
          {params.error ? (
            <div className="notice notice-error">{params.error}</div>
          ) : null}
        </div>

        <div className="page-frame-body">
          <ProductRoleSetup
            loginNext="/create"
            reviewHref="/how-it-works"
            surface="create_page"
            user={user ? { id: user.id } : null}
          />
        </div>
      </section>
    </SiteShell>
  );
}
