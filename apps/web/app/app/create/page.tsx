import Link from "next/link";
import { RoleCreateWizard } from "@/components/role-create-wizard";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { getOptionalUser } from "@/lib/auth-redirect";

type AppCreatePageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
  }>;
};

export default async function AppCreatePage({ searchParams }: AppCreatePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const defaultMode =
    params.mode === "girlfriend" || params.mode === "boyfriend" ? params.mode : "companion";

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href="/app/role">
          Cancel
        </Link>
      }
      currentHref="/app/create"
      description="Set up your companion in three steps."
      eyebrow="New Role"
      title="Create a new role"
    >
      {params.error ? (
        <div className="notice notice-error">{params.error}</div>
      ) : null}
      <div className="site-card rcw-shell-card">
        <RoleCreateWizard
          defaultMode={defaultMode}
          loginNext="/app/create"
          redirectAfterCreate="/app/role"
          user={user ? { id: user.id } : null}
        />
      </div>
    </ProductConsoleShell>
  );
}
