"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { AppLanguage } from "@/lib/i18n/site";

type TelegramBindingFormProps = {
  agentId: string;
  characterChannelSlug: string;
  threadId: string;
  hasExistingBinding?: boolean;
  language?: AppLanguage;
};

export function TelegramBindingForm({
  agentId,
  characterChannelSlug,
  threadId,
  hasExistingBinding = false,
  language = "en",
}: TelegramBindingFormProps) {
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
          {isZh ? "会话 ID" : "Chat ID"}
        </label>
        <input
          className="input"
          id="channel_id"
          name="channel_id"
          placeholder={isZh ? "粘贴机器人回复里的会话 ID" : "Paste the Chat ID from the bot reply"}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="peer_id">
          {isZh ? "用户 ID" : "User ID"}
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
          placeholder={isZh ? "粘贴机器人回复里的用户 ID" : "Paste the User ID from the bot reply"}
          value={peerId}
        />
      </div>

      <p className="helper-copy">
        {isZh
          ? "多数 Telegram 私聊里，会话 ID 和用户 ID 是同一个数字，两个输入框都填同一个值即可。"
          : "For most private chats the Chat ID and User ID are the same number — just paste it in both fields."}
      </p>

      {/* platform_user_id is always synced to peer_id for standard 1:1 Telegram chats */}
      <input name="platform_user_id" type="hidden" value={platformUserId} />

      <FormSubmitButton
        eventName="im_bind_started"
        eventPayload={{ platform: "telegram", surface: "connect_im" }}
        idleText={hasExistingBinding ? (isZh ? "更新连接" : "Update connection") : isZh ? "连接 Telegram" : "Connect Telegram"}
        pendingText={isZh ? "保存中..." : "Saving..."}
      />
    </>
  );
}
