# SparkCore Memory Upgrade P11 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P10 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P10` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P11` 的第一批实施基线
- 从 `P10` 已成立事实，继续推进到“更稳定的 unified governance consolidation runtime、更明确的 cross-surface consolidated governance coordination、以及更接近 phase-level unified memory governance consolidation runtime”的执行文档

上层输入：

- [memory_upgrade_p10_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p10_close_note_v1.0.md)
- [memory_upgrade_p10_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p10_close_readiness_v1.0.md)
- [memory_upgrade_p10_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p10_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P11 的一句话目标

**在 `P10` 已建立的 namespace / retention / knowledge / scenario governance consolidation 基础上，把 SparkCore 记忆系统推进到“更统一的 governance consolidation runtime 协调层、更明确的 cross-surface consolidated governance coordination contract、以及更接近 phase-level unified memory governance consolidation runtime”的阶段。**

---

## 3. P11 与 P10 的分界

P10 已经解决的，是：

- namespace 已进入 governance consolidation digest / summary / runtime consolidation reuse
- retention 已进入 lifecycle consolidation digest / keep-drop consolidation / runtime reuse
- knowledge 已进入 governance consolidation digest / source-budget consolidation / selection runtime reuse
- scenario pack 已进入 governance consolidation digest / strategy consolidation / orchestration consolidation
- 第一版 `P10` regression gate 已成立，并开始进入更像正式阶段 gate 的密度

P11 不再重复做这些 “v8 consolidation 最小成立证明”。

P11 重点解决的是：

1. namespace governance 从 consolidation runtime reuse 推进到更稳定的 unified governance consolidation coordination
2. retention lifecycle 从 consolidation reuse 推进到更明确的 lifecycle consolidation coordination
3. knowledge governance 从 consolidation contract 推进到更稳定的 cross-surface consolidation coordination
4. scenario governance 从 orchestration consolidation 推进到更明确的 runtime strategy consolidation coordination
5. `P11` 的 regression / acceptance gate 继续上提

---

## 4. P11 首批目标

### 4.1 Namespace unified governance consolidation v6

P11 首批要把 namespace 从：

- `governance_consolidation_digest_id`
- `governance_consolidation_summary`
- `runtime_consolidation_mode`

继续推进到：

- namespace unified governance consolidation digest
- 更明确的 retrieval / write consolidation coordination summary
- 更稳定的 cross-surface governance consolidation alignment

最小要求：

- 至少一条 namespace 决策不再只输出 consolidation digest，而开始输出更明确的 unified consolidation digest
- 至少一条 retrieval / write runtime 面开始复用同一层 unified consolidation 输出

### 4.2 Retention lifecycle coordination v9

P11 首批要把 retention 从：

- `lifecycle_consolidation_digest`
- `keep_drop_consolidation_summary`
- `lifecycle_consolidation_mode`

继续推进到：

- lifecycle coordination digest
- 更明确的 keep / drop consolidation coordination summary
- 更稳定的 lifecycle coordination alignment

最小要求：

- 至少一条 retention 决策不再只输出 consolidation digest，而开始输出更明确的 coordination digest
- 至少一条 keep / drop runtime 行为开始复用同一层 coordination 输出

### 4.3 Knowledge governance coordination v9

P11 首批要把 knowledge 从：

- `governance_consolidation_digest`
- `source_budget_consolidation_summary`
- `governance_consolidation_mode`

继续推进到：

- knowledge governance coordination digest
- 更明确的 source / budget coordination summary
- 更稳定的 cross-surface governance coordination

最小要求：

- 至少一条 knowledge 决策不再只输出 consolidation digest，而开始输出更明确的 coordination digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 coordination 输出

### 4.4 Scenario governance coordination v9

P11 首批要把 scenario pack 从：

- `governance_consolidation_digest_id`
- `strategy_consolidation_summary`
- `orchestration_consolidation_mode`

继续推进到：

- scenario governance coordination digest
- 更明确的 runtime strategy coordination summary
- 更稳定的 orchestration coordination alignment

最小要求：

- 至少一条 scenario 决策不再只输出 consolidation digest，而开始输出更明确的 coordination digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 coordination 级事实

### 4.5 Regression / acceptance expansion

P11 首批必须让阶段 gate 继续跟着主线生长，而不是等代码长完再回头补。

最小要求：

- `P11` 形成第一版阶段 gate
- gate 至少锁：
  - namespace unified governance consolidation v6
  - retention lifecycle coordination v9
  - knowledge governance coordination v9
  - scenario governance coordination v9

---

## 5. P11 施工顺序建议

建议顺序：

1. `P11-1 Namespace unified governance consolidation v6`
2. `P11-2 Retention lifecycle coordination v9`
3. `P11-3 Knowledge governance coordination v9`
4. `P11-4 Scenario governance coordination v9`
5. `P11-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 unified consolidation digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P10` consolidation 事实，适合在 `P11` 升成 coordination 级表达
- scenario governance 已经具备 consolidation digest / strategy summary，当前最自然的下一步就是上提成更稳定的 runtime coordination contract
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P11-1`
  - 中段
- `P11-2`
  - 中段
- `P11-3`
  - 待开始
- `P11-4`
  - 待开始
- `P11-5`
  - 待开始

整体 `P11` 当前大约：

- **`50% - 60%`**

当前更推荐的下一步：

- **开始 `P11-3 Knowledge governance coordination v9` 的第一刀**

---

## 6. 当前结论

`P11` 当前已经具备明确的上层输入与施工起点。

因此：

- `P10` 可以正式视为已收官阶段
- `P11` 应作为新的执行起点
- `P11-1` 已经进入中段
- `P11-2` 已经推进到中段，当前更值的是开始 `P11-3`
