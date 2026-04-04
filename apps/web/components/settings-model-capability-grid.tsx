"use client";

import { useMemo, useState } from "react";
import type { AppLanguage } from "@/lib/i18n/site";
import type {
  ProductModelCapabilitySettings,
  ProductModelOption
} from "@/lib/product/settings";

type SettingsModelCapabilityGridProps = {
  capabilityType: ProductModelCapabilitySettings["capabilityType"];
  options: ProductModelOption[];
  selectedSlug: string | null;
  subscriptionSectionId: string;
  language?: AppLanguage;
};


export function SettingsModelCapabilityGrid({
  capabilityType,
  options,
  selectedSlug,
  subscriptionSectionId,
  language = "en",
}: SettingsModelCapabilityGridProps) {
  const isZh = language.toLowerCase().startsWith("zh");
  const [upgradeOption, setUpgradeOption] = useState<ProductModelOption | null>(null);
  const [currentSelectedSlug, setCurrentSelectedSlug] = useState<string | null>(selectedSlug);

  const selectedOption = useMemo(
    () => options.find((item) => item.slug === currentSelectedSlug) ?? null,
    [options, currentSelectedSlug]
  );
  const tagLabelMap: Record<string, string> = isZh
    ? {
        Fast: "响应快",
        "Low cost": "成本低",
        "Natural companion": "对话更自然",
        Reasoning: "推理更强",
        Reliable: "更稳",
        "Balanced quality": "质量均衡",
        "Deep reasoning": "深度推理",
        "Premium quality": "高质量",
        "Chinese-friendly": "更适合中文",
        "Everyday use": "适合日常",
        "Portrait quality": "头像效果更好",
        Premium: "高级",
        "High quality": "质量更高",
        Photorealistic: "更写实",
        "Style control": "风格可控",
        Consistent: "风格稳定",
        "Text in image": "支持图片内文字",
        "Design-focused": "偏设计",
        "Brand visual": "适合品牌视觉",
        "Natural voice": "自然音色",
        Neural: "神经语音",
        "Human-like voice": "更像真人",
        "Expressive voice": "更有表现力",
        Multilingual: "多语言",
      }
    : {};
  const statusLabelMap: Record<string, string> = isZh
    ? {
        "Available now": "现已可用",
        "Official integration planned": "官方接入规划中",
      }
    : {};

  function scrollToSubscription() {
    const section = document.getElementById(subscriptionSectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setUpgradeOption(null);
  }

  return (
    <>
      <div className="settings-model-grid">
        {options.map((option) => {
          const isAvailable = option.availabilityStatus === "active";
          const isLocked = isAvailable && option.accessLevel === "upgrade_required";
          const isDisabled = !isAvailable;
          const isSelected = option.slug === selectedOption?.slug;

          if (isLocked) {
            return (
              <button
                key={option.slug}
                className="settings-model-card settings-model-card-button locked"
                onClick={() => setUpgradeOption(option)}
                type="button"
              >
                <div className="settings-model-card-check" aria-hidden="true">
                  <div className="settings-model-card-check-dot" />
                </div>
                <span className="settings-model-card-name">{option.displayName}</span>
                <div className="settings-model-card-meta">
                  <span className="settings-model-card-provider">{option.provider}</span>
                  {option.statusLabel ? (
                    <span className="settings-model-card-provider">
                      {statusLabelMap[option.statusLabel] ?? option.statusLabel}
                    </span>
                  ) : null}
                </div>
                <span className="settings-model-tier tier-pro">Pro</span>
                {option.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="settings-model-tag">{tagLabelMap[tag] ?? tag}</span>
                ))}
              </button>
            );
          }

          return (
            <label
              key={option.slug}
              className={`settings-model-card${isDisabled ? " disabled" : ""}${
                isSelected ? " selected" : ""
              }`}
            >
              <input
                checked={isSelected}
                className="settings-model-card-radio"
                disabled={isDisabled}
                name={`default_${capabilityType}_model_slug`}
                onChange={() => setCurrentSelectedSlug(option.slug)}
                type="radio"
                value={option.slug}
              />
              <div className="settings-model-card-check" aria-hidden="true">
                <div className="settings-model-card-check-dot" />
              </div>
              <span className="settings-model-card-name">{option.displayName}</span>
              <div className="settings-model-card-meta">
                <span className="settings-model-card-provider">{option.provider}</span>
                {option.statusLabel ? (
                  <span className="settings-model-card-provider">
                    {statusLabelMap[option.statusLabel] ?? option.statusLabel}
                  </span>
                ) : null}
              </div>
              {option.qualityTier !== "free" && (
                <span className="settings-model-tier tier-pro">Pro</span>
              )}
              {option.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="settings-model-tag">{tagLabelMap[tag] ?? tag}</span>
              ))}
            </label>
          );
        })}
      </div>

      {upgradeOption ? (
        <div
          aria-hidden="true"
          className="settings-upgrade-backdrop"
          onClick={() => setUpgradeOption(null)}
        >
          <div
            aria-labelledby="settings-upgrade-title"
            aria-modal="true"
            className="settings-upgrade-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="settings-upgrade-head">
              <h3 className="settings-upgrade-title" id="settings-upgrade-title">
                {isZh ? `升级后可使用 ${upgradeOption.displayName}` : `Upgrade to use ${upgradeOption.displayName}`}
              </h3>
              <button
                aria-label={isZh ? "关闭" : "Close"}
                className="settings-upgrade-close"
                onClick={() => setUpgradeOption(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="settings-upgrade-copy">
              {isZh ? "这个模型仅在 Pro 方案中可用。" : "This model is available on the Pro plan."}
            </p>
            <div className="settings-upgrade-actions">
              <button className="button button-primary" onClick={scrollToSubscription} type="button">
                {isZh ? "查看 Pro 方案" : "View Pro plan"}
              </button>
              <button
                className="button button-secondary"
                onClick={() => setUpgradeOption(null)}
                type="button"
              >
                {isZh ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
