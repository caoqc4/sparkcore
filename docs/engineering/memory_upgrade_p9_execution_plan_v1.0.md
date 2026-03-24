# SparkCore Memory Upgrade P9 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P8 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P8` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P9` 的第一批实施基线
- 从 `P8` 已成立事实，继续推进到“更统一的 cross-surface governance runtime、更稳定的 lifecycle / knowledge / scenario unified governance contract、以及更接近 phase-level unified memory runtime”的执行文档

上层输入：

- [memory_upgrade_p8_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p8_close_note_v1.0.md)
- [memory_upgrade_p8_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p8_close_readiness_v1.0.md)
- [memory_upgrade_p8_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p8_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P9 的一句话目标

**在 `P8` 已建立的 namespace / retention / knowledge / scenario convergence 基础上，把 SparkCore 记忆系统推进到“更统一的 governance runtime 层、更明确的 cross-surface unified contract、以及更接近 phase-level unified memory governance runtime”的阶段。**

---

## 3. P9 与 P8 的分界

P8 已经解决的，是：

- namespace 已进入 governance convergence digest / summary / alignment
- retention 已进入 lifecycle convergence digest / keep-drop convergence / alignment reuse
- knowledge 已进入 governance convergence digest / source-budget alignment / prompt selection reuse
- scenario pack 已进入 governance convergence digest / strategy convergence / orchestration alignment
- 第一版 `P8` regression gate 已成立

P9 不再重复做这些 “v6 最小成立证明”。

P9 重点解决的是：

1. namespace governance 从 convergence digest 推进到更统一的 runtime governance contract
2. retention lifecycle 从 convergence reuse 推进到更稳定的 unified lifecycle governance contract
3. knowledge governance 从 convergence digest 推进到更明确的 cross-surface unified governance coordination
4. scenario governance 从 convergence digest 推进到更统一的 runtime strategy governance contract
5. `P9` 的 regression / acceptance gate 立住

---

## 4. P9 首批目标

### 4.1 Namespace unified governance runtime v4

P9 首批要把 namespace 从：

- `governance_convergence_digest_id`
- `governance_convergence_summary`
- `retrieval_write_digest_alignment`

继续推进到：

- namespace unified governance digest
- 更明确的 retrieval/write runtime governance summary
- 更稳定的 cross-surface runtime alignment

最小要求：

- 至少一条 namespace 决策不再只输出 convergence digest，而开始输出更明确的 unified runtime governance digest
- 至少一条 retrieval / write runtime 面开始复用同一层 unified governance 输出

### 4.2 Retention lifecycle unification v7

P9 首批要把 retention 从：

- `lifecycle_convergence_digest`
- `keep_drop_convergence_summary`
- `lifecycle_alignment_mode`

继续推进到：

- lifecycle unified governance digest
- 更明确的 keep/drop runtime governance summary
- 更稳定的 lifecycle unified alignment

最小要求：

- 至少一条 retention 决策不再只输出 convergence digest，而开始输出更明确的 unified lifecycle governance digest
- 至少一条 keep/drop runtime 行为开始复用同一层 unified governance 输出

### 4.3 Knowledge governance unification v7

P9 首批要把 knowledge 从：

- `governance_convergence_digest`
- `source_budget_alignment_summary`
- `governance_alignment_mode`

继续推进到：

- knowledge unified governance digest
- 更明确的 source/budget runtime governance summary
- 更稳定的 cross-surface governance unification

最小要求：

- 至少一条 knowledge 决策不再只输出 convergence digest，而开始输出更明确的 unified governance digest
- 至少一条 prompt / budget / metadata 行为开始复用同一层 unified governance 输出

### 4.4 Scenario governance unification v7

P9 首批要把 scenario pack 从：

- `governance_convergence_digest_id`
- `strategy_convergence_summary`
- `orchestration_alignment_mode`

继续推进到：

- scenario unified governance digest
- 更明确的 runtime strategy governance summary
- 更稳定的 orchestration unified alignment

最小要求：

- 至少一条 scenario 决策不再只输出 convergence digest，而开始输出更明确的 unified governance digest
- 至少一条 prompt / metadata / debug 摘要开始暴露 unified governance 级事实

### 4.5 Regression / acceptance expansion

P9 首批必须让阶段 gate 继续跟着主线生长，而不是等代码长完再回头补。

最小要求：

- `P9` 形成第一版阶段 gate
- gate 至少锁：
  - namespace unified governance runtime v4
  - retention lifecycle unification v7
  - knowledge governance unification v7
  - scenario governance unification v7

---

## 5. P9 施工顺序建议

建议顺序：

1. `P9-1 Namespace unified governance runtime v4`
2. `P9-2 Retention lifecycle unification v7`
3. `P9-3 Knowledge governance unification v7`
4. `P9-4 Scenario governance unification v7`
5. `P9-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 unified runtime digest 立起来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P8` convergence 事实，适合在 `P9` 升成 unified governance 级表达
- scenario governance 已经具备 convergence digest / alignment，当前最自然的下一步就是上提成更统一的 runtime governance contract
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P9-1`
  - 中段
- `P9-2`
  - 中段
- `P9-3`
  - 前中段
- `P9-4`
  - 待开始
- `P9-5`
  - 待开始

整体 `P9` 当前大约：

- **`55% - 65%`**

当前更推荐的下一步：

- **先对 `P9-3 Knowledge governance unification v7` 做一次小评估**
- 当前 `P9-3` 已开始显式产出：
  - `governance_unification_digest`
  - `source_budget_unification_summary`
  - `governance_unification_mode`
- 这层 unified knowledge contract 已开始进入：
  - knowledge prompt section
  - assistant metadata / reader
  - runtime debug metadata
  - harness
- 这说明 `P9-3` 已经不只是 convergence 字段可见，而是开始进入真实的 knowledge prompt / metadata 统一输出
- 当前更值的下一步，是先判断它现在处在前中段还是已经接近中段，再决定继续补第二刀还是切去 `P9-4`

---

## 6. 当前结论

`P9` 当前已经从执行起点推进到了更明确的前半段。

因此：

- 下一步不需要再写新的总结文档
- 最值的是开始 `P9-2` 的第一刀实现
