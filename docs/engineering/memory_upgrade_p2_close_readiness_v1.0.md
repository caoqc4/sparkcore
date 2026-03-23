# SparkCore Memory Upgrade P2 Close Readiness v1.0

## 1. 文档定位

本文档用于在 `P2` 进入中段后，明确：

- `P2-1 ~ P2-5` 当前各自处于什么状态
- 哪些已经可以视为基本成立
- 哪些还差最后几刀才能进入收口判断
- 当前是否已经适合准备 `P2 close note`

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p2_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p2_execution_plan_v1.0.md) 的阶段性收口复盘
- 对当前 `P2` 代码事实的压缩判断

---

## 2. 当前总体判断

当前 `Memory Upgrade P2` 已从起步期推进到更明确的中段。

当前总判断：

- `P2-1 ~ P2-2` 的高阶 seam 已基本立住
- `P2-3 ~ P2-4` 已不再只是可见 seam，而开始进入真实 prompt / metadata / filtering 边界
- `P2-5` 已不再只是计划，而已成立第一版回归 gate
- 当前剩余项已从“立新概念”转向“把高阶 seam 再往真实作用边界推进一点，再判断 close-readiness”

当前整体完成度评估：

- **约 65%**

---

## 3. P2-1 ~ P2-5 当前状态

### P2-1 Scenario Memory Pack seam

状态：

- **基本完成**

当前已成立：

- `packages/core/memory/packs.ts` 已新增首版：
  - `ScenarioMemoryPack`
  - `ScenarioMemoryLayer`
  - `ScenarioMemoryRoute`
  - `COMPANION_SCENARIO_MEMORY_PACK`
- `apps/web/lib/chat/memory-packs.ts` 已新增：
  - `resolveActiveScenarioMemoryPack()`
  - `buildScenarioMemoryPackPromptSection(...)`
- runtime `buildAgentSystemPrompt(...)` 已开始显式注入：
  - `Active Scenario Memory Pack: companion`
- assistant metadata / debug metadata 已开始暴露最小 pack 摘要
- `memory-upgrade-harness.ts` 已开始显式校验 companion pack seam

结论：

- `P2-1` 已不再只是文档中的方向
- 已可视为第一轮目标达成

### P2-2 Knowledge Layer minimal separation

状态：

- **基本完成**

当前已成立：

- `packages/core/memory/knowledge.ts` 已新增首版：
  - `KnowledgeResource`
  - `KnowledgeSnapshot`
  - `KnowledgeLink`
- `apps/web/lib/chat/memory-knowledge.ts` 已新增：
  - `buildKnowledgeSnapshot(...)`
  - `buildRuntimeKnowledgeSnippet(...)`
  - `buildKnowledgePromptSection(...)`
  - `buildKnowledgeSummary(...)`
- runtime `buildAgentSystemPrompt(...)` 已开始显式注入最小 knowledge-layer section
- assistant metadata / debug metadata 已开始暴露最小 knowledge 摘要
- `memory-upgrade-harness.ts` 已开始显式校验 knowledge seam

结论：

- `P2-2` 的“知识层最小分离”已经成立
- 当前不再需要继续扩来源来证明这条线存在

### P2-3 Thread Compaction / Retention v1

状态：

- **第一版已成立**

当前已成立：

- `packages/core/memory/compaction.ts` 已新增首版 `CompactedThreadSummary` contract
- `apps/web/lib/chat/thread-compaction.ts` 已新增：
  - `buildCompactedThreadSummary(...)`
  - `buildThreadCompactionPromptSection(...)`
  - `buildThreadCompactionSummary(...)`
- runtime `buildAgentSystemPrompt(...)` 已开始显式注入：
  - `Compacted thread summary:`
- assistant metadata / debug metadata 已开始暴露最小 thread compaction 摘要
- `memory-upgrade-harness.ts` 已开始显式校验：
  - compaction metadata reader
  - prompt 注入
  - focus context 可见性

结论：

- `P2-3` 已经越过“只有 contract”的阶段
- 已可视为第一版真实路径成立

### P2-4 Scope / Namespace expansion

状态：

- **已成立第一版，并开始进入真实作用边界**

当前已成立：

- `packages/core/memory/namespace.ts` 已新增首版：
  - `MemoryNamespaceLayer`
  - `MemoryNamespaceRef`
  - `ActiveMemoryNamespace`
  - `buildActiveMemoryNamespace(...)`
- `apps/web/lib/chat/memory-namespace.ts` 已新增：
  - `resolveActiveMemoryNamespace(...)`
  - `buildMemoryNamespacePromptSection(...)`
  - `buildMemoryNamespaceSummary(...)`
- runtime `buildAgentSystemPrompt(...)` 已开始显式注入：
  - `Active Memory Namespace: primary_layer = ...`
- assistant metadata / debug metadata 已开始暴露最小 namespace 摘要
- namespace 当前也已开始影响真实 knowledge 过滤边界：
  - out-of-namespace knowledge 不再进入 prompt / summary
- `memory-upgrade-harness.ts` 已开始显式校验：
  - metadata reader
  - prompt 注入
  - project namespace 命中
  - out-of-namespace knowledge 被过滤

结论：

- `P2-4` 不再只是“可见 seam”
- 已推进到第一条真实分流行为

### P2-5 regression / acceptance expansion

状态：

- **第一版已成立**

当前已成立：

- `memory-upgrade-harness.ts` 当前不只锁 `P0 + P1`
- 也已开始显式校验：
  - scenario memory pack summary
  - knowledge summary
  - thread compaction summary
  - memory namespace summary
  - prompt 中的 compaction / namespace 注入
  - knowledge 的 namespace 过滤结果
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

结论：

- `P2-5` 已不再只是启动
- 已可以视为第一版成立

---

## 4. 当前最值得关注的剩余项

当前真正还值得继续处理的，不是重新开新线，而是：

1. `P2-4` 是否还需要再补一刀 namespace 的真实 retrieval / filtering 边界
2. `P2-5` 是否需要再补一层更正式的 close gate 表达
3. 当前是否已经适合准备：
   - `P2 close note`

---

## 5. 当前结论

当前 `Memory Upgrade P2` 的状态不是“已经完成”，但已经进入：

- **可以开始准备 close-readiness 判断**

更准确地说：

- `P2-1`：基本完成
- `P2-2`：基本完成
- `P2-3`：第一版已成立
- `P2-4`：已成立第一版，并进入真实作用边界
- `P2-5`：第一版已成立

当前这轮复盘已经完成，下一步更合理的不是继续发散做新主题，而是：

- 判断是否还需要最后 1-2 刀收口
- 或直接准备 `P2 close note`
