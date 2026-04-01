import { RoleCreateWizard } from "@/components/role-create-wizard";
import { SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import { loadActiveAudioAssets, loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { buildPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "Create Your Companion",
  description:
    "Create a SparkCore companion with a name, personality, and portrait. Set up IM channels after.",
  path: "/create",
  noIndex: true,
});

type CreatePageProps = {
  searchParams: Promise<{
    preset?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();
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
    <SiteShell>
      <section className="page-frame onboarding-frame">
        <div className="page-frame-header onboarding-frame-header">
          <div className="onboarding-copy">
            <p className="eyebrow">Create Companion</p>
            <h1 className="title">
              Build the relationship before you think about channels.
            </h1>
            <p className="lead">
              Three quick steps — identity, personality, and portrait. IM
              connection comes after, not first.
            </p>
          </div>
        </div>

        <div className="page-frame-body">
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
                    <a
                      key={slug}
                      className={`rcw-create-preset-link${active ? " active" : ""}`}
                      href={`/create?preset=${encodeURIComponent(slug)}`}
                    >
                      <span className="rcw-create-preset-name">{character.displayName}</span>
                      <span className="rcw-create-preset-meta">
                        {character.mode === "assistant" ? "Assistant" : "Companion"} · {character.avatarGender}
                      </span>
                    </a>
                  );
                })}
                <a
                  className={`rcw-create-preset-link${presetSlug === null ? " active" : ""}`}
                  href="/create"
                >
                  <span className="rcw-create-preset-name">Blank</span>
                  <span className="rcw-create-preset-meta">Start from scratch</span>
                </a>
              </div>
            </aside>
            <div className="site-card rcw-shell-card">
              <RoleCreateWizard
                createSurface="/create"
                defaultPresetSlug={presetSlug ?? undefined}
                defaultMode={presetDefinition?.mode}
                defaultGender={presetDefinition?.avatarGender}
                defaultName={presetDefinition?.displayName}
                audioOptions={Array.isArray(audioOptions) ? audioOptions : []}
                portraitAssets={resolvedPortraitAssets}
                currentPlanSlug={currentPlanSlug === "pro" ? "pro" : "free"}
                redirectAfterCreate="/app/chat"
                loginNext="/create"
                user={user ? { id: user.id } : null}
              />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
