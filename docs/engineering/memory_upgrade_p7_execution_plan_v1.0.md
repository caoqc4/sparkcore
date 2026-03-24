# SparkCore Memory Upgrade P7 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P6 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P6` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P7` 的第一批实施基线
- 从 `P6` 已成立事实，推进到“更明确的跨 policy 协同、更稳定的 lifecycle / governance 收束、以及更接近 unified orchestration runtime”的执行文档

上层输入：

- [memory_upgrade_p6_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p6_close_note_v1.0.md)
- [memory_upgrade_p6_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p6_close_readiness_v1.0.md)
- [memory_upgrade_p6_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p6_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P7 的一句话目标

**在 `P6` 已建立的 namespace policy、retention lifecycle、knowledge governance、scenario strategy orchestration 基础上，把 SparkCore 记忆系统推进到“更统一的 orchestration 协同层、更明确的跨 policy 收束、以及更接近 stage-level governance runtime”的阶段。**

---

## 3. P7 与 P6 的分界

P6 已经解决的，是：

- namespace 已进入 policy bundle / governance mode / fallback policy
- retention 已进入 lifecycle policy / decision grouping / survival rationale
- knowledge 已进入 governance class / governance weight / governance bias
- scenario pack 已进入 strategy policy / orchestration mode
- 第一版 `P6` regression gate 已成立

P7 不再重复做这些 “v4 最小成立证明”。

P7 重点解决的是：

1. namespace policy 从单条 policy 输出推进到更明确的 policy orchestration
2. retention lifecycle 从 decision grouping 推进到更稳定的 lifecycle governance layering
3. knowledge governance 从 weighting 推进到更明确的 governance policy coordination
4. scenario strategy 从 policy orchestration 推进到更统一的 orchestration digest / runtime coordination
5. `P7` 的 regression / acceptance gate 立住

---

## 4. P7 首批目标

### 4.1 Namespace policy orchestration v2

P7 首批要把 namespace 从：

- `policy_bundle_id`
- `route_governance_mode`
- `retrieval_fallback_mode`
- `write_escalation_mode`

继续推进到：

- namespace policy digest
- 更明确的 cross-policy coordination summary
- 更稳定的 retrieval/write governance consistency

最小要求：

- 至少一条 namespace 决策不再只输出 policy 字段，而开始输出更明确的 orchestration digest
- 至少一条 retrieval / write 行为开始复用同一层 policy digest，而不再分别消费零散字段

当前已成立的第一刀代码事实：

- 新增 `MemoryNamespacePolicyDigestId`
- namespace boundary 现在除了：
  - `policy_bundle_id`
  - `route_governance_mode`
  - `retrieval_fallback_mode`
  - `write_escalation_mode`
  之外，也会显式产出：
  - `policy_digest_id`
- 当前最小 digest 已成立：
  - `thread_focus_orchestration`
  - `project_coordination_orchestration`
  - `world_reference_orchestration`
  - `default_memory_orchestration`
- 这层 digest 已进入：
  - namespace prompt section
  - assistant metadata / metadata reader
  - runtime debug metadata
  - harness
- 第二刀已成立的 coordination 事实：
  - namespace boundary 现在还会显式产出：
    - `policy_coordination_summary`
    - `governance_consistency_mode`
  - 当前最小 coordination 已成立：
    - `thread_focus_no_timeline`
    - `project_parallel_coordination`
    - `world_timeline_reference`
    - `default_balanced_coordination`
- 当前最小 consistency 已成立：
  - `retrieval_strict_write_outward`
  - `retrieval_write_balanced`
  - `retrieval_timeline_write_pinned`
  - `retrieval_write_default`
- 这层输出已进入：
  - prompt
  - assistant metadata / reader
  - runtime debug metadata
  - harness

当前阶段判断：

- `P7-1` 已经从“待开始”推进到：
  - **前中段到中段之间**
- 当前已成立的主事实：
  - `policy_digest_id`
  - `policy_coordination_summary`
  - `governance_consistency_mode`
- 这些事实已经进入：
  - namespace prompt section
  - assistant metadata / reader
  - runtime debug metadata
  - harness
- 下一步更合理的选择开始变成：
  - **转去 `P7-2 Retention lifecycle governance v5`**
  - 而不是继续深挖 `P7-1` 很多刀

### 4.2 Retention lifecycle governance v5

P7 首批要把 retention 从：

- `retention_policy_id`
- `cross_layer_survival_mode`
- `retention_decision_group`
- `survival_rationale`

继续推进到：

- lifecycle governance digest
- 更明确的 keep/drop governance summary
- 更稳定的 cross-layer survival coordination

当前已成立的第一刀代码事实：

- retention 现在除了：
  - `retention_policy_id`
  - `cross_layer_survival_mode`
  - `retention_decision_group`
  - `survival_rationale`
  之外，也会显式产出：
  - `lifecycle_governance_digest`
  - `keep_drop_governance_summary`
- 当前最小 digest / summary 已成立：
  - `anchor_preservation_governance`
  - `anchor_keep_priority`
- 这层输出已进入：
  - thread compaction summary text
  - assistant metadata / metadata reader
  - runtime debug metadata
  - harness
- 第二刀已成立的 coordination 事实：
  - retention 现在还会显式产出：
    - `lifecycle_coordination_summary`
    - `survival_consistency_mode`
  - 当前最小 coordination / consistency 已成立：
    - `anchor_only_coordination`
    - `anchor_keep_consistent`
  - 这层输出已进入：
    - thread compaction summary text
    - assistant metadata / metadata reader
    - runtime debug metadata
    - harness

当前阶段判断：

- `P7-2` 已经从“待开始”推进到：
  - **前中段到中段之间**
- 当前已成立的主事实：
  - `lifecycle_governance_digest`
  - `keep_drop_governance_summary`
  - `lifecycle_coordination_summary`
  - `survival_consistency_mode`
- 这些事实已经进入：
  - thread compaction summary text
  - assistant metadata / metadata reader
  - runtime debug metadata
  - harness
- 下一步更合理的选择开始变成：
  - **转去 `P7-3 Knowledge governance coordination v5`**
  - 而不是继续深挖 `P7-2` 很多刀

最小要求：

- 至少一条 retention decision 不再只输出 policy / group，而开始输出更明确的 governance digest
- 至少一条 keep/drop 行为开始复用同一层 governance digest

### 4.3 Knowledge governance coordination v5

P7 首批要把 knowledge 从：

- `governance_class`
- `governance_weight`
- `governance_route_bias`

继续推进到：

- governance coordination summary
- 更明确的 source-governance orchestration
- 更稳定的 governance-aware budget coordination

最小要求：

- 至少一条 knowledge 决策不再只输出 class/weight，而开始输出更明确的 governance coordination 字段
- 至少一条 prompt / route 行为开始复用同一层 governance coordination 输出

### 4.4 Scenario orchestration digest v5

P7 首批要把 scenario strategy 从：

- `strategy_policy_id`
- `orchestration_mode`
- `strategy_bundle_id`
- `strategy_assembly_order`

继续推进到：

- orchestration digest
- 更明确的 strategy rationale summary
- 更统一的 runtime-visible orchestration coordination

最小要求：

- 至少一条 runtime 决策开始直接消费 orchestration digest，而不再只消费 policy / bundle 字段
- 至少一条 metadata / prompt 摘要开始暴露 digest 级事实

### 4.5 Regression / acceptance expansion

P7 首批必须让阶段 gate 继续往前推进，而不是等代码长完再回头补。

最小要求：

- `P7` 形成第一版阶段 gate
- gate 至少锁：
  - namespace policy orchestration v2
  - retention lifecycle governance v5
  - knowledge governance coordination v5
  - scenario orchestration digest v5

---

## 5. P7 施工顺序建议

建议顺序：

1. `P7-1 Namespace policy orchestration v2`
2. `P7-2 Retention lifecycle governance v5`
3. `P7-3 Knowledge governance coordination v5`
4. `P7-4 Scenario orchestration digest v5`
5. `P7-5 Regression / acceptance expansion`

原因：

- `namespace` 仍然是最上游的 policy 边界，先把 orchestration digest 收出来，后面的 retention / knowledge / scenario 更容易共享同一层治理输出
- `retention` 与 `knowledge` 已经具备较强的 v4 事实，适合在 `P7` 升成 governance coordination 级表达
- `scenario strategy` 已经具备 policy / orchestration mode，当前最自然的下一步就是上提成更统一的 orchestration digest
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P7-1`
  - 待开始
- `P7-2`
  - 待开始
- `P7-3`
  - 待开始
- `P7-4`
  - 待开始
- `P7-5`
  - 待开始

整体 `P7` 当前大约：

- **`0% - 10%`**

当前更推荐的下一步：

- **开始 `P7-1 Namespace policy orchestration v2` 的第一刀**
- 当前 `P6` 已经 close-ready，下一步最自然的主线就是把 namespace policy 从字段集合推进到更明确的 orchestration digest

---

## 6. 与尾项 backlog 的关系

`P0 ~ P6` 的非阻塞尾项当前已统一收束到：

- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)

P7 的施工原则仍然是：

- 不回头阻塞主线
- 仅在某条尾项直接影响 `P7` 新 contract 时，才顺手吸收
- 其它尾项优先按 batch cleanup / gate strengthening 方式后置处理

---

## 7. 当前结论

当前 `Memory Upgrade` 已不再处于“单条 policy 继续加字段”的阶段，而开始进入：

**把 namespace、retention、knowledge、scenario strategy 进一步上提成统一 orchestration coordination 的阶段。**

`P7` 的关键不是再发明更多平行概念，而是：

- 把 `P6` 已成立的 policy / governance / orchestration 事实收成更统一的 coordination digest
- 让 runtime / prompt / metadata / harness 继续共享这层 digest
- 为后续真正更复杂的 stage-level governance runtime 留出清晰边界
