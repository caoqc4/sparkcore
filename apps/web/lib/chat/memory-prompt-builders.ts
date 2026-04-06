import type { RecalledMemory } from "@/lib/chat/memory-shared";
import { buildRuntimeMemorySemanticSummary } from "@/lib/chat/memory-records";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";

export function buildRolePresenceAnchorPrompt(args: {
  roleExpression:
    | {
        identity: {
          agent_name: string;
        };
        persona_summary: string | null;
        style_guidance: string | null;
        role_traits: {
          background_summary: string | null;
          tone: string | null;
          identity_archetype: string;
        };
      }
    | null
    | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const roleExpression = args.roleExpression;

  if (!roleExpression) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const parts = [
    isZh
      ? `角色本体锚点：保持 ${roleExpression.identity.agent_name} 这个角色本身可被辨认，不要被关系适配、任务推进或知识解释抹平成泛化助手。`
      : `Role-presence anchor: keep ${roleExpression.identity.agent_name} recognizable as this specific role instead of flattening into a generic helper under relationship, task, or knowledge pressure.`,
    roleExpression.persona_summary
      ? isZh
        ? `人格主轴：${roleExpression.persona_summary}。`
        : `Core persona: ${roleExpression.persona_summary}.`
      : "",
    roleExpression.style_guidance
      ? isZh
        ? `说话习惯：${roleExpression.style_guidance}。`
        : `Speaking style: ${roleExpression.style_guidance}.`
      : "",
    roleExpression.role_traits.background_summary
      ? isZh
        ? `背景锚点：${roleExpression.role_traits.background_summary}。`
        : `Background anchor: ${roleExpression.role_traits.background_summary}.`
      : "",
    roleExpression.role_traits.tone
      ? isZh
        ? `语气基调：${roleExpression.role_traits.tone}。`
        : `Tone bias: ${roleExpression.role_traits.tone}.`
      : "",
    roleExpression.role_traits.identity_archetype
      ? isZh
        ? `身份气质：${roleExpression.role_traits.identity_archetype}。`
        : `Identity shape: ${roleExpression.role_traits.identity_archetype}.`
      : "",
    isZh
      ? "如果当前回合需要适应关系记忆，只调整亲疏、称呼和互动节奏，不要改掉角色原本的身份感、背景感和说话纹理。"
      : "If this turn adapts to relationship memory, only modulate closeness, address, and interaction rhythm; do not replace the role's original identity, background, or speaking texture."
  ].filter(Boolean);

  return parts.join(" ");
}

export function buildThreadStatePrompt(
  threadState: ThreadStateRecord | null | undefined,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!threadState) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const sections: string[] = [];

  if (threadState.lifecycle_status !== "active") {
    sections.push(
      isZh
        ? `线程状态：当前 lifecycle_status = ${threadState.lifecycle_status}。`
        : `Thread state: current lifecycle_status = ${threadState.lifecycle_status}.`
    );
  }

  if (threadState.focus_mode) {
    sections.push(
      isZh
        ? `线程状态：当前 focus_mode = ${threadState.focus_mode}。`
        : `Thread state: current focus_mode = ${threadState.focus_mode}.`
    );
  }

  if (
    threadState.continuity_status &&
    threadState.continuity_status !== "cold"
  ) {
    sections.push(
      isZh
        ? `线程状态：当前 continuity_status = ${threadState.continuity_status}。`
        : `Thread state: current continuity_status = ${threadState.continuity_status}.`
    );
  }

  if (threadState.current_language_hint) {
    sections.push(
      isZh
        ? `线程状态：当前 current_language_hint = ${threadState.current_language_hint}。`
        : `Thread state: current current_language_hint = ${threadState.current_language_hint}.`
    );
  }

  if (sections.length === 0) {
    return "";
  }

  sections.push(
    isZh
      ? "把 thread_state 视为当前线程的即时进行态；当它和远处记忆冲突时，优先保证当前线程的 focus、continuity 与语言提示不被打断。"
      : "Treat thread_state as the live coordination state for this thread; when it conflicts with distant memory, preserve the current thread focus, continuity, and language hint first."
  );

  return sections.join("\n");
}

export function buildMemorySemanticSummaryPrompt(args: {
  recalledMemories: RecalledMemory[];
  threadState: ThreadStateRecord | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const profileSnapshot = args.recalledMemories
    .filter(
      (memory) =>
        memory.memory_type === "profile" || memory.memory_type === "preference"
    )
    .map((memory) => memory.content);
  const semanticSummary = buildRuntimeMemorySemanticSummary({
    memoryTypesUsed: args.recalledMemories.map((memory) => memory.memory_type),
    profileSnapshot,
    hasThreadState: Boolean(args.threadState),
    threadStateFocusMode: args.threadState?.focus_mode ?? null,
    semanticLayersUsed: args.recalledMemories.map(
      (memory) => memory.semantic_layer
    )
  });

  if (
    !semanticSummary.primary_layer &&
    semanticSummary.observed_layers.length === 0
  ) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const sections = [
    isZh
      ? `本轮记忆语义摘要：primary_layer = ${semanticSummary.primary_layer ?? "none"}；observed_layers = ${semanticSummary.observed_layers.join(", ") || "none"}。`
      : `Memory semantic summary for this turn: primary_layer = ${semanticSummary.primary_layer ?? "none"}; observed_layers = ${semanticSummary.observed_layers.join(", ") || "none"}.`
  ];
  const hasEpisodeMemory = args.recalledMemories.some(
    (memory) => memory.memory_type === "episode"
  );
  const hasTimelineMemory = args.recalledMemories.some(
    (memory) => memory.memory_type === "timeline"
  );

  if (semanticSummary.primary_layer === "thread_state") {
    sections.push(
      isZh
        ? "优先让当前线程状态决定即时 focus、continuity 和语言延续，再用其它记忆层做补充。"
        : "Let the current thread state drive immediate focus, continuity, and language carryover first, then use other memory layers as support."
    );
  } else if (semanticSummary.primary_layer === "static_profile") {
    sections.push(
      isZh
        ? "优先把稳定 profile / preference 作为回答基线，再按需要补充关系或线程状态。"
        : "Use stable profile and preference facts as the baseline first, then layer in relationship or thread-state detail only when needed."
    );
  } else if (semanticSummary.primary_layer === "dynamic_profile") {
    sections.push(
      isZh
        ? "优先把当前阶段仍持续有效的动态画像当作本轮回答基线，不要把它误压回线程即时状态或静态长期偏好。"
        : "Use the currently active dynamic profile as the baseline for this turn instead of collapsing it back into thread-state immediacy or static long-term preference."
    );
  } else if (semanticSummary.primary_layer === "memory_record") {
    sections.push(
      isZh
        ? "优先把关系/事件类记忆当作当前问题的直接事实来源，不要被更远的默认 profile 稀释。"
        : "Treat relationship or event-like memory as the direct fact source for this turn before falling back to more distant profile defaults."
    );
  }

  if (hasEpisodeMemory) {
    sections.push(
      isZh
        ? "如果命中 episode 记忆，把它当作与当前问题直接相关的过去事件或阶段事实，优先用来支撑当前回答，不要把它压扁成泛泛偏好。"
        : "When episode memory is present, treat it as a concrete past event or stage fact tied to the current question instead of flattening it into a generic preference."
    );
  }

  if (hasTimelineMemory) {
    sections.push(
      isZh
        ? "如果命中 timeline 记忆，把它当作“变化过程/阶段演进”的线索，用来解释事情是怎么一路发展到现在，而不是只摘一条静态事实。"
        : "When timeline memory is present, use it as a cue for how the situation evolved over time rather than reducing it to a single static fact."
    );
  }

  if (
    semanticSummary.observed_layers.includes("dynamic_profile") &&
    semanticSummary.observed_layers.includes("thread_state")
  ) {
    sections.push(
      isZh
        ? "如果同时命中 dynamic profile 和 thread_state，让 thread_state 决定即时线程推进，让 dynamic profile 决定当前阶段仍持续有效的工作方式或偏好。"
        : "When both dynamic profile and thread_state are present, let thread_state govern immediate thread coordination while dynamic profile carries the still-active phase-level working mode or preference."
    );
  }

  if (
    semanticSummary.observed_layers.includes("static_profile") &&
    semanticSummary.observed_layers.includes("memory_record")
  ) {
    sections.push(
      isZh
        ? "如果同时命中稳定画像和关系记忆，让 stable profile 决定长期偏好，让 relationship memory 决定称呼、关系事实和直接确认信息。"
        : "When both stable profile and relationship memory are present, let stable profile guide long-lived preferences while relationship memory handles address terms, relationship facts, and direct confirmations."
    );
  }

  return sections.join("\n");
}
