"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  const handleSubmit = useCallback(() => {
    const displayName = draft.name.trim() || DEFAULT_NAMES[draft.gender];
    const params = new URLSearchParams({
      gender: draft.gender,
      mode: "companion",
      name: displayName,
      tone: draft.tone,
    });
    if (draft.traits.length > 0) {
      params.set("traits", draft.traits.join(","));
    }
    const createPath = `/app/create?${params.toString()}`;
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
