import Link from "next/link";
import { RoleCreateWizard } from "@/components/role-create-wizard";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { CHARACTER_MANIFEST } from "@/lib/characters/manifest";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import { loadActiveAudioAssets, loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { createClient } from "@/lib/supabase/server";

const CREATE_PRESET_SLUGS = ["caria", "teven", "velia"] as const;
type CreatePresetSlug = (typeof CREATE_PRESET_SLUGS)[number];

function isCreatePresetSlug(value: string | undefined): value is CreatePresetSlug {
  return (
    value === "caria" ||
    value === "teven" ||
    value === "velia"
  );
}

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
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  const presetSlug = isCreatePresetSlug(params.preset) ? params.preset : null;
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
          {isZh ? "取消" : "Cancel"}
        </Link>
      }
      currentHref="/app/create"
      description={isZh ? "用三步完成伴侣设置。" : "Set up your companion in three steps."}
      eyebrow={isZh ? "新角色" : "New Role"}
      title={isZh ? "创建新角色" : "Create a new role"}
    >
      {params.error ? (
        <div className="notice notice-error">{params.error}</div>
      ) : null}
      <div className="rcw-create-layout">
        <aside className="site-card rcw-create-presets">
          <div className="rcw-create-presets-head">
            <span className="rcw-kicker">{isZh ? "预设" : "Presets"}</span>
            <h2 className="rcw-title">{isZh ? "选择一个起点" : "Choose a starting point"}</h2>
          </div>
          <div className="rcw-create-presets-list">
            {CREATE_PRESET_SLUGS.map((slug) => {
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
                    {character.mode === "assistant"
                      ? isZh ? "助手型" : "Assistant"
                      : isZh ? "伴侣型" : "Companion"} · {character.avatarGender}
                  </span>
                </Link>
              );
            })}
            <Link
              className={`rcw-create-preset-link${presetSlug === null ? " active" : ""}`}
              href="/app/create"
            >
              <span className="rcw-create-preset-name">{isZh ? "空白开始" : "Blank"}</span>
              <span className="rcw-create-preset-meta">{isZh ? "从头开始创建" : "Start from scratch"}</span>
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
            language={effectiveSystemLanguage}
            redirectAfterCreate="/app/role"
            user={user ? { id: user.id } : null}
          />
        </div>
      </div>
    </ProductConsoleShell>
  );
}
