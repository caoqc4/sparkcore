"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAgentFromPersonaPack,
  type CreateAgentResult
} from "@/app/chat/actions";
import { getChatCopy, type ChatLocale } from "@/lib/i18n/chat-ui";

type PersonaPackOption = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

type CreateAgentSheetProps = {
  personaPacks: PersonaPackOption[];
  locale: ChatLocale;
};

function buildDefaultAgentName(personaPack: PersonaPackOption | null) {
  return personaPack?.name ?? "";
}

export function CreateAgentSheet({ personaPacks, locale }: CreateAgentSheetProps) {
  const router = useRouter();
  const copy = getChatCopy(locale);
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
        message: `${result.agentName}${copy.sheets.createAgentSuccessSuffix}`
      });
      setIsOpen(false);
      router.refresh();
    });
  }

  if (personaPacks.length === 0) {
    return (
        <div className="notice notice-error">
        {copy.sheets.noPersonaPack}
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
        {copy.sheets.createAgent}
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
                <p className="eyebrow">{copy.sheets.createAgentEyebrow}</p>
                <h3 className="sheet-title" id="create-agent-title">
                  {copy.sheets.createAgentTitle}
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
              {copy.sheets.createAgentHelper}
            </p>

            <form action={handleSubmit} className="sheet-form">
              <label className="field" htmlFor="persona-pack-id">
                <span className="label">{copy.sheets.personaPack}</span>
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
                <span className="label">{copy.sheets.agentName}</span>
                <input
                  className="input"
                  id="agent-name"
                  maxLength={80}
                  name="agent_name"
                  onChange={(event) => setAgentName(event.currentTarget.value)}
                  placeholder={copy.sheets.agentNamePlaceholder}
                  value={agentName}
                />
              </label>

              <div className="sheet-actions">
                <button className="button" disabled={isPending} type="submit">
                  {isPending ? copy.sheets.createPending : copy.sheets.createAgent}
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
