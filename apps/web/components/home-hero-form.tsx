"use client";

import type { CompanionDraft, CompanionTone, IdentityType } from "./home-hero-interactive";

const IDENTITY_OPTIONS: { value: IdentityType; label: string; desc: string }[] = [
  { value: "girlfriend",       label: "Girlfriend",        desc: "Companion · Female" },
  { value: "boyfriend",        label: "Boyfriend",         desc: "Companion · Male"   },
  { value: "female-assistant", label: "Female Assistant",  desc: "Assistant · Female" },
  { value: "male-assistant",   label: "Male Assistant",    desc: "Assistant · Male"   },
];

const TONE_OPTIONS: { value: CompanionTone; label: string; desc: string }[] = [
  { value: "warm",    label: "Warm",    desc: "Caring and emotionally present"    },
  { value: "playful", label: "Playful", desc: "Light-hearted and spontaneous"     },
  { value: "steady",  label: "Steady",  desc: "Calm and intellectually grounded" },
];

const TRAIT_GROUPS: { category: string; tags: string[] }[] = [
  {
    category: "Communication",
    tags: ["Thoughtful listener", "Asks questions", "Shares feelings", "Direct"],
  },
  {
    category: "Energy",
    tags: ["Calm & steady", "Spontaneous", "Encouraging", "Reflective"],
  },
  {
    category: "Interests",
    tags: ["Books & ideas", "Arts", "Nature", "Tech", "Music", "Travel"],
  },
];

const NAME_PLACEHOLDERS: Record<string, string> = {
  female:  "e.g. Caria",
  male:    "e.g. Teven",
};

interface HomeHeroFormProps {
  draft: CompanionDraft;
  onChange: (partial: Partial<CompanionDraft>) => void;
  onIdentityChange: (id: IdentityType) => void;
  onReset: () => void;
  onSubmit: () => void;
}

function toggleTrait(current: string[], trait: string): string[] {
  return current.includes(trait)
    ? current.filter((t) => t !== trait)
    : [...current, trait];
}

export function HomeHeroForm({ draft, onChange, onIdentityChange, onReset, onSubmit }: HomeHeroFormProps) {
  const displayName = draft.name.trim() || "your companion";
  const currentIdentity: IdentityType | null = !draft.identityChosen ? null
    : draft.mode === "assistant"
      ? draft.gender === "male" ? "male-assistant" : "female-assistant"
      : draft.gender === "male" ? "boyfriend" : "girlfriend";

  const nameLabel = draft.gender === "male" ? "Give him a name" : "Give her a name";

  return (
    <div className="home-hero-wizard-preview">

      {/* Identity */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">Identity</span>
        </div>
        <div className="home-hero-identity-selector">
          {IDENTITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`home-hero-identity-btn${currentIdentity === opt.value ? " active" : ""}`}
              onClick={() => onIdentityChange(opt.value)}
            >
              <span className="home-hero-identity-label">{opt.label}</span>
              <span className="home-hero-identity-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <span className="home-hero-wizard-step-line" aria-hidden="true" />

      {/* Name */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">{nameLabel}</span>
        </div>
        <input
          type="text"
          className="home-hero-name-input"
          placeholder={NAME_PLACEHOLDERS[draft.gender]}
          value={draft.name}
          maxLength={20}
          autoComplete="off"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <span className="home-hero-wizard-step-line" aria-hidden="true" />

      {/* Tone */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">Tone</span>
        </div>
        <div className="home-hero-personality-selector">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`home-hero-personality-btn${draft.tone === opt.value ? " active" : ""}`}
              onClick={() => onChange({ tone: opt.value })}
            >
              <span className="home-hero-personality-label">{opt.label}</span>
              <span className="home-hero-personality-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary CTA — visible without scrolling */}
      <div className="home-hero-cta-row">
        <button
          type="button"
          className="button button-primary home-hero-cta"
          onClick={onSubmit}
        >
          Create {displayName} →
        </button>
        <button
          type="button"
          className="home-hero-reset"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <p className="home-hero-wizard-hint">Takes 2 minutes · No setup friction</p>

      {/* Traits — optional, below the fold */}
      <div className="home-hero-traits-section">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">
            Traits
            <span className="home-hero-step-note"> — optional</span>
          </span>
        </div>
        <div className="home-hero-trait-groups">
          {TRAIT_GROUPS.map((group) => (
            <div key={group.category} className="home-hero-trait-group">
              <span className="home-hero-trait-group-label">{group.category}</span>
              <div className="home-hero-traits-selector">
                {group.tags.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    className={`home-hero-trait-btn${draft.traits.includes(trait) ? " active" : ""}`}
                    onClick={() => onChange({ traits: toggleTrait(draft.traits, trait) })}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
