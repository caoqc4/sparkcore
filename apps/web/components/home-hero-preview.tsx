interface RolePreviewData {
  name: string;
  type: "companion" | "assistant";
  tone: string;
  tagline: string;
}

interface HomeHeroPreviewProps {
  roleData: RolePreviewData;
}

const sampleConversation = [
  {
    role: "You",
    message: "I only have ten minutes, but I still wanted to check in.",
  },
  {
    role: "Companion",
    message:
      "Then let's keep this light and close. I still remember what mattered from yesterday.",
  },
  {
    role: "You",
    message: "That's exactly what I needed to hear.",
  },
] as const;

export function HomeHeroPreview({ roleData }: HomeHeroPreviewProps) {
  return (
    <div className="home-hero-preview">
      {/* Portrait card */}
      <div className="home-hero-portrait-card">
        <div className="home-hero-portrait-area">
          <div className="home-hero-portrait-img" aria-hidden="true">
            {roleData.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="home-hero-portrait-status live" aria-hidden="true" />
        </div>
        <div className="home-hero-portrait-meta">
          <span className="home-hero-portrait-name">{roleData.name}</span>
          <span className="home-hero-portrait-type">{roleData.tone}</span>
        </div>
      </div>

      {/* Sample chat */}
      <div className="home-hero-chat-preview">
        {sampleConversation.map((msg, i) => (
          <div
            key={i}
            className={`home-hero-chat-bubble ${
              msg.role === "You"
                ? "home-hero-chat-bubble-user"
                : "home-hero-chat-bubble-companion"
            }`}
          >
            <p>{msg.message}</p>
          </div>
        ))}
        <div className="home-hero-chat-memory-chip">
          <span>Memory saved · 12 items</span>
        </div>
      </div>
    </div>
  );
}
