"use client";

import { useState, useEffect } from "react";
import { createProductRole } from "@/app/create/actions";
import { RoleVoiceTabs, type RoleVoiceGroup } from "@/components/role-voice-tabs";
import { CHARACTER_MANIFEST } from "@/lib/characters/manifest";
import type { AppLanguage } from "@/lib/i18n/site";
import { getProductCharacterPresetDefaults } from "@/lib/characters/preset-defaults";
import {
  filterAudioVoiceOptionsForRole,
  isEligibleForMode,
  pickRecommendedAudioVoiceOption,
  type AssetEligibleMode,
  type ProductAudioVoiceOptionRow
} from "@/lib/product/role-media";

// ── Character presets ────────────────────────────────────────────────────────

type StyleTab = "realistic" | "anime" | "illustrated";
type GenderKey = "female" | "male" | "neutral";
type IdentityType = "girlfriend" | "boyfriend" | "female-assistant" | "male-assistant";

const IDENTITY_OPTIONS: { value: IdentityType; label: string; desc: string; gender: "female" | "male"; mode: "companion" | "assistant" }[] = [
  { value: "girlfriend",       label: "Girlfriend",       desc: "Companion · Female", gender: "female", mode: "companion"  },
  { value: "boyfriend",        label: "Boyfriend",        desc: "Companion · Male",   gender: "male",   mode: "companion"  },
  { value: "female-assistant", label: "Female Assistant", desc: "Assistant · Female", gender: "female", mode: "assistant"  },
  { value: "male-assistant",   label: "Male Assistant",   desc: "Assistant · Male",   gender: "male",   mode: "assistant"  },
];

type PortraitAssetOption = {
  id: string;
  name: string;
  style: StyleTab;
  gender: GenderKey;
  storagePath: string | null;
  publicUrl: string | null;
  characterSlug: string | null;
  eligibleForMode: boolean;
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
    eligible_modes?: unknown;
    storage_path?: string | null;
    public_url?: string | null;
    metadata?: unknown;
  }>;
  currentPlanSlug?: "free" | "pro";
  defaultPresetSlug?: "caria" | "teven" | "velia";
  defaultMode?: "companion" | "assistant";
  defaultGender?: "female" | "male" | "neutral";
  defaultName?: string;
  defaultTone?: "warm" | "playful" | "steady";
  language?: AppLanguage;
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
  language = "en",
}: Props) {
  const isZh = language === "zh-CN";
  const defaultBoundaries = isZh
    ? "保持支持与尊重，避免操控或强迫行为。"
    : "Be supportive, respectful, and avoid manipulative or coercive behavior.";
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
  const [boundaries, setBoundaries] = useState(defaultBoundaries);
  const [backgroundSummary, setBackgroundSummary] = useState("");

  // Step 3 — Look
  const [photoIndex, setPhotoIndex] = useState(0);
  function buildPortraitOptionsForMode(nextMode: "companion" | "assistant") {
    return portraitAssets.map((asset) => {
      const style = Array.isArray(asset.style_tags)
        ? ((asset.style_tags.find(
            (item): item is StyleTab =>
              item === "realistic" || item === "anime" || item === "illustrated",
          ) ?? "realistic") as StyleTab)
        : ("realistic" as StyleTab);
      const genderValue = asset.gender_presentation;
      const resolvedGender: GenderKey =
        genderValue === "female" || genderValue === "male" || genderValue === "neutral"
          ? genderValue
          : "neutral";

      const meta =
        asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
          ? (asset.metadata as Record<string, unknown>)
          : null;
      const characterSlug = typeof meta?.character_slug === "string" ? meta.character_slug : null;

      return {
        id: asset.id,
        name: asset.display_name ?? (isZh ? "形象" : "Portrait"),
        style,
        gender: resolvedGender,
        storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
        publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
        characterSlug,
        eligibleForMode: isEligibleForMode(asset.eligible_modes, nextMode as AssetEligibleMode),
      } satisfies PortraitAssetOption;
    });
  }

  function resolvePresetPortraitIndex(args: {
    preset: "caria" | "teven" | "velia";
    nextMode: "companion" | "assistant";
    nextGender: GenderKey;
  }) {
    const matchingOptions = buildPortraitOptionsForMode(args.nextMode).filter(
      (p) => (p.gender === args.nextGender || p.gender === "neutral") && p.eligibleForMode,
    );
    const presetPortraitIndex = matchingOptions.findIndex(
      (p) => p.characterSlug === args.preset,
    );
    return presetPortraitIndex >= 0 ? presetPortraitIndex : 0;
  }
  const voiceOptions = filterAudioVoiceOptionsForRole({
    options: audioOptions,
    avatarGender: gender,
    tone,
    currentPlanSlug,
    roleMode: mode,
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

  // Read hero draft from sessionStorage on mount — pre-fill all fields and jump to step 3
  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("sparkcore_hero_draft") : null;
    if (!raw) return;
    try {
      sessionStorage.removeItem("sparkcore_hero_draft");
      const saved = JSON.parse(raw) as {
        presetSlug?: string | null;
        gender?: string;
        name?: string;
        tone?: string;
        traits?: string[];
        mode?: string;
      };
      const presetSlug =
        saved.presetSlug === "caria" || saved.presetSlug === "teven" || saved.presetSlug === "velia"
          ? saved.presetSlug
          : null;
      // Apply preset defaults (boundaries, backgroundSummary, relationshipMode)
      if (presetSlug) {
        const definition = CHARACTER_MANIFEST[presetSlug];
        const defaults = getProductCharacterPresetDefaults(presetSlug);
        setSelectedPresetSlug(presetSlug);
        setMode(definition.mode);
        setSelectedTraits(defaults?.traits ?? []);
        setRelationshipMode(defaults?.relationshipMode ?? "long-term companion");
        setBoundaries(defaults?.boundaries ?? defaultBoundaries);
        setBackgroundSummary(defaults?.backgroundSummary ?? "");
        // Auto-select portrait for this preset
        setPhotoIndex(
          resolvePresetPortraitIndex({
            preset: presetSlug,
            nextMode: definition.mode,
            nextGender: definition.avatarGender,
          }),
        );
      }
      // Override with what user specifically set in hero form
      if (saved.gender === "female" || saved.gender === "male" || saved.gender === "neutral") setGender(saved.gender);
      if (saved.name) setName(saved.name);
      if (saved.tone === "warm" || saved.tone === "playful" || saved.tone === "steady") setTone(saved.tone);
      if (saved.mode === "companion" || saved.mode === "assistant") setMode(saved.mode);
      if (Array.isArray(saved.traits) && saved.traits.length > 0) setSelectedTraits(saved.traits);
      // Jump directly to Step 3 (Look)
      setStep(2);
    } catch {
      // ignore malformed storage
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (defaultPresetSlug) {
      const definition = CHARACTER_MANIFEST[defaultPresetSlug];
      const defaults = getProductCharacterPresetDefaults(defaultPresetSlug);
      setSelectedPresetSlug(defaultPresetSlug);
      setMode(defaultMode ?? definition.mode);
      setGender(defaultGender ?? definition.avatarGender);
      setName(defaultName ?? definition.displayName);
      setTone(defaultTone ?? defaults?.tone ?? "warm");
      setSelectedTraits(defaults?.traits ?? []);
      setRelationshipMode(defaults?.relationshipMode ?? "long-term companion");
      setBoundaries(defaults?.boundaries ?? defaultBoundaries);
      setBackgroundSummary(defaults?.backgroundSummary ?? "");
      setPhotoIndex(
        resolvePresetPortraitIndex({
          preset: defaultPresetSlug,
          nextMode: defaultMode ?? definition.mode,
          nextGender: defaultGender ?? definition.avatarGender,
        }),
      );
      return;
    }

    setSelectedPresetSlug(null);
    if (defaultMode) {
      setMode(defaultMode);
    }
    if (defaultGender) {
      setGender(defaultGender);
    }
    if (defaultName) {
      setName(defaultName);
    }
    if (defaultTone) {
      setTone(defaultTone);
    }
    setSelectedTraits([]);
    setBackgroundSummary("");
    setPhotoIndex(0);
  }, [defaultPresetSlug, defaultMode, defaultGender, defaultName, defaultTone, portraitAssets]);

  function applyPreset(preset: "caria" | "teven" | "velia") {
    const definition = CHARACTER_MANIFEST[preset];
    const defaults = getProductCharacterPresetDefaults(preset);
    setSelectedPresetSlug(preset);
    setMode(definition.mode);
    setGender(definition.avatarGender);
    setName(definition.displayName);
    setTone(defaults?.tone ?? "warm");
    setSelectedTraits(defaults?.traits ?? []);
    setRelationshipMode(defaults?.relationshipMode ?? "long-term companion");
    setBoundaries(defaults?.boundaries ?? defaultBoundaries);
    setBackgroundSummary(defaults?.backgroundSummary ?? "");
    // Auto-select this preset's designated portrait
    setPhotoIndex(
      resolvePresetPortraitIndex({
        preset,
        nextMode: definition.mode,
        nextGender: definition.avatarGender,
      }),
    );
  }

  function applyBlankStart() {
    setSelectedPresetSlug(null);
    setSelectedTraits([]);
    setBackgroundSummary("");
  }

  // Filtered presets for step 3
  const portraitOptions: PortraitAssetOption[] = buildPortraitOptionsForMode(mode);
  const filteredPresets = portraitOptions.filter(
    (p) => (p.gender === gender || p.gender === "neutral") && p.eligibleForMode,
  );
  const totalPortraits = filteredPresets.length;
  const safeIndex = Math.min(photoIndex, totalPortraits - 1);
  const currentChar = filteredPresets[safeIndex] ?? null;

  function prevPortrait() {
    setPhotoIndex((i) => (i - 1 + totalPortraits) % totalPortraits);
  }

  function nextPortrait() {
    setPhotoIndex((i) => (i + 1) % totalPortraits);
  }

  // ── Step 1: Basics ────────────────────────────────────────────────────────

  function renderStep0() {
    const namePronoun = isZh ? (gender === "male" ? "他" : "她") : gender === "male" ? "him" : "her";
    const currentCaller = name.trim() || (isZh ? (gender === "male" ? "他" : "她") : (gender === "male" ? "he" : "she"));
    const identityOptions: typeof IDENTITY_OPTIONS = isZh
      ? [
          { value: "girlfriend", label: "AI 女友", desc: "伴侣型 · 女性", gender: "female", mode: "companion" },
          { value: "boyfriend", label: "AI 男友", desc: "伴侣型 · 男性", gender: "male", mode: "companion" },
          { value: "female-assistant", label: "女性助理", desc: "助手型 · 女性", gender: "female", mode: "assistant" },
          { value: "male-assistant", label: "男性助理", desc: "助手型 · 男性", gender: "male", mode: "assistant" },
        ]
      : IDENTITY_OPTIONS;

    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <h2 className="rcw-title">{isZh ? "这个角色是什么类型？" : "Who is this companion?"}</h2>
        </div>

        {/* Identity (gender + mode combined) — 2×2 grid, no emoji */}
        <div className="rcw-field">
          <label className="rcw-label">{isZh ? "身份类型" : "Identity"}</label>
          <div className="rcw-identity-grid">
            {identityOptions.map((opt) => {
              const active = gender === opt.gender && mode === opt.mode;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`rcw-identity-card${active ? " selected" : ""}`}
                  onClick={() => { setGender(opt.gender); setMode(opt.mode); }}
                >
                  <span className="rcw-tone-label">{opt.label}</span>
                  <span className="rcw-tone-desc">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-name">
            {isZh ? `给${namePronoun}起个名字` : `Give ${namePronoun} a name`}
          </label>
          <input
            id="rcw-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              gender === "male"
                ? isZh ? "例如：Teven" : "e.g. Teven"
                : mode === "assistant"
                  ? isZh ? "例如：Velia" : "e.g. Velia"
                  : isZh ? "例如：Caria" : "e.g. Caria"
            }
          />
        </div>

        {/* User preferred name */}
        <div className="rcw-field">
          <label className="rcw-label" htmlFor="rcw-user-name">
            {isZh ? `${currentCaller}该怎么称呼你？` : `What should ${currentCaller} call you?`}
          </label>
          <input
            id="rcw-user-name"
            className="input"
            value={userPreferredName}
            onChange={(e) => setUserPreferredName(e.target.value)}
            placeholder={isZh ? "你的名字或昵称…" : "Your name or nickname…"}
          />
        </div>

        <div className="rcw-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setStep(1)}
            disabled={!name.trim()}
          >
            {isZh ? "下一步" : "Next"} →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Personality ───────────────────────────────────────────────────

  function renderStep1() {
    const tones = [
      { id: "warm" as const, label: isZh ? "温柔" : "Warm", desc: isZh ? "更体贴，也更有陪在身边的感觉" : "Caring and emotionally present" },
      { id: "playful" as const, label: isZh ? "活泼" : "Playful", desc: isZh ? "更轻松，也更有互动感" : "Light-hearted and spontaneous" },
      { id: "steady" as const, label: isZh ? "沉稳" : "Steady", desc: isZh ? "更冷静，也更有稳定感" : "Calm and intellectually grounded" },
    ];

    // Trait tag groups — placeholder categories, more to be added
    const traitGroups = [
      {
        category: isZh ? "沟通方式" : "Communication",
        tags: isZh ? ["善于倾听", "会主动提问", "愿意表达感受", "直接坦率"] : ["Thoughtful listener", "Asks questions", "Shares feelings", "Direct"],
      },
      {
        category: isZh ? "相处氛围" : "Energy",
        tags: isZh ? ["平稳安心", "随性自然", "积极鼓励", "善于共情"] : ["Calm & steady", "Spontaneous", "Encouraging", "Reflective"],
      },
      {
        category: isZh ? "兴趣方向" : "Interests",
        tags: isZh ? ["阅读与思考", "艺术", "自然", "科技", "音乐", "旅行"] : ["Books & ideas", "Arts", "Nature", "Tech", "Music", "Travel"],
      },
    ];

    return (
      <div className="rcw-step">
        <div className="rcw-step-head">
          <h2 className="rcw-title">{isZh ? "定义这个角色的性格" : "Shape their character"}</h2>
        </div>

        {/* Tone */}
        <div className="rcw-field">
          <label className="rcw-label">{isZh ? "相处语气" : "Tone"}</label>
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
            {isZh ? "个性标签" : "Traits"}
            <span className="rcw-label-note">{isZh ? " · 选择你觉得合适的即可" : " — pick any that feel right"}</span>
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
            <span>{isZh ? "高级设置" : "Advanced"}</span>
            <span className={`rcw-advanced-chevron${advancedOpen ? " open" : ""}`}>⌄</span>
          </button>
          {advancedOpen ? (
            <div className="rcw-advanced-body">
              <div className="rcw-field">
                <label className="rcw-label" htmlFor="rcw-relationship-mode">{isZh ? "关系模式" : "Relationship mode"}</label>
                <input
                  id="rcw-relationship-mode"
                  className="input"
                  value={relationshipMode}
                  onChange={(e) => setRelationshipMode(e.target.value)}
                  placeholder={isZh ? "这个角色与你的关系定位…" : "How this role relates to the user…"}
                />
              </div>
              <div className="rcw-field">
                <label className="rcw-label" htmlFor="rcw-bounds">{isZh ? "边界" : "Boundaries"}</label>
                <textarea
                  id="rcw-bounds"
                  className="input"
                  rows={3}
                  value={boundaries}
                  onChange={(e) => setBoundaries(e.target.value)}
                />
              </div>
              <div className="rcw-field">
                <label className="rcw-label" htmlFor="rcw-background">{isZh ? "背景设定" : "Background"}</label>
                <textarea
                  id="rcw-background"
                  className="input"
                  rows={3}
                  value={backgroundSummary}
                  onChange={(e) => setBackgroundSummary(e.target.value)}
                  placeholder={isZh ? "补充一段可供模型参考的背景设定…" : "A short background the model can reference…"}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rcw-actions rcw-actions-row">
          <button type="button" className="button button-secondary" onClick={() => setStep(0)}>
            ← {isZh ? "上一步" : "Back"}
          </button>
          <button type="button" className="button button-primary" onClick={() => setStep(2)}>
            {isZh ? "下一步" : "Next"} →
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
          <h2 className="rcw-title">{isZh ? `选择${name || "TA"}的形象` : `Choose ${name || "their"} appearance`}</h2>
        </div>

        {/* Large portrait carousel */}
        <div className="rcw-carousel">
          <button
            type="button"
            className="rcw-carousel-arrow rcw-carousel-arrow-left"
            onClick={prevPortrait}
            aria-label={isZh ? "上一张" : "Previous"}
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
                  aria-label={isZh ? `形象 ${i + 1}` : `Portrait ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="rcw-carousel-arrow rcw-carousel-arrow-right"
            onClick={nextPortrait}
            aria-label={isZh ? "下一张" : "Next"}
          >
            ›
          </button>
        </div>

        {/* Portrait name */}
        {currentChar ? (
          <div className="rcw-portrait-info">
            <strong className="rcw-portrait-name">{currentChar.name}</strong>
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
                  <h3 className="role-subsection-title">{isZh ? "语音" : "Voice"}</h3>
                </div>
                <p className="role-field-hint">
                  {isZh
                    ? "我们会先根据语气和身份推荐一个语音，你也可以在创建前切换到其他可用语音。"
                    : "We preselect a recommended voice based on tone and identity. You can switch within your available options before creating."}
                </p>
                <RoleVoiceTabs
                  currentPlanSlug={currentPlanSlug}
                  groups={voiceGroups}
                  language={language}
                  selectedAssetId={recommendedVoice?.id ?? null}
                  upgradeHref="/app/settings#settings-subscription"
                />
              </div>
            ) : null}
            <div className="rcw-actions rcw-actions-row">
              <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
                ← {isZh ? "上一步" : "Back"}
              </button>
              <button type="submit" className="button button-primary rcw-create-btn">
                {isZh ? `创建${name}` : `Create ${name}`} →
              </button>
            </div>
          </form>
        ) : (
          <div className="rcw-actions rcw-actions-row">
            <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
                ← {isZh ? "上一步" : "Back"}
            </button>
            <a
              className="button button-primary"
              href={`/login?next=${encodeURIComponent(loginNext)}`}
            >
              {isZh ? "登录后创建" : "Sign in to create"}
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
