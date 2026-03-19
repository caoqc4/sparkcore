"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameAgent, type RenameAgentResult } from "@/app/chat/actions";
import { getChatCopy, type ChatLocale } from "@/lib/i18n/chat-ui";

type AgentEditSheetProps = {
  agent: {
    id: string;
    name: string;
    persona_summary: string;
    background_summary: string | null;
    avatar_emoji: string | null;
    system_prompt_summary: string;
    default_model_profile_id: string | null;
  };
  locale: ChatLocale;
  modelProfiles: Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
    tier_label: string | null;
    usage_note: string | null;
    underlying_model: string | null;
  }>;
};

export function AgentEditSheet({
  agent,
  locale,
  modelProfiles
}: AgentEditSheetProps) {
  const router = useRouter();
  const copy = getChatCopy(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState(agent.name);
  const [draftPersonaSummary, setDraftPersonaSummary] = useState(
    agent.persona_summary
  );
  const [draftBackgroundSummary, setDraftBackgroundSummary] = useState(
    agent.background_summary ?? ""
  );
  const [draftAvatarEmoji, setDraftAvatarEmoji] = useState(agent.avatar_emoji ?? "");
  const [selectedModelProfileId, setSelectedModelProfileId] = useState(
    agent.default_model_profile_id ?? modelProfiles[0]?.id ?? ""
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedModelProfile =
    modelProfiles.find((modelProfile) => modelProfile.id === selectedModelProfileId) ??
    null;

  function getProfilePositioning(
    modelProfile: AgentEditSheetProps["modelProfiles"][number]
  ) {
    const tier = modelProfile.tier_label?.toLowerCase() ?? "";

    if (tier.includes("stable")) {
      return {
        label: copy.sheets.profilePositioningStable,
        helper: copy.sheets.profilePositioningStableHelper,
        tradeoff: copy.sheets.profileTradeoffStableHelper
      };
    }

    if (tier.includes("memory")) {
      return {
        label: copy.sheets.profilePositioningMemory,
        helper: copy.sheets.profilePositioningMemoryHelper,
        tradeoff: copy.sheets.profileTradeoffMemoryHelper
      };
    }

    if (tier.includes("low-cost") || tier.includes("low cost")) {
      return {
        label: copy.sheets.profilePositioningLowCost,
        helper: copy.sheets.profilePositioningLowCostHelper,
        tradeoff: copy.sheets.profileTradeoffLowCostHelper
      };
    }

    return {
      label: copy.sheets.profilePositioningGeneric,
      helper: copy.sheets.profilePositioningGenericHelper,
      tradeoff: copy.sheets.profileTradeoffGenericHelper
    };
  }

  function buildModelProfileOptionLabel(modelProfile: AgentEditSheetProps["modelProfiles"][number]) {
    const parts = [modelProfile.name, getProfilePositioning(modelProfile).label];

    parts.push(
      modelProfile.underlying_model ??
        `${modelProfile.provider}/${modelProfile.model}`
    );

    return parts.join(" · ");
  }

  useEffect(() => {
    setDraftName(agent.name);
    setDraftPersonaSummary(agent.persona_summary);
    setDraftBackgroundSummary(agent.background_summary ?? "");
    setDraftAvatarEmoji(agent.avatar_emoji ?? "");
    setSelectedModelProfileId(
      agent.default_model_profile_id ?? modelProfiles[0]?.id ?? ""
    );
  }, [
    agent.avatar_emoji,
    agent.background_summary,
    agent.default_model_profile_id,
    agent.name,
    agent.persona_summary,
    modelProfiles
  ]);

  function closeSheet() {
    if (isPending) {
      return;
    }

    setDraftName(agent.name);
    setDraftPersonaSummary(agent.persona_summary);
    setDraftBackgroundSummary(agent.background_summary ?? "");
    setDraftAvatarEmoji(agent.avatar_emoji ?? "");
    setSelectedModelProfileId(agent.default_model_profile_id ?? modelProfiles[0]?.id ?? "");
    setFeedback(null);
    setIsOpen(false);
  }

  function handleSubmit(formData: FormData) {
    setFeedback(null);

    startTransition(async () => {
      const result: RenameAgentResult = await renameAgent(formData);

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setDraftName(result.agentName);
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="agent-card-action">
      <button
        className="button button-secondary agent-edit-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {copy.common.edit}
      </button>

      {isOpen ? (
        <div
          aria-hidden={isPending ? "true" : undefined}
          className="sheet-backdrop"
          onClick={closeSheet}
        >
          <div
            aria-labelledby={`edit-agent-title-${agent.id}`}
            aria-modal="true"
            className="sheet-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-header">
              <div>
                <p className="eyebrow">{copy.sheets.editAgentEyebrow}</p>
                <h3 className="sheet-title" id={`edit-agent-title-${agent.id}`}>
                  {copy.sheets.editAgentTitle}
                </h3>
              </div>
              <button
                aria-label={copy.common.close}
                className="sheet-close"
                disabled={isPending}
                onClick={closeSheet}
                type="button"
              >
                {copy.common.close}
              </button>
            </div>

            <p className="helper-copy">
              {copy.sheets.editAgentHelper1}
            </p>
            <p className="helper-copy">
              {copy.sheets.editAgentHelper2}
            </p>
            <p className="helper-copy">
              {copy.sheets.editAgentHelper3}
            </p>

            {feedback ? <div className="notice notice-error">{feedback}</div> : null}

            <form action={handleSubmit} className="sheet-form">
              <input name="agent_id" type="hidden" value={agent.id} />

              <label className="field" htmlFor={`agent-name-${agent.id}`}>
                <span className="label">{copy.sheets.agentName}</span>
                <input
                  className="input"
                  id={`agent-name-${agent.id}`}
                  maxLength={80}
                  name="agent_name"
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                  value={draftName}
                />
              </label>

              <label className="field" htmlFor={`agent-avatar-${agent.id}`}>
                <span className="label">{copy.sheets.avatarCue}</span>
                <input
                  className="input"
                  id={`agent-avatar-${agent.id}`}
                  maxLength={8}
                  name="avatar_emoji"
                  onChange={(event) => setDraftAvatarEmoji(event.currentTarget.value)}
                  placeholder="🧠"
                  value={draftAvatarEmoji}
                />
                <span className="helper-copy">
                  {copy.sheets.avatarCueHelper}
                </span>
              </label>

              <label className="field" htmlFor={`agent-background-${agent.id}`}>
                <span className="label">{copy.sheets.backgroundSummary}</span>
                <textarea
                  className="input textarea"
                  id={`agent-background-${agent.id}`}
                  maxLength={280}
                  name="background_summary"
                  onChange={(event) =>
                    setDraftBackgroundSummary(event.currentTarget.value)
                  }
                  placeholder={copy.sheets.backgroundPlaceholder}
                  value={draftBackgroundSummary}
                />
                <span className="helper-copy">
                  {copy.sheets.backgroundHelper}
                </span>
              </label>

              <label className="field" htmlFor={`agent-persona-${agent.id}`}>
                <span className="label">{copy.sheets.personaSummary}</span>
                <textarea
                  className="input textarea"
                  id={`agent-persona-${agent.id}`}
                  maxLength={280}
                  name="persona_summary"
                  onChange={(event) =>
                    setDraftPersonaSummary(event.currentTarget.value)
                  }
                  value={draftPersonaSummary}
                />
              </label>

              <label className="field" htmlFor={`agent-model-profile-${agent.id}`}>
                <span className="label">{copy.sheets.modelProfile}</span>
                <select
                  className="input"
                  id={`agent-model-profile-${agent.id}`}
                  name="model_profile_id"
                  onChange={(event) =>
                    setSelectedModelProfileId(event.currentTarget.value)
                  }
                  value={selectedModelProfileId}
                >
                  {modelProfiles.map((modelProfile) => (
                    <option key={modelProfile.id} value={modelProfile.id}>
                      {buildModelProfileOptionLabel(modelProfile)}
                    </option>
                  ))}
                </select>
                <span className="helper-copy">
                  {copy.sheets.profileHelper}
                </span>
                <span className="helper-copy">
                  {copy.sheets.profileRecommendationSummary}
                </span>
                {selectedModelProfile ? (
                  <>
                    {(() => {
                      const positioning = getProfilePositioning(selectedModelProfile);

                      return (
                    <div className="sheet-pack-preview">
                      <p className="sheet-pack-name">
                        {copy.sheets.profilePositioning}
                      </p>
                      <p className="thread-link-meta">
                            {positioning.label}
                      </p>
                      <p className="helper-copy">
                            {positioning.helper}
                      </p>
                          <p className="sheet-pack-name">
                            {copy.sheets.profileTradeoff}
                          </p>
                          <p className="helper-copy">
                            {positioning.tradeoff}
                          </p>
                    </div>
                      );
                    })()}
                    {selectedModelProfile.usage_note ? (
                      <span className="helper-copy">
                        {selectedModelProfile.usage_note}
                      </span>
                    ) : null}
                    <span className="helper-copy">
                      {copy.sheets.underlyingModel}:{" "}
                      {selectedModelProfile.underlying_model ??
                        `${selectedModelProfile.provider}/${selectedModelProfile.model}`}
                    </span>
                  </>
                ) : null}
              </label>

              <div className="sheet-pack-preview">
                <p className="sheet-pack-name">{copy.sheets.systemPromptSummary}</p>
                <p className="thread-link-meta">
                  {agent.system_prompt_summary ||
                    "No system prompt summary is available yet."}
                </p>
              </div>

              <div className="sheet-actions">
                <button className="button" disabled={isPending} type="submit">
                  {isPending ? copy.common.saving : copy.common.saveChanges}
                </button>
                <button
                  className="button button-secondary"
                  disabled={isPending}
                  onClick={closeSheet}
                  type="button"
                >
                  {copy.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
