import {
  type AdapterRuntimeInput,
  type AdapterRuntimeOutput,
  type AdapterRuntimePort
} from "@/lib/integrations/im-adapter";
import { classifyAssistantError } from "@/lib/chat/assistant-error";
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
  extractExplicitAudioContent,
  maybeGenerateAssistantArtifacts,
  prepareExplicitArtifactContext,
  type PreparedExplicitArtifactContext,
} from "@/lib/chat/multimodal-artifacts";
import { buildImRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { insertRuntimeUserMessage } from "@/lib/chat/runtime-user-message-persistence";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import {
  loadOwnedThread,
  loadOwnedWorkspace
} from "@/lib/chat/runtime-turn-context";
import { runAgentTurn } from "@/lib/chat/runtime";
import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function runDeferredImPostProcessing(args: {
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  runtimeTurnResult: Pick<
    AdapterRuntimeOutput,
    "memory_write_requests" | "follow_up_requests"
  >;
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
      runtimeTurnResult:
        args.runtimeTurnResult as Pick<
          RuntimeTurnResult,
          "memory_write_requests" | "follow_up_requests"
        >
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
  const deferredPreparedContext: PreparedExplicitArtifactContext | null =
    args.preGeneratedImageArtifact
      ? ({
          intent: null,
          currentPlanSlug: null,
          userSettingsMetadata: null,
          imageResult: {
            artifact: args.preGeneratedImageArtifact,
            status: "generated",
          },
        } as unknown as PreparedExplicitArtifactContext)
      : null;

  try {
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

  if (!input.thread_id || input.thread_id.trim().length === 0) {
    throw new Error("IM runtime input requires a resolved thread_id.");
  }
  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId: input.thread_id,
    userId: input.user_id
  });

  if (!thread) {
    throw new Error("The requested thread could not be loaded for IM runtime.");
  }

  if (!thread.agent_id) {
    throw new Error("The requested thread is not bound to an agent.");
  }

  if (thread.agent_id !== input.agent_id) {
    throw new Error("Thread agent binding does not match adapter runtime input.");
  }

  const { data: workspace } = await loadOwnedWorkspace({
    supabase,
    workspaceId: thread.workspace_id,
    userId: input.user_id
  });

  if (!workspace) {
    throw new Error("The workspace for the IM runtime turn could not be loaded.");
  }

  const roleResolution = await resolveRoleProfile({
    repository: new SupabaseRoleRepository(supabase),
    workspaceId: workspace.id,
    userId: input.user_id,
    requestedAgentId: input.agent_id
  });

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
  const { data: insertedMessage, error: insertError } = await insertRuntimeUserMessage({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: input.user_id,
    content: trimmedContent,
    runtimeTurnInput
  });

  if (insertError || !insertedMessage) {
    throw new Error(insertError?.message ?? "Failed to store inbound IM user message.");
  }

  const {
    threadPatch,
    persistedMessages,
    assistantPlaceholder
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

  try {
    let preparedArtifactContext: Awaited<
      ReturnType<typeof prepareExplicitArtifactContext>
    > | null = null;

    try {
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
      });
    } catch (artifactPreparationError) {
      console.error("IM explicit artifact preparation failed:", artifactPreparationError);
    }

    if (runtimeTurnInput.message.metadata && preparedArtifactContext) {
      const imageArtifact = preparedArtifactContext.imageResult?.artifact ?? null;
      const imageReady = imageArtifact?.status === "ready";
      const imageFailed =
        preparedArtifactContext.intent.imageRequested && imageArtifact?.status === "failed";
      const audioRequested = preparedArtifactContext.intent.audioRequested;
      const audioColonContent = audioRequested
        ? extractExplicitAudioContent(runtimeTurnInput.message.content)
        : null;
      const generationHints = [
        imageReady
          ? "The user explicitly requested an image. An image has already been prepared and will be delivered shortly after your text reply. Briefly acknowledge it naturally and do not say you cannot generate images."
          : "",
        imageFailed
          ? `The user explicitly requested an image, but image generation failed before your reply was written${imageArtifact?.error ? ` (${imageArtifact.error})` : ""}. Briefly acknowledge the failed attempt and avoid promising that an image is attached.`
          : "",
        audioRequested && audioColonContent
          ? `The user wants you to speak exactly this text as your audio reply: "${audioColonContent}". Your written reply should be that exact text verbatim, nothing more.`
          : audioRequested
          ? "The user explicitly requested an audio reply. Write a concise reply that works well when spoken aloud, and do not claim that you cannot send audio."
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

    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      runtimeTurnResult
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
          request_previews_persisted_at: new Date().toISOString(),
          post_processing_status: "scheduled"
        }
      })
    });

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

    let immediateArtifacts: Array<Record<string, unknown>> = [];
    let immediateArtifactGenerationFailed = false;

    if (explicitImageRequested || explicitAudioRequested) {
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
            explicit_audio_requested: explicitAudioRequested,
            explicit_image_requested: explicitImageRequested,
          }
        })
      });

      try {
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
          preparedContext: preparedArtifactContext,
          audioTranscriptOverride: explicitAudioTranscriptOverride,
        });

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
          explicit_image_requested: explicitImageRequested,
          explicit_audio_requested: explicitAudioRequested,
          explicit_media_delivery_mode: "artifact_first",
          suppress_explicit_audio_text_reply:
            explicitAudioRequested &&
            !explicitImageRequested &&
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
              explicit_audio_requested: explicitAudioRequested,
              explicit_image_requested: explicitImageRequested,
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
              explicit_audio_requested: explicitAudioRequested,
              explicit_image_requested: explicitImageRequested,
            }
          })
        });
      }
    }

    const shouldDeferArtifacts =
      immediateArtifactGenerationFailed ||
      (!explicitAudioRequested &&
        (!explicitImageRequested ||
          !preGeneratedImageArtifact ||
          preGeneratedImageArtifact.status !== "ready"));

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
      } : null
    };
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

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
