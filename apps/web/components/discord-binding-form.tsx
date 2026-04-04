"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { AppLanguage } from "@/lib/i18n/site";

type DiscordBindingFormProps = {
  agentId: string;
  characterChannelSlug: string;
  threadId: string;
  hasExistingBinding?: boolean;
  language?: AppLanguage;
};

export function DiscordBindingForm({
  agentId,
  characterChannelSlug,
  threadId,
  hasExistingBinding = false,
  language = "en",
}: DiscordBindingFormProps) {
  const isZh = language === "zh-CN";
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
          {isZh ? "私信频道 ID" : "DM Channel ID"}
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder={isZh ? "粘贴 Discord 私信频道 ID" : "Paste the Discord DM channel ID"}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          {isZh ? "Discord 用户 ID" : "Discord User ID"}
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
          placeholder={isZh ? "粘贴你的 Discord 用户 ID" : "Paste your Discord user ID"}
          value={peerId}
        />
      </div>

      <p className="helper-copy">
        {isZh
          ? "对于标准的一对一 Discord 私信，你的用户 ID 同时也会作为平台用户 ID。"
          : "For a standard 1:1 Discord DM, your user ID is also used as the platform user ID."}
      </p>

      <input name="platform_user_id" type="hidden" value={platformUserId} />

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "discord", surface: "connect_im" }}
        idleText={hasExistingBinding ? (isZh ? "更新连接" : "Update connection") : isZh ? "连接 Discord" : "Connect Discord"}
        pendingText={isZh ? "保存中..." : "Saving..."}
      />
    </>
  );
}
