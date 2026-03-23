import type { ChatStaticProfileRecord } from "@/lib/chat/memory-records";
import type { MemoryCandidate } from "@/lib/chat/memory-shared";
import type { RuntimeGenericMemoryWriteRequest } from "@/lib/chat/runtime-contract";

export function buildPlannedStaticProfileRecord(args: {
  workspaceId: string;
  userId: string;
  candidate: MemoryCandidate & { normalized_content?: string };
  request?: RuntimeGenericMemoryWriteRequest;
  sourceTurnId?: string;
}): ChatStaticProfileRecord {
  const key =
    args.request?.memory_type === "preference"
      ? "preference"
      : args.request?.memory_type === "profile"
        ? "profile"
        : args.candidate.memory_type;

  return {
    profile_id:
      args.request?.dedupe_key
        ? `prof_static:${args.request.dedupe_key}`
        : `prof_static:planned:${args.candidate.memory_type}:${args.candidate.content}`,
    subject_type: "user",
    subject_id: `user:${args.userId}`,
    scope: {
      user_id: args.userId,
      workspace_id: args.workspaceId
    },
    key,
    value: args.candidate.content,
    confidence: Number(args.candidate.confidence.toFixed(2)),
    source_refs: args.sourceTurnId
      ? [{ kind: "message", source_message_id: args.sourceTurnId }]
      : [],
    updated_at: new Date().toISOString()
  };
}
