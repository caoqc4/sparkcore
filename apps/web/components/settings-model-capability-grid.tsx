"use client";

import { useMemo, useState } from "react";
import type {
  ProductModelCapabilitySettings,
  ProductModelOption
} from "@/lib/product/settings";

type SettingsModelCapabilityGridProps = {
  capabilityType: ProductModelCapabilitySettings["capabilityType"];
  options: ProductModelOption[];
  selectedSlug: string | null;
  subscriptionSectionId: string;
};


export function SettingsModelCapabilityGrid({
  capabilityType,
  options,
  selectedSlug,
  subscriptionSectionId
}: SettingsModelCapabilityGridProps) {
  const [upgradeOption, setUpgradeOption] = useState<ProductModelOption | null>(null);
  const [currentSelectedSlug, setCurrentSelectedSlug] = useState<string | null>(selectedSlug);

  const selectedOption = useMemo(
    () => options.find((item) => item.slug === currentSelectedSlug) ?? null,
    [options, currentSelectedSlug]
  );

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
                </div>
                <span className="settings-model-tier tier-pro">Pro</span>
                {option.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="settings-model-tag">{tag}</span>
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
              </div>
              {option.qualityTier !== "free" && (
                <span className="settings-model-tier tier-pro">Pro</span>
              )}
              {option.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="settings-model-tag">{tag}</span>
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
                Upgrade to use {upgradeOption.displayName}
              </h3>
              <button
                aria-label="Close"
                className="settings-upgrade-close"
                onClick={() => setUpgradeOption(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="settings-upgrade-copy">
              This model is available on the Pro plan.
            </p>
            <div className="settings-upgrade-actions">
              <button className="button button-primary" onClick={scrollToSubscription} type="button">
                View Pro plan
              </button>
              <button
                className="button button-secondary"
                onClick={() => setUpgradeOption(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
