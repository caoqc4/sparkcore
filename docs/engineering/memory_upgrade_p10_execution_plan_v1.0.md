# SparkCore Memory Upgrade P10 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P9 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P9` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P10` 的第一批实施基线
- 从 `P9` 已成立事实，继续推进到“更统一的 cross-surface governance runtime consolidation、更稳定的 lifecycle / knowledge / scenario consolidated governance contract、以及更接近 phase-level unified memory governance runtime”的执行文档

上层输入：

- [memory_upgrade_p9_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p9_close_note_v1.0.md)
- [memory_upgrade_p9_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p9_close_readiness_v1.0.md)
- [memory_upgrade_p9_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p9_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P10 的一句话目标

**在 `P9` 已建立的 namespace / retention / knowledge / scenario unified governance 基础上，把 SparkCore 记忆系统推进到“更统一的 governance runtime consolidation 层、更明确的 cross-surface consolidated contract、以及更接近 phase-level unified memory runtime consolidation”的阶段。**

---

## 3. P10 与 P9 的分界

P9 已经解决的，是：

- namespace 已进入 unified governance runtime digest / summary / alignment
- retention 已进入 lifecycle unification digest / keep-drop unification / runtime reuse
- knowledge 已进入 governance unification digest / source-budget unification / cross-surface contract
- scenario pack 已进入 governance unification digest / strategy unification / orchestration unification
- 第一版 `P9` regression gate 已成立，并开始进入更像正式阶段 gate 的密度

P10 不再重复做这些 “v7 最小成立证明”。

P10 重点解决的是：

1. namespace governance 从 unified runtime 推进到更稳定的 runtime consolidation contract
2. retention lifecycle 从 unified runtime reuse 推进到更稳定的 lifecycle consolidation contract
3. knowledge governance 从 unified contract 推进到更明确的 cross-surface governance consolidation
4. scenario governance 从 unified strategy contract 推进到更稳定的 runtime orchestration consolidation
5. `P10` 的 regression / acceptance gate 继续上提

---

## 4. P10 首批目标

### 4.1 Namespace governance consolidation v5

P10 首批要把 namespace 从：

- `unified_governance_runtime_digest_id`
- `unified_governance_runtime_summary`
- `unified_runtime_alignment_mode`

继续推进到：

- namespace governance consolidation digest
- 更明确的 retrieval/write runtime consolidation summary
- 更稳定的 cross-surface runtime consolidation alignment

最小要求：

- 至少一条 namespace 决策不再只输出 unified runtime digest，而开始输出更明确的 consolidation digest
- 至少一条 retrieval / write runtime 面开始复用同一层 consolidation 输出

### 4.2 Retention lifecycle consolidation v8

P10 首批要把 retention 从：

- `lifecycle_unification_digest`
- `keep_drop_unification_summary`
- `lifecycle_unification_mode`

继续推进到：

- lifecycle consolidation digest
- 更明确的 keep/drop runtime consolidation summary
- 更稳定的 lifecycle consolidation alignment

最小要求：

- 至少一条 retention 决策不再只输出 unification digest，而开始输出更明确的 consolidation digest
- 至少一条 keep/drop runtime 行为开始复用同一层 consolidation 输出

### 4.3 Knowledge governance consolidation v8

P10 首批要把 knowledge 从：

- `governance_unification_digest`
- `source_budget_unification_summary`
- `governance_unification_mode`

继续推进到：

- knowledge governance consolidation digest
- 更明确的 source/budget runtime consolidation summary
- 更稳定的 cross-surface governance consolidation

最小要求：

- 至少一条 knowledge 决策不再只输出 unification digest，而开始输出更明确的 consolidation digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 consolidation 输出

### 4.4 Scenario governance consolidation v8

P10 首批要把 scenario pack 从：

- `governance_unification_digest_id`
- `strategy_unification_summary`
- `orchestration_unification_mode`

继续推进到：

- scenario governance consolidation digest
- 更明确的 runtime strategy consolidation summary
- 更稳定的 orchestration consolidation alignment

最小要求：

- 至少一条 scenario 决策不再只输出 unification digest，而开始输出更明确的 consolidation digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 consolidation 级事实

### 4.5 Regression / acceptance expansion

P10 首批必须让阶段 gate 继续跟着主线生长，而不是等代码长完再回头补。

最小要求：

- `P10` 形成第一版阶段 gate
- gate 至少锁：
  - namespace governance consolidation v5
  - retention lifecycle consolidation v8
  - knowledge governance consolidation v8
  - scenario governance consolidation v8

---

## 5. P10 施工顺序建议

建议顺序：

1. `P10-1 Namespace governance consolidation v5`
2. `P10-2 Retention lifecycle consolidation v8`
3. `P10-3 Knowledge governance consolidation v8`
4. `P10-4 Scenario governance consolidation v8`
5. `P10-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 consolidation digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P9` unified governance 事实，适合在 `P10` 升成 consolidation 级表达
- scenario governance 已经具备 unification digest / strategy summary，当前最自然的下一步就是上提成更稳定的 runtime consolidation contract
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P10-1`
  - 中段
- `P10-2`
  - 中段
- `P10-3 ~ P10-5`
  - 待开始

整体 `P10` 当前大约：

- **`45% - 55%`**

当前更推荐的下一步：

- **开始 `P10-3 Knowledge governance consolidation v8` 的第一刀**

---

## 6. 当前结论

`P10` 当前已经从执行起点推进到了更明确的前中段。

因此：

- 下一步不需要再写新的总结文档
- 最值的是开始 `P10-3`，让 consolidation 从 namespace / retention 继续向 knowledge 主线扩展
