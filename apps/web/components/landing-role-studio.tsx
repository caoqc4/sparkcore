"use client";

import Link from "next/link";
import { useState } from "react";
import { createProductRole } from "@/app/create/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

type LandingRoleStudioProps = {
  user: { id: string } | null;
  loginNext: string;
  reviewHref?: string;
  existingRoleName?: string | null;
  dashboardHref?: string;
};

const modeOptions = [
  { id: "girlfriend", label: "Female", defaultName: "Luna" },
  { id: "boyfriend", label: "Male", defaultName: "Atlas" },
  { id: "companion", label: "Companion", defaultName: "Nova" },
] as const;

const toneOptions = [
  { id: "warm", label: "Warm" },
  { id: "playful", label: "Playful" },
  { id: "steady", label: "Steady" },
] as const;

const relationshipOptions = [
  { id: "friend", label: "Friend" },
  { id: "romantic", label: "Romantic" },
  { id: "mentor", label: "Mentor" },
] as const;

const randomNamesByMode = {
  girlfriend: ["Luna", "Mira", "Selene", "Iris"],
  boyfriend: ["Atlas", "Rowan", "Kai", "Orion"],
  companion: ["Nova", "Sage", "Ari", "Ember"],
} as const;

function getDefaultName(mode: (typeof modeOptions)[number]["id"]) {
  return (
    modeOptions.find((option) => option.id === mode)?.defaultName ?? "Nova"
  );
}

function buildRelationshipMode(
  mode: (typeof modeOptions)[number]["id"],
  relationship: (typeof relationshipOptions)[number]["id"],
) {
  if (relationship === "mentor") {
    return "mentor and guide";
  }

  if (relationship === "friend") {
    return mode === "girlfriend"
      ? "close female friend"
      : mode === "boyfriend"
        ? "close male friend"
        : "trusted companion";
  }

  if (mode === "girlfriend") {
    return "long-term girlfriend";
  }

  if (mode === "boyfriend") {
    return "long-term boyfriend";
  }

  return "romantic companion";
}

function buildBoundaryCopy(personality: string) {
  const base =
    "Be supportive, respectful, emotionally steady, and avoid manipulative or coercive behavior.";

  if (!personality.trim()) {
    return base;
  }

  return `${base} Personality direction: ${personality.trim()}`;
}

export function LandingRoleStudio({
  user,
  loginNext,
  reviewHref = "/how-it-works",
  existingRoleName,
  dashboardHref = "/app",
}: LandingRoleStudioProps) {
  const [mode, setMode] =
    useState<(typeof modeOptions)[number]["id"]>("girlfriend");
  const [tone, setTone] = useState<(typeof toneOptions)[number]["id"]>("warm");
  const [relationship, setRelationship] =
    useState<(typeof relationshipOptions)[number]["id"]>("romantic");
  const [name, setName] = useState("Luna");
  const [personality, setPersonality] = useState(
    "Attentive, emotionally warm, remembers what matters, and keeps the relationship feeling consistent over time.",
  );

  const resolvedName = name.trim() || getDefaultName(mode);
  const relationshipMode = buildRelationshipMode(mode, relationship);
  const previewTone =
    toneOptions.find((option) => option.id === tone)?.label ?? "Warm";
  const previewRelationship =
    relationshipOptions.find((option) => option.id === relationship)?.label ??
    "Romantic";
  const previewSummary = personality.trim() || buildBoundaryCopy("");

  function randomizeName() {
    const options = randomNamesByMode[mode];
    const next =
      options[Math.floor(Math.random() * options.length)] ??
      getDefaultName(mode);

    setName(next);
  }

  return (
    <div className="landing-role-studio">
      <section className="landing-role-panel">
        <div className="landing-role-panel-header">
          <p className="home-kicker">Create role</p>
          <h2>Shape the first version of your companion on web.</h2>
          <p>
            Keep the first step focused: decide the type, name, relationship,
            and tone here. IM binding can happen after submit.
          </p>
          {existingRoleName ? (
            <div className="landing-role-existing-note">
              <span>Current live role</span>
              <strong>{existingRoleName}</strong>
              <p>
                This form creates another role. Your current relationship loop
                keeps running separately.
              </p>
              <Link className="site-inline-link" href={dashboardHref}>
                Open current console
              </Link>
            </div>
          ) : null}
        </div>

        <form action={createProductRole} className="landing-role-form">
          <input name="mode" type="hidden" value={mode} />
          <input name="tone" type="hidden" value={tone} />
          <input
            name="relationship_mode"
            type="hidden"
            value={relationshipMode}
          />
          <input
            name="boundaries"
            type="hidden"
            value={buildBoundaryCopy(personality)}
          />

          <div className="landing-control-group">
            <span className="landing-control-label">Type</span>
            <div className="landing-chip-row">
              {modeOptions.map((option) => (
                <button
                  className={`landing-choice-chip ${
                    option.id === mode ? "landing-choice-chip-active" : ""
                  }`}
                  key={option.id}
                  onClick={() => {
                    setMode(option.id);
                    if (!name.trim() || name === getDefaultName(mode)) {
                      setName(option.defaultName);
                    }
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-control-group">
            <div className="landing-control-row">
              <span className="landing-control-label">Name</span>
              <button
                className="landing-random-button"
                onClick={randomizeName}
                type="button"
              >
                Random
              </button>
            </div>
            <input
              className="input"
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder={getDefaultName(mode)}
              value={name}
            />
          </div>

          <div className="landing-control-group">
            <span className="landing-control-label">Bond</span>
            <div className="landing-chip-row">
              {relationshipOptions.map((option) => (
                <button
                  className={`landing-choice-chip ${
                    option.id === relationship
                      ? "landing-choice-chip-active"
                      : ""
                  }`}
                  key={option.id}
                  onClick={() => setRelationship(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-control-group">
            <span className="landing-control-label">Tone</span>
            <div className="landing-chip-row">
              {toneOptions.map((option) => (
                <button
                  className={`landing-choice-chip ${
                    option.id === tone ? "landing-choice-chip-active" : ""
                  }`}
                  key={option.id}
                  onClick={() => setTone(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-control-group">
            <span className="landing-control-label">Personality brief</span>
            <textarea
              className="input input-textarea landing-personality-input"
              onChange={(event) => setPersonality(event.target.value)}
              rows={5}
              value={personality}
            />
          </div>

          <div className="landing-role-actions">
            <Link className="button button-secondary" href={reviewHref}>
              See the full loop
            </Link>
            {user ? (
              <FormSubmitButton
                className="button button-primary button-large"
                eventName="create_started"
                eventPayload={{ surface: "home_studio" }}
                idleText={
                  existingRoleName ? "Create another role" : "Create role"
                }
                pendingText="Creating..."
              />
            ) : (
              <Link
                className="button button-primary button-large site-action-link"
                href={`/login?next=${encodeURIComponent(loginNext)}`}
              >
                Sign in to create
              </Link>
            )}
          </div>
        </form>
      </section>

      <aside className="landing-preview-panel">
        <div className={`landing-preview-stage landing-preview-stage-${mode}`}>
          <div className="landing-preview-chip-row">
            <span className="site-inline-pill">Portrait preview</span>
            <span className="site-inline-pill">Future photo / gen slot</span>
          </div>

          <div className="landing-portrait-frame">
            <div className="landing-portrait-glow" />
            <div className="landing-portrait-silhouette">
              <span>{resolvedName.slice(0, 1).toUpperCase()}</span>
            </div>
          </div>

          <div className="landing-preview-stage-note">
            This area is ready to become a real photo or generated portrait
            later. For now it behaves like a styled preview slot instead of a
            dead empty box.
          </div>
        </div>

        <section className="landing-preview-sheet">
          <div className="landing-preview-sheet-header">
            <p className="home-kicker">Preview</p>
            <h3>{resolvedName}</h3>
            <p>
              {previewRelationship} bond · {previewTone} tone
            </p>
          </div>

          <div className="landing-preview-facts">
            <span>Long memory</span>
            <span>IM-native continuity</span>
            <span>Web control center</span>
          </div>

          <p className="landing-preview-copy">{previewSummary}</p>
          <p className="landing-preview-footnote">
            After submit, SparkCore creates the role, opens the canonical
            thread, and moves you into IM connection instead of dropping you
            into another generic chat inbox.
          </p>
        </section>
      </aside>
    </div>
  );
}
