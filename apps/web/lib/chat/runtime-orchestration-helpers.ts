import {
  isPresenceConfirmingFollowUpPrompt,
  isRelationshipRoughDayPrompt,
  isRelationshipSupportivePrompt
} from "@/lib/chat/answer-decision-signals";
import type { ContinuationReasonCode } from "@/lib/chat/answer-decision";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RuntimeFollowUpRequest } from "@/lib/chat/runtime-contract";

export function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateForCompactPrompt(
  value: string | null | undefined,
  maxChars: number
) {
  const normalized = compactWhitespace(value ?? "");
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

export function resolveKnowledgeLoadLimit(route: string | null | undefined) {
  switch (route) {
    case "no_knowledge":
      return 0;
    case "light_knowledge":
      return 3;
    case "artifact_knowledge":
      return 4;
    case "domain_knowledge":
    default:
      return 8;
  }
}

export function summarizeAgentPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

export function buildMessagePreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

export function shouldPlanGentleCheckIn(args: {
  latestUserMessage: string | null;
  continuationReasonCode: ContinuationReasonCode | null;
}) {
  if (!args.latestUserMessage) {
    return false;
  }

  return (
    isRelationshipRoughDayPrompt(args.latestUserMessage) ||
    isRelationshipSupportivePrompt(args.latestUserMessage) ||
    isPresenceConfirmingFollowUpPrompt(args.latestUserMessage) ||
    args.continuationReasonCode === "brief-supportive-carryover"
  );
}

export function buildFollowUpRequests(args: {
  latestUserMessage: string | null;
  threadId: string;
  agentId: string;
  userId: string;
  continuationReasonCode: ContinuationReasonCode | null;
  replyLanguage: RuntimeReplyLanguage;
}): RuntimeFollowUpRequest[] {
  if (!shouldPlanGentleCheckIn(args)) {
    return [];
  }

  return [
    {
      kind: "gentle_check_in",
      trigger_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
      reason:
        args.continuationReasonCode === "brief-supportive-carryover"
          ? "brief supportive carryover may benefit from a gentle follow-up"
          : "supportive or rough-day conversation may benefit from a gentle check-in",
      payload: {
        thread_id: args.threadId,
        agent_id: args.agentId,
        user_id: args.userId,
        reply_language: args.replyLanguage,
        source: "runtime_planner"
      }
    }
  ];
}
