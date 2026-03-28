"use client";

import { TrackedLink } from "@/components/tracked-link";

interface HomeHeroFormProps {
  user?: { id: string } | null;
}

const wizardSteps = [
  {
    num: "01",
    label: "Gender & name",
    desc: "Set the companion's identity foundation",
  },
  {
    num: "02",
    label: "Tone & traits",
    desc: "Define personality, style, and boundaries",
  },
  {
    num: "03",
    label: "Choose portrait",
    desc: "Pick a face that fits the character",
  },
] as const;

export function HomeHeroForm({ user }: HomeHeroFormProps) {
  const ctaHref = user
    ? "/app/create"
    : `/login?next=${encodeURIComponent("/app/create")}`;
  const ctaLabel = user ? "Create my companion" : "Sign in & create";

  return (
    <div className="home-hero-wizard-preview">
      <div className="home-hero-wizard-steps">
        {wizardSteps.map((step, i) => (
          <div key={step.num} className="home-hero-wizard-step">
            <div className="home-hero-wizard-step-track">
              <span className="home-hero-wizard-step-num">{step.num}</span>
              {i < wizardSteps.length - 1 ? (
                <span className="home-hero-wizard-step-line" aria-hidden="true" />
              ) : null}
            </div>
            <div className="home-hero-wizard-step-text">
              <span className="home-hero-wizard-step-label">{step.label}</span>
              <span className="home-hero-wizard-step-desc">{step.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <TrackedLink
        href={ctaHref}
        className="button button-primary home-hero-cta"
        event="landing_cta_click"
        payload={{ source: "home_hero_create" }}
      >
        {ctaLabel}
      </TrackedLink>

      <p className="home-hero-wizard-hint">
        Takes 2 minutes · No setup friction
      </p>
    </div>
  );
}
