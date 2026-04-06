import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type {
  AnswerStrategyRelationshipRecallSpec,
  AnswerCompositionTemporalContext,
  AnswerCompositionTemporalHints
} from "@/lib/chat/runtime-composition-contracts";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type {
  OutputGovernancePacketV1,
  RoleExpressionPacketV1
} from "@/lib/chat/output-governance";
import type {
  RoleCoreMemoryCloseNoteArchive,
  RoleCoreMemoryCloseNoteArtifact,
  RoleCoreMemoryCloseNoteHandoffPacket,
  RoleCoreMemoryCloseNoteOutput,
  RoleCoreMemoryCloseNotePersistenceEnvelope,
  RoleCoreMemoryCloseNotePersistenceManifest,
  RoleCoreMemoryCloseNotePersistencePayload,
  RoleCoreMemoryCloseNoteRecord,
  RoleCorePacket,
  RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { buildCompactedThreadSummary } from "@/lib/chat/thread-compaction";

export type AgentSystemPromptRelationshipRecall =
  AnswerStrategyRelationshipRecallSpec & {
  directNamingQuestion: boolean;
  directPreferredNameQuestion: boolean;
  relationshipStylePrompt: boolean;
};

export type AgentSystemPromptSectionsArgs = {
  roleCorePacket: RoleCorePacket;
  agentSystemPrompt: string;
  latestUserMessage: string;
  recalledMemories?: RecalledMemory[];
  relevantKnowledge?: RuntimeKnowledgeSnippet[];
  compactedThreadSummary?: ReturnType<typeof buildCompactedThreadSummary> | null;
  activeMemoryNamespace?: ActiveRuntimeMemoryNamespace | null;
  replyLanguage?: RuntimeReplyLanguage;
  relationshipRecall?: AgentSystemPromptRelationshipRecall;
  threadContinuityPrompt?: string;
  threadState?: ThreadStateRecord | null;
  closeNoteHandoffPacket?: RoleCoreMemoryCloseNoteHandoffPacket | null;
  closeNoteArtifact?: RoleCoreMemoryCloseNoteArtifact | null;
  closeNoteOutput?: RoleCoreMemoryCloseNoteOutput | null;
  closeNoteRecord?: RoleCoreMemoryCloseNoteRecord | null;
  closeNoteArchive?: RoleCoreMemoryCloseNoteArchive | null;
  closeNotePersistencePayload?: RoleCoreMemoryCloseNotePersistencePayload | null;
  closeNotePersistenceEnvelope?: RoleCoreMemoryCloseNotePersistenceEnvelope | null;
  closeNotePersistenceManifest?: RoleCoreMemoryCloseNotePersistenceManifest | null;
  rolePresenceAnchorPrompt?: string;
  outputGovernancePrompt?: string;
  humanizedDeliveryPrompt?: string;
  runtimeSurface?: "full" | "im_summary";
  temporalContext: AnswerCompositionTemporalContext;
  temporalHints: AnswerCompositionTemporalHints;
};

export type RuntimePromptSectionsArgs = {
  runtimeSurface: "full" | "im_summary";
  governance: OutputGovernancePacketV1 | null | undefined;
  roleExpression: RoleExpressionPacketV1 | null | undefined;
  humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  replyLanguage: RuntimeReplyLanguage;
  systemPromptArgs: AgentSystemPromptSectionsArgs;
};

export type RuntimePromptSectionsResult = {
  outputGovernancePrompt: string;
  rolePresenceAnchorPrompt: string;
  humanizedDeliveryPrompt: string;
  systemPromptSections: Array<{
    key: string;
    content: string;
  }>;
};
