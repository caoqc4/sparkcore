"use client";

import type { CompanionDraft, CompanionGender, CompanionTone } from "./home-hero-interactive";

// ── Silhouette SVGs (one per identity type) ─────────────────────────────────

function GirlfriendSVG() {
  return (
    <svg viewBox="0 0 80 130" width="72%" height="72%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 76%)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <circle cx="40" cy="22" r="15" />
        {/* Hair — flowing feminine */}
        <path d="M25 15 C28 6 36 3 40 3 C44 3 52 6 55 15" />
        <path d="M25 15 C19 18 18 28 18 38 C18 50 22 57 26 63" />
        <path d="M55 15 C61 18 62 28 62 38 C62 50 58 57 54 63" />
        {/* Neck */}
        <line x1="40" y1="37" x2="40" y2="46" />
        {/* Body — curved, feminine */}
        <path d="M26 63 C18 68 12 78 11 93 L10 122 C10 126 13 129 17 129 L63 129 C67 129 70 126 70 122 L69 93 C68 78 62 68 54 63" />
        {/* Waist curve */}
        <path d="M16 95 C20 105 60 105 64 95" />
      </g>
    </svg>
  );
}

function BoyfriendSVG() {
  return (
    <svg viewBox="0 0 80 130" width="72%" height="72%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 76%)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <circle cx="40" cy="22" r="15" />
        {/* Hair — short masculine */}
        <path d="M25 18 C25 9 33 5 40 5 C47 5 55 9 55 18" />
        {/* Neck */}
        <line x1="40" y1="37" x2="40" y2="46" />
        {/* Body — broad, straight */}
        <path d="M26 46 C16 50 8 62 7 78 L7 122 C7 126 10 129 14 129 L66 129 C70 129 73 126 73 122 L73 78 C72 62 64 50 54 46" />
      </g>
    </svg>
  );
}

function FemaleAssistantSVG() {
  return (
    <svg viewBox="0 0 80 130" width="72%" height="72%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 76%)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <circle cx="40" cy="22" r="15" />
        {/* Hair — neat, pulled back */}
        <path d="M25 15 C29 6 38 4 40 4 C42 4 51 6 55 15" />
        <path d="M52 12 C56 7 60 9 57 15" />
        {/* Neck */}
        <line x1="40" y1="37" x2="40" y2="44" />
        {/* Blazer lapels */}
        <path d="M30 44 L35 56 L40 51 L45 56 L50 44" />
        {/* Structured jacket body */}
        <path d="M30 44 C21 48 15 59 13 75 L12 122 C12 126 15 129 19 129 L61 129 C65 129 68 126 68 122 L67 75 C65 59 59 48 50 44" />
        {/* Center button line */}
        <line x1="40" y1="56" x2="40" y2="95" strokeDasharray="3 5" opacity="0.6" />
      </g>
    </svg>
  );
}

function MaleAssistantSVG() {
  return (
    <svg viewBox="0 0 80 130" width="72%" height="72%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 76%)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <circle cx="40" cy="22" r="15" />
        {/* Hair — neat, short */}
        <path d="M25 18 C26 9 34 5 40 5 C46 5 54 9 55 18" />
        {/* Neck */}
        <line x1="40" y1="37" x2="40" y2="44" />
        {/* Tie */}
        <path d="M37 44 L40 60 L43 44" />
        {/* Suit jacket — broad, structured */}
        <path d="M28 44 C16 48 7 60 6 78 L5 122 C5 126 8 129 12 129 L68 129 C72 129 75 126 75 122 L74 78 C73 60 64 48 52 44" />
        {/* Jacket lapels */}
        <path d="M28 44 L22 58 L37 61" />
        <path d="M52 44 L58 58 L43 61" />
      </g>
    </svg>
  );
}

type SilhouetteKey = "girlfriend" | "boyfriend" | "female-assistant" | "male-assistant";

const SILHOUETTE_MAP: Record<SilhouetteKey, React.FC> = {
  "girlfriend":       GirlfriendSVG,
  "boyfriend":        BoyfriendSVG,
  "female-assistant": FemaleAssistantSVG,
  "male-assistant":   MaleAssistantSVG,
};

function getDraftSilhouetteKey(draft: CompanionDraft): SilhouetteKey {
  if (draft.mode === "assistant") {
    return draft.gender === "male" ? "male-assistant" : "female-assistant";
  }
  return draft.gender === "male" ? "boyfriend" : "girlfriend";
}

// ── Dialogue & label maps ───────────────────────────────────────────────────

const TONE_DIALOGUES: Record<CompanionTone, { from: "you" | "companion"; text: string }[]> = {
  warm: [
    { from: "you",       text: "I've been a bit off today."                        },
    { from: "companion", text: "I noticed. Do you want to talk, or just be heard?" },
    { from: "you",       text: "Just be heard, I think."                           },
  ],
  playful: [
    { from: "you",       text: "Guess what happened today."                        },
    { from: "companion", text: "Okay I'm already excited — tell me everything 👀"  },
    { from: "you",       text: "You're going to love this."                        },
  ],
  steady: [
    { from: "you",       text: "Rough day. Not sure where to start."               },
    { from: "companion", text: "I'm here. Take your time."                         },
    { from: "you",       text: "That helps, actually."                             },
  ],
};

const TONE_LABELS: Record<CompanionTone, string> = {
  warm:    "Warm & Caring",
  playful: "Playful & Spontaneous",
  steady:  "Calm & Grounded",
};

// ── Component ───────────────────────────────────────────────────────────────

interface HomeHeroPreviewProps {
  draft: CompanionDraft;
  portraitUrl?: string | null;
}

export function HomeHeroPreview({ draft, portraitUrl }: HomeHeroPreviewProps) {
  const fallbackNames: Record<CompanionGender, string> = { female: "Caria", male: "Teven" };
  const displayName = draft.name.trim() || (draft.identityChosen ? fallbackNames[draft.gender] : "Your companion");
  const messages    = TONE_DIALOGUES[draft.tone];
  const visibleTraits = draft.traits.slice(0, 3);
  const silhouetteKey = getDraftSilhouetteKey(draft);

  return (
    <div className="home-hero-preview">
      <div className="home-hero-portrait-card">

        {/* Portrait / silhouette area */}
        <div className="home-hero-portrait-area">
          {portraitUrl ? (
            <img
              className="home-hero-portrait-img home-hero-portrait-photo"
              src={portraitUrl}
              alt={draft.name || "Companion portrait"}
            />
          ) : (
            <div className="home-hero-portrait-img home-hero-portrait-silhouette">
              <div className="home-hero-silhouette-container">
                {(Object.keys(SILHOUETTE_MAP) as SilhouetteKey[]).map((key) => {
                  const SvgComponent = SILHOUETTE_MAP[key];
                  return (
                    <div
                      key={key}
                      className={`home-hero-silhouette-slide${silhouetteKey === key ? " visible" : ""}`}
                    >
                      <SvgComponent />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="home-hero-portrait-status live" aria-hidden="true" />
        </div>

        {/* Name + tone badge */}
        <div className="home-hero-portrait-meta">
          <span className="home-hero-portrait-name">{displayName}</span>
          <div className="home-hero-portrait-tags">
            <span className="home-hero-portrait-tag">{TONE_LABELS[draft.tone]}</span>
            {visibleTraits.map((t) => (
              <span key={t} className="home-hero-portrait-tag home-hero-portrait-tag-dim">{t}</span>
            ))}
          </div>
        </div>

        {/* Chat preview — embedded inside card */}
        <div className="home-hero-chat-preview">
          {messages.map((msg, i) => (
            <div
              key={`${draft.tone}-${i}`}
              className={`home-hero-chat-bubble ${
                msg.from === "you"
                  ? "home-hero-chat-bubble-user"
                  : "home-hero-chat-bubble-companion"
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          <div className="home-hero-chat-memory-chip">
            <span>Memory saved · 12 items</span>
          </div>
        </div>

      </div>
    </div>
  );
}
