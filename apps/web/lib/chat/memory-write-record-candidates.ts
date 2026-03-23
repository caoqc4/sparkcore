import type {
  ChatMemoryRecord,
  ChatStaticProfileRecord
} from "@/lib/chat/memory-records";
import type { MemoryCandidate } from "@/lib/chat/memory-shared";
import type {
  RuntimeGenericMemoryWriteRequest,
  RuntimeRelationshipMemoryWriteRequest
} from "@/lib/chat/runtime-contract";
import type {
  ThreadContinuityStatus,
  ThreadStateRecord
} from "@/lib/chat/thread-state";

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

export function buildPlannedRelationshipMemoryRecord(args: {
  workspaceId: string;
  userId: string;
  request: RuntimeRelationshipMemoryWriteRequest;
}): ChatMemoryRecord {
  const now = new Date().toISOString();

  return {
    memory_id:
      args.request.dedupe_key
        ? `mem_rel:${args.request.dedupe_key}`
        : `mem_rel:${args.request.relationship_key}:${args.request.candidate_content}`,
    memory_type: "relationship",
    scope: {
      user_id: args.userId,
      workspace_id: args.workspaceId,
      agent_id: args.request.target_agent_id ?? null,
      thread_id: args.request.target_thread_id ?? null
    },
    subject: {
      entity_type: "relationship",
      entity_id: `user:${args.userId}:agent:${args.request.target_agent_id}`
    },
    canonical_text: args.request.candidate_content,
    normalized_payload: {
      relationship_key: args.request.relationship_key,
      relationship_scope: args.request.relationship_scope,
      target_agent_id: args.request.target_agent_id,
      target_thread_id: args.request.target_thread_id ?? null
    },
    stability:
      args.request.relationship_key === "user_address_style" ? "medium" : "high",
    status: "active",
    confidence: Number(args.request.confidence.toFixed(2)),
    effective_at: now,
    invalid_at: null,
    updated_at: now,
    source_refs: [
      {
        kind: "message",
        source_message_id: args.request.source_turn_id
      }
    ]
  };
}

export type PlannedThreadStateCandidate = Pick<
  ThreadStateRecord,
  | "thread_id"
  | "agent_id"
  | "focus_mode"
  | "current_language_hint"
  | "recent_turn_window_size"
  | "continuity_status"
  | "updated_at"
> & {
  semantic_source: "goal_memory_candidate";
  semantic_value: string;
  source_turn_id?: string | null;
};

export function buildPlannedThreadStateCandidate(args: {
  threadId: string;
  agentId: string;
  goalText: string;
  sourceTurnId?: string | null;
  continuityStatus?: ThreadContinuityStatus | null;
}): PlannedThreadStateCandidate {
  return {
    thread_id: args.threadId,
    agent_id: args.agentId,
    focus_mode: args.goalText.trim(),
    current_language_hint: null,
    recent_turn_window_size: null,
    continuity_status: args.continuityStatus ?? null,
    updated_at: new Date().toISOString(),
    semantic_source: "goal_memory_candidate",
    semantic_value: args.goalText.trim(),
    source_turn_id: args.sourceTurnId ?? null
  };
}

export function buildPlannedThreadStateCandidatePreview(args: {
  goalText: string;
  sourceTurnId?: string | null;
}) {
  return {
    semantic_source: "goal_memory_candidate" as const,
    semantic_value: args.goalText.trim(),
    focus_mode: args.goalText.trim(),
    source_turn_id: args.sourceTurnId ?? null
  };
}
