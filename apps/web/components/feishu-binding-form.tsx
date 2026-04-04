"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { AppLanguage } from "@/lib/i18n/site";

type FeishuBindingFormProps = {
  agentId: string;
  characterChannelSlug: string;
  threadId: string;
  hasExistingBinding?: boolean;
  language?: AppLanguage;
};

export function FeishuBindingForm({
  agentId,
  characterChannelSlug,
  threadId,
  hasExistingBinding = false,
  language = "en",
}: FeishuBindingFormProps) {
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
          {isZh ? "飞书会话 ID" : "Feishu Chat ID"}
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder={isZh ? "粘贴飞书会话 ID" : "Paste the Feishu chat ID"}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          {isZh ? "飞书 Open ID" : "Feishu Open ID"}
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
          placeholder={isZh ? "粘贴你的飞书 Open ID" : "Paste your Feishu open ID"}
          value={peerId}
        />
      </div>

      <p className="helper-copy">
        {isZh
          ? "对于标准的一对一飞书机器人聊天，Open ID 同时也会作为平台用户 ID。"
          : "For a standard 1:1 Feishu bot chat, the open ID is also used as the platform user ID."}
      </p>

      <input name="platform_user_id" type="hidden" value={platformUserId} />

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "feishu", surface: "connect_im" }}
        idleText={hasExistingBinding ? (isZh ? "更新连接" : "Update connection") : isZh ? "连接飞书" : "Connect Feishu"}
        pendingText={isZh ? "保存中..." : "Saving..."}
      />
    </>
  );
}
