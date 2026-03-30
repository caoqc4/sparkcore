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
  };
  isCurrentThreadAgent: boolean;
  isWorkspaceDefaultAgent: boolean;
  locale: ChatLocale;
  triggerLabel?: string;
};

export function AgentEditSheet({
  agent,
  isCurrentThreadAgent,
  isWorkspaceDefaultAgent,
  locale,
  triggerLabel
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const relationshipEntryHelper = isCurrentThreadAgent
    ? copy.sheets.editAgentHelperCurrentThread
    : isWorkspaceDefaultAgent
      ? copy.sheets.editAgentHelperWorkspaceDefault
      : copy.sheets.editAgentHelperOtherAgent;

  useEffect(() => {
    setDraftName(agent.name);
    setDraftPersonaSummary(agent.persona_summary);
    setDraftBackgroundSummary(agent.background_summary ?? "");
    setDraftAvatarEmoji(agent.avatar_emoji ?? "");
  }, [
    agent.avatar_emoji,
    agent.background_summary,
    agent.name,
    agent.persona_summary
  ]);

  function closeSheet() {
    if (isPending) {
      return;
    }

    setDraftName(agent.name);
    setDraftPersonaSummary(agent.persona_summary);
    setDraftBackgroundSummary(agent.background_summary ?? "");
    setDraftAvatarEmoji(agent.avatar_emoji ?? "");
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
        {triggerLabel ?? copy.common.edit}
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
              {relationshipEntryHelper}
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
