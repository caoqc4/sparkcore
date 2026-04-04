"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import type { AppLanguage } from "@/lib/i18n/site";
import { getProductCharacterPresetDefaults } from "@/lib/characters/preset-defaults";
import { HomeHeroForm } from "./home-hero-form";
import { HomeHeroPreview } from "./home-hero-preview";

export type CompanionGender = "female" | "male";
export type CompanionTone = "warm" | "playful" | "steady";
export type CompanionMode = "companion" | "assistant";
export type IdentityType = "girlfriend" | "boyfriend" | "female-assistant" | "male-assistant";

export interface CompanionDraft {
  gender: CompanionGender;
  name: string;
  tone: CompanionTone;
  traits: string[];
  presetSlug: CharacterSlug | null;
  mode: CompanionMode;
  identityChosen: boolean;
}

const DEFAULT_DRAFT: CompanionDraft = {
  gender: "female",
  name: "",
  tone: "warm",
  traits: [],
  presetSlug: null,
  mode: "companion",
  identityChosen: false,
};

const DEFAULT_NAMES: Record<CompanionGender, string> = {
  female: "Caria",
  male: "Teven",
};

const IDENTITY_GENDER_MODE: Record<IdentityType, { gender: CompanionGender; mode: CompanionMode }> = {
  "girlfriend":       { gender: "female", mode: "companion"  },
  "boyfriend":        { gender: "male",   mode: "companion"  },
  "female-assistant": { gender: "female", mode: "assistant"  },
  "male-assistant":   { gender: "male",   mode: "assistant"  },
};

const PRESET_TRAITS: Record<CharacterSlug, string[]> = {
  caria: ["Thoughtful listener", "Shares feelings", "Calm & steady", "Encouraging"],
  teven: ["Thoughtful listener", "Direct", "Calm & steady", "Reflective"],
  velia: ["Direct", "Asks questions", "Spontaneous"],
  lena: ["Playful", "Spontaneous", "Expressive", "Adventurous"],
  sora: ["Creative", "Calm & steady", "Thoughtful listener", "Artistic"],
  leon: ["Direct", "Analytical", "Calm & steady", "Problem-solving"],
  mira: ["Encouraging", "Organized", "Asks questions", "Research"],
  ryuu: ["Precise", "Direct", "Calm & steady", "Problem-solving"],
  fen: ["Thoughtful listener", "Encouraging", "Calm & steady", "Books & ideas"],
  "sora-anime": ["Creative", "Asks questions", "Calm & steady", "Arts"],
};

function resolvePresetModeAndGender(
  slug: CharacterSlug,
  allowedIdentities?: IdentityType[]
): { gender: CompanionGender; mode: CompanionMode } {
  const definition = CHARACTER_MANIFEST[slug];
  const gender: CompanionGender = definition.avatarGender === "male" ? "male" : "female";
  const mode: CompanionMode = definition.mode;

  if (!allowedIdentities || allowedIdentities.length === 0) {
    return { gender, mode };
  }

  // Check if the preset's natural identity (mode+gender combo) is in the allowed list
  const naturalIdentity = (Object.keys(IDENTITY_GENDER_MODE) as IdentityType[]).find(
    (id) => IDENTITY_GENDER_MODE[id].mode === mode && IDENTITY_GENDER_MODE[id].gender === gender
  );
  if (naturalIdentity && allowedIdentities.includes(naturalIdentity)) {
    return { gender, mode };
  }

  // Preset's mode isn't valid on this page — pick the best matching allowed identity.
  // Prefer same gender first, otherwise fall back to first allowed.
  const sameGender = allowedIdentities.find((id) => IDENTITY_GENDER_MODE[id].gender === gender);
  const resolved = sameGender ?? allowedIdentities[0];
  return IDENTITY_GENDER_MODE[resolved];
}

function buildDraftFromPreset(slug: CharacterSlug, allowedIdentities?: IdentityType[]): CompanionDraft {
  const definition = CHARACTER_MANIFEST[slug];
  const defaults = getProductCharacterPresetDefaults(slug);
  const { gender, mode } = resolvePresetModeAndGender(slug, allowedIdentities);
  return {
    gender,
    name: definition.displayName,
    tone: defaults?.tone ?? "warm",
    traits: PRESET_TRAITS[slug] ?? [],
    presetSlug: slug,
    mode,
    identityChosen: true,
  };
}

interface HomeHeroInteractiveProps {
  user?: { id: string } | null;
  initialPreset?: CharacterSlug | null;
  presetPortraits?: Partial<Record<CharacterSlug, string>>;
  allowedIdentities?: IdentityType[];
  basePath?: string;
  heading?: string;
  lead?: string;
  language?: AppLanguage;
}

export function HomeHeroInteractive({
  user,
  initialPreset,
  presetPortraits,
  allowedIdentities,
  basePath,
  heading,
  lead,
  language = "en",
}: HomeHeroInteractiveProps) {
  const isZh = language.toLowerCase().startsWith("zh");
  const router = useRouter();
  const prevPresetRef = useRef<CharacterSlug | null | undefined>(undefined);

  const [draft, setDraft] = useState<CompanionDraft>(() => {
    if (initialPreset) return buildDraftFromPreset(initialPreset, allowedIdentities);
    // Auto-select identity when only one option is allowed
    if (allowedIdentities?.length === 1) {
      const { gender, mode } = IDENTITY_GENDER_MODE[allowedIdentities[0]];
      return { ...DEFAULT_DRAFT, gender, mode, identityChosen: true };
    }
    return DEFAULT_DRAFT;
  });

  // Apply preset when URL param changes (from second-screen card click)
  useEffect(() => {
    if (initialPreset === prevPresetRef.current) return;
    prevPresetRef.current = initialPreset;
    if (initialPreset) {
      setDraft(buildDraftFromPreset(initialPreset, allowedIdentities));
      // Scroll hero into view (handles the case where user clicked from second screen)
      document.getElementById("home-hero")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [initialPreset, allowedIdentities]);

  const handleIdentityChange = useCallback((id: IdentityType) => {
    const { gender, mode } = IDENTITY_GENDER_MODE[id];
    setDraft((prev) => {
      const prevDefault = DEFAULT_NAMES[prev.gender];
      const nameUnchanged = !prev.name || prev.name === prevDefault;
      return {
        ...prev,
        gender,
        mode,
        name: nameUnchanged ? "" : prev.name,
        presetSlug: null,
        identityChosen: true,
      };
    });
  }, []);

  const handleChange = useCallback((partial: Partial<CompanionDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReset = useCallback(() => {
    if (allowedIdentities?.length === 1) {
      const { gender, mode } = IDENTITY_GENDER_MODE[allowedIdentities[0]];
      setDraft({ ...DEFAULT_DRAFT, gender, mode, identityChosen: true });
    } else {
      setDraft(DEFAULT_DRAFT);
    }
    router.replace(basePath ?? "/");
  }, [router, basePath, allowedIdentities]);

  const handleSubmit = useCallback(() => {
    const payload = {
      presetSlug: draft.presetSlug,
      gender: draft.gender,
      name: draft.name || DEFAULT_NAMES[draft.gender],
      tone: draft.tone,
      traits: draft.traits,
      mode: draft.mode,
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sparkcore_hero_draft", JSON.stringify(payload));
    }
    const createPath = "/app/create";
    if (user) {
      router.push(createPath);
    } else {
      router.push(`/login?next=${encodeURIComponent(createPath)}`);
    }
  }, [draft, user, router]);

  // Only show a real portrait photo when a preset is explicitly selected;
  // manual identity picks use the SVG silhouette instead
  const portraitUrl = draft.presetSlug
    ? presetPortraits?.[draft.presetSlug] ?? null
    : null;

  return (
    <>
      {/* Full-width header: badge + H1 + lead */}
      <div className="home-hero-header">
        <span className="home-hero-badge">Lagun</span>
        <h1 className="home-hero-heading">
          {heading ?? (isZh ? "创建一位会记住你的 AI 伴侣。" : "Create a companion that remembers.")}
        </h1>
        <p className="home-hero-lead">
          {lead ??
            (isZh
              ? "在第一条消息之前先定义好 TA 的身份与语气。之后 TA 会留在你的 IM 里，随时可聊，也会一直记得你。"
              : "Shape who they are before the first message. They'll live in your IM — always there, always remembering.")}
        </p>
      </div>

      {/* Left: interactive form */}
      <div className="home-hero-form-section">
        <HomeHeroForm
          draft={draft}
          onChange={handleChange}
          onIdentityChange={handleIdentityChange}
          onReset={handleReset}
          onSubmit={handleSubmit}
          allowedIdentities={allowedIdentities}
          language={language}
        />
      </div>

      {/* Right: reactive preview */}
      <HomeHeroPreview draft={draft} portraitUrl={portraitUrl} language={language} />
    </>
  );
}
