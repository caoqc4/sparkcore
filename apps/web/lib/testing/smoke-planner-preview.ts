import {
  buildPlannerCandidatePreviewFromGenericExtraction,
  buildPlannerCandidatePreviewFromProductFeedbackSignal,
  summarizePlannerCandidates,
  type PlannerCandidatePreview
} from "@/lib/chat/memory-planner-candidates";
import { detectNegativeProductFeedbackSignal } from "@/lib/chat/product-feedback-incidents";
import { buildRuntimeMemoryWriteRequestMetadata } from "@/lib/chat/runtime-preview-metadata";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import { detectSmokeNicknameCandidate, detectSmokeUserPreferredNameCandidate } from "@/lib/testing/smoke-relationship-name-detection";

function shouldCreateGoalCandidate(trimmedContent: string) {
  return /规划|计划|方案|roadmap|plan|访谈|调研|拆解|先从.+开始/i.test(
    trimmedContent
  );
}

function shouldRejectTransientMood(trimmedContent: string) {
  return /(难过|焦虑|伤心|低落|sad|anxious|upset|overwhelmed)/i.test(
    trimmedContent
  ) && /(不用记住|别记住|不要记住|just today|don't remember|do not remember)/i.test(
    trimmedContent
  );
}

function buildSmokeWriteRequests(args: {
  trimmedContent: string;
  sourceMessageId: string;
  agentId: string;
}): RuntimeMemoryWriteRequest[] {
  const requests: RuntimeMemoryWriteRequest[] = [];
  const nickname = detectSmokeNicknameCandidate(args.trimmedContent);
  const preferredName = detectSmokeUserPreferredNameCandidate(args.trimmedContent);

  if (nickname) {
    requests.push({
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "agent_nickname",
      relationship_scope: "user_agent",
      candidate_content: nickname,
      reason: "User explicitly specified the assistant nickname.",
      confidence: 0.99,
      source_turn_id: args.sourceMessageId,
      target_agent_id: args.agentId
    });
  }

  if (preferredName) {
    requests.push({
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "user_preferred_name",
      relationship_scope: "user_agent",
      candidate_content: preferredName,
      reason: "User explicitly specified the preferred name to be used.",
      confidence: 0.99,
      source_turn_id: args.sourceMessageId,
      target_agent_id: args.agentId
    });
  }

  if (shouldCreateGoalCandidate(args.trimmedContent)) {
    requests.push({
      kind: "generic_memory",
      memory_type: "goal",
      candidate_content: args.trimmedContent,
      reason: "User stated a current task or goal for this thread.",
      confidence: 0.92,
      source_turn_id: args.sourceMessageId
    });
  }

  return requests;
}

function buildSmokeExtraPlannerCandidates(args: {
  trimmedContent: string;
  sourceMessageId: string;
}): PlannerCandidatePreview[] {
  const candidates: PlannerCandidatePreview[] = [];
  const negativeProductFeedbackSignal = detectNegativeProductFeedbackSignal(
    args.trimmedContent
  );
  const productFeedbackCandidate = buildPlannerCandidatePreviewFromProductFeedbackSignal(
    {
      signal: negativeProductFeedbackSignal,
      latestUserMessage: args.trimmedContent,
      sourceMessageId: args.sourceMessageId,
      assistantMessageId: null
    }
  );

  if (productFeedbackCandidate) {
    candidates.push(productFeedbackCandidate);
  }

  if (shouldRejectTransientMood(args.trimmedContent)) {
    candidates.push(
      buildPlannerCandidatePreviewFromGenericExtraction({
        candidate: {
          memory_type: "mood",
          content: args.trimmedContent,
          reason: "User explicitly said this short-lived mood should not be stored.",
          confidence: 0.94,
          should_store: false
        },
        latestUserMessage: args.trimmedContent,
        recentContext: [],
        sourceTurnId: args.sourceMessageId
      })
    );
  }

  return candidates;
}

export function buildSmokePlannerPreviewMetadata(args: {
  trimmedContent: string;
  sourceMessageId: string;
  agentId: string;
}) {
  const requests = buildSmokeWriteRequests(args);
  const extraPlannerCandidates = buildSmokeExtraPlannerCandidates(args);

  if (requests.length === 0 && extraPlannerCandidates.length === 0) {
    return null;
  }

  const metadata = buildRuntimeMemoryWriteRequestMetadata(
    requests,
    null,
    extraPlannerCandidates
  );
  const preview = Array.isArray(metadata.runtime_memory_candidates?.preview)
    ? metadata.runtime_memory_candidates.preview.map((candidate) => {
        if (
          candidate &&
          typeof candidate === "object" &&
          !Array.isArray(candidate) &&
          candidate.memory_type === "goal" &&
          candidate.target_layer === "thread_state_candidate"
        ) {
          return {
            ...candidate,
            write_boundary: "thread",
            boundary_reason: "thread_boundary_preserved_thread_state_candidate",
            routed_scope: "thread_local"
          };
        }

        return candidate;
      })
    : [];
  const summary = summarizePlannerCandidates(
    preview.filter(
      (candidate): candidate is PlannerCandidatePreview =>
        Boolean(candidate && typeof candidate === "object" && !Array.isArray(candidate))
    )
  );

  return {
    ...metadata,
    runtime_memory_candidates: {
      count: preview.length,
      preview,
      summary
    },
    runtime_memory_candidate_count: preview.length,
    runtime_memory_candidates_preview: preview,
    runtime_memory_candidates_summary: summary
  };
}
