import {
  planMemoryWriteRequestsWithPlannerInputs,
  planRelationshipMemoryWriteRequests
} from "@/lib/chat/memory-write";
import {
  buildPlannerCandidatePreviewFromGenericExtraction,
  buildPlannerCandidatePreviewsFromWriteRequests,
  summarizePlannerCandidates
} from "@/lib/chat/memory-planner-candidates";
import { buildFollowUpRequests } from "@/lib/chat/runtime-orchestration-helpers";
import type {
  RuntimeTurnPlanningArgs,
  RuntimeTurnPlanningArtifacts
} from "@/lib/chat/runtime-contract";

export async function buildRuntimeTurnPlanningArtifacts(
  args: RuntimeTurnPlanningArgs
): Promise<RuntimeTurnPlanningArtifacts> {
  const recentUserContextForMemoryPlanning = args.recentRawTurns
    .slice(-3)
    .map((message) => ({
      role: message.role,
      content: message.content
    }));

  const memoryWritePlanning =
    args.latestUserMessageContent !== null && args.currentSourceMessageId !== null
      ? await planMemoryWriteRequestsWithPlannerInputs({
          latestUserMessage: args.latestUserMessageContent,
          recentContext: recentUserContextForMemoryPlanning,
          sourceTurnId: args.currentSourceMessageId
        })
      : {
          requests: [],
          rejected_generic_candidates: []
        };

  const memoryWriteRequests = [
    ...memoryWritePlanning.requests,
    ...(
      args.latestUserMessageContent !== null && args.currentSourceMessageId !== null
        ? planRelationshipMemoryWriteRequests({
            latestUserMessage: args.latestUserMessageContent,
            sourceTurnId: args.currentSourceMessageId,
            agentId: args.agentId
          })
        : []
    )
  ];

  const memoryPlannerCandidates =
    args.latestUserMessageContent !== null && args.currentSourceMessageId !== null
      ? (() => {
          const latestUserMessage = args.latestUserMessageContent;
          const sourceTurnId = args.currentSourceMessageId;

          return memoryWritePlanning.rejected_generic_candidates.map((candidate) =>
            buildPlannerCandidatePreviewFromGenericExtraction({
              candidate,
              latestUserMessage,
              recentContext: recentUserContextForMemoryPlanning,
              sourceTurnId
            })
          );
        })()
      : [];

  const runtimePlannedCandidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests: memoryWriteRequests,
    activeNamespace: args.activeMemoryNamespace
  }).concat(memoryPlannerCandidates);

  const memoryPlannerSummary = summarizePlannerCandidates(
    runtimePlannedCandidates
  );

  const followUpRequests = buildFollowUpRequests({
    latestUserMessage: args.latestUserMessageContent,
    threadId: args.threadId,
    agentId: args.agentId,
    userId: args.userId,
    continuationReasonCode: args.continuationReasonCode,
    replyLanguage: args.replyLanguage
  });

  return {
    memoryWriteRequests,
    memoryPlannerCandidates,
    runtimePlannedCandidates,
    memoryPlannerSummary,
    followUpRequests
  };
}
