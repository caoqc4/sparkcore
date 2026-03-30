"use client";

import type { CompanionDraft, CompanionGender, CompanionTone } from "./home-hero-interactive";

function GirlfriendSVG() {
  return (
    <svg viewBox="0 0 80 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 72%)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <circle cx="40" cy="20" r="13" />
        <path d="M27 14 C30 7 36 5 40 5 C44 5 50 7 53 14" />
        <path d="M27 14 C22 16 20 25 20 35 C20 45 23 52 26 58" />
        <path d="M53 14 C58 16 60 25 60 35 C60 45 57 52 54 58" />
        <line x1="40" y1="33" x2="40" y2="42" />
        <path d="M26 58 C20 62 14 70 13 82 L12 112 C12 115 15 118 19 118 L61 118 C65 118 68 115 68 112 L67 82 C66 70 60 62 54 58" />
        <path d="M18 84 C21 92 59 92 62 84" />
      </g>
    </svg>
  );
}

function BoyfriendSVG() {
  return (
    <svg viewBox="0 0 80 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 72%)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <circle cx="40" cy="20" r="13" />
        <path d="M27 16 C27 8 34 5 40 5 C46 5 53 8 53 16" />
        <line x1="40" y1="33" x2="40" y2="42" />
        <path d="M27 42 C18 46 10 56 9 70 L9 112 C9 115 12 118 16 118 L64 118 C68 118 71 115 71 112 L71 70 C70 56 62 46 53 42" />
      </g>
    </svg>
  );
}

function CompanionSVG() {
  return (
    <svg viewBox="0 0 80 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="hsl(268, 52%, 72%)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <circle cx="40" cy="20" r="13" />
        <path d="M27 14 C30 7 36 5 40 5 C44 5 50 7 53 14" />
        <path d="M27 14 C22 16 21 24 21 32 C21 40 24 46 27 50" />
        <path d="M53 14 C58 16 59 24 59 32 C59 40 56 46 53 50" />
        <line x1="40" y1="33" x2="40" y2="42" />
        <path d="M27 50 C20 54 15 63 14 76 L13 112 C13 115 16 118 20 118 L60 118 C64 118 67 115 67 112 L66 76 C65 63 60 54 53 50" />
      </g>
    </svg>
  );
}

const SILHOUETTE_MAP: Record<CompanionGender, React.FC> = {
  female: GirlfriendSVG,
  male: BoyfriendSVG,
  neutral: CompanionSVG,
};

const TONE_DIALOGUES: Record<CompanionTone, { from: "you" | "companion"; text: string }[]> = {
  warm: [
    { from: "you",       text: "I've been a bit off today."                          },
    { from: "companion", text: "I noticed. Do you want to talk, or just be heard?"   },
    { from: "you",       text: "Just be heard, I think."                             },
    { from: "companion", text: "Then I'm right here. Take your time."                },
  ],
  playful: [
    { from: "you",       text: "Guess what happened today."                          },
    { from: "companion", text: "Okay I'm already excited — tell me everything 👀"   },
    { from: "you",       text: "You're going to love this."                          },
    { from: "companion", text: "Stop building suspense and spill it!"                },
  ],
  steady: [
    { from: "you",       text: "Rough day. Not sure where to start."                 },
    { from: "companion", text: "I'm here. Take your time."                           },
    { from: "you",       text: "That helps, actually."                               },
    { from: "companion", text: "Always. What's sitting heaviest right now?"          },
  ],
};

const TONE_LABELS: Record<CompanionTone, string> = {
  warm:    "Warm & Caring",
  playful: "Playful & Spontaneous",
  steady:  "Calm & Grounded",
};

interface HomeHeroPreviewProps {
  draft: CompanionDraft;
}

export function HomeHeroPreview({ draft }: HomeHeroPreviewProps) {
  const fallbackNames: Record<CompanionGender, string> = { female: "Caria", male: "Teven", neutral: "Nova" };
  const displayName = draft.name.trim() || fallbackNames[draft.gender];
  const messages   = TONE_DIALOGUES[draft.tone];
  const visibleTraits = draft.traits.slice(0, 3);

  return (
    <div className="home-hero-preview">
      {/* Silhouette card */}
      <div className="home-hero-portrait-card">
        <div className="home-hero-portrait-area">
          <div className="home-hero-portrait-img home-hero-portrait-silhouette">
            <div className="home-hero-silhouette-container">
              {(["female", "male", "neutral"] as CompanionGender[]).map((g) => {
                const SvgComponent = SILHOUETTE_MAP[g];
                return (
                  <div
                    key={g}
                    className={`home-hero-silhouette-slide${draft.gender === g ? " visible" : ""}`}
                  >
                    <SvgComponent />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="home-hero-portrait-status live" aria-hidden="true" />
        </div>
        <div className="home-hero-portrait-meta">
          <span className="home-hero-portrait-name">{displayName}</span>
          <div className="home-hero-portrait-tags">
            <span className="home-hero-portrait-tag">{TONE_LABELS[draft.tone]}</span>
            {visibleTraits.map((t) => (
              <span key={t} className="home-hero-portrait-tag home-hero-portrait-tag-dim">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tone-reactive dialogue */}
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
  );
}
