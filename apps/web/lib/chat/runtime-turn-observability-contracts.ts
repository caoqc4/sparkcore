import type { RuntimeModelProfileResolutionTimingMs } from "@/lib/chat/runtime-model-profile-resolution";
import type { PromptSectionLength } from "@/lib/chat/runtime-prompt-contracts";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type { RuntimeAssistantPayload } from "@/lib/chat/assistant-message-payload";
import type {
  RuntimeMetadataObject,
  RuntimeTurnResult
} from "@/lib/chat/runtime-contract";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";

export type RuntimeTimingRecord = RuntimeMetadataObject;

export type ExistingRuntimeTiming =
  | RuntimeTimingRecord
  | null
  | undefined;

export type PromptPreparationStats = {
  promptMessageCount: number;
  promptSystemChars: number;
  promptSystemSectionLengths: PromptSectionLength[];
  promptUserChars: number;
  promptAssistantChars: number;
  promptTotalChars: number;
  promptTotalBytes: number;
  promptApproxTokenCount: number;
};

export type AssistantPayloadStats = {
  assistantPayloadContentBytes: number;
  assistantPayloadMetadataBytes: number;
  assistantPayloadTotalBytes: number;
};

export type BaseRuntimeTimingArgs = PromptPreparationStats &
  AssistantPayloadStats & {
    knowledgeLoadDurationMs: number;
    generateTextDurationMs: number;
    modelProfileTimingMs: RuntimeModelProfileResolutionTimingMs;
    persistAssistantDurationMs: number;
    updateThreadDurationMs: number;
    runPreparedTotalDurationMs: number;
  };

export type ThreadStateWritebackResult =
  | {
      status: "written";
      repository: string;
      anchor_mode: string;
      focus_projection_reason: string;
      continuity_projection_reason: string;
    }
  | {
      status: string;
      repository: string;
      reason: string;
    };

export type RuntimeMemoryTimingMs =
  | {
      memory_recall?: number | null;
      nickname_recall?: number | null;
      preferred_name_recall?: number | null;
      address_style_recall?: number | null;
      total?: number | null;
    }
  | null
  | undefined;

export type BuildRuntimeDebugMetadataAfterWritebackArgs =
  BaseRuntimeTimingArgs & {
    existingDebugMetadata: RuntimeMetadataObject | null | undefined;
    existingRuntimeTiming: ExistingRuntimeTiming;
    humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
    threadStateWritebackDurationMs: number;
    threadStateWriteback: ThreadStateWritebackResult;
  };

export type BuildRuntimeDebugMetadataAfterWritebackSoftFailArgs =
  BaseRuntimeTimingArgs & {
    existingDebugMetadata: RuntimeMetadataObject | null | undefined;
    existingRuntimeTiming: ExistingRuntimeTiming;
    humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  };

export type PreparedRuntimeTurnExecutionContext = PromptPreparationStats &
  AssistantPayloadStats & {
    threadId: string;
    agentId: string;
    knowledgeRoute: string;
    knowledgeLoadLimit: number;
    humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
    knowledgeLoadDurationMs: number;
    generateTextDurationMs: number;
    modelProfileTimingMs: RuntimeModelProfileResolutionTimingMs;
    runPreparedStartedAt: number;
    nowMs: () => number;
    elapsedMs: (startedAt: number) => number;
  };

export type BuildPreparedRuntimeTurnLogFieldsArgs =
  PreparedRuntimeTurnExecutionContext & {
    persistAssistantDurationMs: number;
    updateThreadDurationMs: number;
  };

export type RuntimeTurnSideEffectsExecutionContext = Omit<
  PreparedRuntimeTurnExecutionContext,
  "threadId" | "agentId" | "knowledgeRoute" | "knowledgeLoadLimit"
>;

export type RuntimeTurnSideEffectsPersistenceArtifacts = {
  assistantPayload: RuntimeAssistantPayload;
} & AssistantPayloadStats;

export type RuntimeTurnSideEffectsWritebackArtifacts = {
  runtimeTurnResult: RuntimeTurnResult;
};

export type BuildGenerateAgentReplyDebugMetadataArgs = {
  existingDebugMetadata: RuntimeTurnResult["debug_metadata"];
  prepareRuntimeMemoryDurationMs: number;
  runtimeMemoryTimingMs: RuntimeMemoryTimingMs;
  modelProfileDurationMs: number;
  prepareRuntimeTurnDurationMs: number;
  runPreparedRuntimeTurnDurationMs: number;
};

export type BuildGenerateAgentReplyLogFieldsArgs = {
  threadId: string;
  agentId: string;
  prepareRuntimeMemoryDurationMs: number;
  runtimeMemoryTimingMs: RuntimeMemoryTimingMs;
  modelProfileDurationMs: number;
  prepareRuntimeTurnDurationMs: number;
  runPreparedRuntimeTurnDurationMs: number;
};

export type RuntimeTurnSideEffectsPostGenerationArtifacts = {
  assistantPayload: RuntimeAssistantPayload;
  runtimeTurnResult: RuntimeTurnResult;
} & AssistantPayloadStats;

export type ApplyRuntimeTurnSideEffectsArgs = {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  userId: string;
  persistenceArtifacts: RuntimeTurnSideEffectsPersistenceArtifacts;
  writebackArtifacts: RuntimeTurnSideEffectsWritebackArtifacts;
  executionContext: RuntimeTurnSideEffectsExecutionContext;
};
