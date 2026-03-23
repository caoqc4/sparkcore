import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export type SmokeIntroReplyInput = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
};
