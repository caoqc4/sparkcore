"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
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
};

function buildDraftFromPreset(slug: CharacterSlug): CompanionDraft {
  const definition = CHARACTER_MANIFEST[slug];
  const defaults = getProductCharacterPresetDefaults(slug);
  return {
    gender: definition.avatarGender,
    name: definition.displayName,
    tone: defaults?.tone ?? "warm",
    traits: PRESET_TRAITS[slug] ?? [],
    presetSlug: slug,
    mode: definition.mode,
    identityChosen: true,
  };
}

interface HomeHeroInteractiveProps {
  user?: { id: string } | null;
  initialPreset?: CharacterSlug | null;
  presetPortraits?: Partial<Record<CharacterSlug, string>>;
}

export function HomeHeroInteractive({ user, initialPreset, presetPortraits }: HomeHeroInteractiveProps) {
  const router = useRouter();
  const prevPresetRef = useRef<CharacterSlug | null | undefined>(undefined);

  const [draft, setDraft] = useState<CompanionDraft>(() =>
    initialPreset ? buildDraftFromPreset(initialPreset) : DEFAULT_DRAFT
  );

  // Apply preset when URL param changes (from second-screen card click)
  useEffect(() => {
    if (initialPreset === prevPresetRef.current) return;
    prevPresetRef.current = initialPreset;
    if (initialPreset) {
      setDraft(buildDraftFromPreset(initialPreset));
      // Scroll hero into view (handles the case where user clicked from second screen)
      document.getElementById("home-hero")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [initialPreset]);

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
    setDraft(DEFAULT_DRAFT);
    router.replace("/");
  }, [router]);

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
        <span className="home-hero-badge">SparkCore</span>
        <h1 className="home-hero-heading">
          Create a companion that remembers.
        </h1>
        <p className="home-hero-lead">
          Shape who they are before the first message. They'll live in your IM — always there, always remembering.
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
        />
      </div>

      {/* Right: reactive preview */}
      <HomeHeroPreview draft={draft} portraitUrl={portraitUrl} />
    </>
  );
}
