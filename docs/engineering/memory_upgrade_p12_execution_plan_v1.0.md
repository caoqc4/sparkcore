# SparkCore Memory Upgrade P12 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P11 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P11` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P12` 的第一批实施基线
- 从 `P11` 已成立事实，继续推进到“更统一的 phase-level memory governance runtime、更稳定的 cross-surface governance coordination reuse、以及更接近统一 memory governance plane”的执行文档

上层输入：

- [memory_upgrade_p11_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_close_note_v1.0.md)
- [memory_upgrade_p11_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_close_readiness_v1.0.md)
- [memory_upgrade_p11_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P12 的一句话目标

**在 `P11` 已建立的 namespace / retention / knowledge / scenario governance coordination 基础上，把 SparkCore 记忆系统推进到“更统一的 governance plane runtime、更稳定的 cross-surface coordination reuse、以及更接近 phase-level memory governance plane”的阶段。**

---

## 3. P12 与 P11 的分界

P11 已经解决的，是：

- namespace 已进入 unified governance consolidation / cross-surface coordination
- retention 已进入 lifecycle coordination / keep-drop runtime coordination reuse
- knowledge 已进入 governance coordination / selection runtime coordination reuse
- scenario pack 已进入 governance coordination / strategy runtime coordination / reuse
- 第一版 `P11` regression gate 已成立，并已足以支撑 close-ready 判断

P12 不再重复做这些 “v9 coordination 最小成立证明”。

P12 重点解决的是：

1. namespace governance 从 unified consolidation coordination 推进到更稳定的 governance plane runtime
2. retention lifecycle 从 coordination reuse 推进到更统一的 lifecycle governance plane
3. knowledge governance 从 coordination contract 推进到更稳定的 cross-surface governance plane reuse
4. scenario governance 从 runtime coordination 推进到更明确的 scenario governance plane contract
5. `P12` 的 regression / acceptance gate 继续上提

---

## 4. P12 首批目标

### 4.1 Namespace governance plane runtime v7

P12 首批要把 namespace 从：

- `unified_governance_consolidation_digest_id`
- `unified_governance_consolidation_summary`
- `unified_consolidation_coordination_summary`

继续推进到：

- namespace governance plane digest
- 更明确的 retrieval / write plane runtime summary
- 更稳定的 cross-surface governance plane alignment

最小要求：

- 至少一条 namespace 决策不再只输出 unified consolidation digest，而开始输出更明确的 governance plane digest
- 至少一条 retrieval / write runtime 面开始复用同一层 governance plane 输出

### 4.2 Retention lifecycle governance plane v10

P12 首批要把 retention 从：

- `lifecycle_coordination_digest`
- `keep_drop_consolidation_coordination_summary`
- `lifecycle_coordination_reuse_mode`

继续推进到：

- lifecycle governance plane digest
- 更明确的 keep / drop governance plane summary
- 更稳定的 lifecycle governance plane alignment

最小要求：

- 至少一条 retention 决策不再只输出 coordination digest，而开始输出更明确的 governance plane digest
- 至少一条 keep / drop runtime 行为开始复用同一层 governance plane 输出

### 4.3 Knowledge governance plane v10

P12 首批要把 knowledge 从：

- `governance_coordination_digest`
- `source_budget_coordination_summary`
- `governance_coordination_reuse_mode`

继续推进到：

- knowledge governance plane digest
- 更明确的 source / budget governance plane summary
- 更稳定的 cross-surface governance plane reuse

最小要求：

- 至少一条 knowledge 决策不再只输出 coordination digest，而开始输出更明确的 governance plane digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 governance plane 输出

### 4.4 Scenario governance plane v10

P12 首批要把 scenario pack 从：

- `governance_coordination_digest_id`
- `strategy_runtime_coordination_summary`
- `governance_coordination_reuse_mode`

继续推进到：

- scenario governance plane digest
- 更明确的 strategy governance plane summary
- 更稳定的 runtime scenario governance plane alignment

最小要求：

- 至少一条 scenario 决策不再只输出 coordination digest，而开始输出更明确的 governance plane digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 governance plane 级事实

### 4.5 Regression / acceptance expansion

P12 首批必须让阶段 gate 继续跟着主线生长，而不是等代码长完再回头补。

最小要求：

- `P12` 形成第一版阶段 gate
- gate 至少锁：
  - namespace governance plane runtime v7
  - retention lifecycle governance plane v10
  - knowledge governance plane v10
  - scenario governance plane v10

---

## 5. P12 施工顺序建议

建议顺序：

1. `P12-1 Namespace governance plane runtime v7`
2. `P12-2 Retention lifecycle governance plane v10`
3. `P12-3 Knowledge governance plane v10`
4. `P12-4 Scenario governance plane v10`
5. `P12-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 governance plane digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P11` coordination 事实，适合在 `P12` 升成 plane 级表达
- scenario governance 已经具备 runtime coordination summary / reuse，当前最自然的下一步就是上提成更稳定的 governance plane contract
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P12-1`
  - 前中段到中段之间
- `P12-2`
  - 前中段到中段之间
- `P12-3`
  - 前中段
- `P12-4`
  - 前中段
- `P12-5`
  - 第一版已成立

整体 `P12` 当前大约：

- **`70% - 75%`**

当前更推荐的下一步：

- **开始 `P12 close-readiness` 前置评估**

当前正式 `close-readiness` 判断请以
[memory_upgrade_p12_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_close_readiness_v1.0.md)
为准。

---

## 6. 当前结论

`P12` 当前已经具备明确的上层输入与施工起点。

因此：

- `P11` 可以正式视为已收官阶段
- `P12` 应作为新的执行起点
- 下一步最合理的是开始 `P12 close-readiness` 前置评估
