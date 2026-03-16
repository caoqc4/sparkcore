"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameAgent, type RenameAgentResult } from "@/app/chat/actions";

type AgentEditSheetProps = {
  agent: {
    id: string;
    name: string;
    persona_summary: string;
    system_prompt_summary: string;
    default_model_profile_id: string | null;
  };
  modelProfiles: Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
  }>;
};

export function AgentEditSheet({ agent, modelProfiles }: AgentEditSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState(agent.name);
  const [selectedModelProfileId, setSelectedModelProfileId] = useState(
    agent.default_model_profile_id ?? modelProfiles[0]?.id ?? ""
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftName(agent.name);
    setSelectedModelProfileId(
      agent.default_model_profile_id ?? modelProfiles[0]?.id ?? ""
    );
  }, [agent.default_model_profile_id, agent.name, modelProfiles]);

  function closeSheet() {
    if (isPending) {
      return;
    }

    setDraftName(agent.name);
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
        Edit
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
                <p className="eyebrow">Agent</p>
                <h3 className="sheet-title" id={`edit-agent-title-${agent.id}`}>
                  Lightweight agent details
                </h3>
              </div>
              <button
                aria-label="Close agent details"
                className="sheet-close"
                disabled={isPending}
                onClick={closeSheet}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="helper-copy">
              Keep agent editing lightweight inside chat. Rename the agent here
              and review the current persona summary and system prompt summary
              without leaving the thread workspace.
            </p>
            <p className="helper-copy">
              Changes here update the agent object for future replies that use
              this agent. They do not rewrite older thread content or past
              runtime summaries.
            </p>

            {feedback ? <div className="notice notice-error">{feedback}</div> : null}

            <form action={handleSubmit} className="sheet-form">
              <input name="agent_id" type="hidden" value={agent.id} />

              <label className="field" htmlFor={`agent-name-${agent.id}`}>
                <span className="label">Agent name</span>
                <input
                  className="input"
                  id={`agent-name-${agent.id}`}
                  maxLength={80}
                  name="agent_name"
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                  value={draftName}
                />
              </label>

              <label className="field" htmlFor={`agent-model-profile-${agent.id}`}>
                <span className="label">Model profile</span>
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
                      {modelProfile.name} · {modelProfile.provider}/{modelProfile.model}
                    </option>
                  ))}
                </select>
                <span className="helper-copy">
                  Switching the model profile only affects future replies from
                  this agent.
                </span>
              </label>

              <div className="sheet-pack-preview">
                <p className="sheet-pack-name">Persona summary</p>
                <p className="thread-link-meta">
                  {agent.persona_summary || "No persona summary is available yet."}
                </p>
              </div>

              <div className="sheet-pack-preview">
                <p className="sheet-pack-name">System prompt summary</p>
                <p className="thread-link-meta">
                  {agent.system_prompt_summary ||
                    "No system prompt summary is available yet."}
                </p>
              </div>

              <div className="sheet-actions">
                <button className="button" disabled={isPending} type="submit">
                  {isPending ? "Saving..." : "Save changes"}
                </button>
                <button
                  className="button button-secondary"
                  disabled={isPending}
                  onClick={closeSheet}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
