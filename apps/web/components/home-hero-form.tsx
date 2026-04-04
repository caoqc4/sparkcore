"use client";

import type { AppLanguage } from "@/lib/i18n/site";
import type { CompanionDraft, CompanionTone, IdentityType } from "./home-hero-interactive";

const HOME_TRAIT_GROUPS = [
  {
    category: { en: "Communication", "zh-CN": "沟通方式" },
    tags: [
      { key: "Thoughtful listener", en: "Thoughtful listener", "zh-CN": "善于倾听" },
      { key: "Asks questions", en: "Asks questions", "zh-CN": "会主动提问" },
      { key: "Shares feelings", en: "Shares feelings", "zh-CN": "愿意表达感受" },
      { key: "Direct", en: "Direct", "zh-CN": "直接坦率" },
    ],
  },
  {
    category: { en: "Energy", "zh-CN": "相处氛围" },
    tags: [
      { key: "Calm & steady", en: "Calm & steady", "zh-CN": "平稳安心" },
      { key: "Spontaneous", en: "Spontaneous", "zh-CN": "随性自然" },
      { key: "Encouraging", en: "Encouraging", "zh-CN": "积极鼓励" },
      { key: "Reflective", en: "Reflective", "zh-CN": "善于共情" },
    ],
  },
  {
    category: { en: "Interests", "zh-CN": "兴趣方向" },
    tags: [
      { key: "Books & ideas", en: "Books & ideas", "zh-CN": "阅读与思考" },
      { key: "Arts", en: "Arts", "zh-CN": "艺术" },
      { key: "Nature", en: "Nature", "zh-CN": "自然" },
      { key: "Tech", en: "Tech", "zh-CN": "科技" },
      { key: "Music", en: "Music", "zh-CN": "音乐" },
      { key: "Travel", en: "Travel", "zh-CN": "旅行" },
    ],
  },
] as const;

interface HomeHeroFormProps {
  draft: CompanionDraft;
  onChange: (partial: Partial<CompanionDraft>) => void;
  onIdentityChange: (id: IdentityType) => void;
  onReset: () => void;
  onSubmit: () => void;
  allowedIdentities?: IdentityType[];
  language?: AppLanguage;
}

function toggleTrait(current: string[], trait: string): string[] {
  return current.includes(trait)
    ? current.filter((t) => t !== trait)
    : [...current, trait];
}

export function HomeHeroForm({
  draft,
  onChange,
  onIdentityChange,
  onReset,
  onSubmit,
  allowedIdentities,
  language = "en",
}: HomeHeroFormProps) {
  const isZh = language.toLowerCase().startsWith("zh");
  const identityOptions: { value: IdentityType; label: string; desc: string }[] = isZh
    ? [
        { value: "girlfriend", label: "AI 女友", desc: "伴侣型 · 女性" },
        { value: "boyfriend", label: "AI 男友", desc: "伴侣型 · 男性" },
        { value: "female-assistant", label: "女性助理", desc: "助手型 · 女性" },
        { value: "male-assistant", label: "男性助理", desc: "助手型 · 男性" },
      ]
    : [
        { value: "girlfriend", label: "Girlfriend", desc: "Companion · Female" },
        { value: "boyfriend", label: "Boyfriend", desc: "Companion · Male" },
        { value: "female-assistant", label: "Female Assistant", desc: "Assistant · Female" },
        { value: "male-assistant", label: "Male Assistant", desc: "Assistant · Male" },
      ];
  const toneOptions: { value: CompanionTone; label: string; desc: string }[] = isZh
    ? [
        { value: "warm", label: "温柔", desc: "更体贴，也更有陪在身边的感觉" },
        { value: "playful", label: "活泼", desc: "更轻松，也更有互动感" },
        { value: "steady", label: "沉稳", desc: "更冷静，也更有稳定感" },
      ]
    : [
        { value: "warm", label: "Warm", desc: "Caring and emotionally present" },
        { value: "playful", label: "Playful", desc: "Light-hearted and spontaneous" },
        { value: "steady", label: "Steady", desc: "Calm and intellectually grounded" },
      ];
  const namePlaceholders: Record<string, string> = {
    female: isZh ? "例如：Caria" : "e.g. Caria",
    male: isZh ? "例如：Teven" : "e.g. Teven",
  };
  const currentIdentity: IdentityType | null = !draft.identityChosen ? null
    : draft.mode === "assistant"
      ? draft.gender === "male" ? "male-assistant" : "female-assistant"
      : draft.gender === "male" ? "boyfriend" : "girlfriend";

  const displayNameCopy = draft.name.trim() || (isZh ? "你的伴侣" : "your companion");
  const nameLabel = isZh
    ? draft.gender === "male" ? "给他起个名字" : "给她起个名字"
    : draft.gender === "male" ? "Give him a name" : "Give her a name";
  const toneTagline = isZh
    ? draft.tone === "warm"
      ? "更体贴，也更有陪在身边的感觉"
      : draft.tone === "playful"
        ? "更轻松，也更有互动感"
        : "更冷静，也更有稳定感"
    : null;

  const visibleIdentities = allowedIdentities
    ? identityOptions.filter((opt) => allowedIdentities.includes(opt.value))
    : identityOptions;

  return (
    <div className="home-hero-wizard-preview">

      {/* Identity — hidden when only one option (auto-selected by parent) */}
      {visibleIdentities.length > 1 && (
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">{isZh ? "身份类型" : "Identity"}</span>
        </div>
        <div className="home-hero-identity-selector">
          {visibleIdentities.map((opt) => (
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
      )}

      <span className="home-hero-wizard-step-line" aria-hidden="true" />

      {/* Name */}
      <div className="home-hero-step-block">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">{nameLabel}</span>
        </div>
        <input
          type="text"
          className="home-hero-name-input"
          placeholder={namePlaceholders[draft.gender]}
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
          <span className="home-hero-wizard-step-label">{isZh ? "相处语气" : "Tone"}</span>
        </div>
        <div className="home-hero-personality-selector">
          {toneOptions.map((opt) => (
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
          {isZh ? `创建${displayNameCopy}` : `Create ${displayNameCopy}`} →
        </button>
        <button
          type="button"
          className="home-hero-reset"
          onClick={onReset}
        >
          {isZh ? "重置" : "Reset"}
        </button>
      </div>

      <p className="home-hero-wizard-hint">
        {isZh ? "约 2 分钟完成 · 无需复杂设置" : "Takes 2 minutes · No setup friction"}
      </p>

      {isZh ? (
        <p className="home-hero-wizard-hint">
          {`你正在创建的是一位${draft.mode === "assistant" ? "助手" : "伴侣"}，${toneTagline}。`}
        </p>
      ) : null}

      {/* Traits — optional, below the fold */}
      <div className="home-hero-traits-section">
        <div className="home-hero-step-header">
          <span className="home-hero-wizard-step-label">
            {isZh ? "个性标签" : "Traits"}
            <span className="home-hero-step-note">{isZh ? " · 可选" : " — optional"}</span>
          </span>
        </div>
        <div className="home-hero-trait-groups">
          {HOME_TRAIT_GROUPS.map((group) => (
            <div key={group.category.en} className="home-hero-trait-group">
              <span className="home-hero-trait-group-label">{group.category[language]}</span>
              <div className="home-hero-traits-selector">
                {group.tags.map((trait) => (
                  <button
                    key={trait.key}
                    type="button"
                    className={`home-hero-trait-btn${draft.traits.includes(trait.key) ? " active" : ""}`}
                    onClick={() => onChange({ traits: toggleTrait(draft.traits, trait.key) })}
                  >
                    {trait[language]}
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
