import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export type SmokeRelationshipReplyInput = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
};

export type SmokeRelationshipReplyArgs = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export type SmokeContinuationReplyArgs = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
};
