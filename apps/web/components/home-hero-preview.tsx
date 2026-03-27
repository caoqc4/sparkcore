"use client";

import { motion } from "framer-motion";

interface RolePreviewData {
  name: string;
  type: "companion" | "assistant";
  tone: string;
  tagline: string;
  avatar?: string;
}

interface HomeHeroPreviewProps {
  roleData: RolePreviewData;
}

const sampleConversations = [
  {
    role: "You",
    message: "I only have ten minutes, but I still wanted to check in before bed.",
  },
  {
    role: "Companion",
    message: "Then let's keep this light and close. I still remember what mattered from yesterday.",
  },
];

export function HomeHeroPreview({ roleData }: HomeHeroPreviewProps) {
  const displayName = roleData.name || "Your Companion";
  const displayType = roleData.type === "companion" ? "Close Companion" : "Personal Assistant";
  const displayTone = roleData.tone || "Gentle & Listening";

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeOut", duration: 0.6, delay: 0.2 }}
      className="home-hero-preview"
    >
      {/* Role Avatar/Image Placeholder */}
      <div className="role-preview-avatar">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ease: "easeOut", duration: 0.5, delay: 0.4 }}
          className="avatar-placeholder"
        >
          <span className="avatar-emoji">
            {roleData.type === "companion" ? "💫" : "⚡"}
          </span>
          <div className="avatar-bg-effect" />
        </motion.div>
      </div>

      {/* Role Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.5 }}
        className="role-preview-info"
      >
        <h3 className="role-preview-name">{displayName}</h3>
        <div className="role-preview-tags">
          <span className="role-preview-tag tag-type">{displayType}</span>
          <span className="role-preview-tag tag-tone">{displayTone}</span>
        </div>
        <p className="role-preview-tagline">
          {roleData.tagline || "A relationship that grows with every conversation."}
        </p>
      </motion.div>

      {/* Sample Conversations */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.6 }}
        className="role-preview-conversations"
      >
        {sampleConversations.map((conv, index) => (
          <div
            key={index}
            className={`preview-bubble ${
              conv.role === "You" ? "bubble-user" : "bubble-companion"
            }`}
          >
            <span className="bubble-role">{conv.role}</span>
            <p className="bubble-message">{conv.message}</p>
          </div>
        ))}
      </motion.div>

      {/* Future Feature Teaser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.8 }}
        className="role-preview-teaser"
      >
        <span className="teaser-badge">Coming Soon</span>
        <p className="teaser-text">Generate unique avatar for your role</p>
      </motion.div>
    </motion.div>
  );
}
