"use client";

import { useRef, useState } from "react";

type StyleTab = "realistic" | "anime" | "illustrated";
type GenderFilter = "female" | "male" | "neutral";

type PresetCharacter = {
  id: string;
  name: string;
  descriptor: string;
  style: StyleTab;
  gender: GenderFilter;
  // gradient used as placeholder until real images are loaded
  gradient: string;
  accentColor: string;
};

const PRESET_CHARACTERS: PresetCharacter[] = [
  // Realistic / Female
  { id: "aurora",  name: "Aurora",  descriptor: "Warm & thoughtful",    style: "realistic",   gender: "female",  gradient: "linear-gradient(160deg, hsl(340 60% 72%), hsl(20 80% 78%))",   accentColor: "hsl(340 60% 60%)" },
  { id: "luna",    name: "Luna",    descriptor: "Gentle & introspective", style: "realistic",   gender: "female",  gradient: "linear-gradient(160deg, hsl(220 55% 65%), hsl(260 60% 72%))",  accentColor: "hsl(220 55% 55%)" },
  { id: "sage",    name: "Sage",    descriptor: "Calm & grounded",       style: "realistic",   gender: "female",  gradient: "linear-gradient(160deg, hsl(160 45% 55%), hsl(190 55% 65%))",  accentColor: "hsl(160 45% 45%)" },
  { id: "ember",   name: "Ember",   descriptor: "Energetic & bold",      style: "realistic",   gender: "female",  gradient: "linear-gradient(160deg, hsl(25 80% 62%), hsl(340 70% 68%))",   accentColor: "hsl(25 80% 52%)" },
  // Realistic / Male
  { id: "atlas",   name: "Atlas",   descriptor: "Strong & dependable",   style: "realistic",   gender: "male",    gradient: "linear-gradient(160deg, hsl(210 50% 50%), hsl(230 55% 62%))",  accentColor: "hsl(210 50% 42%)" },
  { id: "river",   name: "River",   descriptor: "Easy-going & open",     style: "realistic",   gender: "male",    gradient: "linear-gradient(160deg, hsl(175 50% 46%), hsl(200 55% 58%))",  accentColor: "hsl(175 50% 38%)" },
  { id: "orion",   name: "Orion",   descriptor: "Intellectual & patient", style: "realistic",  gender: "male",    gradient: "linear-gradient(160deg, hsl(250 45% 56%), hsl(270 50% 65%))",  accentColor: "hsl(250 45% 48%)" },
  // Anime / Female
  { id: "hana",    name: "Hana",    descriptor: "Bright & expressive",   style: "anime",       gender: "female",  gradient: "linear-gradient(160deg, hsl(320 65% 72%), hsl(350 70% 80%))",  accentColor: "hsl(320 65% 60%)" },
  { id: "yuki",    name: "Yuki",    descriptor: "Cool & mysterious",     style: "anime",       gender: "female",  gradient: "linear-gradient(160deg, hsl(200 60% 68%), hsl(230 65% 76%))",  accentColor: "hsl(200 60% 55%)" },
  { id: "akari",   name: "Akari",   descriptor: "Sweet & energetic",     style: "anime",       gender: "female",  gradient: "linear-gradient(160deg, hsl(35 80% 68%), hsl(15 75% 74%))",   accentColor: "hsl(35 80% 55%)" },
  // Anime / Male
  { id: "kaito",   name: "Kaito",   descriptor: "Protective & earnest",  style: "anime",       gender: "male",    gradient: "linear-gradient(160deg, hsl(205 60% 52%), hsl(220 65% 62%))",  accentColor: "hsl(205 60% 44%)" },
  { id: "ren",     name: "Ren",     descriptor: "Reserved & sincere",    style: "anime",       gender: "male",    gradient: "linear-gradient(160deg, hsl(240 50% 55%), hsl(260 55% 65%))",  accentColor: "hsl(240 50% 46%)" },
  // Illustrated / Neutral
  { id: "nova",    name: "Nova",    descriptor: "Curious & adaptive",    style: "illustrated", gender: "neutral", gradient: "linear-gradient(160deg, hsl(268 55% 62%), hsl(290 60% 72%))",  accentColor: "hsl(268 55% 52%)" },
  { id: "echo",    name: "Echo",    descriptor: "Empathetic & calm",     style: "illustrated", gender: "neutral", gradient: "linear-gradient(160deg, hsl(180 50% 50%), hsl(210 55% 62%))",  accentColor: "hsl(180 50% 42%)" },
];

const STYLE_TABS: { id: StyleTab; label: string }[] = [
  { id: "realistic",   label: "Realistic" },
  { id: "anime",       label: "Anime" },
  { id: "illustrated", label: "Illustrated" },
];

const GENDER_OPTIONS: { id: GenderFilter; label: string }[] = [
  { id: "female",  label: "Female" },
  { id: "male",    label: "Male" },
  { id: "neutral", label: "Any" },
];

type Props = {
  defaultName?: string;
};

export function RolePhotoPicker({ defaultName = "Nova" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [style, setStyle] = useState<StyleTab>("realistic");
  const [gender, setGender] = useState<GenderFilter>("female");
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const filtered = PRESET_CHARACTERS.filter(
    (c) => c.style === style && (c.gender === gender || c.gender === "neutral"),
  );

  const selectedChar = selected
    ? PRESET_CHARACTERS.find((c) => c.id === selected) ?? null
    : null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadUrl(URL.createObjectURL(file));
    setSelected("__upload__");
  }

  return (
    <div className="rpp-root">
      {/* ── Gender filter ── */}
      <div className="rpp-gender-row">
        {GENDER_OPTIONS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`rpp-gender-btn${gender === g.id ? " active" : ""}`}
            onClick={() => setGender(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* ── Style tabs ── */}
      <div className="rpp-style-tabs">
        {STYLE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rpp-style-tab${style === t.id ? " active" : ""}`}
            onClick={() => setStyle(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Portrait grid ── */}
      <div className="rpp-grid">
        {filtered.map((char) => {
          const isSelected = selected === char.id;
          return (
            <button
              key={char.id}
              type="button"
              className={`rpp-portrait-card${isSelected ? " selected" : ""}`}
              onClick={() => { setSelected(char.id); setUploadUrl(null); }}
              style={{ "--accent": char.accentColor } as React.CSSProperties}
            >
              {/* Placeholder portrait */}
              <div className="rpp-portrait-img" style={{ background: char.gradient }}>
                <span className="rpp-portrait-initial">
                  {char.name.slice(0, 1)}
                </span>
                <span className="rpp-portrait-coming">Photo coming soon</span>
              </div>
              {isSelected && (
                <div className="rpp-portrait-check" aria-hidden="true">✓</div>
              )}
              <div className="rpp-portrait-meta">
                <span className="rpp-portrait-name">{char.name}</span>
                <span className="rpp-portrait-desc">{char.descriptor}</span>
              </div>
            </button>
          );
        })}

        {/* Upload your own */}
        <button
          type="button"
          className={`rpp-portrait-card rpp-portrait-upload${selected === "__upload__" ? " selected" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          {uploadUrl ? (
            <img className="rpp-portrait-img rpp-portrait-img-photo" src={uploadUrl} alt="Your upload" />
          ) : (
            <div className="rpp-portrait-img rpp-portrait-img-upload">
              <span className="rpp-upload-icon">↑</span>
              <span className="rpp-upload-label">Upload photo</span>
            </div>
          )}
          {selected === "__upload__" && (
            <div className="rpp-portrait-check" aria-hidden="true">✓</div>
          )}
          <div className="rpp-portrait-meta">
            <span className="rpp-portrait-name">Custom</span>
            <span className="rpp-portrait-desc">Your own image</span>
          </div>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="rpp-file-input"
        onChange={handleFile}
        name="avatar_file"
        aria-label="Upload avatar photo"
      />
      <input
        type="hidden"
        name="avatar_preset"
        value={selected === "__upload__" ? "" : (selected ?? "")}
      />

      {/* Selected preview summary */}
      {selected && selected !== "__upload__" && selectedChar ? (
        <p className="rpp-selection-note">
          Selected: <strong>{selectedChar.name}</strong> — {selectedChar.descriptor}
        </p>
      ) : null}
    </div>
  );
}
