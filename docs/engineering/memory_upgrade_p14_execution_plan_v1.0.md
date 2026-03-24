# SparkCore Memory Upgrade P14 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P13 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P13` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P14` 的第一批实施基线
- 从 `P13` 已成立事实，继续推进到“更统一的 phase-level memory governance fabric plane、更稳定的 cross-surface fabric plane reuse、以及更接近统一 memory governance fabric plane contract”的执行文档

上层输入：

- [memory_upgrade_p13_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_close_note_v1.0.md)
- [memory_upgrade_p13_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_close_readiness_v1.0.md)
- [memory_upgrade_p13_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_execution_plan_v1.0.md)
- [memory_upgrade_p13_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)
- [memory_upgrade_p14_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_gate_snapshot_v1.0.md)

---

## 2. P14 的一句话目标

**在 `P13` 已建立的 namespace / retention / knowledge / scenario governance fabric 基础上，把 SparkCore 记忆系统推进到“更统一的 governance fabric plane、更稳定的 cross-surface fabric plane reuse、以及更接近 phase-level memory governance fabric plane contract”的阶段。**

---

## 3. P14 与 P13 的分界

P13 已经解决的，是：

- namespace 已进入 governance fabric runtime / alignment / reuse
- retention 已进入 lifecycle governance fabric / keep-drop governance fabric reuse
- knowledge 已进入 governance fabric / source-budget governance fabric reuse
- scenario pack 已进入 governance fabric / runtime governance fabric contract
- 第一版 `P13` 正式 gate、gate snapshot、close note 已成立

P14 不再重复做这些 “v11 governance fabric 最小成立证明”。

P14 重点解决的是：

1. namespace governance 从 fabric runtime 推进到更稳定的 governance fabric plane
2. retention lifecycle 从 fabric reuse 推进到更统一的 lifecycle governance fabric plane
3. knowledge governance 从 fabric contract 推进到更稳定的 cross-surface governance fabric plane reuse
4. scenario governance 从 fabric runtime 推进到更明确的 scenario governance fabric plane contract
5. `P14` 的 regression / acceptance gate 继续上提，并开始更明确服务于 phase-level plane 判断

---

## 4. P14 首批目标

### 4.1 Namespace governance fabric plane v9

P14 首批要把 namespace 从：

- `governance_fabric_runtime_digest_id`
- `governance_fabric_runtime_summary`
- `governance_fabric_alignment_mode`
- `governance_fabric_reuse_mode`

继续推进到：

- namespace governance fabric plane digest
- 更明确的 retrieval / write fabric plane summary
- 更稳定的 cross-surface governance fabric plane alignment

最小要求：

- 至少一条 namespace 决策不再只输出 governance fabric digest，而开始输出更明确的 governance fabric plane digest
- 至少一条 retrieval / write runtime 面开始复用同一层 governance fabric plane 输出

### 4.2 Retention lifecycle governance fabric plane v12

P14 首批要把 retention 从：

- `lifecycle_governance_fabric_digest`
- `keep_drop_governance_fabric_summary`
- `lifecycle_governance_fabric_alignment_mode`
- `lifecycle_governance_fabric_reuse_mode`

继续推进到：

- lifecycle governance fabric plane digest
- 更明确的 keep / drop governance fabric plane summary
- 更稳定的 lifecycle governance fabric plane alignment

最小要求：

- 至少一条 retention 决策不再只输出 governance fabric digest，而开始输出更明确的 governance fabric plane digest
- 至少一条 keep / drop runtime 行为开始复用同一层 governance fabric plane 输出

### 4.3 Knowledge governance fabric plane v12

P14 首批要把 knowledge 从：

- `governance_fabric_digest`
- `source_budget_governance_fabric_summary`
- `governance_fabric_mode`
- `governance_fabric_reuse_mode`

继续推进到：

- knowledge governance fabric plane digest
- 更明确的 source / budget governance fabric plane summary
- 更稳定的 cross-surface governance fabric plane reuse

最小要求：

- 至少一条 knowledge 决策不再只输出 governance fabric digest，而开始输出更明确的 governance fabric plane digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 governance fabric plane 输出

### 4.4 Scenario governance fabric plane v12

P14 首批要把 scenario pack 从：

- `governance_fabric_digest_id`
- `strategy_governance_fabric_summary`
- `orchestration_governance_fabric_mode`
- `governance_fabric_reuse_mode`

继续推进到：

- scenario governance fabric plane digest
- 更明确的 strategy governance fabric plane summary
- 更稳定的 runtime scenario governance fabric plane alignment

最小要求：

- 至少一条 scenario 决策不再只输出 governance fabric digest，而开始输出更明确的 governance fabric plane digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 governance fabric plane 级事实

### 4.5 Regression / acceptance expansion

P14 首批必须让阶段 gate 继续跟着主线生长，而不是等 plane 事实散落到多个输出面之后再回头补。

最小要求：

- `P14` 形成第一版阶段 gate
- gate 至少锁：
  - namespace governance fabric plane v9
  - retention lifecycle governance fabric plane v12
  - knowledge governance fabric plane v12
  - scenario governance fabric plane v12
- gate 至少开始暴露：
  - plane-level consistency
  - plane-level drift guard
  - close-readiness 可消费摘要

---

## 5. P14 施工顺序建议

建议顺序：

1. `P14-1 Namespace governance fabric plane v9`
2. `P14-2 Retention lifecycle governance fabric plane v12`
3. `P14-3 Knowledge governance fabric plane v12`
4. `P14-4 Scenario governance fabric plane v12`
5. `P14-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 governance fabric plane digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P13` governance fabric 事实，适合在 `P14` 升成 fabric plane 级表达
- scenario governance 已经具备 runtime governance fabric summary / reuse，当前最自然的下一步就是上提成更稳定的 governance fabric plane contract
- gate 继续保持“跟着主线长”，避免 `P14` 再次出现 plane 级事实已经成立但阶段判断滞后的情况

当前阶段判断：

- `P14-1`
  - 已开始
  - namespace governance fabric plane v9 第一刀已成立
- `P14-2`
  - 已开始
  - retention lifecycle governance fabric plane v12 第一刀已成立
- `P14-3`
  - 已开始
  - knowledge governance fabric plane v12 第一刀已成立
- `P14-4`
  - 已开始
  - scenario governance fabric plane v12 第一刀已成立
- `P14-5`
  - 已开始
  - 第一版正式 gate 已建立

整体 `P14` 当前大约：

- **`60% - 65%`**

当前更推荐的下一步：

- **继续扩 `P14-5 Regression / acceptance expansion`，优先补 plane-level snapshot / negative coverage / close-readiness consumption**

---

## 6. 当前结论

`P13` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P13` 可以正式视为已收官阶段
- `P14` 应作为新的执行起点
- `P14-1 Namespace governance fabric plane v9` 的第一刀当前已经成立：
  - `packages/core/memory/namespace.ts` 已新增 namespace governance fabric plane digest type
  - `apps/web/lib/chat/memory-namespace.ts` 已把 fabric plane 事实接入 boundary / prompt / summary / scoped metadata / plane contract
  - `apps/web/lib/chat/runtime-assistant-metadata.ts`、`assistant-message-metadata.ts`、`assistant-message-metadata-read.ts` 已把 fabric plane 事实接入 assistant metadata 与 reader
  - `apps/web/lib/chat/runtime-preview-metadata.ts`、`memory-write-targets.ts`、`runtime-debug-metadata.ts` 已把 fabric plane 事实接入 write preview / target routing / debug surface
  - `apps/web/scripts/memory-upgrade-harness.ts` 已新增 `p14_namespace_governance_fabric_plane.namespace_governance_fabric_plane_v9_ok`
- `P14-2 Retention lifecycle governance fabric plane v12` 的第一刀当前已经成立：
  - `packages/core/memory/compaction.ts` 已新增 retention governance fabric plane digest / summary / alignment / reuse type
  - `apps/web/lib/chat/thread-compaction.ts` 已把 fabric plane 事实接入 compaction summary text、summary object 与 retain/drop decision
  - `apps/web/lib/chat/runtime-assistant-metadata.ts`、`assistant-message-metadata.ts`、`assistant-message-metadata-read.ts` 已把 retention fabric plane 事实接入 assistant metadata 与 reader
  - `apps/web/scripts/memory-upgrade-harness.ts` 已新增 `p14_retention_governance_fabric_plane.retention_lifecycle_governance_fabric_plane_v12_ok`
  - 当前基础验证已通过：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
- `P14-3 Knowledge governance fabric plane v12` 的第一刀当前已经成立：
  - `packages/core/memory/knowledge.ts` 已新增 knowledge governance fabric plane digest / summary / mode / reuse type
  - `apps/web/lib/chat/memory-knowledge.ts` 已把 fabric plane 事实接入 prompt section 与 knowledge summary
  - `apps/web/lib/chat/runtime-assistant-metadata.ts`、`assistant-message-metadata.ts`、`assistant-message-metadata-read.ts` 已把 knowledge fabric plane 事实接入 assistant metadata 与 reader
  - `apps/web/scripts/memory-upgrade-harness.ts` 已新增 `p14_knowledge_governance_fabric_plane.knowledge_governance_fabric_plane_v12_ok`
  - 当前基础验证已通过：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
- `P14-4 Scenario governance fabric plane v12` 的第一刀当前已经成立：
  - `packages/core/memory/packs.ts` 已新增 scenario governance fabric plane digest / summary / mode / reuse type
  - `apps/web/lib/chat/memory-packs.ts` 已把 fabric plane 事实接入 scenario policy、active pack contract 与 prompt section
  - `apps/web/lib/chat/runtime-assistant-metadata.ts`、`runtime-debug-metadata.ts`、`assistant-message-metadata.ts`、`assistant-message-metadata-read.ts` 已把 scenario fabric plane 事实接入 assistant metadata、debug surface 与 reader
  - `apps/web/scripts/memory-upgrade-harness.ts` 已新增 `p14_scenario_governance_fabric_plane.scenario_governance_fabric_plane_v12_ok`
  - 当前基础验证已通过：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
- `P14-5 Regression / acceptance expansion` 的第一刀当前已经成立：
  - `apps/web/scripts/memory-upgrade-harness.ts` 已新增 `p14_regression_gate`
  - 当前 gate 已按三层 acceptance 面输出：
    - `positive_contracts`
    - `metadata_consistency`
    - `drift_guards`
- 当前 gate 已锁住：
  - namespace governance fabric plane v9
  - retention lifecycle governance fabric plane v12
  - knowledge governance fabric plane v12
  - scenario governance fabric plane v12
  - plane-level metadata consistency v12
  - plane-level prompt surface consistency v12
  - plane-level drift guard v12
  - scenario fabric plane drift guard v12
  - `apps/web/scripts/memory-upgrade-harness.ts` 当前也已新增 `p14_gate_snapshot`，用于更轻量地消费当前 gate 状态
  - 当前 gate 轻量快照请以
    [memory_upgrade_p14_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_gate_snapshot_v1.0.md)
    为准
  - 当前基础验证已通过：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
- 下一步最合理的是继续扩 `P14-5`，把 gate snapshot、negative coverage 和 close-readiness 可消费摘要补得更完整，而不是回到单线平推阶段

当前正式收官结论请以
[memory_upgrade_p13_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_close_note_v1.0.md)
为准。
