import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export function buildSmokeRelationshipReplyContext(args: {
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  return {
    addressStyleValue: args.addressStyleMemory?.content ?? null,
    selfName: args.nicknameMemory?.content ?? args.agentName,
    userName: args.preferredNameMemory?.content ?? null
  };
}
