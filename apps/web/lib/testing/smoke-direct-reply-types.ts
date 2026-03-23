import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeRecallMemory,
  SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-recall-memory-types";

export type SmokeDirectOrGroundedReplyArgs = {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  modelProfileName: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
};
