# SparkCore Memory Upgrade P6 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P5 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P5` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P6` 的第一批实施基线
- 从 `P5` 已成立事实，推进到“更明确的策略编排、更稳定的跨层治理、以及更接近 policy-driven memory orchestration”的执行文档

上层输入：

- [memory_upgrade_p5_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p5_close_note_v1.0.md)
- [memory_upgrade_p5_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p5_close_readiness_v1.0.md)
- [memory_upgrade_p5_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p5_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P6 的一句话目标

**在 `P5` 已建立的多预算路由、layered retention、knowledge weighting、pack strategy layer 基础上，把 SparkCore 记忆系统推进到“更明确的 policy 编排、更稳定的跨层协调、以及更接近真实 orchestration runtime”的阶段。**

---

## 3. P6 与 P5 的分界

P5 已经解决的，是：

- namespace 已进入 multi-budget routing、write priority 与 route order
- retention 已进入 layered budget、section order、section weights
- knowledge 已进入 route weighting 与 pack-visible weighting
- scenario pack 已进入 strategy bundle 与 assembly ordering
- 第一版 `P5` regression gate 已成立

P6 不再重复做这些 “v3 最小成立证明”。

P6 重点解决的是：

1. namespace 从 multi-budget routing 推进到更明确的 policy bundle / policy selection
2. retention 从 layered pruning 推进到更稳定的 lifecycle policy / cross-layer survival policy
3. knowledge 从 route weighting 推进到更真实的 weighting governance / budget orchestration
4. scenario pack 从 strategy bundle 推进到更高一层的 strategy policy orchestration
5. `P6` 的 regression / acceptance gate 立住

---

## 4. P6 首批目标

### 4.1 Namespace policy orchestration

P6 首批要把 namespace 从：

- multi-budget routing
- write priority / fallback order
- retrieval route order

继续推进到：

- namespace policy bundle
- 更明确的 route governance contract
- 更稳定的 cross-layer fallback policy

最小要求：

- 至少一条 namespace 决策不再只输出 budget/order，而开始输出正式 policy id
- 至少一条 retrieval / write 行为开始复用这层 policy，而不再各自拼接细项

当前已成立的第一刀代码事实：

- [packages/core/memory/namespace.ts](/Users/caoq/git/sparkcore/packages/core/memory/namespace.ts) 当前已开始把 namespace orchestration 从 boundary/order 组合事实上提成正式 policy bundle contract：
  - `MemoryNamespacePolicyBundleId`
  - `thread_strict_focus`
  - `project_balanced_coordination`
  - `world_reference_exploration`
  - `default_balanced_memory`
- [memory-namespace.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-namespace.ts) 当前已开始让 `resolveRuntimeMemoryBoundary(...)` 不只产出 budget/order，还会显式产出：
  - `policy_bundle_id`
  - `route_governance_mode`
- 当前最小规则已经成立：
  - `thread` primary namespace：
    - `policy_bundle_id = thread_strict_focus`
    - `route_governance_mode = thread_strict`
  - `project` primary namespace：
    - `policy_bundle_id = project_balanced_coordination`
    - `route_governance_mode = project_balanced`
- [memory-recall.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-recall.ts) 与 [memory-write-targets.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-targets.ts) 当前都已继续复用同一层 boundary/policy 输出，不再各自拼接 route 细节
- 这层 policy 当前也已进入：
  - assistant metadata
  - runtime debug metadata
  - memory namespace summary
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts)

当前已成立的第二刀代码事实：

- [memory-namespace.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-namespace.ts) 当前已开始把 namespace policy 从“bundle id + governance mode”继续推进成更明确的 fallback policy 输出：
  - `retrieval_fallback_mode`
  - `write_escalation_mode`
- 当前最小规则已经成立：
  - `thread` primary namespace：
    - `retrieval_fallback_mode = strict_no_timeline`
    - `write_escalation_mode = thread_outward_escalation`
  - `project` primary namespace：
    - `retrieval_fallback_mode = parallel_timeline_allowed`
    - `write_escalation_mode = project_world_escalation`
- [memory-write-targets.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-targets.ts) 与 [memory-write-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-metadata.ts) 当前也已开始把这层 policy 带进 write preview / planner metadata，不再只暴露 `fallback_write_boundary`
- [runtime-preview-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-preview-metadata.ts) 当前也已开始把：
  - `write_escalation_mode`
  - `namespace_policy_bundle_id`
  暴露到 runtime preview
- assistant metadata / runtime debug metadata / harness 当前也已同步接上这层 fallback policy

### 4.2 Retention lifecycle policy v4

P6 首批要把 retention 从：

- layered budget
- section order
- section weights

继续推进到：

- lifecycle policy
- cross-layer survival policy
- 更明确的 prune rationale grouping

最小要求：

- 至少一条 retention decision 开始显式输出 lifecycle policy id
- 至少一条 keep/drop 行为开始按 lifecycle policy 聚合，而不再只看单一 budget/weight

当前已成立的第一刀代码事实：

- [compaction.ts](/Users/caoq/git/sparkcore/packages/core/memory/compaction.ts) 当前已开始把 retention 从 layered pruning 进一步上提成 policy contract：
  - `retention_policy_id`
  - `cross_layer_survival_mode`
- [thread-compaction.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-compaction.ts) 当前已开始让 compaction summary 不只输出：
  - `retention_mode`
  - `retention_reason`
  - `retention_layers`

  还会显式输出：
  - `retention_policy_id`
  - `cross_layer_survival_mode`
- 当前最小规则已经成立：
  - `focus_anchor` 下：
    - `retention_policy_id = focus_continuity_anchor`
    - `cross_layer_survival_mode = anchor_only`
- assistant metadata / runtime debug metadata / [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已同步接上这层 retention lifecycle policy

### 4.3 Knowledge governance weighting v4

P6 首批要把 knowledge 从：

- scope / namespace / pack weighting
- route weighting
- budget weighting

继续推进到：

- governance weighting
- source-class weighting
- 更明确的 route budget orchestration

最小要求：

- 至少一条 knowledge 决策开始显式区分 source governance class
- 至少一条 prompt / route 行为开始复用统一的 governance weighting 输出

### 4.4 Scenario strategy orchestration v4

P6 首批要把 scenario pack 从：

- strategy bundle
- assembly ordering
- layer budget bundle

继续推进到：

- strategy policy layer
- pack-to-policy mapping
- 更明确的 cross-layer orchestration summary

最小要求：

- 至少一条 runtime 决策开始直接消费 strategy policy，而不是只消费 pack id
- 至少一条 metadata / prompt 摘要开始暴露 strategy policy 级事实

### 4.5 Regression / acceptance expansion

P6 首批必须让阶段 gate 继续往前推进，而不是等代码长完再回头补。

最小要求：

- `P6` 形成第一版阶段 gate
- gate 至少锁：
  - namespace policy orchestration
  - retention lifecycle policy
  - knowledge governance weighting
  - scenario strategy orchestration

---

## 5. P6 施工顺序建议

建议顺序：

1. `P6-1 Namespace policy orchestration`
2. `P6-2 Retention lifecycle policy v4`
3. `P6-3 Knowledge governance weighting v4`
4. `P6-4 Scenario strategy orchestration v4`
5. `P6-5 Regression / acceptance expansion`

原因：

- `namespace` 仍然是上游边界，先稳定 policy bundle，后面的 retention / knowledge / pack 编排才更容易复用同一层 contract
- `retention` 与 `knowledge` 已经有较多 v3 事实，适合在 `P6` 升成 policy 级治理
- `scenario pack` 已经具备 strategy bundle，当前最自然的下一步就是上提成更明确的 orchestration policy
- gate 仍然保持“跟着主线长”，避免再次出现阶段快结束才补 acceptance 的情况

当前阶段判断：

- `P6-1`
  - 前中段到中段之间
  - 当前已经从：
    - `policy_bundle_id`
    - `route_governance_mode`
    继续推进到了：
    - `retrieval_fallback_mode`
    - `write_escalation_mode`
  - 这层 policy 当前也已进入：
    - recall / write 共用 boundary helper
    - planner metadata / runtime preview
    - assistant metadata / runtime debug metadata
    - harness
- `P6-2 ~ P6-5`
  - 待开始

整体 `P6` 当前大约：

- **`15% - 25%`**

当前更推荐的下一步：

- **先做一次 `P6-1` 小评估后的切线判断**
- 如果保持阶段推进效率优先，下一步更适合开始 `P6-2 Retention lifecycle policy v4`

---

## 6. 与尾项 backlog 的关系

`P0 ~ P5` 的非阻塞尾项当前已统一收束到：

- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)

P6 的施工原则仍然是：

- 不回头阻塞主线
- 仅在某条尾项直接影响 `P6` 新 contract 时，才顺手吸收
- 其它尾项优先按 batch cleanup / gate strengthening 方式后置处理

---

## 7. 当前结论

当前 `Memory Upgrade` 已不再处于“单条能力补洞”的阶段，而开始进入：

**把 namespace、retention、knowledge、scenario strategy 进一步上提成 policy / orchestration 级事实的阶段。**

`P6` 的关键不是再发明更多新层，而是：

- 把已经存在的 v3 事实压成更稳定的 policy 结构
- 让 runtime / prompt / metadata / harness 继续共享这层 policy
- 为后续真正更复杂的 orchestration runtime 留出清晰边界
