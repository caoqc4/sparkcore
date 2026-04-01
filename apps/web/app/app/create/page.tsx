import Link from "next/link";
import { RoleCreateWizard } from "@/components/role-create-wizard";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import { loadActiveAudioAssets, loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { createClient } from "@/lib/supabase/server";

type AppCreatePageProps = {
  searchParams: Promise<{
    error?: string;
    preset?: string;
  }>;
};

export default async function AppCreatePage({ searchParams }: AppCreatePageProps) {
  const params = await searchParams;
  const user   = await getOptionalUser();
  const supabase = await createClient();
  const presetSlug =
    params.preset === "caria" || params.preset === "teven" || params.preset === "velia"
      ? (params.preset as CharacterSlug)
      : null;
  const presetDefinition = presetSlug ? CHARACTER_MANIFEST[presetSlug] : null;
  const [{ data: audioOptions }, { data: portraitAssets }, currentPlanSlug] = await Promise.all([
    loadActiveAudioAssets({ supabase }),
    loadSharedPresetPortraitAssets({ supabase }),
    user ? loadCurrentProductPlanSlug({ supabase, userId: user.id }) : Promise.resolve("free")
  ]);
  const resolvedPortraitAssets = Array.isArray(portraitAssets)
    ? portraitAssets.map((asset) => ({
        ...asset,
        public_url:
          typeof asset.public_url === "string" && asset.public_url.length > 0
            ? asset.public_url
            : typeof asset.storage_path === "string" && asset.storage_path.startsWith("character-assets/")
              ? supabase.storage
                  .from("character-assets")
                  .getPublicUrl(asset.storage_path.replace(/^character-assets\//, "")).data.publicUrl
              : null
      }))
    : [];

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
      <div className="rcw-create-layout">
        <aside className="site-card rcw-create-presets">
          <div className="rcw-create-presets-head">
            <span className="rcw-kicker">Presets</span>
            <h2 className="rcw-title">Choose a starting point</h2>
          </div>
          <div className="rcw-create-presets-list">
            {(["caria", "teven", "velia"] as CharacterSlug[]).map((slug) => {
              const character = CHARACTER_MANIFEST[slug];
              const active = presetSlug === slug;
              return (
                <Link
                  key={slug}
                  className={`rcw-create-preset-link${active ? " active" : ""}`}
                  href={`/app/create?preset=${encodeURIComponent(slug)}`}
                >
                  <span className="rcw-create-preset-name">{character.displayName}</span>
                  <span className="rcw-create-preset-meta">
                    {character.mode === "assistant" ? "Assistant" : "Companion"} · {character.avatarGender}
                  </span>
                </Link>
              );
            })}
            <Link
              className={`rcw-create-preset-link${presetSlug === null ? " active" : ""}`}
              href="/app/create"
            >
              <span className="rcw-create-preset-name">Blank</span>
              <span className="rcw-create-preset-meta">Start from scratch</span>
            </Link>
          </div>
        </aside>
        <div className="site-card rcw-shell-card">
          <RoleCreateWizard
            createSurface="/app/create"
            defaultPresetSlug={presetSlug ?? undefined}
            defaultMode={presetDefinition?.mode}
            defaultGender={presetDefinition?.avatarGender}
            defaultName={presetDefinition?.displayName}
            audioOptions={Array.isArray(audioOptions) ? audioOptions : []}
            portraitAssets={resolvedPortraitAssets}
            currentPlanSlug={currentPlanSlug === "pro" ? "pro" : "free"}
            loginNext="/app/create"
            redirectAfterCreate="/app/role"
            user={user ? { id: user.id } : null}
          />
        </div>
      </div>
    </ProductConsoleShell>
  );
}
