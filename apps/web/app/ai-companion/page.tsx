import { HomeHeroInteractive } from "@/components/home-hero-interactive";
import { HomePresetShowcase, type PresetShowcaseItem } from "@/components/home-preset-showcase";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getAiCompanionLandingCopy } from "@/lib/i18n/product-page-copy";
import { loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { buildLocalizedPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion With Long Memory and IM Continuity",
      "zh-CN": "拥有长期记忆与 IM 连续性的 AI 伴侣",
    },
    description: {
      en: "Lagun is an AI companion built around long-term memory and IM-native relationship continuity — with a visible memory control center so nothing is hidden.",
      "zh-CN": "Lagun 是围绕长期记忆和 IM 原生关系连续性构建的 AI 伴侣，并提供可见的记忆控制中心，让关键状态不再隐藏。",
    },
    path: "/ai-companion",
  });
}

type PageProps = {
  searchParams: Promise<{ preset?: string }>;
};

export default async function AiCompanionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getAiCompanionLandingCopy(contentLanguage);
  const user = await getOptionalUser();
  const supabase = await createClient();

  const initialPreset =
    params.preset === "caria" || params.preset === "teven" || params.preset === "sora-anime"
      ? (params.preset as CharacterSlug)
      : null;

  const { data: portraitAssets } = await loadSharedPresetPortraitAssets({ supabase });
  const presetPortraits: Partial<Record<CharacterSlug, string>> = {};
  for (const asset of portraitAssets ?? []) {
    const meta = asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
      ? (asset.metadata as Record<string, unknown>)
      : null;
    const slug = typeof meta?.character_slug === "string" ? meta.character_slug : null;
    if (slug === "caria" || slug === "teven" || slug === "sora-anime") {
      const publicUrl = resolveCharacterAssetPublicUrl({
        publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
        storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
        supabase
      });
      if (publicUrl) presetPortraits[slug as CharacterSlug] = publicUrl;
    }
  }

  const showcasePresets: PresetShowcaseItem[] = (["caria", "teven", "sora-anime"] as CharacterSlug[]).map((slug) => ({
    slug,
    name: CHARACTER_MANIFEST[slug].displayName,
    portraitUrl: presetPortraits[slug] ?? null,
    ...(copy.presets.meta[slug] ?? {
      type: copy.presets.fallbackType,
      tagline: "",
      emoji: "🌸",
    }),
  }));

  return (
    <SiteShell>
      {/* Section 1: Hero */}
      <section id="companion-hero" className="home-section">
        <div className="home-hero-grid">
          <HomeHeroInteractive
            user={user ? { id: user.id } : null}
            initialPreset={initialPreset}
            presetPortraits={presetPortraits}
            allowedIdentities={["girlfriend", "boyfriend"]}
            basePath="/ai-companion"
            heading={copy.hero.heading}
            lead={copy.hero.lead}
            language={contentLanguage}
          />
        </div>
      </section>

      {/* Section 2: Companion preset showcase */}
      <section className="home-feature-spotlight" id="companion-roles">
        <div className="home-section-heading">
          <p className="home-kicker">{copy.presets.kicker}</p>
          <h2>{copy.presets.title}</h2>
          <p>{copy.presets.body}</p>
        </div>
        <HomePresetShowcase
          presets={showcasePresets}
          heroId="companion-hero"
          basePath="/ai-companion"
          language={contentLanguage}
        />
      </section>

      {/* Section 3: Definitional — own the relationship-AI semantic space vs productivity AI */}
      <section className="home-feature-spotlight" id="companion-what-is">
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

      {/* Section 4: Relationship memory — what the companion carries forward */}
      <section className="home-feature-spotlight" id="companion-memory">
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
              payload={{ source: "ai_companion_memory_guide" }}
            >
              {copy.memory.guide}
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Section 5: IM continuity — daily presence, not an app to open */}
      <section className="home-feature-spotlight" id="companion-im">
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
              payload={{ source: "ai_companion_im_guide" }}
            >
              {copy.im.guide}
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Section 6: FAQ — targeting PAA */}
      <section className="home-feature-spotlight" id="companion-faq">
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
            payload={{ source: "ai_companion_faq_more" }}
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
            payload={{ source: "ai_companion_final_cta" }}
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
            href="/how-it-works"
            payload={{ source: "ai_companion_final_how" }}
          >
            {copy.cta.secondary}
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
