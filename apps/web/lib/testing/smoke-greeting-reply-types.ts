import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export type SmokeBriefGreetingReplyInput = {
  replyLanguage: SmokeReplyLanguage;
  styleValue: string | null;
};

export type SmokeNamingReplyInput = {
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  nickname: string | null;
};

export type SmokePreferredNameReplyInput = {
  replyLanguage: SmokeReplyLanguage;
  preferredName: string | null;
};
