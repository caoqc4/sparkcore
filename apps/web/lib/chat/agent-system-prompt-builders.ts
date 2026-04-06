import {
  buildKnowledgeLayerPrompt,
  buildKnowledgeLayerPromptCompact,
  buildMemoryLayerAssemblyPrompt,
  buildMemoryNamespaceLayerPrompt,
  buildScenarioMemoryPackAssemblyPrompt,
  buildThreadCompactionLayerPrompt,
  buildThreadCompactionLayerPromptCompact
} from "@/lib/chat/layer-prompt-builders";
import { buildMemoryRecallPrompt } from "@/lib/chat/memory-recall-prompt";
import {
  buildMemorySemanticSummaryPrompt,
  buildThreadStatePrompt
} from "@/lib/chat/memory-prompt-builders";
import { buildTemporalContextPrompt } from "@/lib/chat/prompt-context-builders";
import {
  buildRuntimeTemporalContext,
  getImTemporalContinuityHints
} from "@/lib/chat/runtime-composition-context";
import { resolveActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import type { RuntimeReplyLanguage, RoleCorePacket } from "@/lib/chat/role-core";
import type {
  RoleCoreMemoryCloseNoteArchive,
  RoleCoreMemoryCloseNoteArtifact,
  RoleCoreMemoryCloseNoteHandoffPacket,
  RoleCoreMemoryCloseNoteOutput,
  RoleCoreMemoryCloseNotePersistenceEnvelope,
  RoleCoreMemoryCloseNotePersistenceManifest,
  RoleCoreMemoryCloseNotePersistencePayload,
  RoleCoreMemoryCloseNoteRecord
} from "@/lib/chat/role-core";
import type {
  AgentSystemPromptSectionsArgs
} from "@/lib/chat/runtime-system-prompt-contracts";
export type {
  AgentSystemPromptRelationshipRecall,
  AgentSystemPromptSectionsArgs
} from "@/lib/chat/runtime-system-prompt-contracts";

function getReplyLanguageInstruction(language: RuntimeReplyLanguage) {
  switch (language) {
    case "zh-Hans":
      return [
        "Runtime language target: reply in Simplified Chinese for this turn unless the user explicitly asks to switch languages.",
        "The latest user message has higher priority than prior thread language, recalled memory language, model labels, or internal notes.",
        "Do not drift into English just because recalled memory, model labels, or internal notes contain English text."
      ].join(" ");
    case "en":
      return [
        "Runtime language target: reply in English for this turn unless the user explicitly asks to switch languages.",
        "The latest user message has higher priority than prior thread language, recalled memory language, model labels, or internal notes.",
        "Do not switch to another language just because recalled memory, model labels, or internal notes contain that language."
      ].join(" ");
    default:
      return "Runtime language target: follow the latest user message language, treat it as the highest-priority signal for this turn, and avoid unnecessary language switching within the same reply.";
  }
}

export function buildRoleCoreMemoryHandoffPrompt(
  roleCorePacket: RoleCorePacket,
  replyLanguage: RuntimeReplyLanguage
) {
  const handoff = roleCorePacket.memory_handoff;

  if (!handoff) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core memory handoff：handoff_version = ${handoff.handoff_version}。`
      : `Role core memory handoff: handoff_version = ${handoff.handoff_version}.`,
    isZh
      ? `Namespace phase snapshot：${handoff.namespace_phase_snapshot_id}；${handoff.namespace_phase_snapshot_summary}。`
      : `Namespace phase snapshot: ${handoff.namespace_phase_snapshot_id}; ${handoff.namespace_phase_snapshot_summary}.`,
    handoff.retention_phase_snapshot_id &&
    handoff.retention_phase_snapshot_summary
      ? isZh
        ? `Retention phase snapshot：${handoff.retention_phase_snapshot_id}；${handoff.retention_phase_snapshot_summary}。`
        : `Retention phase snapshot: ${handoff.retention_phase_snapshot_id}; ${handoff.retention_phase_snapshot_summary}.`
      : isZh
        ? "Retention phase snapshot：none。"
        : "Retention phase snapshot: none.",
    isZh
      ? `Knowledge phase snapshot：${handoff.knowledge_phase_snapshot_id}；${handoff.knowledge_phase_snapshot_summary}。`
      : `Knowledge phase snapshot: ${handoff.knowledge_phase_snapshot_id}; ${handoff.knowledge_phase_snapshot_summary}.`,
    handoff.knowledge_scope_layers?.length ||
    handoff.knowledge_governance_classes?.length
      ? isZh
        ? `Knowledge handoff depth：scope_layers = ${handoff.knowledge_scope_layers?.join(", ") || "none"}；governance_classes = ${handoff.knowledge_governance_classes?.join(", ") || "none"}。`
        : `Knowledge handoff depth: scope_layers = ${handoff.knowledge_scope_layers?.join(", ") || "none"}; governance_classes = ${handoff.knowledge_governance_classes?.join(", ") || "none"}.`
      : "",
    isZh
      ? `Scenario phase snapshot：${handoff.scenario_phase_snapshot_id}；${handoff.scenario_phase_snapshot_summary}。`
      : `Scenario phase snapshot: ${handoff.scenario_phase_snapshot_id}; ${handoff.scenario_phase_snapshot_summary}.`,
    handoff.scenario_strategy_bundle_id && handoff.scenario_orchestration_mode
      ? isZh
        ? `Scenario handoff depth：strategy_bundle = ${handoff.scenario_strategy_bundle_id}；orchestration_mode = ${handoff.scenario_orchestration_mode}。`
        : `Scenario handoff depth: strategy_bundle = ${handoff.scenario_strategy_bundle_id}; orchestration_mode = ${handoff.scenario_orchestration_mode}.`
      : "",
    handoff.retention_decision_group
      ? isZh
        ? `Retention handoff depth：decision_group = ${handoff.retention_decision_group}；retained_fields = ${handoff.retention_retained_fields?.join(", ") || "none"}。`
        : `Retention handoff depth: decision_group = ${handoff.retention_decision_group}; retained_fields = ${handoff.retention_retained_fields?.join(", ") || "none"}.`
      : "",
    isZh
      ? "将这些 phase snapshot 视为当前 role-core 记忆交接基线；回答时保持 handoff 与 runtime memory surface 一致，不要把它们回退成更旧的散点 summary。"
      : "Treat these phase snapshots as the current role-core memory handoff baseline; keep responses aligned with the handoff and runtime memory surfaces instead of falling back to older fragmented summaries."
  ];

  return sections.join("\n");
}

export function buildRoleCoreMemoryCloseNoteHandoffPrompt(
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!closeNoteHandoffPacket) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `Role core close-note handoff：packet_version = ${closeNoteHandoffPacket.packet_version}；readiness = ${closeNoteHandoffPacket.readiness_judgment}。`
      : `Role core close-note handoff: packet_version = ${closeNoteHandoffPacket.packet_version}; readiness = ${closeNoteHandoffPacket.readiness_judgment}.`,
    isZh
      ? `Close-note progress：${closeNoteHandoffPacket.progress_range}；close_note_recommended = ${closeNoteHandoffPacket.close_note_recommended ? "true" : "false"}。`
      : `Close-note progress: ${closeNoteHandoffPacket.progress_range}; close_note_recommended = ${closeNoteHandoffPacket.close_note_recommended ? "true" : "false"}.`,
    isZh
      ? `Namespace close-note section：${closeNoteHandoffPacket.namespace.phase_snapshot_id}；${closeNoteHandoffPacket.namespace.phase_snapshot_summary}。`
      : `Namespace close-note section: ${closeNoteHandoffPacket.namespace.phase_snapshot_id}; ${closeNoteHandoffPacket.namespace.phase_snapshot_summary}.`,
    closeNoteHandoffPacket.retention.phase_snapshot_id &&
    closeNoteHandoffPacket.retention.phase_snapshot_summary
      ? isZh
        ? `Retention close-note section：${closeNoteHandoffPacket.retention.phase_snapshot_id}；${closeNoteHandoffPacket.retention.phase_snapshot_summary}；decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}。`
        : `Retention close-note section: ${closeNoteHandoffPacket.retention.phase_snapshot_id}; ${closeNoteHandoffPacket.retention.phase_snapshot_summary}; decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}.`
      : isZh
        ? "Retention close-note section：none。"
        : "Retention close-note section: none.",
    isZh
      ? `Knowledge close-note section：${closeNoteHandoffPacket.knowledge.phase_snapshot_id}；scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}。`
      : `Knowledge close-note section: ${closeNoteHandoffPacket.knowledge.phase_snapshot_id}; scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}.`,
    isZh
      ? `Scenario close-note section：${closeNoteHandoffPacket.scenario.phase_snapshot_id}；strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}。`
      : `Scenario close-note section: ${closeNoteHandoffPacket.scenario.phase_snapshot_id}; strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}.`,
    isZh
      ? `Close-note carry-through：blocking_items = ${closeNoteHandoffPacket.blocking_items.join(", ") || "none"}；non_blocking_items = ${closeNoteHandoffPacket.non_blocking_items.join(", ") || "none"}。`
      : `Close-note carry-through: blocking_items = ${closeNoteHandoffPacket.blocking_items.join(", ") || "none"}; non_blocking_items = ${closeNoteHandoffPacket.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note acceptance gaps：blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.blocking}；non_blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.non_blocking}；tail_candidate = ${closeNoteHandoffPacket.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note acceptance gaps: blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteHandoffPacket.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note next expansion focus：${closeNoteHandoffPacket.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note next expansion focus: ${closeNoteHandoffPacket.next_expansion_focus.join(", ") || "none"}.`
  ];

  return sections.join("\n");
}

function buildCloseNotePrompt<T extends {
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended?: boolean;
  headline: string;
  non_blocking_items: string[];
  tail_candidate_items: string[];
  acceptance_gap_buckets: { blocking: number; non_blocking: number; tail_candidate: number };
  next_expansion_focus: string[];
}>(args: {
  value: T | null;
  replyLanguage: RuntimeReplyLanguage;
  kind:
    | "artifact"
    | "output"
    | "record"
    | "archive"
    | "persistence payload"
    | "persistence envelope"
    | "persistence manifest";
  versionLabel: string;
  sections: string[];
  summary: string;
}) {
  if (!args.value) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const value = args.value;
  const closeNoteRecommended =
    "close_note_recommended" in value && typeof value.close_note_recommended === "boolean"
      ? value.close_note_recommended
      : null;

  return [
    isZh
      ? `Role core close-note ${args.kind}：${args.versionLabel}；readiness = ${value.readiness_judgment}。`
      : `Role core close-note ${args.kind}: ${args.versionLabel}; readiness = ${value.readiness_judgment}.`,
    isZh
      ? `Close-note ${args.kind} progress：${value.progress_range}；close_candidate = ${value.close_candidate ? "true" : "false"}${closeNoteRecommended === null ? "" : `；close_note_recommended = ${closeNoteRecommended ? "true" : "false"}`}。`
      : `Close-note ${args.kind} progress: ${value.progress_range}; close_candidate = ${value.close_candidate ? "true" : "false"}${closeNoteRecommended === null ? "" : `; close_note_recommended = ${closeNoteRecommended ? "true" : "false"}`}.`,
    isZh
      ? `Close-note ${args.kind} headline：${value.headline}。`
      : `Close-note ${args.kind} headline: ${value.headline}.`,
    ...args.sections,
    args.summary,
    isZh
      ? `Close-note ${args.kind} non-blocking items：${value.non_blocking_items.join(", ") || "none"}。`
      : `Close-note ${args.kind} non-blocking items: ${value.non_blocking_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note ${args.kind} tail candidates：${value.tail_candidate_items.join(", ") || "none"}。`
      : `Close-note ${args.kind} tail candidates: ${value.tail_candidate_items.join(", ") || "none"}.`,
    isZh
      ? `Close-note ${args.kind} gap buckets：blocking = ${value.acceptance_gap_buckets.blocking}；non_blocking = ${value.acceptance_gap_buckets.non_blocking}；tail_candidate = ${value.acceptance_gap_buckets.tail_candidate}。`
      : `Close-note ${args.kind} gap buckets: blocking = ${value.acceptance_gap_buckets.blocking}; non_blocking = ${value.acceptance_gap_buckets.non_blocking}; tail_candidate = ${value.acceptance_gap_buckets.tail_candidate}.`,
    isZh
      ? `Close-note ${args.kind} next focus：${value.next_expansion_focus.join(", ") || "none"}。`
      : `Close-note ${args.kind} next focus: ${value.next_expansion_focus.join(", ") || "none"}.`
  ].join("\n");
}

export function buildRoleCoreMemoryCloseNoteArtifactPrompt(
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNoteArtifact,
    replyLanguage,
    kind: "artifact",
    versionLabel: `artifact_version = ${closeNoteArtifact?.artifact_version ?? "unknown"}`,
    sections: closeNoteArtifact
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace artifact section：${closeNoteArtifact.sections.namespace}。`
            : `Namespace artifact section: ${closeNoteArtifact.sections.namespace}.`,
          replyLanguage === "zh-Hans"
            ? `Retention artifact section：${closeNoteArtifact.sections.retention}。`
            : `Retention artifact section: ${closeNoteArtifact.sections.retention}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge artifact section：${closeNoteArtifact.sections.knowledge}。`
            : `Knowledge artifact section: ${closeNoteArtifact.sections.knowledge}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario artifact section：${closeNoteArtifact.sections.scenario}。`
            : `Scenario artifact section: ${closeNoteArtifact.sections.scenario}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note artifact carry-through：${closeNoteArtifact?.carry_through_summary ?? ""}\nClose-note artifact acceptance：${closeNoteArtifact?.acceptance_summary ?? ""}`
        : `Close-note artifact carry-through: ${closeNoteArtifact?.carry_through_summary ?? ""}\nClose-note artifact acceptance: ${closeNoteArtifact?.acceptance_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNoteOutputPrompt(
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNoteOutput,
    replyLanguage,
    kind: "output",
    versionLabel: `output_version = ${closeNoteOutput?.output_version ?? "unknown"}`,
    sections: closeNoteOutput
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace output section：${closeNoteOutput.namespace.output_summary}。`
            : `Namespace output section: ${closeNoteOutput.namespace.output_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention output section：${closeNoteOutput.retention.output_summary}。`
            : `Retention output section: ${closeNoteOutput.retention.output_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge output section：${closeNoteOutput.knowledge.output_summary}。`
            : `Knowledge output section: ${closeNoteOutput.knowledge.output_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario output section：${closeNoteOutput.scenario.output_summary}。`
            : `Scenario output section: ${closeNoteOutput.scenario.output_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note output emission：${closeNoteOutput?.emission_summary ?? ""}`
        : `Close-note output emission: ${closeNoteOutput?.emission_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNoteRecordPrompt(
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNoteRecord,
    replyLanguage,
    kind: "record",
    versionLabel: `record_version = ${closeNoteRecord?.record_version ?? "unknown"}`,
    sections: closeNoteRecord
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace record section：${closeNoteRecord.namespace.record_summary}。`
            : `Namespace record section: ${closeNoteRecord.namespace.record_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention record section：${closeNoteRecord.retention.record_summary}。`
            : `Retention record section: ${closeNoteRecord.retention.record_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge record section：${closeNoteRecord.knowledge.record_summary}。`
            : `Knowledge record section: ${closeNoteRecord.knowledge.record_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario record section：${closeNoteRecord.scenario.record_summary}。`
            : `Scenario record section: ${closeNoteRecord.scenario.record_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note record summary：${closeNoteRecord?.record_summary ?? ""}`
        : `Close-note record summary: ${closeNoteRecord?.record_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNoteArchivePrompt(
  closeNoteArchive: RoleCoreMemoryCloseNoteArchive | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNoteArchive,
    replyLanguage,
    kind: "archive",
    versionLabel: `archive_version = ${closeNoteArchive?.archive_version ?? "unknown"}`,
    sections: closeNoteArchive
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace archive section：${closeNoteArchive.namespace.archive_summary}。`
            : `Namespace archive section: ${closeNoteArchive.namespace.archive_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention archive section：${closeNoteArchive.retention.archive_summary}。`
            : `Retention archive section: ${closeNoteArchive.retention.archive_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge archive section：${closeNoteArchive.knowledge.archive_summary}。`
            : `Knowledge archive section: ${closeNoteArchive.knowledge.archive_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario archive section：${closeNoteArchive.scenario.archive_summary}。`
            : `Scenario archive section: ${closeNoteArchive.scenario.archive_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note archive summary：${closeNoteArchive?.archive_summary ?? ""}`
        : `Close-note archive summary: ${closeNoteArchive?.archive_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNotePersistencePayloadPrompt(
  closeNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNotePersistencePayload,
    replyLanguage,
    kind: "persistence payload",
    versionLabel: `payload_version = ${closeNotePersistencePayload?.payload_version ?? "unknown"}`,
    sections: closeNotePersistencePayload
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace persistence section：${closeNotePersistencePayload.namespace.persistence_summary}。`
            : `Namespace persistence section: ${closeNotePersistencePayload.namespace.persistence_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention persistence section：${closeNotePersistencePayload.retention.persistence_summary}。`
            : `Retention persistence section: ${closeNotePersistencePayload.retention.persistence_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge persistence section：${closeNotePersistencePayload.knowledge.persistence_summary}。`
            : `Knowledge persistence section: ${closeNotePersistencePayload.knowledge.persistence_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario persistence section：${closeNotePersistencePayload.scenario.persistence_summary}。`
            : `Scenario persistence section: ${closeNotePersistencePayload.scenario.persistence_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note persistence summary：${closeNotePersistencePayload?.persistence_summary ?? ""}`
        : `Close-note persistence summary: ${closeNotePersistencePayload?.persistence_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNotePersistenceEnvelopePrompt(
  closeNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNotePersistenceEnvelope,
    replyLanguage,
    kind: "persistence envelope",
    versionLabel: `envelope_version = ${closeNotePersistenceEnvelope?.envelope_version ?? "unknown"}`,
    sections: closeNotePersistenceEnvelope
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace persistence envelope section：${closeNotePersistenceEnvelope.namespace.envelope_summary}。`
            : `Namespace persistence envelope section: ${closeNotePersistenceEnvelope.namespace.envelope_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention persistence envelope section：${closeNotePersistenceEnvelope.retention.envelope_summary}。`
            : `Retention persistence envelope section: ${closeNotePersistenceEnvelope.retention.envelope_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge persistence envelope section：${closeNotePersistenceEnvelope.knowledge.envelope_summary}。`
            : `Knowledge persistence envelope section: ${closeNotePersistenceEnvelope.knowledge.envelope_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario persistence envelope section：${closeNotePersistenceEnvelope.scenario.envelope_summary}。`
            : `Scenario persistence envelope section: ${closeNotePersistenceEnvelope.scenario.envelope_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note persistence envelope summary：${closeNotePersistenceEnvelope?.envelope_summary ?? ""}`
        : `Close-note persistence envelope summary: ${closeNotePersistenceEnvelope?.envelope_summary ?? ""}`
  });
}

export function buildRoleCoreMemoryCloseNotePersistenceManifestPrompt(
  closeNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null,
  replyLanguage: RuntimeReplyLanguage
) {
  return buildCloseNotePrompt({
    value: closeNotePersistenceManifest,
    replyLanguage,
    kind: "persistence manifest",
    versionLabel: `manifest_version = ${closeNotePersistenceManifest?.manifest_version ?? "unknown"}`,
    sections: closeNotePersistenceManifest
      ? [
          replyLanguage === "zh-Hans"
            ? `Namespace persistence manifest section：${closeNotePersistenceManifest.namespace.manifest_summary}。`
            : `Namespace persistence manifest section: ${closeNotePersistenceManifest.namespace.manifest_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Retention persistence manifest section：${closeNotePersistenceManifest.retention.manifest_summary}。`
            : `Retention persistence manifest section: ${closeNotePersistenceManifest.retention.manifest_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Knowledge persistence manifest section：${closeNotePersistenceManifest.knowledge.manifest_summary}。`
            : `Knowledge persistence manifest section: ${closeNotePersistenceManifest.knowledge.manifest_summary}.`,
          replyLanguage === "zh-Hans"
            ? `Scenario persistence manifest section：${closeNotePersistenceManifest.scenario.manifest_summary}。`
            : `Scenario persistence manifest section: ${closeNotePersistenceManifest.scenario.manifest_summary}.`
        ]
      : [],
    summary:
      replyLanguage === "zh-Hans"
        ? `Close-note persistence manifest summary：${closeNotePersistenceManifest?.manifest_summary ?? ""}`
        : `Close-note persistence manifest summary: ${closeNotePersistenceManifest?.manifest_summary ?? ""}`
  });
}

export function buildAgentSystemPromptSections(args: AgentSystemPromptSectionsArgs) {
  const {
    roleCorePacket,
    agentSystemPrompt,
    latestUserMessage,
    recalledMemories = [],
    relevantKnowledge = [],
    compactedThreadSummary = null,
    activeMemoryNamespace = null,
    replyLanguage = "unknown",
    relationshipRecall = {
      directNamingQuestion: false,
      directPreferredNameQuestion: false,
      relationshipStylePrompt: false,
      sameThreadContinuity: false,
      addressStyleMemory: null,
      nicknameMemory: null,
      preferredNameMemory: null
    },
    threadContinuityPrompt = "",
    threadState = null,
    closeNoteHandoffPacket = null,
    closeNoteArtifact = null,
    closeNoteOutput = null,
    closeNoteRecord = null,
    closeNoteArchive = null,
    closeNotePersistencePayload = null,
    closeNotePersistenceEnvelope = null,
    closeNotePersistenceManifest = null,
    rolePresenceAnchorPrompt = "",
    outputGovernancePrompt = "",
    humanizedDeliveryPrompt = "",
    runtimeSurface = "full",
    temporalContext,
    temporalHints
  } = args;

  const activePack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace ?? null,
    relevantKnowledge
  });

  const baseSections = [
    { key: "identity", content: `You are ${roleCorePacket.identity.agent_name}.` },
    {
      key: "persona_summary",
      content: roleCorePacket.persona_summary
        ? `Persona summary: ${roleCorePacket.persona_summary}`
        : ""
    },
    {
      key: "style_guidance",
      content: roleCorePacket.style_guidance
        ? `Style guidance: ${roleCorePacket.style_guidance}`
        : ""
    },
    { key: "role_presence_anchor", content: rolePresenceAnchorPrompt },
    {
      key: "reply_language",
      content: getReplyLanguageInstruction(
        roleCorePacket.language_behavior.reply_language_target
      )
    },
    {
      key: "temporal_context",
      content:
        runtimeSurface === "im_summary"
          ? buildTemporalContextPrompt({
              replyLanguage,
              temporalContext,
              temporalHints
            })
          : ""
    },
    {
      key: "humanized_delivery",
      content: runtimeSurface === "im_summary" ? humanizedDeliveryPrompt : ""
    },
    { key: "thread_continuity", content: threadContinuityPrompt },
    { key: "thread_state", content: buildThreadStatePrompt(threadState, replyLanguage) },
    {
      key: "memory_semantic_summary",
      content: buildMemorySemanticSummaryPrompt({
        recalledMemories,
        threadState,
        replyLanguage
      })
    }
  ];

  const fullSections = [
    {
      key: "scenario_pack_assembly",
      content: buildScenarioMemoryPackAssemblyPrompt({
        activeMemoryNamespace,
        relevantKnowledge,
        replyLanguage
      })
    },
    {
      key: "knowledge_layer",
      content: buildKnowledgeLayerPrompt({
        relevantKnowledge,
        activeMemoryNamespace,
        replyLanguage
      })
    },
    {
      key: "memory_namespace_layer",
      content: buildMemoryNamespaceLayerPrompt({
        activeMemoryNamespace,
        replyLanguage
      })
    },
    {
      key: "thread_compaction_layer",
      content: buildThreadCompactionLayerPrompt({
        compactedThreadSummary,
        replyLanguage
      })
    },
    {
      key: "memory_layer_assembly",
      content: buildMemoryLayerAssemblyPrompt({
        recalledMemories,
        threadState,
        scenarioPack: activePack,
        replyLanguage
      })
    },
    {
      key: "role_core_handoff",
      content: buildRoleCoreMemoryHandoffPrompt(roleCorePacket, replyLanguage)
    },
    {
      key: "close_note_handoff",
      content: buildRoleCoreMemoryCloseNoteHandoffPrompt(
        closeNoteHandoffPacket,
        replyLanguage
      )
    },
    {
      key: "close_note_artifact",
      content: buildRoleCoreMemoryCloseNoteArtifactPrompt(
        closeNoteArtifact,
        replyLanguage
      )
    },
    {
      key: "close_note_output",
      content: buildRoleCoreMemoryCloseNoteOutputPrompt(closeNoteOutput, replyLanguage)
    },
    {
      key: "close_note_record",
      content: buildRoleCoreMemoryCloseNoteRecordPrompt(closeNoteRecord, replyLanguage)
    },
    {
      key: "close_note_archive",
      content: buildRoleCoreMemoryCloseNoteArchivePrompt(closeNoteArchive, replyLanguage)
    },
    {
      key: "close_note_persistence_payload",
      content: buildRoleCoreMemoryCloseNotePersistencePayloadPrompt(
        closeNotePersistencePayload,
        replyLanguage
      )
    },
    {
      key: "close_note_persistence_envelope",
      content: buildRoleCoreMemoryCloseNotePersistenceEnvelopePrompt(
        closeNotePersistenceEnvelope,
        replyLanguage
      )
    },
    {
      key: "close_note_persistence_manifest",
      content: buildRoleCoreMemoryCloseNotePersistenceManifestPrompt(
        closeNotePersistenceManifest,
        replyLanguage
      )
    }
  ];

  const imSummarySections = [
    {
      key: "knowledge_layer",
      content:
        relevantKnowledge.length > 0
          ? buildKnowledgeLayerPromptCompact({
              relevantKnowledge,
              replyLanguage
            })
          : ""
    },
    {
      key: "thread_compaction_layer",
      content: compactedThreadSummary
        ? buildThreadCompactionLayerPromptCompact({
            compactedThreadSummary,
            replyLanguage
          })
        : ""
    }
  ];

  return [
    ...baseSections,
    ...(runtimeSurface === "im_summary" ? imSummarySections : fullSections),
    { key: "output_governance", content: outputGovernancePrompt },
    { key: "agent_system_prompt", content: agentSystemPrompt },
    {
      key: "memory_recall",
      content: buildMemoryRecallPrompt(
        latestUserMessage,
        recalledMemories,
        replyLanguage,
        relationshipRecall
      )
    }
  ].filter((section) => section.content);
}

export function buildAgentSystemPrompt(args: AgentSystemPromptSectionsArgs): string;
export function buildAgentSystemPrompt(
  roleCorePacket: AgentSystemPromptSectionsArgs["roleCorePacket"],
  agentSystemPrompt: string,
  latestUserMessage: string,
  recalledMemories?: AgentSystemPromptSectionsArgs["recalledMemories"],
  relevantKnowledge?: AgentSystemPromptSectionsArgs["relevantKnowledge"],
  compactedThreadSummary?: AgentSystemPromptSectionsArgs["compactedThreadSummary"],
  activeMemoryNamespace?: AgentSystemPromptSectionsArgs["activeMemoryNamespace"],
  replyLanguage?: AgentSystemPromptSectionsArgs["replyLanguage"],
  relationshipRecall?: AgentSystemPromptSectionsArgs["relationshipRecall"],
  threadContinuityPrompt?: string,
  threadState?: AgentSystemPromptSectionsArgs["threadState"],
  closeNoteHandoffPacket?: AgentSystemPromptSectionsArgs["closeNoteHandoffPacket"],
  closeNoteArtifact?: AgentSystemPromptSectionsArgs["closeNoteArtifact"],
  closeNoteOutput?: AgentSystemPromptSectionsArgs["closeNoteOutput"],
  closeNoteRecord?: AgentSystemPromptSectionsArgs["closeNoteRecord"],
  closeNoteArchive?: AgentSystemPromptSectionsArgs["closeNoteArchive"],
  closeNotePersistencePayload?: AgentSystemPromptSectionsArgs["closeNotePersistencePayload"],
  closeNotePersistenceEnvelope?: AgentSystemPromptSectionsArgs["closeNotePersistenceEnvelope"],
  closeNotePersistenceManifest?: AgentSystemPromptSectionsArgs["closeNotePersistenceManifest"],
  outputGovernancePrompt?: string,
  humanizedDeliveryPrompt?: string,
  runtimeSurface?: AgentSystemPromptSectionsArgs["runtimeSurface"]
): string;
export function buildAgentSystemPrompt(
  argsOrRoleCorePacket: AgentSystemPromptSectionsArgs | AgentSystemPromptSectionsArgs["roleCorePacket"],
  agentSystemPrompt?: string,
  latestUserMessage?: string,
  recalledMemories: AgentSystemPromptSectionsArgs["recalledMemories"] = [],
  relevantKnowledge: AgentSystemPromptSectionsArgs["relevantKnowledge"] = [],
  compactedThreadSummary: AgentSystemPromptSectionsArgs["compactedThreadSummary"] = null,
  activeMemoryNamespace: AgentSystemPromptSectionsArgs["activeMemoryNamespace"] = null,
  replyLanguage: AgentSystemPromptSectionsArgs["replyLanguage"] = "unknown",
  relationshipRecall: AgentSystemPromptSectionsArgs["relationshipRecall"] = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  },
  threadContinuityPrompt = "",
  threadState: AgentSystemPromptSectionsArgs["threadState"] = null,
  closeNoteHandoffPacket: AgentSystemPromptSectionsArgs["closeNoteHandoffPacket"] = null,
  closeNoteArtifact: AgentSystemPromptSectionsArgs["closeNoteArtifact"] = null,
  closeNoteOutput: AgentSystemPromptSectionsArgs["closeNoteOutput"] = null,
  closeNoteRecord: AgentSystemPromptSectionsArgs["closeNoteRecord"] = null,
  closeNoteArchive: AgentSystemPromptSectionsArgs["closeNoteArchive"] = null,
  closeNotePersistencePayload: AgentSystemPromptSectionsArgs["closeNotePersistencePayload"] = null,
  closeNotePersistenceEnvelope: AgentSystemPromptSectionsArgs["closeNotePersistenceEnvelope"] = null,
  closeNotePersistenceManifest: AgentSystemPromptSectionsArgs["closeNotePersistenceManifest"] = null,
  outputGovernancePrompt = "",
  humanizedDeliveryPrompt = "",
  runtimeSurface: AgentSystemPromptSectionsArgs["runtimeSurface"] = "full"
) {
  const args: AgentSystemPromptSectionsArgs =
    typeof argsOrRoleCorePacket === "object" &&
    argsOrRoleCorePacket !== null &&
    "roleCorePacket" in argsOrRoleCorePacket
      ? argsOrRoleCorePacket
      : {
          roleCorePacket: argsOrRoleCorePacket,
          agentSystemPrompt: agentSystemPrompt ?? "",
          latestUserMessage: latestUserMessage ?? "",
          recalledMemories,
          relevantKnowledge,
          compactedThreadSummary,
          activeMemoryNamespace,
          replyLanguage,
          relationshipRecall,
          threadContinuityPrompt,
          threadState,
          closeNoteHandoffPacket,
          closeNoteArtifact,
          closeNoteOutput,
          closeNoteRecord,
          closeNoteArchive,
          closeNotePersistencePayload,
          closeNotePersistenceEnvelope,
          closeNotePersistenceManifest,
          outputGovernancePrompt,
          humanizedDeliveryPrompt,
          runtimeSurface,
          temporalContext: buildRuntimeTemporalContext(),
          temporalHints: getImTemporalContinuityHints([])
        };

  return buildAgentSystemPromptSections(args)
    .map((section) => section.content)
    .join("\n\n");
}
