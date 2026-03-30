"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  currentPlanSlug,
  upgradeHref,
}: {
  groups: RoleVoiceGroup[];
  selectedAssetId: string | null;
  currentPlanSlug: "free" | "pro";
  upgradeHref: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(
    () =>
      groups.find((g) => g.assets.some((a) => a.id === selectedAssetId))?.modelSlug ??
      groups[0]?.modelSlug ??
      ""
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [previewingAssetId, setPreviewingAssetId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [upgradeGroupLabel, setUpgradeGroupLabel] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  async function handlePreview(asset: VoiceAsset) {
    if (asset.provider !== "Azure" && asset.provider !== "ElevenLabs") {
      return;
    }

    if (previewingAssetId === asset.id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPreviewingAssetId(null);
      return;
    }

    setPreviewError(null);
    setPreviewingAssetId(asset.id);

    try {
      const response = await fetch("/api/audio/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioAssetId: asset.id,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Preview failed.");
      }

      const blob = await response.blob();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => {
          setPreviewingAssetId(null);
        });
      }

      audioRef.current.src = objectUrl;
      await audioRef.current.play();
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Preview failed.");
      setPreviewingAssetId(null);
    }
  }

  if (groups.length === 0) {
    return null;
  }

  function handleUpgradeView() {
    setUpgradeGroupLabel(null);
    router.push(upgradeHref);
  }

  return (
    <>
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
            {group.assets.map((asset) => {
              const isLocked = currentPlanSlug !== "pro" && group.tier === "pro";

              return (
              <label
                key={asset.id}
                className={`role-voice-card${isLocked ? " locked" : ""}`}
                onClick={(event) => {
                  const target = event.target;
                  if (
                    isLocked &&
                    target instanceof Element &&
                    !target.closest(".role-voice-preview-btn")
                  ) {
                    event.preventDefault();
                    setUpgradeGroupLabel(group.modelDisplayName);
                  }
                }}
              >
                <input
                  type="radio"
                  name="audio_asset_id"
                  value={asset.id}
                  defaultChecked={asset.id === selectedAssetId}
                  className="role-voice-card-radio"
                  disabled={isLocked}
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
                        : "◈ Neutral"}
                  </span>
                ) : null}
                {isLocked ? <span className="role-voice-lock-badge">Pro</span> : null}
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
                  disabled={asset.provider !== "Azure" && asset.provider !== "ElevenLabs"}
                  aria-label="Preview voice"
                  onClick={(event) => {
                    event.preventDefault();
                    void handlePreview(asset);
                  }}
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
                  {previewingAssetId === asset.id ? "Stop" : "Preview"}
                </button>
              </label>
            )})}
          </div>
        </div>
      ))}
      {previewError ? <p className="role-field-hint">{previewError}</p> : null}
      </div>

      {upgradeGroupLabel ? (
        <div
          aria-hidden="true"
          className="settings-upgrade-backdrop"
          onClick={() => setUpgradeGroupLabel(null)}
        >
          <div
            aria-labelledby="role-audio-upgrade-title"
            aria-modal="true"
            className="settings-upgrade-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="settings-upgrade-head">
              <h3 className="settings-upgrade-title" id="role-audio-upgrade-title">
                Upgrade to use {upgradeGroupLabel} voices
              </h3>
              <button
                aria-label="Close"
                className="settings-upgrade-close"
                onClick={() => setUpgradeGroupLabel(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="settings-upgrade-copy">
              These voices are available on the Pro plan.
            </p>
            <div className="settings-upgrade-actions">
              <button className="button button-primary" onClick={handleUpgradeView} type="button">
                View Pro plan
              </button>
              <button
                className="button button-secondary"
                onClick={() => setUpgradeGroupLabel(null)}
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
