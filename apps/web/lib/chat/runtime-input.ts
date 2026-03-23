import type { AdapterRuntimeInput } from "@/lib/integrations/im-adapter";

export type RuntimeTurnSource = "web" | "im" | "scheduler" | "internal";

export type RuntimeTurnInput = {
  actor: {
    user_id: string;
    agent_id: string;
    thread_id: string;
    workspace_id?: string | null;
  };
  message: {
    content: string;
    message_type: "text";
    source: RuntimeTurnSource;
    timestamp?: string;
    message_id?: string | null;
    metadata?: Record<string, unknown>;
  };
  context?: {
    source_platform?: string | null;
    binding_id?: string | null;
    trigger_kind?: string | null;
  };
};

export function buildRuntimeTurnInput(args: {
  userId: string;
  agentId: string;
  threadId: string;
  workspaceId?: string | null;
  content: string;
  messageType?: "text";
  source: RuntimeTurnSource;
  timestamp?: string;
  messageId?: string | null;
  metadata?: Record<string, unknown>;
  context?: RuntimeTurnInput["context"];
}): RuntimeTurnInput {
  return {
    actor: {
      user_id: args.userId,
      agent_id: args.agentId,
      thread_id: args.threadId,
      workspace_id: args.workspaceId ?? null
    },
    message: {
      content: args.content,
      message_type: args.messageType ?? "text",
      source: args.source,
      timestamp: args.timestamp,
      message_id: args.messageId ?? null,
      metadata: args.metadata
    },
    context: args.context
  };
}

export function buildWebRuntimeTurnInput(args: {
  userId: string;
  agentId: string;
  threadId: string;
  workspaceId?: string | null;
  content: string;
  messageId?: string | null;
  timestamp?: string;
  baseMetadata?: Record<string, unknown> | null;
  trigger: "chat_send" | "retry_assistant_reply";
  triggerKind?: string | null;
}): RuntimeTurnInput {
  return buildRuntimeTurnInput({
    userId: args.userId,
    agentId: args.agentId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    content: args.content,
    source: "web",
    timestamp: args.timestamp,
    messageId: args.messageId ?? null,
    metadata: {
      ...(args.baseMetadata ?? {}),
      trigger: args.trigger
    },
    context: {
      source_platform: "web",
      ...(args.triggerKind ? { trigger_kind: args.triggerKind } : {})
    }
  });
}

export function buildInternalRuntimeTurnInput(args: {
  userId: string;
  agentId: string;
  threadId: string;
  workspaceId?: string | null;
  content: string;
  messageId?: string | null;
}): RuntimeTurnInput {
  return buildRuntimeTurnInput({
    userId: args.userId,
    agentId: args.agentId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    content: args.content,
    source: "internal",
    messageId: args.messageId ?? null,
    context: {
      source_platform: "internal"
    }
  });
}

export function buildRuntimeTurnInputFromAdapterInput(args: {
  input: AdapterRuntimeInput;
  workspaceId?: string | null;
  messageId?: string | null;
  context?: RuntimeTurnInput["context"];
}): RuntimeTurnInput {
  return buildRuntimeTurnInput({
    userId: args.input.user_id,
    agentId: args.input.agent_id,
    threadId: args.input.thread_id,
    workspaceId: args.workspaceId,
    content: args.input.message,
    messageType: args.input.message_type === "text" ? "text" : "text",
    source: args.input.source,
    timestamp: args.input.timestamp,
    messageId: args.messageId ?? null,
    metadata: args.input.metadata,
    context: args.context
  });
}
