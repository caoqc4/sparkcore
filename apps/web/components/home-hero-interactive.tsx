"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { HomeHeroForm } from "./home-hero-form";
import { HomeHeroPreview } from "./home-hero-preview";

export type CompanionGender = "female" | "male" | "neutral";
export type CompanionTone = "warm" | "playful" | "steady";

export interface CompanionDraft {
  gender: CompanionGender;
  name: string;
  tone: CompanionTone;
  traits: string[];
}

const DEFAULT_NAMES: Record<CompanionGender, string> = {
  female: "Caria",
  male: "Teven",
  neutral: "Nova",
};

// companion mode for all gender selections from the hero form;
// assistant is a separate creation path not surfaced here

interface HomeHeroInteractiveProps {
  user?: { id: string } | null;
}

const HERO_PRESETS: Array<{
  slug: CharacterSlug;
  label: string;
  desc: string;
}> = [
  { slug: "caria", label: "Caria", desc: "Warm preset" },
  { slug: "teven", label: "Teven", desc: "Steady preset" },
  { slug: "velia", label: "Velia", desc: "Assistant preset" },
];

export function HomeHeroInteractive({ user }: HomeHeroInteractiveProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CompanionDraft>({
    gender: "female",
    name: "Caria",
    tone: "warm",
    traits: [],
  });

  const handleChange = useCallback((partial: Partial<CompanionDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      if (partial.gender && partial.gender !== prev.gender) {
        const prevDefault = DEFAULT_NAMES[prev.gender];
        if (!prev.name || prev.name === prevDefault) {
          next.name = DEFAULT_NAMES[partial.gender];
        }
      }
      return next;
    });
  }, []);

  const handlePresetStart = useCallback((presetSlug: CharacterSlug | "blank") => {
    const createPath =
      presetSlug === "blank" ? "/app/create" : `/app/create?preset=${encodeURIComponent(presetSlug)}`;

    if (user) {
      router.push(createPath);
    } else {
      router.push(`/login?next=${encodeURIComponent(createPath)}`);
    }
  }, [router, user]);

  const handleSubmit = useCallback(() => {
    const createPath =
      draft.gender === "female"
        ? "/app/create?preset=caria"
        : draft.gender === "male"
          ? "/app/create?preset=teven"
          : "/app/create";
    if (user) {
      router.push(createPath);
    } else {
      router.push(`/login?next=${encodeURIComponent(createPath)}`);
    }
  }, [draft, user, router]);

  return (
    <>
      {/* Full-width header: badge + H1 + lead */}
      <div className="home-hero-header">
        <span className="home-hero-badge">SparkCore</span>
        <h1 className="home-hero-heading">
          Create a companion that remembers.
        </h1>
        <p className="home-hero-lead">
          Shape who they are before the first message.
          Keep the relationship alive in IM — return only when memory or privacy needs you.
        </p>
        <div className="home-hero-preset-row">
          {HERO_PRESETS.map((preset) => (
            <button
              key={preset.slug}
              type="button"
              className="home-hero-preset-chip"
              onClick={() => handlePresetStart(preset.slug)}
            >
              <span className="home-hero-preset-chip-name">
                {CHARACTER_MANIFEST[preset.slug].displayName}
              </span>
              <span className="home-hero-preset-chip-desc">{preset.desc}</span>
            </button>
          ))}
          <button
            type="button"
            className="home-hero-preset-chip home-hero-preset-chip-blank"
            onClick={() => handlePresetStart("blank")}
          >
            <span className="home-hero-preset-chip-name">Blank</span>
            <span className="home-hero-preset-chip-desc">Start from scratch</span>
          </button>
        </div>
      </div>

      {/* Left: interactive form */}
      <div className="home-hero-form-section">
        <HomeHeroForm draft={draft} onChange={handleChange} onSubmit={handleSubmit} />
      </div>

      {/* Right: reactive preview */}
      <HomeHeroPreview draft={draft} />
    </>
  );
}
