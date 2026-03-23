import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export function getSmokeIntroReplyContext(args: {
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  return {
    styleValue: args.addressStyleMemory?.content ?? null,
    selfName: args.nicknameMemory?.content ?? args.agentName,
    userName: args.preferredNameMemory?.content ?? null,
    nickname: args.nicknameMemory?.content ?? null,
    preferredName: args.preferredNameMemory?.content ?? null,
    hasNicknameMemory: Boolean(args.nicknameMemory)
  };
}
