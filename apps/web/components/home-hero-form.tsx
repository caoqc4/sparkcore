"use client";

import { useState } from "react";
import { TrackedLink } from "@/components/tracked-link";

type RoleType = "companion" | "assistant";
type ToneStyle = "playful" | "gentle" | "rational";

interface RoleFormData {
  roleType: RoleType;
  name: string;
  tone: ToneStyle;
}

interface HomeHeroFormProps {
  user?: { id: string } | null;
}

export function HomeHeroForm({ user }: HomeHeroFormProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    roleType: "companion",
    name: "",
    tone: "gentle",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement role creation logic
    console.log("Creating role:", formData);
  };

  return (
    <div className="home-hero-form-section">
      <form onSubmit={handleSubmit} className="home-hero-form">
        {/* Role Type Selection */}
        <div className="form-field">
          <label className="form-label">Role Type</label>
          <div className="role-type-selector">
            <button
              type="button"
              className={`role-type-option ${
                formData.roleType === "companion" ? "active" : ""
              }`}
              onClick={() => setFormData({ ...formData, roleType: "companion" })}
            >
              <span className="role-type-icon">💫</span>
              <div className="role-type-content">
                <span className="role-type-title">Companion</span>
                <span className="role-type-desc">
                  Emotional support and relationship
                </span>
              </div>
            </button>
            <button
              type="button"
              className={`role-type-option ${
                formData.roleType === "assistant" ? "active" : ""
              }`}
              onClick={() => setFormData({ ...formData, roleType: "assistant" })}
            >
              <span className="role-type-icon">⚡</span>
              <div className="role-type-content">
                <span className="role-type-title">Assistant</span>
                <span className="role-type-desc">
                  Productivity and task-focused
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Name Input */}
        <div className="form-field">
          <label htmlFor="role-name" className="form-label">
            Name
          </label>
          <input
            id="role-name"
            type="text"
            className="input"
            placeholder="Give your companion a name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Tone Selection */}
        <div className="form-field">
          <label className="form-label">Tone & Style</label>
          <div className="tone-selector">
            <button
              type="button"
              className={`tone-option ${formData.tone === "playful" ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, tone: "playful" })}
            >
              Playful & Energetic
            </button>
            <button
              type="button"
              className={`tone-option ${formData.tone === "gentle" ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, tone: "gentle" })}
            >
              Gentle & Listening
            </button>
            <button
              type="button"
              className={`tone-option ${formData.tone === "rational" ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, tone: "rational" })}
            >
              Rational & Calm
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          {user ? (
            <button type="submit" className="button button-primary button-lg button-rounded">
              Create My Role
            </button>
          ) : (
            <TrackedLink
              href={`/login?next=${encodeURIComponent("/create")}`}
              className="button button-primary button-lg button-rounded"
              event="landing_cta_click"
              payload={{ source: "home_hero_create" }}
            >
              Login & Create
            </TrackedLink>
          )}
        </div>
      </form>
    </div>
  );
}
