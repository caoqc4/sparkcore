"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAgentFromPersonaPack,
  type CreateAgentResult
} from "@/app/chat/actions";

type PersonaPackOption = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

type CreateAgentSheetProps = {
  personaPacks: PersonaPackOption[];
};

function buildDefaultAgentName(personaPack: PersonaPackOption | null) {
  return personaPack?.name ?? "";
}

export function CreateAgentSheet({ personaPacks }: CreateAgentSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersonaPackId, setSelectedPersonaPackId] = useState(
    personaPacks[0]?.id ?? ""
  );
  const [agentName, setAgentName] = useState(
    buildDefaultAgentName(personaPacks[0] ?? null)
  );
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPersonaPack = useMemo(
    () =>
      personaPacks.find((personaPack) => personaPack.id === selectedPersonaPackId) ??
      null,
    [personaPacks, selectedPersonaPackId]
  );

  useEffect(() => {
    if (!selectedPersonaPack) {
      return;
    }

    setAgentName((current) => {
      const trimmed = current.trim();
      const knownNames = new Set(personaPacks.map((personaPack) => personaPack.name));

      if (trimmed.length === 0 || knownNames.has(trimmed)) {
        return buildDefaultAgentName(selectedPersonaPack);
      }

      return current;
    });
  }, [personaPacks, selectedPersonaPack]);

  function closeSheet() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
  }

  function handleSubmit(formData: FormData) {
    setFeedback(null);

    startTransition(async () => {
      const result: CreateAgentResult = await createAgentFromPersonaPack(formData);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: `${result.agentName} is ready for new threads.`
      });
      setIsOpen(false);
      router.refresh();
    });
  }

  if (personaPacks.length === 0) {
    return (
      <div className="notice notice-error">
        No active persona pack is available right now, so chat cannot create a
        new agent yet.
      </div>
    );
  }

  return (
    <div className="create-agent-shell">
      {feedback ? (
        <div
          className={`notice ${
            feedback.tone === "success" ? "notice-success" : "notice-error"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <button className="button button-secondary" onClick={() => setIsOpen(true)} type="button">
        Create agent
      </button>

      {isOpen ? (
        <div
          aria-hidden={isPending ? "true" : undefined}
          className="sheet-backdrop"
          onClick={closeSheet}
        >
          <div
            aria-labelledby="create-agent-title"
            aria-modal="true"
            className="sheet-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Create agent</p>
                <h3 className="sheet-title" id="create-agent-title">
                  Start from a persona pack
                </h3>
              </div>
              <button
                aria-label="Close create agent sheet"
                className="sheet-close"
                disabled={isPending}
                onClick={closeSheet}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="helper-copy">
              Create a new agent inside the current chat workspace, keep the
              starting persona lightweight, and make it immediately available for
              new threads.
            </p>

            <form action={handleSubmit} className="sheet-form">
              <label className="field" htmlFor="persona-pack-id">
                <span className="label">Persona pack</span>
                <select
                  className="input"
                  id="persona-pack-id"
                  name="persona_pack_id"
                  onChange={(event) =>
                    setSelectedPersonaPackId(event.currentTarget.value)
                  }
                  required
                  value={selectedPersonaPackId}
                >
                  {personaPacks.map((personaPack) => (
                    <option key={personaPack.id} value={personaPack.id}>
                      {personaPack.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedPersonaPack ? (
                <div className="sheet-pack-preview">
                  <p className="sheet-pack-name">{selectedPersonaPack.name}</p>
                  <p className="thread-link-meta">
                    {selectedPersonaPack.description || selectedPersonaPack.persona_summary}
                  </p>
                </div>
              ) : null}

              <label className="field" htmlFor="agent-name">
                <span className="label">Agent name</span>
                <input
                  className="input"
                  id="agent-name"
                  maxLength={80}
                  name="agent_name"
                  onChange={(event) => setAgentName(event.currentTarget.value)}
                  placeholder="Leave as the persona name or rename it here"
                  value={agentName}
                />
              </label>

              <div className="sheet-actions">
                <button className="button" disabled={isPending} type="submit">
                  {isPending ? "Creating..." : "Create agent"}
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
