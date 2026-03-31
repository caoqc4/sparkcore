import Link from "next/link";
import { RoleCreateWizard } from "@/components/role-create-wizard";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { getOptionalUser } from "@/lib/auth-redirect";

type AppCreatePageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
    gender?: string;
    name?: string;
    tone?: string;
    traits?: string;
    boundary?: string;
  }>;
};

const BOUNDARY_TEXT: Record<string, string> = {
  warm_support: "Be warm, supportive, and emotionally present. Prioritize listening and comfort over advice.",
  open_playful: "Be expressive, fun, and go with the energy of the conversation. Stay positive and light.",
  grounded:     "Be calm and grounded. Keep the relationship healthy without fostering unhealthy dependency.",
};

export default async function AppCreatePage({ searchParams }: AppCreatePageProps) {
  const params = await searchParams;
  const user   = await getOptionalUser();

  const defaultMode: "companion" | "assistant" =
    params.mode === "assistant" ? "assistant" : "companion";

  const defaultGender =
    params.gender === "female" || params.gender === "male" || params.gender === "neutral"
      ? (params.gender as "female" | "male" | "neutral")
      : undefined;

  const defaultName = params.name?.trim().slice(0, 20) || undefined;

  const defaultTone =
    params.tone === "warm" || params.tone === "playful" || params.tone === "steady"
      ? params.tone
      : undefined;

  const defaultTraits =
    params.traits
      ? params.traits.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

  const defaultBoundaries =
    params.boundary && BOUNDARY_TEXT[params.boundary]
      ? BOUNDARY_TEXT[params.boundary]
      : undefined;

  // If we have pre-fills from the homepage (name provided), skip to Look step
  const startAtLook = Boolean(defaultName);

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
          defaultGender={defaultGender}
          defaultName={defaultName}
          defaultTone={defaultTone}
          defaultTraits={defaultTraits}
          defaultBoundaries={defaultBoundaries}
          startAtLook={startAtLook}
          loginNext="/app/create"
          redirectAfterCreate="/app/role"
          user={user ? { id: user.id } : null}
        />
      </div>
    </ProductConsoleShell>
  );
}
