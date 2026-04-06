import { RoleCreateWizard } from "@/components/role-create-wizard";
import { SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import { CHARACTER_MANIFEST } from "@/lib/characters/manifest";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import { loadActiveAudioAssets, loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { buildLocalizedPageMetadata } from "@/lib/site";
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

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Create Your Companion", "zh-CN": "创建你的伴侣" },
    description: {
      en: "Create a Lagun companion with a name, personality, and portrait. Set up IM channels after.",
      "zh-CN": "创建一个拥有名字、性格和头像的 Lagun 伴侣。IM 渠道连接会在之后完成。",
    },
    path: "/create",
    noIndex: true,
  });
}

type CreatePageProps = {
  searchParams: Promise<{
    preset?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const { contentLanguage } = await getSiteLanguageState();
  const isZh = contentLanguage === "zh-CN";
  const user = await getOptionalUser();
  const supabase = await createClient();
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
        public_url: resolveCharacterAssetPublicUrl({
          publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
          storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
          supabase
        })
      }))
    : [];

  return (
    <SiteShell>
      <section className="page-frame onboarding-frame">
        <div className="page-frame-header onboarding-frame-header">
          <div className="onboarding-copy">
            <p className="eyebrow">{isZh ? "创建角色" : "Create Companion"}</p>
            <h1 className="title">
              {isZh ? "先把角色关系建立起来，再去连接渠道。" : "Build the relationship before you think about channels."}
            </h1>
            <p className="lead">
              {isZh
                ? "只需三步：身份、性格、形象。IM 连接放在后面，不放在前面。"
                : "Three quick steps — identity, personality, and portrait. IM connection comes after, not first."}
            </p>
          </div>
        </div>

        <div className="page-frame-body">
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
                    <a
                      key={slug}
                      className={`rcw-create-preset-link${active ? " active" : ""}`}
                      href={`/create?preset=${encodeURIComponent(slug)}`}
                    >
                      <span className="rcw-create-preset-name">{character.displayName}</span>
                      <span className="rcw-create-preset-meta">
                        {character.mode === "assistant"
                          ? isZh ? "助手型" : "Assistant"
                          : isZh ? "伴侣型" : "Companion"} · {character.avatarGender}
                      </span>
                    </a>
                  );
                })}
                <a
                  className={`rcw-create-preset-link${presetSlug === null ? " active" : ""}`}
                  href="/create"
                >
                  <span className="rcw-create-preset-name">{isZh ? "空白开始" : "Blank"}</span>
                  <span className="rcw-create-preset-meta">{isZh ? "从头开始创建" : "Start from scratch"}</span>
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
                language={contentLanguage}
                user={user ? { id: user.id } : null}
              />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
