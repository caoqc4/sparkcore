import { loadThreadMessages } from "@/lib/chat/message-read";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  summarizePlannerCandidates,
  type PlannerCandidatePreview
} from "@/lib/chat/memory-planner-candidates";
import {
  getRuntimePreviewMetadataGroup,
  getRuntimePreviewMetadataObject
} from "@/lib/chat/runtime-preview-metadata";

export type ProductFeedbackSignal = {
  detected: boolean;
  category:
    | "memory_capability_mocking"
    | "image_mismatch"
    | "general_quality_complaint"
    | null;
  confidence: "high" | "medium" | "low" | null;
  reason: string | null;
};

type ThreadMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

function isPlannerCandidatePreview(
  value: unknown
): value is PlannerCandidatePreview {
  const candidate = getRuntimePreviewMetadataObject(value);

  return (
    candidate !== null &&
    typeof candidate.candidate_id === "string" &&
    typeof candidate.decision_kind === "string" &&
    typeof candidate.target_layer === "string"
  );
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

export function detectNegativeProductFeedbackSignal(
  latestUserMessage: string
): ProductFeedbackSignal {
  const normalized = normalizeComparableText(latestUserMessage);

  if (!normalized) {
    return {
      detected: false,
      category: null,
      confidence: null,
      reason: null
    };
  }

  if (
    /记忆(力|能力)?(不行|太差|好差|很差|拉胯|不太行|不怎么样)|你.*记不住|你又忘了|你怎么又忘了|你这记忆|memory.*(bad|weak|terrible)|you.*forgot again|you can'?t remember/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "memory_capability_mocking",
      confidence: "high",
      reason: "User complained about memory quality or mocked memory capability."
    };
  }

  if (
    /图片(不对|不符|不符合|不一样|不匹配|跑偏|偏了|有问题)|图不对|图有问题|图片和.*不符|image.*(wrong|off|doesn'?t match|mismatch)|picture.*(wrong|off|doesn'?t match|mismatch)/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "image_mismatch",
      confidence: "high",
      reason: "User said generated image or visual result does not match the request."
    };
  }

  if (
    /你这产品|你这个产品|这个功能(不行|很差|太差)|回复(不对|很差|不行)|效果(不行|很差|不好)|体验(很差|不好)|bug|有毛病|吐槽|槽点|bad product|poor quality|this is wrong|this is bad/i.test(
      normalized
    )
  ) {
    return {
      detected: true,
      category: "general_quality_complaint",
      confidence: "medium",
      reason: "User gave general negative product or quality feedback."
    };
  }

  return {
    detected: false,
    category: null,
    confidence: null,
    reason: null
  };
}

function buildIncidentSummary(args: {
  signal: ProductFeedbackSignal;
  latestUserMessage: string;
}) {
  const category = args.signal.category ?? "negative_product_feedback";
  const normalizedMessage = args.latestUserMessage.replace(/\s+/g, " ").trim();

  return `[${category}] ${normalizedMessage.slice(0, 140)}`;
}

function buildContextWindow(args: {
  messages: ThreadMessageRow[];
  sourceMessageId: string;
  assistantMessageId: string;
}) {
  const sourceIndex = args.messages.findIndex(
    (message) => message.id === args.sourceMessageId
  );
  const assistantIndex = args.messages.findIndex(
    (message) => message.id === args.assistantMessageId
  );
  const anchorIndex = Math.max(sourceIndex, assistantIndex);

  if (anchorIndex < 0) {
    return [];
  }

  const start = Math.max(0, anchorIndex - 5);
  const end = Math.min(args.messages.length, anchorIndex + 1);

  return args.messages.slice(start, end).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    created_at: message.created_at
  }));
}

async function writeProductFeedbackIncidentPreview(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  sourceMessageId: string;
  latestUserMessage: string;
  incidentId: string;
  signal: ProductFeedbackSignal;
  reusedExisting: boolean;
}) {
  await updateAssistantPreviewMetadata({
    supabase: args.supabase,
    assistantMessageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    updates: (currentMetadata) => {
      const plannerCandidate = buildPlannerCandidatePreviewFromProductFeedbackSignal(
        {
          signal: args.signal,
          latestUserMessage: args.latestUserMessage,
          sourceMessageId: args.sourceMessageId,
          assistantMessageId: args.assistantMessageId
        }
      );
      const existingPlannerCandidates =
        getRuntimePreviewMetadataGroup(currentMetadata, "runtime_memory_candidates");
      const existingPreview = Array.isArray(existingPlannerCandidates?.preview)
        ? existingPlannerCandidates.preview
        : [];
      const nextPlannerPreview = plannerCandidate
        ? [
            ...existingPreview.filter(
              (item) =>
                !(
                  item &&
                  typeof item === "object" &&
                  !Array.isArray(item) &&
                  (item as { candidate_id?: unknown }).candidate_id ===
                    plannerCandidate.candidate_id
                )
            ),
            plannerCandidate
          ]
        : existingPreview;
      const nextPlannerSummary = summarizePlannerCandidates(
        nextPlannerPreview.filter(isPlannerCandidatePreview)
      );

      return {
        runtime_memory_candidates: {
          count: nextPlannerPreview.length,
          preview: nextPlannerPreview,
          summary: nextPlannerSummary
        },
        runtime_memory_candidate_count: nextPlannerPreview.length,
        runtime_memory_candidates_preview: nextPlannerPreview,
        runtime_memory_candidates_summary: nextPlannerSummary,
        product_feedback_incident: {
          incident_id: args.incidentId,
          signal_category: args.signal.category,
          confidence: args.signal.confidence,
          captured: true,
          reused_existing: args.reusedExisting
        },
        humanized_delivery: {
          ...(currentMetadata?.humanized_delivery &&
          typeof currentMetadata.humanized_delivery === "object" &&
          !Array.isArray(currentMetadata.humanized_delivery)
            ? (currentMetadata.humanized_delivery as Record<string, unknown>)
            : {}),
          negative_product_feedback_detected: true,
          negative_product_feedback_category: args.signal.category,
          negative_product_feedback_confidence: args.signal.confidence
        }
      };
    }
  });
}

export async function captureNegativeProductFeedbackIncident(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  agentId: string;
  threadId: string;
  sourceMessageId: string;
  assistantMessageId: string;
  latestUserMessage: string;
  assistantReply: string;
  signal: ProductFeedbackSignal;
}) {
  if (!args.signal.detected) {
    return { inserted: false, incidentId: null, reusedExisting: false };
  }

  const { data: existingIncident, error: existingError } = await args.supabase
    .from("product_feedback_incidents")
    .select("id")
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .eq("source_message_id", args.sourceMessageId)
    .eq("signal_type", "negative_product_feedback")
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to check existing product feedback incidents: ${existingError.message}`
    );
  }

  if (existingIncident?.id) {
    await writeProductFeedbackIncidentPreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      sourceMessageId: args.sourceMessageId,
      latestUserMessage: args.latestUserMessage,
      incidentId: existingIncident.id,
      signal: args.signal,
      reusedExisting: true
    });

    return {
      inserted: false,
      incidentId: existingIncident.id,
      reusedExisting: true
    };
  }

  const { data: threadMessages, error: threadMessagesError } = await loadThreadMessages({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    select: "id, role, content, status, metadata, created_at"
  });

  if (threadMessagesError) {
    throw new Error(
      `Failed to load thread messages for product feedback capture: ${threadMessagesError.message}`
    );
  }

  const orderedMessages = ((threadMessages ?? []) as ThreadMessageRow[]).filter(
    (message) => message.status !== "failed"
  );
  const contextWindow = buildContextWindow({
    messages: orderedMessages,
    sourceMessageId: args.sourceMessageId,
    assistantMessageId: args.assistantMessageId
  });

  const payload = {
    signal: args.signal,
    latest_user_message: args.latestUserMessage,
    assistant_reply: args.assistantReply,
    context_window: contextWindow,
    export_ready: true
  };

  const { data: incident, error: insertError } = await args.supabase
    .from("product_feedback_incidents")
    .insert({
      workspace_id: args.workspaceId,
      user_id: args.userId,
      agent_id: args.agentId,
      thread_id: args.threadId,
      source_message_id: args.sourceMessageId,
      assistant_message_id: args.assistantMessageId,
      signal_type: "negative_product_feedback",
      status: "captured",
      summary: buildIncidentSummary({
        signal: args.signal,
        latestUserMessage: args.latestUserMessage
      }),
      payload
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `Failed to insert product feedback incident: ${insertError.message}`
    );
  }

  await writeProductFeedbackIncidentPreview({
    supabase: args.supabase,
    assistantMessageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    sourceMessageId: args.sourceMessageId,
    latestUserMessage: args.latestUserMessage,
    incidentId: incident.id,
    signal: args.signal,
    reusedExisting: false
  });

  return { inserted: true, incidentId: incident.id, reusedExisting: false };
}
