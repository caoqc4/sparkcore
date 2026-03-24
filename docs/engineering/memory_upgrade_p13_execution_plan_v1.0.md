# SparkCore Memory Upgrade P13 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P12 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P12` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P13` 的第一批实施基线
- 从 `P12` 已成立事实，继续推进到“更统一的 phase-level memory governance fabric、更稳定的 cross-surface fabric reuse、以及更接近统一 memory governance fabric plane”的执行文档

上层输入：

- [memory_upgrade_p12_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_close_note_v1.0.md)
- [memory_upgrade_p12_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_close_readiness_v1.0.md)
- [memory_upgrade_p12_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P13 的一句话目标

**在 `P12` 已建立的 namespace / retention / knowledge / scenario governance plane 基础上，把 SparkCore 记忆系统推进到“更统一的 governance fabric runtime、更稳定的 cross-surface fabric reuse、以及更接近 phase-level memory governance fabric plane”的阶段。**

---

## 3. P13 与 P12 的分界

P12 已经解决的，是：

- namespace 已进入 governance plane runtime / reuse
- retention 已进入 lifecycle governance plane / keep-drop governance plane reuse
- knowledge 已进入 governance plane / selection budget governance plane reuse
- scenario pack 已进入 governance plane / runtime governance plane contract
- 第一版 `P12` regression gate 已成立，并已足以支撑 close-ready 判断

P13 不再重复做这些 “v10 governance plane 最小成立证明”。

P13 重点解决的是：

1. namespace governance 从 governance plane runtime 推进到更稳定的 governance fabric runtime
2. retention lifecycle 从 governance plane reuse 推进到更统一的 lifecycle governance fabric
3. knowledge governance 从 governance plane contract 推进到更稳定的 cross-surface governance fabric reuse
4. scenario governance 从 governance plane runtime 推进到更明确的 scenario governance fabric contract
5. `P13` 的 regression / acceptance gate 继续上提

---

## 4. P13 首批目标

### 4.1 Namespace governance fabric runtime v8

P13 首批要把 namespace 从：

- `governance_plane_runtime_digest_id`
- `governance_plane_runtime_summary`
- `governance_plane_reuse_mode`

继续推进到：

- namespace governance fabric digest
- 更明确的 retrieval / write fabric runtime summary
- 更稳定的 cross-surface governance fabric alignment

最小要求：

- 至少一条 namespace 决策不再只输出 governance plane digest，而开始输出更明确的 governance fabric digest
- 至少一条 retrieval / write runtime 面开始复用同一层 governance fabric 输出

### 4.2 Retention lifecycle governance fabric v11

P13 首批要把 retention 从：

- `lifecycle_governance_plane_digest`
- `keep_drop_governance_plane_summary`
- `lifecycle_governance_plane_reuse_mode`

继续推进到：

- lifecycle governance fabric digest
- 更明确的 keep / drop governance fabric summary
- 更稳定的 lifecycle governance fabric alignment

最小要求：

- 至少一条 retention 决策不再只输出 governance plane digest，而开始输出更明确的 governance fabric digest
- 至少一条 keep / drop runtime 行为开始复用同一层 governance fabric 输出

### 4.3 Knowledge governance fabric v11

P13 首批要把 knowledge 从：

- `governance_plane_digest`
- `source_budget_governance_plane_summary`
- `governance_plane_reuse_mode`

继续推进到：

- knowledge governance fabric digest
- 更明确的 source / budget governance fabric summary
- 更稳定的 cross-surface governance fabric reuse

最小要求：

- 至少一条 knowledge 决策不再只输出 governance plane digest，而开始输出更明确的 governance fabric digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 governance fabric 输出

### 4.4 Scenario governance fabric v11

P13 首批要把 scenario pack 从：

- `governance_plane_digest_id`
- `strategy_governance_plane_summary`
- `governance_plane_reuse_mode`

继续推进到：

- scenario governance fabric digest
- 更明确的 strategy governance fabric summary
- 更稳定的 runtime scenario governance fabric alignment

最小要求：

- 至少一条 scenario 决策不再只输出 governance plane digest，而开始输出更明确的 governance fabric digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 governance fabric 级事实

### 4.5 Regression / acceptance expansion

P13 首批必须让阶段 gate 继续跟着主线生长，而不是等代码长完再回头补。

最小要求：

- `P13` 形成第一版阶段 gate
- gate 至少锁：
  - namespace governance fabric runtime v8
  - retention lifecycle governance fabric v11
  - knowledge governance fabric v11
  - scenario governance fabric v11

---

## 5. P13 施工顺序建议

建议顺序：

1. `P13-1 Namespace governance fabric runtime v8`
2. `P13-2 Retention lifecycle governance fabric v11`
3. `P13-3 Knowledge governance fabric v11`
4. `P13-4 Scenario governance fabric v11`
5. `P13-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 governance fabric digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P12` governance plane 事实，适合在 `P13` 升成 fabric 级表达
- scenario governance 已经具备 runtime governance plane summary / reuse，当前最自然的下一步就是上提成更稳定的 governance fabric contract
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P13-1`
  - 前中段
- `P13-2`
  - 前中段
- `P13-3`
  - 前中段
- `P13-4`
  - 前中段
- `P13-5`
  - 已开始
  - 第一版正式 gate 已建立

整体 `P13` 当前大约：

- **`70% - 75%`**

当前更推荐的下一步：

- **继续扩 `P13-5 Regression / acceptance expansion`，把第一版 gate 从 fabric 成立证明继续推进到更完整的 acceptance coverage**

---

## 6. 当前结论

`P13` 当前已经具备明确的上层输入与施工起点。

因此：

- `P12` 可以正式视为已收官阶段
- `P13` 应作为新的执行起点
- `P13-5` 的第一刀已经成立：
  - `memory-upgrade-harness.ts` 当前已新增正式 `p13_regression_gate`
  - gate 当前已锁住：
    - namespace governance fabric runtime v8
    - retention lifecycle governance fabric v11
    - knowledge governance fabric v11
    - scenario governance fabric v11
    - cross-surface fabric metadata consistency v11
  - 已完成本轮基础验证：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
- 下一步最合理的是继续扩 `P13-5`，而不是回退到更早子项
