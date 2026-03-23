import {
  resolveBuiltInScenarioMemoryPack,
  type ScenarioMemoryLayer,
  type ScenarioMemoryPack,
} from "../../../../packages/core/memory";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";

export type ActiveScenarioMemoryPack = ScenarioMemoryPack & {
  selection_reason: "default_companion_phase";
};

export function resolveActiveScenarioMemoryPack(): ActiveScenarioMemoryPack {
  return {
    ...resolveBuiltInScenarioMemoryPack("companion"),
    selection_reason: "default_companion_phase",
  };
}

function formatAssemblyLayerLabel(
  layer: ScenarioMemoryLayer,
  isZh: boolean
) {
  switch (layer) {
    case "thread_state":
      return isZh ? "线程进行态" : "thread_state";
    case "dynamic_profile":
      return isZh ? "动态画像" : "dynamic_profile";
    case "static_profile":
      return isZh ? "静态画像" : "static_profile";
    case "memory_record":
      return isZh ? "长期记忆记录" : "memory_record";
    case "knowledge":
      return isZh ? "知识层" : "knowledge";
    default:
      return layer;
  }
}

export function buildScenarioMemoryPackPromptSection(args: {
  pack: ActiveScenarioMemoryPack;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const isZh = args.replyLanguage === "zh-Hans";

  return [
    isZh
      ? `当前生效的 Scenario Memory Pack：${args.pack.pack_id}（${args.pack.label}）。`
      : `Active Scenario Memory Pack: ${args.pack.pack_id} (${args.pack.label}).`,
    isZh
      ? `优先检索顺序：${args.pack.preferred_routes.join(" -> ")}。`
      : `Preferred retrieval order: ${args.pack.preferred_routes.join(" -> ")}.`,
    isZh
      ? `默认组装顺序：${args.pack.assembly_order
          .map((layer) => formatAssemblyLayerLabel(layer, true))
          .join(" -> ")}。`
      : `Default assembly order: ${args.pack.assembly_order.join(" -> ")}.`,
    isZh
      ? "如果当前回复缺少直接任务事实，优先保持陪伴连续性、关系 grounding 与稳定偏好一致性。"
      : "When the current reply lacks direct task facts, prioritize continuity, relationship grounding, and stable preference alignment.",
  ].join("\n");
}
