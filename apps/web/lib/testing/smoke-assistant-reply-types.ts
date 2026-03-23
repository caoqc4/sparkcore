import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeRecallMemory,
  SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-recall-memory-types";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export type SmokeAssistantReplyInput = {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  modelProfileName: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
};
