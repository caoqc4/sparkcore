"use client";

import { useRef, useState } from "react";
import { createProductRole } from "@/app/create/actions";

// ── Character presets ────────────────────────────────────────────────────────

type StyleTab = "realistic" | "anime" | "illustrated";
type GenderKey = "female" | "male" | "neutral";

type PresetCharacter = {
  id: string;
  name: string;
  descriptor: string;
  style: StyleTab;
  gender: GenderKey;
  gradient: string;
};

const PRESETS: PresetCharacter[] = [
  { id: "aurora",  name: "Aurora",  descriptor: "Warm & thoughtful",      style: "realistic",   gender: "female",  gradient: "linear-gradient(170deg, hsl(340 55% 68%), hsl(20 75% 72%))" },
  { id: "luna",    name: "Luna",    descriptor: "Gentle & introspective", style: "realistic",   gender: "female",  gradient: "linear-gradient(170deg, hsl(220 52% 62%), hsl(260 58% 70%))" },
  { id: "sage",    name: "Sage",    descriptor: "Calm & grounded",        style: "realistic",   gender: "female",  gradient: "linear-gradient(170deg, hsl(160 42% 52%), hsl(190 52% 62%))" },
  { id: "ember",   name: "Ember",   descriptor: "Energetic & bold",       style: "realistic",   gender: "female",  gradient: "linear-gradient(170deg, hsl(25 78% 58%), hsl(340 68% 66%))" },
  { id: "atlas",   name: "Atlas",   descriptor: "Strong & dependable",    style: "realistic",   gender: "male",    gradient: "linear-gradient(170deg, hsl(210 48% 48%), hsl(230 52% 60%))" },
  { id: "river",   name: "River",   descriptor: "Easy-going & open",      style: "realistic",   gender: "male",    gradient: "linear-gradient(170deg, hsl(175 48% 44%), hsl(200 52% 56%))" },
  { id: "orion",   name: "Orion",   descriptor: "Intellectual & patient", style: "realistic",   gender: "male",    gradient: "linear-gradient(170deg, hsl(250 42% 54%), hsl(270 48% 63%))" },
  { id: "hana",    name: "Hana",    descriptor: "Bright & expressive",    style: "anime",       gender: "female",  gradient: "linear-gradient(170deg, hsl(320 62% 68%), hsl(350 68% 78%))" },
  { id: "yuki",    name: "Yuki",    descriptor: "Cool & mysterious",      style: "anime",       gender: "female",  gradient: "linear-gradient(170deg, hsl(200 58% 65%), hsl(230 62% 73%))" },
  { id: "akari",   name: "Akari",   descriptor: "Sweet & energetic",      style: "anime",       gender: "female",  gradient: "linear-gradient(170deg, hsl(35 78% 65%), hsl(15 72% 72%))" },
  { id: "kaito",   name: "Kaito",   descriptor: "Protective & earnest",   style: "anime",       gender: "male",    gradient: "linear-gradient(170deg, hsl(205 58% 50%), hsl(220 62% 60%))" },
  { id: "ren",     name: "Ren",     descriptor: "Reserved & sincere",     style: "anime",       gender: "male",    gradient: "linear-gradient(170deg, hsl(240 48% 52%), hsl(260 52% 63%))" },
  { id: "nova",    name: "Nova",    descriptor: "Curious & adaptive",     style: "illustrated", gender: "neutral", gradient: "linear-gradient(170deg, hsl(268 52% 58%), hsl(290 58% 70%))" },
  { id: "echo",    name: "Echo",    descriptor: "Empathetic & calm",      style: "illustrated", gender: "neutral", gradient: "linear-gradient(170deg, hsl(180 48% 48%), hsl(210 52% 60%))" },
];

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = ["Basics", "Personality", "Look"] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="rcw-step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rcw-step-dot${i === current ? " active" : i < current ? " done" : ""}`}
        />
      ))}
      <span className="rcw-step-label">Step {current + 1} of {total}</span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  user: { id: string } | null;
  loginNext: string;
  redirectAfterCreate?: string;
  defaultMode?: "companion" | "girlfriend" | "boyfriend";
};

// ── Wizard ────────────────────────────────────────────────────────────────────

export function RoleCreateWizard({
  user,
  loginNext,
  redirectAfterCreate,
  defaultMode = "companion",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 — Basics
  const [gender, setGender] = useState<GenderKey>(
    defaultMode === "boyfriend" ? "male" : "female",
  );
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState(
    defaultMode === "girlfriend" ? "Luna" : defaultMode === "boyfriend" ? "Atlas" : "Nova",
  );

  // Step 2 — Personality
  const [tone, setTone] = useState<"warm" | "playful" | "steady">("warm");
  const [relationshipMode, setRelationshipMode] = useState(
    defaultMode === "girlfriend"
      ? "long-term girlfriend"
      : defaultMode === "boyfriend"
        ? "long-term boyfriend"
        : "long-term companion",
  );
  const [boundaries, setBoundaries] = useState(
    "Be supportive, respectful, and avoid manipulative or coercive behavior.",
  );

  // Step 3 — Look
  const [styleTab, setStyleTab] = useState<StyleTab>("realistic");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [useUpload, setUseUpload] = useState(false);

  // Filtered presets for step 3
  const filteredPresets = PRESETS.filter(
    (p) => p.style === styleTab && (p.gender === gender || p.gender === "neutral"),
  );
  const totalPortraits = filteredPresets.length;
  const safeIndex = Math.min(photoIndex, totalPortraits - 1);
  const currentChar = filteredPresets[safeIndex] ?? null;

  function handleStyleChange(s: StyleTab) {
    setStyleTab(s);
    setPhotoIndex(0);
  }

  function prevPortrait() {
    setPhotoIndex((i) => (i - 1 + totalPortraits) % totalPortraits);
    setUseUpload(false);
  }

  function nextPortrait() {
    setPhotoIndex((i) => (i + 1) % totalPortraits);
    setUseUpload(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setUseUpload(true);
  }

  // ── Step 1: Basics ────────────────────────────────────────────────────────

  function renderStep0() {
    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <p className="rcw-kicker">Step 1 — Basics</p>
          <h2 className="rcw-title">Who is this companion?</h2>
        </div>

        {/* Gender selection */}
        <div className="rcw-field">
          <label className="rcw-label">Gender</label>
          <div className="rcw-gender-cards">
            {(["female", "male", "neutral"] as GenderKey[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`rcw-gender-card${gender === g ? " selected" : ""}`}
                onClick={() => setGender(g)}
              >
                <span className="rcw-gender-icon">
                  {g === "female" ? "♀" : g === "male" ? "♂" : "◈"}
                </span>
                <span className="rcw-gender-label">
                  {g === "female" ? "Female" : g === "male" ? "Male" : "Neutral"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-mode">Mode</label>
          <select
            id="rcw-mode"
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="companion">Companion</option>
            <option value="girlfriend">Girlfriend</option>
            <option value="boyfriend">Boyfriend</option>
          </select>
        </div>

        {/* Name */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-name">Name</label>
          <input
            id="rcw-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Give them a name…"
          />
        </div>

        <div className="rcw-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setStep(1)}
            disabled={!name.trim()}
          >
            Next — Personality →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Personality ───────────────────────────────────────────────────

  function renderStep1() {
    const tones = [
      { id: "warm" as const,    label: "Warm",    desc: "Caring and emotionally present" },
      { id: "playful" as const, label: "Playful", desc: "Light-hearted and spontaneous" },
      { id: "steady" as const,  label: "Steady",  desc: "Calm and intellectually grounded" },
    ];

    // Trait tag groups — placeholder categories, more to be added
    const traitGroups = [
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

    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <p className="rcw-kicker">Step 2 — Personality</p>
          <h2 className="rcw-title">Shape their character</h2>
        </div>

        {/* Tone */}
        <div className="rcw-field">
          <label className="rcw-label">Tone</label>
          <div className="rcw-tone-cards">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`rcw-tone-card${tone === t.id ? " selected" : ""}`}
                onClick={() => setTone(t.id)}
              >
                <span className="rcw-tone-label">{t.label}</span>
                <span className="rcw-tone-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trait tags */}
        <div className="rcw-field">
          <label className="rcw-label">
            Traits
            <span className="rcw-label-note"> — pick any that feel right</span>
          </label>
          <div className="rcw-trait-groups">
            {traitGroups.map((group) => (
              <div key={group.category} className="rcw-trait-group">
                <span className="rcw-trait-group-label">{group.category}</span>
                <div className="rcw-trait-tags">
                  {group.tags.map((tag) => (
                    <span key={tag} className="rcw-trait-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship mode */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-rel">Relationship style</label>
          <input
            id="rcw-rel"
            className="input"
            value={relationshipMode}
            onChange={(e) => setRelationshipMode(e.target.value)}
          />
        </div>

        {/* Boundaries */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-bounds">Boundaries</label>
          <textarea
            id="rcw-bounds"
            className="input"
            rows={3}
            value={boundaries}
            onChange={(e) => setBoundaries(e.target.value)}
          />
        </div>

        <div className="rcw-actions rcw-actions-row">
          <button type="button" className="button button-secondary" onClick={() => setStep(0)}>
            ← Back
          </button>
          <button type="button" className="button button-primary" onClick={() => setStep(2)}>
            Next — Choose look →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Look ──────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <p className="rcw-kicker">Step 3 — Look</p>
          <h2 className="rcw-title">Choose {name}'s appearance</h2>
        </div>

        {/* Style tabs */}
        <div className="rcw-style-tabs">
          {(["realistic", "anime", "illustrated"] as StyleTab[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`rcw-style-tab${styleTab === s ? " active" : ""}`}
              onClick={() => handleStyleChange(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Large portrait carousel */}
        <div className="rcw-carousel">
          <button
            type="button"
            className="rcw-carousel-arrow rcw-carousel-arrow-left"
            onClick={prevPortrait}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="rcw-portrait-wrap">
            {useUpload && uploadUrl ? (
              <img className="rcw-portrait" src={uploadUrl} alt="Your upload" />
            ) : currentChar ? (
              <div className="rcw-portrait rcw-portrait-placeholder" style={{ background: currentChar.gradient }}>
                <span className="rcw-portrait-initial">{currentChar.name[0]}</span>
                <span className="rcw-portrait-placeholder-label">Photo coming soon</span>
              </div>
            ) : null}

            {/* Dots */}
            <div className="rcw-carousel-dots">
              {filteredPresets.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`rcw-carousel-dot${i === safeIndex && !useUpload ? " active" : ""}`}
                  onClick={() => { setPhotoIndex(i); setUseUpload(false); }}
                  aria-label={`Portrait ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="rcw-carousel-arrow rcw-carousel-arrow-right"
            onClick={nextPortrait}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        {/* Portrait name + descriptor */}
        {!useUpload && currentChar ? (
          <div className="rcw-portrait-info">
            <strong className="rcw-portrait-name">{currentChar.name}</strong>
            <span className="rcw-portrait-desc">{currentChar.descriptor}</span>
          </div>
        ) : (
          <div className="rcw-portrait-info">
            <strong className="rcw-portrait-name">Custom</strong>
            <span className="rcw-portrait-desc">Your own image</span>
          </div>
        )}

        {/* Upload option */}
        <button
          type="button"
          className="rcw-upload-link"
          onClick={() => fileRef.current?.click()}
        >
          {useUpload ? "Change uploaded photo" : "Or upload your own photo ↑"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="rcw-file-input"
          onChange={handleFile}
        />

        {/* Final submit form with all accumulated state */}
        {user ? (
          <form action={createProductRole} className="rcw-submit-form">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="tone" value={tone} />
            <input type="hidden" name="relationship_mode" value={relationshipMode} />
            <input type="hidden" name="boundaries" value={boundaries} />
            <input type="hidden" name="avatar_preset" value={useUpload ? "" : (currentChar?.id ?? "")} />
            <input type="hidden" name="avatar_gender" value={gender} />
            {redirectAfterCreate ? (
              <input type="hidden" name="redirect_after" value={redirectAfterCreate} />
            ) : null}
            <div className="rcw-actions rcw-actions-row">
              <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="submit" className="button button-primary rcw-create-btn">
                Create {name} →
              </button>
            </div>
          </form>
        ) : (
          <div className="rcw-actions rcw-actions-row">
            <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <a
              className="button button-primary"
              href={`/login?next=${encodeURIComponent(loginNext)}`}
            >
              Sign in to create
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rcw-root">
      <StepIndicator current={step} total={STEPS.length} />
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
}
