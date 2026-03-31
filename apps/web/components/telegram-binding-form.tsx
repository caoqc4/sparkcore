"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";

type TelegramBindingFormProps = {
  agentId: string;
  threadId: string;
  hasExistingBinding?: boolean;
};

export function TelegramBindingForm({
  agentId,
  threadId,
  hasExistingBinding = false,
}: TelegramBindingFormProps) {
  const [peerId, setPeerId] = useState("");
  const [platformUserId, setPlatformUserId] = useState("");

  return (
    <>
      <input name="agent_id" type="hidden" value={agentId} />
      <input name="thread_id" type="hidden" value={threadId} />

      <div className="field">
        <label className="label" htmlFor="channel_id">
          Chat ID
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder="Paste the Chat ID from the bot reply"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          User ID
        </label>
        <input
          className="input"
          id="peer_id"
          name="peer_id"
          onChange={(event) => {
            const nextValue = event.target.value;
            setPeerId(nextValue);
            setPlatformUserId(nextValue);
          }}
          placeholder="Paste the User ID from the bot reply"
          value={peerId}
        />
      </div>

      <p className="helper-copy">
        For most private chats the Chat ID and User ID are the same number — just paste it in both fields.
      </p>

      {/* platform_user_id is always synced to peer_id for standard 1:1 Telegram chats */}
      <input name="platform_user_id" type="hidden" value={platformUserId} />

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "telegram", surface: "connect_im" }}
        idleText={hasExistingBinding ? "Update connection" : "Connect Telegram"}
        pendingText="Saving..."
      />
    </>
  );
}
