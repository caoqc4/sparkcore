import {
  getMemoryCategory,
  getMemoryKey,
  getMemoryScope,
  getMemorySourceRefs,
  getMemoryStability,
  getMemoryStatus
} from "@/lib/chat/memory-v2";
import type { StoredMemory } from "@/lib/chat/memory-shared";

export type VisibleMemoryRecord = {
  id: string;
  memory_type: string | null;
  category: string;
  key: string;
  value: unknown;
  scope: string;
  target_agent_id: string | null;
  target_thread_id: string | null;
  target_agent_name: string | null;
  stability: string;
  status: string;
  source_refs: unknown[];
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
  source_message_id: string | null;
  source_thread_id: string | null;
  source_thread_title: string | null;
  source_timestamp: string | null;
  created_at: string;
  updated_at: string;
};

export type HiddenMemoryRecord = VisibleMemoryRecord;
export type IncorrectMemoryRecord = VisibleMemoryRecord;
export type SupersededMemoryRecord = VisibleMemoryRecord;

export function buildVisibleMemoryRecord(args: {
  memory: StoredMemory;
  agentNameById: Map<string, string>;
  sourceMessageById: Map<string, { thread_id: string | null; created_at: string }>;
  sourceThreadTitleById: Map<string, string>;
}): VisibleMemoryRecord {
  const sourceMessage = args.memory.source_message_id
    ? args.sourceMessageById.get(args.memory.source_message_id) ?? null
    : null;

  return {
    ...args.memory,
    content: args.memory.content,
    confidence: args.memory.confidence,
    category: getMemoryCategory(args.memory),
    key: getMemoryKey(args.memory),
    value: args.memory.value ?? args.memory.content,
    scope: getMemoryScope(args.memory),
    target_agent_id: args.memory.target_agent_id ?? null,
    target_thread_id: args.memory.target_thread_id ?? null,
    target_agent_name: args.memory.target_agent_id
      ? args.agentNameById.get(args.memory.target_agent_id) ?? null
      : null,
    stability: getMemoryStability(args.memory),
    status: getMemoryStatus(args.memory),
    metadata: (args.memory.metadata ?? {}) as Record<string, unknown>,
    source_message_id: args.memory.source_message_id ?? null,
    source_refs: getMemorySourceRefs(args.memory),
    source_thread_id: sourceMessage?.thread_id ?? null,
    source_thread_title: sourceMessage?.thread_id
      ? args.sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
      : null,
    source_timestamp: sourceMessage?.created_at ?? null,
    created_at: args.memory.created_at,
    updated_at: args.memory.updated_at ?? args.memory.created_at
  };
}
