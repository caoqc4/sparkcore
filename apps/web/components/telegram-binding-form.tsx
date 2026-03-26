"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";

type TelegramBindingFormProps = {
  agentId: string;
  threadId: string;
};

export function TelegramBindingForm({
  agentId,
  threadId
}: TelegramBindingFormProps) {
  const [peerId, setPeerId] = useState("");
  const [platformUserId, setPlatformUserId] = useState("");
  const [syncIdentity, setSyncIdentity] = useState(true);

  return (
    <>
      <input name="agent_id" type="hidden" value={agentId} />
      <input name="thread_id" type="hidden" value={threadId} />

      <div className="field">
        <label className="label" htmlFor="channel_id">
          Channel ID
        </label>
        <input className="input" id="channel_id" name="channel_id" placeholder="Telegram chat id" />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          Peer ID
        </label>
        <input
          className="input"
          id="peer_id"
          name="peer_id"
          onChange={(event) => {
            const nextValue = event.target.value;
            setPeerId(nextValue);

            if (syncIdentity) {
              setPlatformUserId(nextValue);
            }
          }}
          placeholder="Telegram user id"
          value={peerId}
        />
      </div>

      <label className="checkbox-row" htmlFor="sync_identity">
        <input
          checked={syncIdentity}
          id="sync_identity"
          onChange={(event) => {
            const checked = event.target.checked;
            setSyncIdentity(checked);

            if (checked) {
              setPlatformUserId(peerId);
            }
          }}
          type="checkbox"
        />
        <span>Platform user ID is the same as peer ID</span>
      </label>

      <div className="field">
        <label className="label" htmlFor="platform_user_id">
          Platform user ID
        </label>
        <input
          className="input"
          id="platform_user_id"
          name="platform_user_id"
          onChange={(event) => setPlatformUserId(event.target.value)}
          placeholder="Usually the same Telegram user id"
          readOnly={syncIdentity}
          value={platformUserId}
        />
      </div>

      <p className="helper-copy">
        In most 1:1 Telegram chats, `peer_id` and `platform_user_id` are the same value.
      </p>

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "telegram", surface: "connect_im" }}
        idleText="Save Telegram binding"
        pendingText="Saving..."
      />
    </>
  );
}
