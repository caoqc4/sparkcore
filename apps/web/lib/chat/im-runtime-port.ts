import {
  type AdapterDeferredPostProcessingPayload,
  type AdapterRuntimeInput,
  type AdapterRuntimeOutput,
  type AdapterRuntimePort
} from "@/lib/integrations/im-adapter";
import { classifyAssistantError } from "@/lib/chat/assistant-error";
import { LiteLLMFetchError } from "@/lib/litellm/client";
import {
  readHumanizedArtifactAction,
  readHumanizedDeliveryGate,
  type HumanizedArtifactActionValue,
} from "@/lib/chat/humanized-delivery-consumption";
import {
  insertPendingAssistantMessage,
  markAssistantMessageFailed
} from "@/lib/chat/assistant-message-state-persistence";
import { bootstrapRuntimeAssistantTurn } from "@/lib/chat/runtime-turn-bootstrap";
import {
  persistAssistantRequestPreviews,
  processAssistantRuntimePostProcessing
} from "@/lib/chat/runtime-turn-post-processing";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  maybeGenerateAssistantArtifacts,
  prepareExplicitArtifactContext,
  type PreparedExplicitArtifactContext,
} from "@/lib/chat/multimodal-artifacts";
import { extractExplicitAudioContent } from "@/lib/chat/multimodal-intent-decision";
import { buildImRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { insertRuntimeUserMessage } from "@/lib/chat/runtime-user-message-persistence";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import {
  loadOwnedThread,
  loadOwnedWorkspace
} from "@/lib/chat/runtime-turn-context";
import { runAgentTurn } from "@/lib/chat/runtime";
import type {
  RuntimeDeferredPostProcessingPayload,
  RuntimeTurnResult,
} from "@/lib/chat/runtime-contract";
import { createAdminClient } from "@/lib/supabase/admin";

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

function withDebugMetadata<T extends { debug_metadata?: Record<string, unknown> }>(
  runtimeTurnResult: T,
  updates: Record<string, unknown>
): T {
  return {
    ...runtimeTurnResult,
    debug_metadata: {
      ...(runtimeTurnResult.debug_metadata ?? {}),
      ...updates
    }
  };
}

function toRuntimeDeferredPostProcessingPayload(
  payload: AdapterDeferredPostProcessingPayload
): RuntimeDeferredPostProcessingPayload {
  return {
    memory_write_requests:
      payload.memory_write_requests as RuntimeDeferredPostProcessingPayload["memory_write_requests"],
    follow_up_requests:
      payload.follow_up_requests as RuntimeDeferredPostProcessingPayload["follow_up_requests"],
    memory_usage_updates: []
  };
}

export async function runDeferredImPostProcessing(args: {
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  runtimeTurnResult: AdapterDeferredPostProcessingPayload;
}) {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();

  await updateAssistantPreviewMetadata({
    supabase,
    assistantMessageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    updates: (currentMetadata) => ({
      im_delivery: {
        ...(currentMetadata?.im_delivery &&
        typeof currentMetadata.im_delivery === "object" &&
        !Array.isArray(currentMetadata.im_delivery)
          ? (currentMetadata.im_delivery as Record<string, unknown>)
          : {}),
        post_processing_started_at: startedAt,
        post_processing_status: "running"
      }
    })
  });

  try {
    await processAssistantRuntimePostProcessing({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      runtimeTurnResult: toRuntimeDeferredPostProcessingPayload(
        args.runtimeTurnResult
      )
    });

    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          post_processing_completed_at: new Date().toISOString(),
          post_processing_status: "completed"
        }
      })
    });
  } catch (error) {
    console.error("[im-post-processing:failed]", {
      assistant_message_id: args.assistantMessageId,
      thread_id: args.threadId,
      workspace_id: args.workspaceId,
      user_id: args.userId,
      agent_id: args.agentId,
      memory_write_request_count: args.runtimeTurnResult.memory_write_requests.length,
      memory_write_request_types: args.runtimeTurnResult.memory_write_requests.map(
        (request) => request.memory_type
      ),
      follow_up_request_count: args.runtimeTurnResult.follow_up_requests.length,
      error_message: error instanceof Error ? error.message : String(error)
    });

    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          post_processing_completed_at: new Date().toISOString(),
          post_processing_status: "failed",
          post_processing_error:
            error instanceof Error ? error.message : "unknown_post_processing_error"
        }
      })
    });

    throw error;
  }
}

export async function runDeferredImArtifactGeneration(args: {
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  userMessage: string;
  assistantReply: string;
  agentName: string | null;
  personaSummary: string;
  preGeneratedImageArtifact?: Record<string, unknown> | null;
  audioTranscriptOverride?: string | null;
  explicitImageRequested?: boolean;
  explicitAudioRequested?: boolean;
  deliveryGate?: {
    clarifyBeforeAction: boolean;
    reason: string | null;
    conflictHint: string | null;
  } | null;
  imageArtifactAction?: HumanizedArtifactActionValue;
  audioArtifactAction?: HumanizedArtifactActionValue;
}) {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();

  await updateAssistantPreviewMetadata({
    supabase,
    assistantMessageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    updates: (currentMetadata) => ({
      im_delivery: {
        ...(currentMetadata?.im_delivery &&
        typeof currentMetadata.im_delivery === "object" &&
        !Array.isArray(currentMetadata.im_delivery)
          ? (currentMetadata.im_delivery as Record<string, unknown>)
          : {}),
        artifact_generation_started_at: startedAt,
        artifact_generation_status: "running"
      }
    })
  });

  // If the image was already generated during the main turn, pass it as a prepared context so
  // maybeGenerateAssistantArtifacts skips re-generation and only handles audio.
  let deferredPreparedContext: PreparedExplicitArtifactContext | null =
    args.preGeneratedImageArtifact
      ? ({
          intent: {
            imageRequested: args.imageArtifactAction !== "block",
            audioRequested: args.audioArtifactAction !== "block",
          },
          currentPlanSlug: null,
          userSettingsMetadata: null,
          billingRetryEvents: [],
          imageResult: {
            artifact: args.preGeneratedImageArtifact,
            status: "generated",
          },
        } as unknown as PreparedExplicitArtifactContext)
      : null;

  try {
    if (!deferredPreparedContext) {
      deferredPreparedContext = await prepareExplicitArtifactContext({
        supabase,
        assistantMessageId: args.assistantMessageId,
        threadId: args.threadId,
        workspaceId: args.workspaceId,
        userId: args.userId,
        agentId: args.agentId,
        userMessage: args.userMessage,
        agentName: args.agentName,
        personaSummary: args.personaSummary,
        agentMetadata: null,
        overrides: {
          intent: {
            imageRequested:
              (args.explicitImageRequested ?? false) &&
              args.imageArtifactAction !== "block",
            audioRequested:
              (args.explicitAudioRequested ?? false) &&
              args.audioArtifactAction !== "block",
            imageConfidence: (args.explicitImageRequested ?? false) ? 1 : 0.01,
            audioConfidence: (args.explicitAudioRequested ?? false) ? 1 : 0.01,
            source: "fallback_rules",
            reasoning: "Deferred artifact execution reused centrally prepared explicit media intent.",
          },
          deliveryGate: args.deliveryGate ?? null,
        },
      });
    }

    if (!deferredPreparedContext) {
      return [];
    }

    const artifactResults = await maybeGenerateAssistantArtifacts({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      userMessage: args.userMessage,
      assistantReply: args.assistantReply,
      agentName: args.agentName,
      personaSummary: args.personaSummary,
      preparedContext: deferredPreparedContext,
      audioTranscriptOverride: args.audioTranscriptOverride ?? null,
    });

    const artifacts = [artifactResults.image.artifact, artifactResults.audio.artifact]
      .filter((artifact) => Boolean(artifact) && typeof artifact === "object" && !Array.isArray(artifact))
      .map((artifact) => artifact as Record<string, unknown>);

    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          artifact_generation_completed_at: new Date().toISOString(),
          artifact_generation_status: "completed"
        }
      })
    });

    return artifacts;
  } catch (error) {
    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          artifact_generation_completed_at: new Date().toISOString(),
          artifact_generation_status: "failed",
          artifact_generation_error:
            error instanceof Error ? error.message : "unknown_artifact_generation_error"
        }
      })
    });

    throw error;
  }
}

async function runImRuntimeTurnWithSupabase(args: {
  supabase: any;
  input: AdapterRuntimeInput;
}): Promise<AdapterRuntimeOutput> {
  const { supabase, input } = args;
  const imRuntimeStartedAt = nowMs();

  console.info("[im-runtime:start]", {
    user_id: input.user_id,
    agent_id: input.agent_id,
    thread_id: input.thread_id,
    source: input.source,
    message_type: input.message_type
  });

  if (!input.thread_id || input.thread_id.trim().length === 0) {
    throw new Error("IM runtime input requires a resolved thread_id.");
  }
  const loadThreadStartedAt = nowMs();
  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId: input.thread_id,
    userId: input.user_id
  });
  const loadThreadDurationMs = elapsedMs(loadThreadStartedAt);

  if (!thread) {
    throw new Error("The requested thread could not be loaded for IM runtime.");
  }

  if (!thread.agent_id) {
    throw new Error("The requested thread is not bound to an agent.");
  }

  if (thread.agent_id !== input.agent_id) {
    throw new Error("Thread agent binding does not match adapter runtime input.");
  }

  const loadWorkspaceStartedAt = nowMs();
  const { data: workspace } = await loadOwnedWorkspace({
    supabase,
    workspaceId: thread.workspace_id,
    userId: input.user_id
  });
  const loadWorkspaceDurationMs = elapsedMs(loadWorkspaceStartedAt);

  if (!workspace) {
    throw new Error("The workspace for the IM runtime turn could not be loaded.");
  }

  const resolveRoleStartedAt = nowMs();
  const roleResolution = await resolveRoleProfile({
    repository: new SupabaseRoleRepository(supabase),
    workspaceId: workspace.id,
    userId: input.user_id,
    requestedAgentId: input.agent_id
  });
  const resolveRoleDurationMs = elapsedMs(resolveRoleStartedAt);

  if (roleResolution.status !== "resolved") {
    throw new Error("The bound agent for the IM runtime turn could not be loaded.");
  }
  const agent = roleResolution.role;

  const runtimeTurnInput = buildImRuntimeTurnInput({
    input: {
      ...input,
      metadata: {
        ...(input.metadata ?? {}),
      }
    },
    workspaceId: workspace.id
  });
  const runtimeStartedAt = new Date().toISOString();
  const trimmedContent = runtimeTurnInput.message.content.trim();
  const insertUserMessageStartedAt = nowMs();
  const { data: insertedMessage, error: insertError } = await insertRuntimeUserMessage({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: input.user_id,
    content: trimmedContent,
    runtimeTurnInput
  });
  const insertUserMessageDurationMs = elapsedMs(insertUserMessageStartedAt);

  if (insertError || !insertedMessage) {
    throw new Error(insertError?.message ?? "Failed to store inbound IM user message.");
  }

  console.info("[im-runtime:user-message-stored]", {
    user_id: input.user_id,
    thread_id: thread.id,
    workspace_id: workspace.id,
    message_id: insertedMessage.id
  });

  const bootstrapStartedAt = nowMs();
  const {
    threadPatch,
    persistedMessages,
    assistantPlaceholder,
    timing: bootstrapTiming
  } = await bootstrapRuntimeAssistantTurn({
    supabase,
    thread: {
      id: thread.id,
      title: thread.title,
      agent_id: thread.agent_id,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      status: thread.status
    },
    workspaceId: workspace.id,
    userId: input.user_id,
    content: trimmedContent,
    userMessageId: insertedMessage.id,
    source: input.source
  });
  const bootstrapDurationMs = elapsedMs(bootstrapStartedAt);

  try {
    let preparedArtifactContext: Awaited<
      ReturnType<typeof prepareExplicitArtifactContext>
    > | null = null;
    let artifactPreparationDurationMs: number | null = null;
    let artifactPreparationTiming: Record<string, number | null> | null = null;

    try {
      const artifactPreparationStartedAt = nowMs();
      preparedArtifactContext = await prepareExplicitArtifactContext({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        agentId: thread.agent_id,
        userMessage: runtimeTurnInput.message.content,
        agentName: agent.name,
        personaSummary: agent.persona_summary,
        agentMetadata:
          agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
            ? (agent.metadata as Record<string, unknown>)
            : null,
      });
      artifactPreparationDurationMs = elapsedMs(artifactPreparationStartedAt);
      artifactPreparationTiming = preparedArtifactContext?.timingMs ?? {
        total: artifactPreparationDurationMs,
        detect_intent: artifactPreparationDurationMs,
        load_user_settings: null,
        load_current_plan: null,
        pre_generate_image: null,
      };
    } catch (artifactPreparationError) {
      console.error("IM explicit artifact preparation failed:", artifactPreparationError);
    }

    if (runtimeTurnInput.message.metadata && preparedArtifactContext) {
      const imageArtifact = preparedArtifactContext.imageResult?.artifact ?? null;
      const imageReady = imageArtifact?.status === "ready";
      const imageFailed =
        preparedArtifactContext.intent.imageRequested && imageArtifact?.status === "failed";
      const audioRequested = preparedArtifactContext.intent.audioRequested;
      const clarifyBeforeAction =
        preparedArtifactContext.deliveryGate?.clarifyBeforeAction === true;
      const audioColonContent = audioRequested
        ? extractExplicitAudioContent(runtimeTurnInput.message.content)
        : null;
      const generationHints = [
        clarifyBeforeAction
          ? `The user's current request is not aligned yet${preparedArtifactContext.deliveryGate?.conflictHint ? ` (${preparedArtifactContext.deliveryGate.conflictHint})` : ""}. Ask one short clarifying question first. Do not continue with image delivery, advice expansion, or action-taking in this turn.`
          : "",
        imageReady
          ? "The user explicitly requested an image. An image has already been prepared and will be delivered shortly after your text reply. Let the image lead. Keep your text to 1-3 short sentences. Open from the scene, atmosphere, or feeling of seeing it, not from agent-led delivery phrasing. For companion-style delivery, structure it like shared viewing: sentence one notices the scene, sentence two stays in quiet resonance or co-feeling, and an optional third sentence gently invites the user back into the moment. Let the cadence vary naturally by moment: sometimes one short line is enough, sometimes two beats, and only occasionally a third. Avoid turning the image copy into a polished takeaway, emotional summary, user-serving benefit statement, or image-review paragraph. Do not sound like a museum caption, travel brochure, curated mood board, or aesthetic commentary. Use one or two concrete visual details and keep the wording colloquial, as if speaking while looking at it together. Favor short spoken sentences, simple phrasing, and slight natural looseness over polished prose. Avoid stacked modifiers, balanced parallel phrases, abstract summary nouns, or neat concluding lines. Briefly acknowledge it naturally and do not say you cannot generate images."
          : "",
        imageFailed
          ? `The user explicitly requested an image, but image generation failed before your reply was written${imageArtifact?.error ? ` (${imageArtifact.error})` : ""}. Briefly acknowledge the failed attempt and avoid promising that an image is attached.`
          : "",
        audioRequested && audioColonContent
          ? `The user wants you to speak exactly this text as your audio reply: "${audioColonContent}". Your written reply should be that exact text verbatim, nothing more.`
          : audioRequested
          ? "The user explicitly requested an audio reply. Write a concise reply that works well when spoken aloud, and do not claim that you cannot send audio. Let the cadence feel like live speech rather than a neatly composed note."
          : "",
      ]
        .filter((line) => line.length > 0)
        .join("\n");

      if (generationHints.length > 0) {
        runtimeTurnInput.message.metadata = {
          ...runtimeTurnInput.message.metadata,
          assistant_generation_hint: generationHints,
        };
      }
    }

    const runAgentTurnStartedAt = nowMs();
    let runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput,
      supabase,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id
      },
      agent,
      messages: persistedMessages,
      assistantMessageId: assistantPlaceholder.id
    });
    const runAgentTurnDurationMs = elapsedMs(runAgentTurnStartedAt);

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime completed without an assistant message.");
    }

    runtimeTurnResult = withDebugMetadata(runtimeTurnResult, {
      im_runtime_started_at: runtimeStartedAt,
      im_runtime_completed_at: new Date().toISOString(),
      assistant_message_id: assistantPlaceholder.id,
      source_message_id: insertedMessage.id
    });
    const assistantMessage = runtimeTurnResult.assistant_message;

    if (!assistantMessage) {
      throw new Error("Runtime completed without an assistant message.");
    }

    const previewRuntimeStartedAt = nowMs();
    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          source_platform: "telegram",
          runtime_started_at: runtimeStartedAt,
          assistant_completed_at: new Date().toISOString()
        }
      })
    });
    const previewRuntimeDurationMs = elapsedMs(previewRuntimeStartedAt);

    const persistPreviewStartedAt = nowMs();
    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      runtimeTurnResult
    });
    const persistPreviewDurationMs = elapsedMs(persistPreviewStartedAt);

    const previewPostProcessStartedAt = nowMs();
    await updateAssistantPreviewMetadata({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      updates: (currentMetadata) => ({
        im_delivery: {
          ...(currentMetadata?.im_delivery &&
          typeof currentMetadata.im_delivery === "object" &&
          !Array.isArray(currentMetadata.im_delivery)
            ? (currentMetadata.im_delivery as Record<string, unknown>)
            : {}),
          request_previews_persisted_at: new Date().toISOString(),
          post_processing_status: "scheduled"
        }
      })
    });
    const previewPostProcessDurationMs = elapsedMs(previewPostProcessStartedAt);

    // Determine the pre-generated image artifact (from explicit path) to pass into deferred
    // so it is not regenerated later.
    const preGeneratedImageArtifact =
      preparedArtifactContext?.imageResult?.artifact &&
      preparedArtifactContext.imageResult.artifact.status === "ready" &&
      typeof preparedArtifactContext.imageResult.artifact === "object"
        ? (preparedArtifactContext.imageResult.artifact as Record<string, unknown>)
        : null;

    const explicitImageRequested = Boolean(preparedArtifactContext?.intent.imageRequested);
    const explicitAudioRequested = Boolean(preparedArtifactContext?.intent.audioRequested);
    const explicitAudioTranscriptOverride =
      preparedArtifactContext?.audioTranscriptOverride ?? null;
    const billingRetryEvents = preparedArtifactContext?.billingRetryEvents ?? [];
    const artifactAction = readHumanizedArtifactAction(
      runtimeTurnResult.debug_metadata,
      "artifact_action"
    );
    const imageArtifactAction = readHumanizedArtifactAction(
      runtimeTurnResult.debug_metadata,
      "image_artifact_action"
    );
    const audioArtifactAction = readHumanizedArtifactAction(
      runtimeTurnResult.debug_metadata,
      "audio_artifact_action"
    );
    const deliveryGate = readHumanizedDeliveryGate(runtimeTurnResult.debug_metadata);
    const allowArtifactDelivery = artifactAction !== "block";
    const allowImageDelivery = imageArtifactAction !== "block";
    const allowAudioDelivery = audioArtifactAction !== "block";
    const deliverableImageRequested = explicitImageRequested && allowImageDelivery;
    const deliverableAudioRequested = explicitAudioRequested && allowAudioDelivery;

    let immediateArtifacts: Array<Record<string, unknown>> = [];
    let immediateArtifactGenerationFailed = false;
    let immediateArtifactDurationMs: number | null = null;

    if (
      preparedArtifactContext &&
      (deliverableImageRequested || deliverableAudioRequested) &&
      allowArtifactDelivery
    ) {
      await updateAssistantPreviewMetadata({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        updates: (currentMetadata) => ({
          im_delivery: {
            ...(currentMetadata?.im_delivery &&
            typeof currentMetadata.im_delivery === "object" &&
            !Array.isArray(currentMetadata.im_delivery)
              ? (currentMetadata.im_delivery as Record<string, unknown>)
              : {}),
            artifact_generation_started_at: new Date().toISOString(),
            artifact_generation_status: "running",
            explicit_media_delivery_mode: "artifact_first",
            explicit_audio_requested: deliverableAudioRequested,
            explicit_image_requested: deliverableImageRequested,
            billing_retry_events: billingRetryEvents,
          }
        })
      });

      if (billingRetryEvents.length > 0) {
        runtimeTurnResult = withDebugMetadata(runtimeTurnResult, {
          billing_retry_events: billingRetryEvents
        });
      }

      try {
        const immediateArtifactStartedAt = nowMs();
        const immediateArtifactResults = await maybeGenerateAssistantArtifacts({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          agentId: thread.agent_id,
          userMessage: runtimeTurnInput.message.content,
          assistantReply: assistantMessage.content,
          agentName: agent.name,
          personaSummary: agent.persona_summary,
          agentMetadata:
            agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
              ? (agent.metadata as Record<string, unknown>)
              : null,
          preparedContext: {
            ...preparedArtifactContext,
            intent: {
              ...preparedArtifactContext.intent,
              imageRequested: deliverableImageRequested,
              audioRequested: deliverableAudioRequested,
            },
          },
          audioTranscriptOverride: explicitAudioTranscriptOverride,
        });
        immediateArtifactDurationMs = elapsedMs(immediateArtifactStartedAt);

        immediateArtifacts = [
          immediateArtifactResults.image.artifact,
          immediateArtifactResults.audio.artifact,
        ]
          .filter(
            (artifact) =>
              Boolean(artifact) &&
              typeof artifact === "object" &&
              !Array.isArray(artifact) &&
              artifact?.status === "ready"
          )
          .map((artifact) => artifact as Record<string, unknown>);

        runtimeTurnResult = withDebugMetadata(runtimeTurnResult, {
          explicit_image_requested: deliverableImageRequested,
          explicit_audio_requested: deliverableAudioRequested,
          explicit_media_delivery_mode: "artifact_first",
          suppress_explicit_audio_text_reply:
            deliverableAudioRequested &&
            !deliverableImageRequested &&
            immediateArtifacts.some((artifact) => artifact.type === "audio") &&
            typeof explicitAudioTranscriptOverride === "string" &&
            explicitAudioTranscriptOverride.trim().length > 0,
        });

        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          updates: (currentMetadata) => ({
            im_delivery: {
              ...(currentMetadata?.im_delivery &&
              typeof currentMetadata.im_delivery === "object" &&
              !Array.isArray(currentMetadata.im_delivery)
                ? (currentMetadata.im_delivery as Record<string, unknown>)
                : {}),
              artifact_generation_completed_at: new Date().toISOString(),
              artifact_generation_status: "completed",
              explicit_media_delivery_mode: "artifact_first",
              explicit_audio_requested: deliverableAudioRequested,
              explicit_image_requested: deliverableImageRequested,
            }
          })
        });
      } catch (immediateArtifactError) {
        immediateArtifactGenerationFailed = true;
        console.error("Immediate IM artifact generation failed:", immediateArtifactError);

        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          updates: (currentMetadata) => ({
            im_delivery: {
              ...(currentMetadata?.im_delivery &&
              typeof currentMetadata.im_delivery === "object" &&
              !Array.isArray(currentMetadata.im_delivery)
                ? (currentMetadata.im_delivery as Record<string, unknown>)
                : {}),
              artifact_generation_completed_at: new Date().toISOString(),
              artifact_generation_status: "scheduled",
              artifact_generation_error:
                immediateArtifactError instanceof Error
                  ? immediateArtifactError.message
                  : "immediate_artifact_generation_failed",
              explicit_media_delivery_mode: "artifact_first",
              explicit_audio_requested: deliverableAudioRequested,
              explicit_image_requested: deliverableImageRequested,
            }
          })
        });
      }
    }

    const imRuntimeTiming = {
      total: elapsedMs(imRuntimeStartedAt),
      load_thread: loadThreadDurationMs,
      load_workspace: loadWorkspaceDurationMs,
      resolve_role: resolveRoleDurationMs,
      insert_user_message: insertUserMessageDurationMs,
      bootstrap: bootstrapDurationMs,
      bootstrap_update_thread: bootstrapTiming.update_thread,
      bootstrap_load_thread_messages: bootstrapTiming.load_thread_messages,
      bootstrap_insert_assistant_placeholder:
        bootstrapTiming.insert_assistant_placeholder,
      artifact_preparation: artifactPreparationDurationMs,
      artifact_preparation_detect_intent:
        artifactPreparationTiming?.detect_intent ?? null,
      artifact_preparation_load_user_settings:
        artifactPreparationTiming?.load_user_settings ?? null,
      artifact_preparation_load_current_plan:
        artifactPreparationTiming?.load_current_plan ?? null,
      artifact_preparation_pre_generate_image:
        artifactPreparationTiming?.pre_generate_image ?? null,
      run_agent_turn: runAgentTurnDurationMs,
      preview_runtime: previewRuntimeDurationMs,
      persist_request_previews: persistPreviewDurationMs,
      preview_postprocess_schedule: previewPostProcessDurationMs,
      immediate_artifact_generation: immediateArtifactDurationMs
    };

    runtimeTurnResult = withDebugMetadata(runtimeTurnResult, {
      im_runtime_timing_ms: imRuntimeTiming
    });

    console.info("[im-runtime]", {
      thread_id: thread.id,
      agent_id: thread.agent_id,
      ...imRuntimeTiming
    });

    const shouldDeferArtifacts =
      (allowArtifactDelivery &&
      (immediateArtifactGenerationFailed ||
      (!deliverableAudioRequested &&
        (!deliverableImageRequested ||
          !preGeneratedImageArtifact ||
          preGeneratedImageArtifact.status !== "ready"))));

    return {
      ...runtimeTurnResult,
      immediate_artifacts: immediateArtifacts,
      deferred_post_processing: {
        assistant_message_id: assistantPlaceholder.id,
        source_message_id: insertedMessage.id,
        agent_id: thread.agent_id,
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: input.user_id,
        active_memory_namespace: null
      },
      deferred_artifact_generation: shouldDeferArtifacts ? {
        assistant_message_id: assistantPlaceholder.id,
        source_message_id: insertedMessage.id,
        agent_id: thread.agent_id,
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: input.user_id,
        user_message: runtimeTurnInput.message.content,
        assistant_reply: assistantMessage.content,
        agent_name: agent.name,
        persona_summary: agent.persona_summary,
        pre_generated_image_artifact: preGeneratedImageArtifact,
        audio_transcript_override: explicitAudioTranscriptOverride,
        explicit_image_requested: explicitImageRequested,
        explicit_audio_requested: explicitAudioRequested,
        delivery_gate: deliveryGate
          ? {
              clarify_before_action: deliveryGate.clarifyBeforeAction,
              reason: deliveryGate.reason,
              conflict_hint: deliveryGate.conflictHint,
            }
          : null,
        image_artifact_action: imageArtifactAction,
        audio_artifact_action: audioArtifactAction,
      } : null
    };
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    console.error("[im-runtime:run-agent-turn-failed]", {
      thread_id: thread.id,
      agent_id: thread.agent_id,
      user_id: input.user_id,
      workspace_id: workspace.id,
      assistant_message_id: assistantPlaceholder.id,
      source_message_id: insertedMessage.id,
      error_type: assistantFailure.errorType,
      error_message: assistantFailure.message,
      litellm_operation:
        error instanceof LiteLLMFetchError ? error.operation : null,
      litellm_endpoint:
        error instanceof LiteLLMFetchError ? error.endpoint : null,
      cause_message:
        error instanceof LiteLLMFetchError &&
        error.causeError instanceof Error
          ? error.causeError.message
          : null
    });

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      agentId: thread.agent_id,
      userMessageId: insertedMessage.id,
      source: input.source,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

    throw error;
  }
}

export async function runImRuntimeTurn(
  input: AdapterRuntimeInput
): Promise<AdapterRuntimeOutput> {
  const supabase = createAdminClient();
  return runImRuntimeTurnWithSupabase({
    supabase,
    input
  });
}

export function createWebImRuntimePort(): AdapterRuntimePort {
  return {
    runTurn: runImRuntimeTurn
  };
}

export const webImRuntimePort: AdapterRuntimePort = createWebImRuntimePort();
