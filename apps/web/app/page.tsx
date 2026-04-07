import { redirect } from "next/navigation";
import { HomeHeroInteractive } from "@/components/home-hero-interactive";
import { HomePresetShowcase, type PresetShowcaseItem } from "@/components/home-preset-showcase";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import {
  HomePresetSlug,
  getHomeFaqItems,
  getHomeImConversationPreview,
  getHomeMemoryPreviewCards,
  getHomePresetShowcaseMeta,
} from "@/lib/i18n/home-page-copy";
import { getSiteChromeCopy, getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadSharedPresetPortraitAssets } from "@/lib/product/role-media";
import { buildLocalizedPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion with Long Memory & IM Continuity",
      "zh-CN": "会记住你、并在 IM 中持续陪着你的 AI 伴侣",
    },
    description: {
      en: "Meet your AI companion who actually remembers you. Long memory, IM-native relationship loop, and a web control center for memory, privacy, and channel settings.",
      "zh-CN": "认识一个真正会记住你的 AI 伴侣。长期记忆、IM 原生关系循环，以及用于记忆、隐私和渠道设置的网页控制中心。",
    },
    keywords: [
      "ai companion",
      "ai girlfriend",
      "ai boyfriend",
      "replika alternative",
      "character ai alternative",
      "ai with long memory",
      "im chat ai",
    ],
    path: "/",
  });
}

type HomePageProps = {
  searchParams: Promise<{
    preview?: string;
    preset?: string;
  }>;
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lagun",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  description:
    "Lagun is an IM-native AI companion with long memory, relationship continuity, and a web control center for memory, privacy, and channel management.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function isTransientNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const cause = error.cause;
  const causeCode =
    cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string"
      ? cause.code
      : null;

  return (
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    causeCode === "ECONNRESET"
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const { contentLanguage } = await getSiteLanguageState();
  const homeCopy = getSiteChromeCopy(contentLanguage).homepage;
  let user = null;
  try {
    user = await getOptionalUser();
  } catch (error) {
    if (!isTransientNetworkError(error)) {
      throw error;
    }
    console.warn("[home] optional user load degraded", error);
  }
  const supabase = await createClient();
  let overview = null;
  if (user) {
    try {
      overview = await loadDashboardOverview({ supabase, userId: user.id });
    } catch (error) {
      if (!isTransientNetworkError(error)) {
        throw error;
      }
      console.warn("[home] dashboard overview degraded", error);
    }
  }
  const hasConsoleReady = Boolean(overview?.currentRole && overview?.currentThread);
  const allowLandingPreview = params.preview === "landing";
  if (hasConsoleReady && !allowLandingPreview) {
    redirect("/app");
  }

  // Resolve initialPreset from URL
  const initialPreset =
    params.preset === "caria" || params.preset === "teven" || params.preset === "velia"
      ? (params.preset as HomePresetSlug)
      : null;

  // Load preset portrait assets for second screen and hero preview
  let portraitAssets: Awaited<ReturnType<typeof loadSharedPresetPortraitAssets>>["data"] = null;
  try {
    const result = await loadSharedPresetPortraitAssets({ supabase });
    portraitAssets = result.data;
  } catch (error) {
    if (!isTransientNetworkError(error)) {
      throw error;
    }
    console.warn("[home] preset portrait load degraded", error);
  }
  const presetPortraits: Partial<Record<CharacterSlug, string>> = {};
  for (const asset of portraitAssets ?? []) {
    const meta = asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
      ? (asset.metadata as Record<string, unknown>)
      : null;
    const slug = typeof meta?.character_slug === "string" ? meta.character_slug : null;
    if (slug === "caria" || slug === "teven" || slug === "velia") {
      const publicUrl = resolveCharacterAssetPublicUrl({
        publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
        storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
        supabase
      });
      if (publicUrl) presetPortraits[slug] = publicUrl;
    }
  }

  const presetMeta = getHomePresetShowcaseMeta(contentLanguage);
  const faqItems = getHomeFaqItems(contentLanguage);
  const memoryPreviewCards = getHomeMemoryPreviewCards(contentLanguage);
  const imConversationPreview = getHomeImConversationPreview(
    contentLanguage,
    homeCopy.previewRoles,
  );

  const showcasePresets: PresetShowcaseItem[] = (["caria", "teven", "velia"] as HomePresetSlug[]).map((slug) => ({
    slug,
    name: CHARACTER_MANIFEST[slug].displayName,
    portraitUrl: presetPortraits[slug] ?? null,
    ...presetMeta[slug],
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero Section */}
      <section id="home-hero" className="home-section">
        <div className="home-hero-grid">
          <HomeHeroInteractive
            user={user ? { id: user.id } : null}
            initialPreset={initialPreset}
            presetPortraits={presetPortraits}
            heading={homeCopy.heading}
            lead={homeCopy.lead}
            language={contentLanguage}
          />
        </div>
      </section>

      {/* Role Showcase Section */}
      <section className="home-feature-spotlight" id="home-roles">
        <div className="home-section-heading">
          <p className="home-kicker">{homeCopy.presetsKicker}</p>
          <h2>{homeCopy.presetsTitle}</h2>
          <p>{homeCopy.presetsBody}</p>
        </div>

        <HomePresetShowcase language={contentLanguage} presets={showcasePresets} />
      </section>

      {/* IM Chat Feature Section */}
      <section className="home-feature-spotlight" id="home-im-chat">
        <div className="home-section-heading">
          <p className="home-kicker">{homeCopy.imKicker}</p>
          <h2>{homeCopy.imTitle}</h2>
        </div>

        <div className="home-feature-grid home-feature-grid-reverse">
          <aside className="home-im-preview">
            {imConversationPreview.map((message) => (
              <article
                className={`home-im-bubble ${
                  message.variant === "assistant"
                    ? "home-im-bubble-assistant"
                    : message.variant === "system"
                      ? "home-im-bubble-system"
                      : "home-im-bubble-user"
                }`}
                key={`${message.role}-${message.body}`}
              >
                <span>{message.role}</span>
                <p>{message.body}</p>
              </article>
            ))}
          </aside>

          <article className="home-feature-panel">
            <h3>{homeCopy.imPanelTitle}</h3>
            <ul className="site-bullet-list">
              {homeCopy.imBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/im-chat"
              payload={{ source: "home_im_section_guide" }}
            >
              {homeCopy.imGuide}
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Memory Feature Section */}
      <section className="home-feature-spotlight" id="home-memory">
        <div className="home-section-heading">
          <p className="home-kicker">{homeCopy.memoryKicker}</p>
          <h2>{homeCopy.memoryTitle}</h2>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-panel home-feature-panel-dark">
            <h3>{homeCopy.memoryPanelTitle}</h3>
            <ul className="site-bullet-list">
              {homeCopy.memoryBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/memory-center"
              payload={{ source: "home_memory_section_guide" }}
            >
              {homeCopy.memoryGuide}
            </TrackedLink>
          </article>

          <aside className="home-memory-preview">
            {memoryPreviewCards.map((card) => (
              <article className="home-memory-preview-card" key={card.title}>
                <p className="home-discovery-label">{card.label}</p>
                <h3>{card.title}</h3>
              </article>
            ))}
          </aside>
        </div>
      </section>

      {/* FAQ / Trust Section */}
      <section className="home-feature-spotlight" id="home-faq">
        <div className="home-section-heading">
          <p className="home-kicker">{homeCopy.faqKicker}</p>
          <h2>{homeCopy.faqTitle}</h2>
          <p>{homeCopy.faqBody}</p>
        </div>

        <div className="home-faq-grid">
          {faqItems.map((item) => (
            <article className="site-card home-faq-card" key={item.q}>
              <h3 className="home-faq-question">{item.q}</h3>
              <p className="home-faq-answer">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta-band">
        <div>
          <p className="home-kicker">{homeCopy.readyKicker}</p>
          <h2>{homeCopy.ctaTitle}</h2>
          <p>{homeCopy.ctaBody}</p>
        </div>

        <div className="home-cta-actions">
          <TrackedLink
            className="button button-primary home-cta-action"
            event="landing_cta_click"
            href="/#home-hero"
            payload={{ source: "home_final_cta" }}
          >
            {homeCopy.createCompanion}
          </TrackedLink>
          <TrackedLink
            className="button button-secondary home-cta-action"
            event="landing_cta_click"
            href="/how-it-works"
            payload={{ source: "home_final_how" }}
          >
            {homeCopy.seeHowItWorks}
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
