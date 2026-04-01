"use client";

import { useState } from "react";
import { createProductRole } from "@/app/create/actions";
import { RoleVoiceTabs, type RoleVoiceGroup } from "@/components/role-voice-tabs";
import { CHARACTER_MANIFEST } from "@/lib/characters/manifest";
import { getProductCharacterPresetDefaults } from "@/lib/characters/preset-defaults";
import {
  filterAudioVoiceOptionsForRole,
  pickRecommendedAudioVoiceOption,
  type ProductAudioVoiceOptionRow
} from "@/lib/product/role-media";

// ── Character presets ────────────────────────────────────────────────────────

type StyleTab = "realistic" | "anime" | "illustrated";
type GenderKey = "female" | "male" | "neutral";

type PortraitAssetOption = {
  id: string;
  name: string;
  style: StyleTab;
  gender: GenderKey;
  storagePath: string | null;
  publicUrl: string | null;
};

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
  createSurface?: "/create" | "/app/create";
  redirectAfterCreate?: string;
  audioOptions?: ProductAudioVoiceOptionRow[];
  portraitAssets?: Array<{
    id: string;
    display_name: string | null;
    gender_presentation: string | null;
    style_tags: unknown;
    storage_path?: string | null;
    public_url?: string | null;
  }>;
  currentPlanSlug?: "free" | "pro";
  defaultPresetSlug?: "caria" | "teven" | "velia";
  defaultMode?: "companion" | "assistant";
  defaultGender?: "female" | "male" | "neutral";
  defaultName?: string;
  defaultTone?: "warm" | "playful" | "steady";
};

// ── Wizard ────────────────────────────────────────────────────────────────────

export function RoleCreateWizard({
  user,
  loginNext,
  createSurface = "/create",
  redirectAfterCreate,
  audioOptions = [],
  portraitAssets = [],
  currentPlanSlug = "free",
  defaultPresetSlug,
  defaultMode = "companion",
  defaultGender,
  defaultName,
  defaultTone,
}: Props) {
  // Step state
  const [step, setStep] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedPresetSlug, setSelectedPresetSlug] = useState<
    "caria" | "teven" | "velia" | null
  >(defaultPresetSlug ?? null);

  // Step 1 — Basics
  const [gender, setGender] = useState<GenderKey>(defaultGender ?? "female");
  const [mode, setMode] = useState<"companion" | "assistant">(defaultMode);
  const [name, setName] = useState(
    defaultName ??
      (defaultGender === "male" ? "Teven" : defaultMode === "assistant" ? "Velia" : "Caria"),
  );
  const [userPreferredName, setUserPreferredName] = useState("");

  // Step 2 — Personality
  const [tone, setTone] = useState<"warm" | "playful" | "steady">(defaultTone ?? "warm");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [relationshipMode, setRelationshipMode] = useState(
    defaultMode === "assistant"
      ? "task-focused assistant"
      : defaultGender === "male"
        ? "long-term boyfriend"
        : "long-term girlfriend",
  );
  const [boundaries, setBoundaries] = useState(
    "Be supportive, respectful, and avoid manipulative or coercive behavior.",
  );
  const [backgroundSummary, setBackgroundSummary] = useState("");

  // Step 3 — Look
  const [styleTab, setStyleTab] = useState<StyleTab>("realistic");
  const [photoIndex, setPhotoIndex] = useState(0);
  const voiceOptions = filterAudioVoiceOptionsForRole({
    options: audioOptions,
    avatarGender: gender,
    tone,
    currentPlanSlug,
  });
  const recommendedVoice = pickRecommendedAudioVoiceOption({
    options: voiceOptions,
    avatarGender: gender,
    tone,
  });
  const voiceGroups: RoleVoiceGroup[] = [];
  for (const option of voiceOptions) {
    const groupKey = option.model_slug;
    const existing = voiceGroups.find((group) => group.modelSlug === groupKey);
    const asset = {
      id: option.id,
      displayName: option.display_name,
      provider: option.provider,
      modelSlug: option.model_slug,
      styleTags: Array.isArray(option.style_tags)
        ? option.style_tags.filter((item): item is string => typeof item === "string")
        : [],
      genderPresentation: option.gender_presentation,
      isDefault: option.is_default,
    };

    if (existing) {
      existing.assets.push(asset);
    } else {
      voiceGroups.push({
        modelSlug: groupKey,
        modelDisplayName: option.provider,
        tier: option.tier === "pro" ? "pro" : "free",
        assets: [asset],
      });
    }
  }

  function applyPreset(preset: "caria" | "teven" | "velia") {
    const definition = CHARACTER_MANIFEST[preset];
    const defaults = getProductCharacterPresetDefaults(preset);
    setSelectedPresetSlug(preset);
    setMode(definition.mode);
    setGender(definition.avatarGender);
    setName(definition.displayName);
    setTone(defaults?.tone ?? "warm");
    setRelationshipMode(defaults?.relationshipMode ?? "long-term companion");
    setBoundaries(
      defaults?.boundaries ??
        "Be supportive, respectful, and avoid manipulative or coercive behavior."
    );
    setBackgroundSummary(defaults?.backgroundSummary ?? "");
  }

  function applyBlankStart() {
    setSelectedPresetSlug(null);
    setBackgroundSummary("");
  }

  // Filtered presets for step 3
  const portraitOptions: PortraitAssetOption[] = portraitAssets
    .map((asset) => {
      const style = Array.isArray(asset.style_tags)
        ? (asset.style_tags.find(
            (item): item is StyleTab =>
              item === "realistic" || item === "anime" || item === "illustrated"
          ) ?? null)
        : null;
      const genderValue = asset.gender_presentation;
      const resolvedGender: GenderKey =
        genderValue === "female" || genderValue === "male" || genderValue === "neutral"
          ? genderValue
          : "neutral";

      if (!style) {
        return null;
      }

      return {
        id: asset.id,
        name: asset.display_name ?? "Portrait",
        style,
        gender: resolvedGender,
        storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
        publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
      };
    })
    .filter((asset): asset is PortraitAssetOption => asset !== null);
  const filteredPresets = portraitOptions.filter(
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
  }

  function nextPortrait() {
    setPhotoIndex((i) => (i + 1) % totalPortraits);
  }

  // ── Step 1: Basics ────────────────────────────────────────────────────────

  function renderStep0() {
    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <p className="rcw-kicker">Step 1 — Basics</p>
          <h2 className="rcw-title">Who is this companion?</h2>
        </div>

        <div className="rcw-field">
          <label className="rcw-label">Starting point</label>
          <div className="rcw-preset-grid">
            {([
              { id: "caria", label: "Caria", desc: "Warm romantic preset", emoji: "🌸" },
              { id: "teven", label: "Teven", desc: "Steady romantic preset", emoji: "🌿" },
              { id: "velia", label: "Velia", desc: "Playful assistant preset", emoji: "✦" },
            ] as const).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`rcw-preset-card${selectedPresetSlug === preset.id ? " selected" : ""}`}
                onClick={() => applyPreset(preset.id)}
              >
                <span className="rcw-preset-emoji" aria-hidden="true">{preset.emoji}</span>
                <span className="rcw-preset-copy">
                  <span className="rcw-tone-label">{preset.label}</span>
                  <span className="rcw-tone-desc">{preset.desc}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`rcw-preset-card${selectedPresetSlug === null ? " selected" : ""}`}
              onClick={applyBlankStart}
            >
              <span className="rcw-preset-emoji" aria-hidden="true">+</span>
              <span className="rcw-preset-copy">
                <span className="rcw-tone-label">Blank</span>
                <span className="rcw-tone-desc">Start from scratch</span>
              </span>
            </button>
          </div>
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
            <option value="assistant">Assistant</option>
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

        {/* User preferred name */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-user-name">
            What should {name.trim() || "they"} call you?
          </label>
          <input
            id="rcw-user-name"
            className="input"
            value={userPreferredName}
            onChange={(e) => setUserPreferredName(e.target.value)}
            placeholder="Your name or nickname…"
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

        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-relationship-mode">Relationship mode</label>
          <input
            id="rcw-relationship-mode"
            className="input"
            value={relationshipMode}
            onChange={(e) => setRelationshipMode(e.target.value)}
            placeholder="How this role relates to the user…"
          />
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
                    <button
                      key={tag}
                      type="button"
                      className={`rcw-trait-tag${selectedTraits.includes(tag) ? " selected" : ""}`}
                      onClick={() => setSelectedTraits((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rcw-advanced">
          <button
            type="button"
            className="rcw-advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            <span>Advanced</span>
            <span className={`rcw-advanced-chevron${advancedOpen ? " open" : ""}`}>⌄</span>
          </button>
          {advancedOpen ? (
            <div className="rcw-advanced-body">
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

              <div className="rcw-field">
                <label className="rcw-label" htmlFor="rcw-background">Background</label>
                <textarea
                  id="rcw-background"
                  className="input"
                  rows={3}
                  value={backgroundSummary}
                  onChange={(e) => setBackgroundSummary(e.target.value)}
                  placeholder="A short background readers and the model can both understand…"
                />
              </div>
            </div>
          ) : null}
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
            {currentChar ? (
              currentChar.publicUrl ? (
                <img className="rcw-portrait" src={currentChar.publicUrl} alt={currentChar.name} />
              ) : (
                <div className="rcw-portrait rcw-portrait-placeholder">
                  <span className="rcw-portrait-initial">{currentChar.name[0]}</span>
                  <span className="rcw-portrait-placeholder-label">{currentChar.name}</span>
                </div>
              )
            ) : null}

            {/* Dots */}
            <div className="rcw-carousel-dots">
              {filteredPresets.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`rcw-carousel-dot${i === safeIndex ? " active" : ""}`}
                  onClick={() => { setPhotoIndex(i); }}
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
        {currentChar ? (
          <div className="rcw-portrait-info">
            <strong className="rcw-portrait-name">{currentChar.name}</strong>
            <span className="rcw-portrait-desc">{currentChar.style}</span>
          </div>
        ) : null}

        {/* Final submit form with all accumulated state */}
        {user ? (
          <form action={createProductRole} className="rcw-submit-form">
            <input type="hidden" name="create_surface" value={createSurface} />
            <input type="hidden" name="preset_slug" value={selectedPresetSlug ?? ""} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="user_preferred_name" value={userPreferredName} />
            <input type="hidden" name="tone" value={tone} />
            <input type="hidden" name="relationship_mode" value={relationshipMode} />
            <input type="hidden" name="boundaries" value={boundaries} />
            <input type="hidden" name="background_summary" value={backgroundSummary} />
            <input type="hidden" name="traits" value={selectedTraits.join(",")} />
            <input type="hidden" name="avatar_preset" value="" />
            <input type="hidden" name="portrait_asset_id" value={currentChar?.id ?? ""} />
            <input type="hidden" name="avatar_gender" value={gender} />
            {recommendedVoice ? (
              <input type="hidden" name="recommended_audio_asset_id" value={recommendedVoice.id} />
            ) : null}
            {redirectAfterCreate ? (
              <input type="hidden" name="redirect_after" value={redirectAfterCreate} />
            ) : null}
            {voiceGroups.length > 0 ? (
              <div className="role-subsection">
                <div className="role-subsection-head">
                  <h3 className="role-subsection-title">Voice</h3>
                </div>
                <p className="role-field-hint">
                  We preselect a recommended voice based on tone and identity. You can switch
                  within your available options before creating.
                </p>
                <RoleVoiceTabs
                  currentPlanSlug={currentPlanSlug}
                  groups={voiceGroups}
                  selectedAssetId={recommendedVoice?.id ?? null}
                  upgradeHref="/app/settings#settings-subscription"
                />
              </div>
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
