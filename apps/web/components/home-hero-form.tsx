"use client";

import type { CompanionDraft, CompanionGender, CompanionTone } from "./home-hero-interactive";

const GENDER_OPTIONS: { value: CompanionGender; icon: string; label: string }[] = [
  { value: "female",  icon: "♀", label: "Female"  },
  { value: "male",    icon: "♂", label: "Male"    },
  { value: "neutral", icon: "◈", label: "Neutral" },
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

const NAME_PLACEHOLDERS: Record<CompanionGender, string> = {
  female:  "Caria",
  male:    "Teven",
  neutral: "Nova",
};

interface HomeHeroFormProps {
  draft: CompanionDraft;
  onChange: (partial: Partial<CompanionDraft>) => void;
  onSubmit: () => void;
}

function toggleTrait(current: string[], trait: string): string[] {
  return current.includes(trait)
    ? current.filter((t) => t !== trait)
    : [...current, trait];
}

export function HomeHeroForm({ draft, onChange, onSubmit }: HomeHeroFormProps) {
  const displayName = draft.name.trim() || "my companion";

  return (
    <div className="home-hero-wizard-preview">

      {/* Step 1: Gender */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-num">01</span>
          <span className="home-hero-wizard-step-label">Gender</span>
        </div>
        <div className="home-hero-gender-selector">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`home-hero-gender-btn${draft.gender === opt.value ? " active" : ""}`}
              onClick={() => onChange({ gender: opt.value })}
            >
              <span className="home-hero-gender-icon">{opt.icon}</span>
              <span className="home-hero-gender-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <span className="home-hero-wizard-step-line" aria-hidden="true" />

      {/* Step 2: Name */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-num">02</span>
          <span className="home-hero-wizard-step-label">Give them a name</span>
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

      {/* Step 3: Tone */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-num">03</span>
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

      <span className="home-hero-wizard-step-line" aria-hidden="true" />

      {/* Step 4: Traits */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-num">04</span>
          <span className="home-hero-wizard-step-label">
            Traits
            <span className="home-hero-step-note"> — pick any</span>
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

      <button
        type="button"
        className="button button-primary home-hero-cta"
        onClick={onSubmit}
      >
        Create {displayName} →
      </button>

      <p className="home-hero-wizard-hint">Takes 2 minutes · No setup friction</p>
    </div>
  );
}
