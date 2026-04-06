import type {
  AnswerCarryoverPolicy,
  AnswerForbiddenMove,
  AnswerQuestionType,
  AnswerSceneGoal,
  AnswerStrategy
} from "@/lib/chat/answer-decision";
import { buildAnswerCompositionSpec } from "@/lib/chat/answer-composition-spec";
import { buildHumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-packet";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import {
  buildRuntimeTemporalContext,
  getImTemporalContinuityHints
} from "@/lib/chat/runtime-composition-context";
import type {
  AnswerCompositionSpec,
  BuildRuntimeCompositionArtifactsArgs,
  RuntimeCompositionArtifacts
} from "@/lib/chat/runtime-composition-contracts";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import { buildRuntimePromptSections } from "@/lib/chat/runtime-prompt-sections";

export function buildRuntimeCompositionArtifacts(
  args: BuildRuntimeCompositionArtifactsArgs
): RuntimeCompositionArtifacts {
  const runtimeSurface =
    args.preparedRuntimeTurn.input.message.source === "im" ? "im_summary" : "full";
  const imTemporalContinuityHints = getImTemporalContinuityHints(
    args.preparedRuntimeTurn.session.recent_raw_turns
  );
  const runtimeTemporalContext = buildRuntimeTemporalContext();
  const answerCompositionSpec = buildAnswerCompositionSpec({
    runtimeSurface,
    replyLanguage: args.replyLanguage,
    latestUserMessage: args.latestUserMessageContent,
    temporalContext: runtimeTemporalContext,
    temporalHints: imTemporalContinuityHints,
    recentRawTurns: args.preparedRuntimeTurn.session.recent_raw_turns,
    answer: {
      questionType: args.answerQuestionType,
      strategy: args.answerStrategy,
      carryoverPolicy: args.answerCarryoverPolicy,
      forbiddenMoves: args.answerForbiddenMoves,
      sceneGoal: args.answerSceneGoal
    }
  });
  const humanizedDeliveryPacket: HumanizedDeliveryPacket | null =
    answerCompositionSpec.runtimeSurface === "im_summary" &&
    answerCompositionSpec.latestUserMessage
      ? buildHumanizedDeliveryPacket({
          spec: answerCompositionSpec,
          detectNegativeProductFeedbackSignal:
            args.detectNegativeProductFeedbackSignal,
          hashString: args.hashString
        })
      : null;

  const { systemPromptSections } = buildRuntimePromptSections({
    runtimeSurface,
    governance: args.preparedRuntimeTurn.governance?.output_governance,
    roleExpression: args.preparedRuntimeTurn.governance?.role_expression,
    humanizedDeliveryPacket,
    replyLanguage: args.replyLanguage,
    systemPromptArgs: {
      roleCorePacket:
        args.roleCoreCloseNoteArtifacts.roleCorePacketWithMemoryHandoff,
      agentSystemPrompt: args.preparedRuntimeTurn.role.agent.system_prompt,
      latestUserMessage: args.latestUserMessageContent ?? "",
      recalledMemories: args.allRecalledMemories,
      relevantKnowledge:
        args.memoryGovernanceContext.applicableKnowledge as RuntimeKnowledgeSnippet[],
      compactedThreadSummary: args.compactedThreadSummary,
      activeMemoryNamespace: args.memoryGovernanceContext.activeMemoryNamespace,
      replyLanguage: args.replyLanguage,
      relationshipRecall:
        args.preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall,
      threadContinuityPrompt: args.threadContinuityPrompt,
      threadState: args.preparedRuntimeTurn.session.thread_state,
      closeNoteHandoffPacket:
        args.roleCoreCloseNoteArtifacts.roleCoreCloseNoteHandoffPacket,
      closeNoteArtifact:
        args.roleCoreCloseNoteArtifacts.roleCoreCloseNoteArtifact,
      closeNoteOutput: args.roleCoreCloseNoteArtifacts.roleCoreCloseNoteOutput,
      closeNoteRecord: args.roleCoreCloseNoteArtifacts.roleCoreCloseNoteRecord,
      closeNoteArchive: args.roleCoreCloseNoteArtifacts.roleCoreCloseNoteArchive,
      closeNotePersistencePayload:
        args.roleCoreCloseNoteArtifacts.roleCoreCloseNotePersistencePayload,
      closeNotePersistenceEnvelope:
        args.roleCoreCloseNoteArtifacts.roleCoreCloseNotePersistenceEnvelope,
      closeNotePersistenceManifest:
        args.roleCoreCloseNoteArtifacts.roleCoreCloseNotePersistenceManifest,
      runtimeSurface,
      temporalContext: runtimeTemporalContext,
      temporalHints: imTemporalContinuityHints
    }
  });

  return {
    runtimeSurface,
    imTemporalContinuityHints,
    runtimeTemporalContext,
    answerCompositionSpec,
    humanizedDeliveryPacket,
    systemPromptSections
  };
}
