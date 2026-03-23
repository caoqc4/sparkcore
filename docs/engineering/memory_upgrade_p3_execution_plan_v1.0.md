# SparkCore Memory Upgrade P3 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P2 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0` / `P1` / `P2` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P3` 的第一批实施基线
- 从 `P2` 已成立事实，推进到“更真实的 namespace 分流、更实的 compaction / retention、更明确的 project / world 作用边界”的执行文档

上层输入：

- [memory_upgrade_p2_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p2_close_note_v1.0.md)
- [memory_upgrade_p2_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p2_close_readiness_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P3 的一句话目标

**在 `P2` 已建立的 `pack / knowledge / compaction / namespace` 高阶 seam 基础上，把 SparkCore 记忆系统推进到“更真实的 namespace 作用边界、更真实的 thread retention、以及更可持续的 project/world 级知识与记忆分流”的阶段。**

---

## 3. P3 与 P2 的分界

P2 已经解决的，是：

- `Scenario Memory Pack` 已成为正式 seam
- `Knowledge Layer` 已从 `memory_record` 中最小分层出来
- `Thread Compaction` 已进入真实 prompt / metadata
- `Namespace` 已不只是可见 seam，而开始影响 knowledge 过滤
- 第一版 `P2` regression gate 已成立

P3 不再重复做这些“最小存在证明”。

P3 重点解决的是：

1. `Namespace` 从最小过滤边界推进到更多真实 retrieval / write boundary
2. `Thread Compaction / Retention` 从最小 summary 推进到更明确的保留/裁剪策略
3. `Knowledge Layer` 与 `project / world` scope 的真实分流进一步实体化
4. `Scenario Memory Pack` 从默认内建 seam 推进到更明确的扩展点
5. `P3` 的 close gate 与回归面立住

---

## 4. P3 首批目标

P3 首批不追求把多 Agent / world simulation 一次做满，而是先完成以下五件事。

### 4.1 Namespace boundary expansion

P3 首批要做的，不是完整多 Agent 共享状态引擎，而是把 namespace 从：

- prompt / metadata
- knowledge filtering

继续推进到：

- retrieval decision
- write decision
- project / world-aware scope routing

最小要求：

- 至少一条 retrieval 逻辑开始显式受 namespace 影响
- 至少一条 write / target decision 开始显式受 namespace 影响
- `project / world` 不再只作为 metadata 可见层存在

当前已成立的第一刀代码事实：

- `apps/web/lib/chat/memory-namespace.ts` 当前已开始提供 namespace-aware memory applicability 判断
- `apps/web/lib/chat/memory-recall.ts` 当前已开始支持 `activeNamespace` 输入，并先按 namespace 过滤可参与 recall 的 memory row
- `apps/web/lib/chat/runtime-prepared-turn.ts` / `apps/web/lib/chat/runtime.ts` 当前已开始把 active namespace 传入 memory preparation 主路径
- `memory-upgrade-harness.ts` 当前也已开始显式校验：
  - in-namespace project memory 会被保留
  - out-of-namespace project memory 会被过滤

当前已成立的第二刀代码事实：

- `apps/web/lib/chat/memory-write.ts` 当前已开始支持 `activeNamespace` 输入，并在 generic / relationship write 执行中先按 namespace 过滤可参与去重或 single-slot refresh 的 existing row
- `apps/web/lib/chat/memory-namespace.ts` 当前也已开始提供 namespace-scoped write metadata helper，用于把 `project / world` scope 真实写入 planner metadata
- `apps/web/lib/chat/runtime-turn-post-processing.ts` / `apps/web/app/chat/actions.ts` 当前也已开始把 runtime 期的 active namespace 传入 post-processing write path
- `memory-upgrade-harness.ts` 当前也已开始显式校验：
  - generic planner metadata 会携带 namespace project scope
  - relationship planner metadata 会携带 namespace project scope

当前已成立的第三刀代码事实：

- `apps/web/lib/chat/memory-write-targets.ts` 当前已开始把 active namespace 纳入 `resolvePlannedMemoryWriteTarget(...)`，并显式产出：
  - `write_boundary`
  - `namespace_primary_layer`
  - `target_namespace_id`
- `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把这层 namespace-aware write routing 暴露到 runtime memory write preview
- `apps/web/lib/chat/runtime.ts` 当前也已开始把 `write_boundaries` 写入 `memory_write_planned` event
- `memory-upgrade-harness.ts` 当前也已开始显式校验 project namespace 下的 write boundary 解析与 preview metadata 暴露

当前已成立的第四刀代码事实：

- `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始显式产出：
  - `routed_scope`
  - `routed_target_agent_id`
  - `routed_target_thread_id`
- 在 thread namespace 下，generic `profile / preference` 写入当前会开始走 `thread_local` routed scope，而不再只停留在 `write_boundary = thread` 的元信息层
- `apps/web/lib/chat/memory-write-rows.ts` 当前也已开始把这层 routed scope / routed target ids 真正写进 generic insert / update row
- `apps/web/lib/chat/runtime-preview-metadata.ts` 当前已开始把这层 routed scope 暴露到 memory write preview

### 4.2 Thread retention strategy v1

P3 首批要把 `Thread Compaction` 再往前推进一层，形成最小 retention 策略。

最小要求：

- 明确哪类 thread summary 需要继续保留
- 明确与 `ThreadState`、`episode / timeline` 的边界
- 至少一条 retention/selection helper 成为真实主路径输入

首批不做：

- 复杂自动过期治理
- 大规模后台批处理系统

当前已成立的第一刀代码事实：

- `packages/core/memory/compaction.ts` 当前已开始把 retention 明确成正式 contract：
  - `retention_mode`
  - `retained_fields`
- `apps/web/lib/chat/thread-compaction.ts` 当前已开始提供最小 retention strategy helper，并根据：
  - `focus_mode`
  - `continuity_status`
  - `recent_turn_count`
  推导：
  - `focus_anchor`
  - `continuity_anchor`
  - `recent_window`
  - `minimal`
- runtime prompt / assistant metadata / debug metadata 当前也已开始承接这层 retention 结果，而不再只暴露一个压缩摘要文本
- `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` retention mode

当前已成立的第二刀代码事实：

- `apps/web/lib/chat/thread-compaction.ts` 当前已开始提供：
  - `shouldRetainCompactedThreadSummary(...)`
  - `selectRetainedThreadCompactionSummary(...)`
  这层 keep/drop decision helper
- `apps/web/lib/chat/runtime.ts` 当前也已开始在主路径里先走 retention selection，再决定 compaction summary 是否进入 prompt / metadata / debug
- 当前最小规则已经成立：
  - `closed + minimal`
    的 thread compaction summary 会被主动丢弃
- `memory-upgrade-harness.ts` 当前也已开始显式校验这条 keep/drop 行为

当前已成立的第三刀代码事实：

- `packages/core/memory/compaction.ts` 当前也已开始把 retention reason 收成正式 contract：
  - `retention_reason`
- `apps/web/lib/chat/thread-compaction.ts` 当前也已开始显式产出：
  - `focus_mode_present`
  - `engaged_continuity`
  - `recent_turn_window`
  - `minimal_context`
  - `closed_minimal_pruned`
  这层选择依据
- runtime prompt / assistant metadata / debug metadata 当前也已开始承接 retention reason
- `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_mode_present` 这条 retention reason

### 4.3 Knowledge scope materialization

P3 首批要让 `Knowledge Layer` 更明确地区分：

- thread / agent-local supporting facts
- project-level knowledge
- world-level knowledge

最小要求：

- runtime 或 retrieval 至少一条逻辑开始显式区分 `project / world`
- 不再只靠 prompt 文字说明它们不同

### 4.4 Scenario pack expansion point v1

P3 首批要把 `Scenario Memory Pack` 从“一个默认 companion pack”推进到“更明确的扩展位”。

最小要求：

- pack resolver 支持不止一种内建候选
- 至少有一条 pack 选择依据开始显式来自 context / namespace / knowledge

首批不做：

- 完整插件市场
- 动态远程装载

### 4.5 P3 regression / acceptance expansion

P3 首批要把 gate 继续扩大到：

- namespace-aware retrieval / write decision
- retention strategy
- knowledge scope materialization
- scenario pack selection expansion

目标不是把所有行为都锁死，而是确保 `P3` 的新增事实不会退回：

- 只存在于 prompt 文本
- 只存在于 metadata
- 只存在于文档

---

## 5. P3 明确不做的事项

P3 首批明确不做：

- 完整多 Agent 共享记忆仲裁系统
- world state 实时同步引擎
- 大规模 retention 后台任务系统
- 完整知识治理产品化后台
- 正式对外 API / SDK 产品化

P3 仍然保持：

- 先把真实边界立住
- 再考虑完整平台化

---

## 6. P3 第一批实施顺序

建议顺序：

1. `P3-1 Namespace boundary expansion`
2. `P3-2 Thread retention strategy v1`
3. `P3-3 Knowledge scope materialization`
4. `P3-4 Scenario pack expansion point v1`
5. `P3-5 regression / acceptance expansion`

原因：

- namespace 是后面更多分流与多实体边界的入口
- retention 需要建立在 namespace 与已有 compaction 之上
- knowledge scope materialization 应站在前两者之上推进
- pack 扩展位最后再收，会更稳定
- gate 最后补强，锁住 `P3` 新事实

---

## 7. 模块改动映射

P3 首批高概率会触达这些区域：

- `packages/core/memory/`
  - namespace / compaction / pack / knowledge contract 继续扩
- `apps/web/lib/chat/`
  - `memory-namespace.ts`
  - `memory-knowledge.ts`
  - `thread-compaction.ts`
  - `memory-recall.ts`
  - `memory-write*.ts`
  - `runtime.ts`
- `apps/web/scripts/`
  - `memory-upgrade-harness.ts`
- `docs/engineering/`
  - `memory_upgrade_p3_execution_plan_v1.0.md`
  - 后续 `P3 close readiness / close note`

---

## 8. P3 验收标准

P3 首批验收标准分三类。

### 8.1 功能 gate

- namespace 至少在一条 retrieval / write decision 中成为真实输入
- retention 至少在一条 thread compaction 路径中成为真实选择逻辑
- knowledge 至少在一条 project / world scope 路径中体现真实分流
- scenario pack 至少有一条真实选择扩展位

### 8.2 结构 gate

- namespace 不再只停在 prompt / metadata
- compaction 不再只停在 summary 存在
- knowledge scope 不再只停在 summary / title 层
- pack 扩展位不再只绑定默认 companion 单值

### 8.3 回归 gate

- `pnpm --filter @sparkcore/web memory:upgrade:harness` 持续通过
- `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json` 持续通过
- `P0 ~ P2` 已成立主路径不回退：
  - `profile`
  - `thread_state`
  - `episode`
  - `timeline`
  - `dynamic_profile`
  - scenario pack seam
  - knowledge seam
  - compaction seam
  - namespace seam

---

## 9. P3 当前起点判断

P3 不是从零开始。

当前可直接依赖的代码事实包括：

- `P0 ~ P2` 的 retrieval / context assembly / metadata 主线已成立
- namespace 已开始影响 knowledge filtering
- compaction 已进入 prompt / metadata / harness
- pack / knowledge / namespace / compaction 都已有最小 code contract

因此，P3 的正确起点不是重新立 seam，而是：

**把这些 seam 再推进成更真实的作用边界。**

---

## 10. 当前推荐的第一刀

P3 最推荐的第一刀是：

**`P3-1 Namespace boundary expansion`**

理由：

- 它最直接决定 `P3` 会不会只是继续写更多 metadata
- 它也是后面 retention、knowledge scope、pack selection 继续做深的前置边界
