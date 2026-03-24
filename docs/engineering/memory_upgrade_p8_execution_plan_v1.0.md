# SparkCore Memory Upgrade P8 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P7 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P7` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P8` 的第一批实施基线
- 从 `P7` 已成立事实，继续推进到“更统一的跨层 governance digest、更明确的 lifecycle / knowledge / scenario convergence、以及更接近 unified governance runtime”的执行文档

上层输入：

- [memory_upgrade_p7_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p7_close_note_v1.0.md)
- [memory_upgrade_p7_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p7_close_readiness_v1.0.md)
- [memory_upgrade_p7_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p7_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P8 的一句话目标

**在 `P7` 已建立的 namespace / retention / knowledge / scenario digest 与 coordination 基础上，把 SparkCore 记忆系统推进到“更统一的 governance convergence 层、更明确的跨层 digest 收束、以及更接近 phase-level unified runtime”的阶段。**

---

## 3. P8 与 P7 的分界

P7 已经解决的，是：

- namespace 已进入 policy digest / coordination summary / consistency mode
- retention 已进入 lifecycle governance digest / keep-drop governance / survival consistency
- knowledge 已进入 governance coordination / budget coordination / source orchestration / governance consistency
- scenario pack 已进入 orchestration digest / rationale / coordination / strategy consistency
- 第一版 `P7` regression gate 已成立

P8 不再重复做这些 “v5 最小成立证明”。

P8 重点解决的是：

1. namespace policy 从单条 orchestration 推进到更统一的 governance convergence
2. retention lifecycle 从 governance summary 推进到更稳定的 lifecycle convergence contract
3. knowledge governance 从 coordination 推进到更明确的 governance convergence / digest alignment
4. scenario orchestration 从 digest / coordination 推进到更统一的 orchestration governance convergence
5. `P8` 的 regression / acceptance gate 立住

---

## 4. P8 首批目标

### 4.1 Namespace governance convergence v3

P8 首批要把 namespace 从：

- `policy_digest_id`
- `policy_coordination_summary`
- `governance_consistency_mode`

继续推进到：

- namespace governance digest
- 更明确的 convergence summary
- 更稳定的 retrieval/write digest alignment

最小要求：

- 至少一条 namespace 决策不再只输出 orchestration digest，而开始输出更明确的 governance convergence digest
- 至少一条 retrieval / write 一致性判断开始复用同一层 convergence 输出

### 4.2 Retention lifecycle convergence v6

P8 首批要把 retention 从：

- `lifecycle_governance_digest`
- `keep_drop_governance_summary`
- `lifecycle_coordination_summary`
- `survival_consistency_mode`

继续推进到：

- lifecycle convergence digest
- 更明确的 keep/drop convergence summary
- 更稳定的 cross-layer lifecycle alignment

最小要求：

- 至少一条 retention 决策不再只输出 governance digest，而开始输出更明确的 lifecycle convergence digest
- 至少一条 keep/drop 判断开始复用同一层 convergence 输出

### 4.3 Knowledge governance convergence v6

P8 首批要把 knowledge 从：

- `governance_coordination_summary`
- `budget_coordination_mode`
- `source_governance_summary`
- `governance_consistency_mode`

继续推进到：

- governance convergence digest
- 更明确的 source/budget alignment summary
- 更稳定的 governance digest coordination

最小要求：

- 至少一条 knowledge 决策不再只输出 coordination 字段，而开始输出更明确的 governance convergence digest
- 至少一条 prompt / budget 行为开始复用同一层 convergence 输出

### 4.4 Scenario governance convergence v6

P8 首批要把 scenario pack 从：

- `orchestration_digest_id`
- `strategy_rationale_summary`
- `orchestration_coordination_summary`
- `strategy_consistency_mode`

继续推进到：

- scenario governance digest
- 更明确的 strategy convergence summary
- 更稳定的 orchestration digest alignment

最小要求：

- 至少一条 scenario 决策不再只输出 orchestration digest，而开始输出更明确的 governance convergence digest
- 至少一条 metadata / prompt 摘要开始暴露 convergence 级事实

### 4.5 Regression / acceptance expansion

P8 首批必须让阶段 gate 继续往前推进，而不是等代码长完再回头补。

最小要求：

- `P8` 形成第一版阶段 gate
- gate 至少锁：
  - namespace governance convergence v3
  - retention lifecycle convergence v6
  - knowledge governance convergence v6
  - scenario governance convergence v6

---

## 5. P8 施工顺序建议

建议顺序：

1. `P8-1 Namespace governance convergence v3`
2. `P8-2 Retention lifecycle convergence v6`
3. `P8-3 Knowledge governance convergence v6`
4. `P8-4 Scenario governance convergence v6`
5. `P8-5 Regression / acceptance expansion`

原因：

- namespace 仍然是最上游的治理边界，先把 convergence digest 收出来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- retention 与 knowledge 已经具备较强的 `P7` digest / coordination 事实，适合在 `P8` 升成 convergence 级表达
- scenario orchestration 已经具备 digest / coordination / consistency，当前最自然的下一步就是上提成更统一的 governance convergence
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P8-1`
  - 前中段到中段之间
- `P8-2`
  - 前中段到中段之间
- `P8-3`
  - 前中段到中段之间
- `P8-4`
  - 已启动
- `P8-5`
  - 待开始

整体 `P8` 当前大约：

- **`55% - 65%`**

当前更推荐的下一步：

- **先对 `P8-4 Scenario governance convergence v6` 做一次小评估**
- 当前 scenario convergence 已开始进入：
  - `governance_convergence_digest_id`
  - `strategy_convergence_summary`
  - `orchestration_alignment_mode`
- 这层输出已开始进入：
  - prompt
  - assistant metadata / reader
  - runtime debug metadata
  - harness
- 当前 knowledge convergence 已经进入：
  - `governance_convergence_digest`
  - `source_budget_alignment_summary`
  - `governance_alignment_mode`
  - knowledge prompt selection 的 route/budget 复用
- 这说明 `P8-3` 已经不只是“可见 digest”，而是开始进入真实 selection decision
- 当前更值的是让 `P8-4` 也开始进入 convergence 层，避免 `P8` 再次单线推进过深

---

## 6. 当前结论

`P8` 当前已经不只是开工阶段，而是已经具备了第一批真实代码事实。

因此：

- 下一步不需要再写新的总结文档
- 最值的是继续把 `P8-4 / P8-5` 补起来，让 `P8` 从“多条 convergence 已启动”推进到“阶段主骨架更完整”
