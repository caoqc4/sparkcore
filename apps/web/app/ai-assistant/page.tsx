import { HomeHeroInteractive } from "@/components/home-hero-interactive";
import { HomePresetShowcase, type PresetShowcaseItem } from "@/components/home-preset-showcase";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getAiAssistantLandingCopy } from "@/lib/i18n/product-page-copy";
import { loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { buildLocalizedPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "Personal AI Assistant with Memory & IM Access",
      "zh-CN": "带记忆的个人 AI 助手，会逐步学会你的工作方式",
    },
    description: {
      en: "Lagun is a personal AI assistant that remembers your working style, preferences, and context — not just your last request. Configurable personality and IM-native access.",
      "zh-CN": "Lagun 是一个会记住你的工作风格、偏好和上下文的个人 AI 助手，而不只记得你上一条请求。支持可配置人格和 IM 原生接入。",
    },
    keywords: ["ai assistant", "personal ai assistant", "ai assistant with memory", "im ai assistant"],
    path: "/ai-assistant",
  });
}

type PageProps = {
  searchParams: Promise<{ preset?: string }>;
};

export default async function AiAssistantPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getAiAssistantLandingCopy(contentLanguage);
  const user = await getOptionalUser();
  const supabase = await createClient();

  const initialPreset =
    params.preset === "velia" || params.preset === "fen" || params.preset === "sora-anime"
      ? (params.preset as CharacterSlug)
      : null;

  const { data: portraitAssets } = await loadSharedPresetPortraitAssets({ supabase });
  const presetPortraits: Partial<Record<CharacterSlug, string>> = {};
  for (const asset of portraitAssets ?? []) {
    const meta = asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
      ? (asset.metadata as Record<string, unknown>)
      : null;
    const slug = typeof meta?.character_slug === "string" ? meta.character_slug : null;
    if (slug === "velia" || slug === "fen" || slug === "sora-anime") {
      const publicUrl = resolveCharacterAssetPublicUrl({
        publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
        storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
        supabase
      });
      if (publicUrl) presetPortraits[slug as CharacterSlug] = publicUrl;
    }
  }

  const showcasePresets: PresetShowcaseItem[] = (["velia", "fen", "sora-anime"] as CharacterSlug[]).map((slug) => ({
    slug,
    name: CHARACTER_MANIFEST[slug].displayName,
    portraitUrl: presetPortraits[slug] ?? null,
    ...(copy.presets.meta[slug] ?? { type: copy.presets.fallbackType, tagline: "", emoji: "✦" }),
  }));

  return (
    <SiteShell>
      {/* Section 1: Hero — identity locked to assistant */}
      <section id="assistant-hero" className="home-section">
        <div className="home-hero-grid">
          <HomeHeroInteractive
            user={user ? { id: user.id } : null}
            initialPreset={initialPreset ?? "velia"}
            presetPortraits={presetPortraits}
            allowedIdentities={["female-assistant", "male-assistant"]}
            basePath="/ai-assistant"
            heading={copy.hero.heading}
            lead={copy.hero.lead}
            language={contentLanguage}
          />
        </div>
      </section>

      {/* Section 2: Assistant preset showcase */}
      <section className="home-feature-spotlight" id="assistant-presets">
        <div className="home-section-heading">
          <p className="home-kicker">{copy.presets.kicker}</p>
          <h2>{copy.presets.title}</h2>
          <p>{copy.presets.body}</p>
        </div>
        <HomePresetShowcase
          presets={showcasePresets}
          heroId="assistant-hero"
          basePath="/ai-assistant"
          language={contentLanguage}
        />
      </section>

      {/* Section 3: What is a personal AI assistant — differentiate from task bots */}
      <section className="home-feature-spotlight" id="assistant-what-is">
        <div className="home-section-heading">
          <p className="home-kicker">{copy.definition.kicker}</p>
          <h2>{copy.definition.title}</h2>
          <p>{copy.definition.body}</p>
        </div>
        <div className="site-card-grid">
          {copy.definition.cards.map((card) => (
            <article className="site-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Section 4: Memory — professional context and working patterns */}
      <section className="home-feature-spotlight" id="assistant-memory">
        <div className="home-section-heading">
          <p className="home-kicker">{copy.memory.kicker}</p>
          <h2>{copy.memory.title}</h2>
          <p>{copy.memory.body}</p>
        </div>
        <div className="home-feature-grid">
          <article className="home-feature-panel home-feature-panel-dark">
            <h3>{copy.memory.panelTitle}</h3>
            <ul className="site-bullet-list">
              {copy.memory.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/memory-center"
              payload={{ source: "ai_assistant_memory_guide" }}
            >
              {copy.memory.guide}
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Section 5: IM — utility and on-demand access, not presence */}
      <section className="home-feature-spotlight" id="assistant-im">
        <div className="home-section-heading">
          <p className="home-kicker">{copy.im.kicker}</p>
          <h2>{copy.im.title}</h2>
          <p>{copy.im.body}</p>
        </div>
        <div className="home-feature-grid home-feature-grid-reverse">
          <article className="home-feature-panel">
            <h3>{copy.im.panelTitle}</h3>
            <ul className="site-bullet-list">
              {copy.im.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/im-chat"
              payload={{ source: "ai_assistant_im_guide" }}
            >
              {copy.im.guide}
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Section 6: FAQ — personal assistant PAA questions */}
      <section className="home-feature-spotlight" id="assistant-faq">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: copy.faq.items.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          }}
        />
        <div className="home-section-heading">
          <p className="home-kicker">{copy.faq.kicker}</p>
          <h2>{copy.faq.title}</h2>
        </div>
        <div className="home-faq-grid">
          {copy.faq.items.map((item) => (
            <article className="site-card home-faq-card" key={item.q}>
              <h3 className="home-faq-question">{item.q}</h3>
              <p className="home-faq-answer">{item.a}</p>
            </article>
          ))}
        </div>
        <div className="toolbar" style={{ marginTop: "2rem" }}>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/faq"
            payload={{ source: "ai_assistant_faq_more" }}
          >
            {copy.faq.more}
          </TrackedLink>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="home-cta-band">
        <div>
          <p className="home-kicker">{copy.cta.kicker}</p>
          <h2>{copy.cta.title}</h2>
          <p>{copy.cta.body}</p>
        </div>
        <div className="home-cta-actions">
          <AdaptiveTrackedLink
            className="button button-primary home-cta-action"
            event="landing_cta_click"
            payload={{ source: "ai_assistant_final_cta" }}
            intent="create_companion"
            labels={{
              anonymous: copy.cta.primary,
              signed_in_empty: copy.cta.primary,
              signed_in_role_only: copy.cta.continueFlow,
              signed_in_connected: copy.cta.continueFlow,
            }}
          >
            {copy.cta.primary}
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary home-cta-action"
            event="landing_cta_click"
            href="/ai-companion"
            payload={{ source: "ai_assistant_final_companion" }}
          >
            {copy.cta.secondary}
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
