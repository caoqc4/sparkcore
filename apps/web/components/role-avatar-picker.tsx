"use client";

import { useRef, useState } from "react";

const AVATAR_PRESETS = [
  { id: "violet", bg: "linear-gradient(135deg, hsl(268 52% 60%), hsl(280 60% 72%))" },
  { id: "rose",   bg: "linear-gradient(135deg, hsl(340 72% 60%), hsl(350 80% 72%))" },
  { id: "amber",  bg: "linear-gradient(135deg, hsl(35 85% 56%), hsl(42 90% 64%))" },
  { id: "teal",   bg: "linear-gradient(135deg, hsl(174 62% 42%), hsl(183 70% 56%))" },
  { id: "blue",   bg: "linear-gradient(135deg, hsl(210 80% 52%), hsl(220 88% 65%))" },
  { id: "slate",  bg: "linear-gradient(135deg, hsl(220 18% 46%), hsl(230 22% 58%))" },
];

type Props = {
  initial: string;
};

export function RoleAvatarPicker({ initial }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState(AVATAR_PRESETS[0].id);
  const [letter, setLetter] = useState(initial.slice(0, 1).toUpperCase());

  const selectedPreset = AVATAR_PRESETS.find((p) => p.id === preset) ?? AVATAR_PRESETS[0];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  }

  function handleClear() {
    setPhotoUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Keep letter in sync if name field changes — listen via form input
  function handleLetterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    if (val.length > 0) setLetter(val[0].toUpperCase());
  }

  return (
    <div className="role-avatar-picker">
      {/* Preview */}
      <div className="role-avatar-preview-wrap">
        {photoUrl ? (
          <img className="role-avatar-preview-photo" src={photoUrl} alt="Role avatar" />
        ) : (
          <div
            className="role-avatar-preview-letter"
            style={{ background: selectedPreset.bg }}
          >
            {letter}
          </div>
        )}
        <div className="role-avatar-preview-actions">
          <button
            type="button"
            className="role-avatar-upload-btn"
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl ? "Change photo" : "Upload photo"}
          </button>
          {photoUrl ? (
            <button type="button" className="role-avatar-clear-btn" onClick={handleClear}>
              Remove
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="role-avatar-file-input"
          onChange={handleFile}
          name="avatar_file"
          aria-label="Upload avatar photo"
        />
      </div>

      {/* Color presets — only shown when no photo */}
      {!photoUrl ? (
        <div className="role-avatar-presets" role="radiogroup" aria-label="Avatar color">
          {AVATAR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`role-avatar-preset-dot${preset === p.id ? " selected" : ""}`}
              style={{ background: p.bg }}
              aria-label={p.id}
              aria-checked={preset === p.id}
              onClick={() => setPreset(p.id)}
            />
          ))}
        </div>
      ) : null}

      {/* Hidden fields for server action */}
      <input type="hidden" name="avatar_preset" value={photoUrl ? "" : preset} />
    </div>
  );
}
