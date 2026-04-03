"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CharacterSlug } from "@/lib/characters/manifest";

export type PresetShowcaseItem = {
  slug: CharacterSlug;
  name: string;
  type: string;
  tagline: string;
  portraitUrl: string | null;
  emoji: string;
};

interface HomePresetShowcaseProps {
  presets: PresetShowcaseItem[];
}

export function HomePresetShowcase({ presets }: HomePresetShowcaseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePreset = searchParams.get("preset") as CharacterSlug | null;
  const [justSelected, setJustSelected] = useState<CharacterSlug | null>(null);

  function handleSelect(slug: CharacterSlug) {
    setJustSelected(slug);
    document.getElementById("home-hero")?.scrollIntoView({ behavior: "smooth" });
    router.push(`/?preset=${encodeURIComponent(slug)}`, { scroll: false });
  }

  return (
    <div className="home-role-showcase-grid">
      {presets.map((preset) => {
        const isSelected = activePreset === preset.slug || justSelected === preset.slug;
        return (
        <button
          key={preset.slug}
          type="button"
          className={`site-card home-role-showcase-card home-role-showcase-card-btn${isSelected ? " selected" : ""}`}
          onClick={() => handleSelect(preset.slug)}
        >
          <div className="home-role-showcase-portrait">
            {preset.portraitUrl ? (
              <img
                className="home-role-showcase-portrait-img"
                src={preset.portraitUrl}
                alt={preset.name}
              />
            ) : (
              <div className="img-placeholder img-placeholder-role" aria-hidden="true">
                <span className="img-placeholder-emoji">{preset.emoji}</span>
              </div>
            )}
          </div>
          <div className="home-role-showcase-meta">
            <span className="home-kicker">{preset.type}</span>
            <h3 className="home-role-showcase-name">{preset.name}</h3>
          </div>
          <p className="home-role-showcase-tagline">{preset.tagline}</p>
          <span className="home-role-showcase-cta">
            {isSelected ? "✓ Selected" : "Use this preset →"}
          </span>
        </button>
        );
      })}
    </div>
  );
}
