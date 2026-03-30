"use client";

import { useState } from "react";

type VoiceAsset = {
  id: string;
  displayName: string;
  provider: string;
  modelSlug: string;
  styleTags: string[];
  genderPresentation: string | null;
  isDefault: boolean;
};

export type RoleVoiceGroup = {
  modelSlug: string;
  modelDisplayName: string;
  tier: "free" | "pro";
  assets: VoiceAsset[];
};

export function RoleVoiceTabs({
  groups,
  selectedAssetId,
}: {
  groups: RoleVoiceGroup[];
  selectedAssetId: string | null;
}) {
  const [activeTab, setActiveTab] = useState(
    () =>
      groups.find((g) => g.assets.some((a) => a.id === selectedAssetId))?.modelSlug ??
      groups[0]?.modelSlug ??
      ""
  );

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="role-voice-tabs">
      {/* Tab bar */}
      <div className="role-voice-tab-bar" role="tablist">
        {groups.map((group) => (
          <button
            key={group.modelSlug}
            type="button"
            role="tab"
            aria-selected={activeTab === group.modelSlug}
            className={`role-voice-tab${activeTab === group.modelSlug ? " active" : ""}`}
            onClick={() => setActiveTab(group.modelSlug)}
          >
            <span className="role-voice-tab-label">{group.modelDisplayName}</span>
            <span className={`role-voice-tab-tier tier-${group.tier}`}>
              {group.tier === "free" ? "Free" : "Pro"}
            </span>
          </button>
        ))}
      </div>

      {/* Tab panels — all rendered, inactive panels hidden so radios stay in the form */}
      {groups.map((group) => (
        <div
          key={group.modelSlug}
          role="tabpanel"
          className={`role-voice-tab-panel${activeTab === group.modelSlug ? "" : " hidden"}`}
        >
          <div className="role-voice-grid">
            {group.assets.map((asset) => (
              <label key={asset.id} className="role-voice-card">
                <input
                  type="radio"
                  name="audio_asset_id"
                  value={asset.id}
                  defaultChecked={asset.id === selectedAssetId}
                  className="role-voice-card-radio"
                />
                <div className="role-voice-card-check" aria-hidden="true">
                  <div className="role-voice-card-check-dot" />
                </div>
                <svg
                  className="role-voice-waveform"
                  viewBox="0 0 21 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="0" y="4" width="3" height="6" rx="1.5" fill="currentColor" />
                  <rect x="4.5" y="1" width="3" height="12" rx="1.5" fill="currentColor" />
                  <rect x="9" y="3" width="3" height="8" rx="1.5" fill="currentColor" />
                  <rect x="13.5" y="2" width="3" height="10" rx="1.5" fill="currentColor" />
                  <rect x="18" y="4.5" width="3" height="5" rx="1.5" fill="currentColor" />
                </svg>
                <span className="role-voice-card-name">{asset.displayName}</span>
                {asset.genderPresentation ? (
                  <span className={`role-voice-gender-tag gender-${asset.genderPresentation}`}>
                    {asset.genderPresentation === "female"
                      ? "♀ Female"
                      : asset.genderPresentation === "male"
                        ? "♂ Male"
                        : asset.genderPresentation}
                  </span>
                ) : null}
                {asset.styleTags.length > 0 ? (
                  <div className="role-voice-card-tags">
                    {asset.styleTags.map((tag) => (
                      <span key={tag} className="role-voice-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="role-voice-preview-btn"
                  disabled
                  aria-label="Preview voice"
                >
                  <svg
                    viewBox="0 0 10 12"
                    fill="currentColor"
                    aria-hidden="true"
                    width="7"
                    height="8"
                  >
                    <polygon points="0,0 10,6 0,12" />
                  </svg>
                  Preview
                </button>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
