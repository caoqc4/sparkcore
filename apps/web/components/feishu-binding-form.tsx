"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";

type FeishuBindingFormProps = {
  agentId: string;
  characterChannelSlug: string;
  threadId: string;
  hasExistingBinding?: boolean;
};

export function FeishuBindingForm({
  agentId,
  characterChannelSlug,
  threadId,
  hasExistingBinding = false
}: FeishuBindingFormProps) {
  const [peerId, setPeerId] = useState("");
  const [platformUserId, setPlatformUserId] = useState("");

  return (
    <>
      <input name="agent_id" type="hidden" value={agentId} />
      <input
        name="character_channel_slug"
        type="hidden"
        value={characterChannelSlug}
      />
      <input name="thread_id" type="hidden" value={threadId} />

      <div className="field">
        <label className="label" htmlFor="channel_id">
          Feishu Chat ID
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder="Paste the Feishu chat ID"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          Feishu Open ID
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
          placeholder="Paste your Feishu open ID"
          value={peerId}
        />
      </div>

      <p className="helper-copy">
        For a standard 1:1 Feishu bot chat, the open ID is also used as the platform user ID.
      </p>

      <input name="platform_user_id" type="hidden" value={platformUserId} />

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "feishu", surface: "connect_im" }}
        idleText={hasExistingBinding ? "Update connection" : "Connect Feishu"}
        pendingText="Saving..."
      />
    </>
  );
}
