# SparkCore Memory Upgrade P5 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P4 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P4` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P5` 的第一批实施基线
- 从 `P4` 已成立事实，推进到“更完整的多预算治理、更强的 route weighting、更接近真实场景操作系统”的执行文档

上层输入：

- [memory_upgrade_p4_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_note_v1.0.md)
- [memory_upgrade_p4_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_readiness_v1.0.md)
- [memory_upgrade_p4_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P5 的一句话目标

**在 `P4` 已建立的 boundary / pruning / knowledge influence / pack consumption 基础上，把 SparkCore 记忆系统推进到“更明确的多预算协同、更稳定的 route weighting、以及更可扩展的 pack 策略层”的阶段。**

---

## 3. P5 与 P4 的分界

P4 已经解决的，是：

- namespace 已进入 retrieval boundary / write boundary / recall budget
- retention 已进入 budget / pruning / keep-drop
- knowledge 已进入 route influence / assembly emphasis / rationale
- scenario pack 已进入跨 layer、跨 subtype 的真实 consumption 差异
- 第一版 `P4` regression gate 已成立

P5 不再重复做这些“v2 最小成立证明”。

P5 重点解决的是：

1. namespace boundary 从单预算推进到更完整的多预算协同
2. retention 从单 budget 推进到更明确的 layered pruning strategy
3. knowledge 从 route influence 推进到更真实的 route weighting / context budget 作用
4. scenario pack 从 pack-specific consumption 推进到更完整的 pack strategy layer
5. `P5` 的 regression / acceptance gate 立住

---

## 4. P5 首批目标

### 4.1 Namespace multi-budget routing

P5 首批要把 namespace 从：

- retrieval boundary
- write boundary
- 单层 recall budget

继续推进到：

- 多层 recall / write budget 协同
- 更明确的 project / world / thread route weighting

最小要求：

- 至少一条 namespace budget 不再只控制 recall count，而开始控制 layer-weighting 或 fallback order
- 至少一条 write route 决策开始体现更细的 namespace priority

当前已成立的第一刀代码事实：

- [memory-namespace.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-namespace.ts) 当前已开始把 namespace boundary 从单层 recall budget 推进成更明确的 multi-budget 结构：
  - `profile_budget`
  - `episode_budget`
  - `timeline_budget`
  - `parallel_timeline_budget`
- 当前最小规则已经成立：
  - `thread` primary namespace 下：
    - `parallel_timeline_budget = 0`
  - `project / world` primary namespace 下：
    - `parallel_timeline_budget = 1`
- [memory-recall.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-recall.ts) 当前也已开始复用这层 budget：
  - 当 namespace 允许 `parallel_timeline_budget > 0` 时，timeline recall 不再只能在 `episode = 0` 时触发，而开始允许与 episode 并行保留一条 timeline
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `thread` boundary 下 `parallel_timeline_budget = 0`
  - `project` boundary 下 `parallel_timeline_budget = 1`

当前已成立的第二刀代码事实：

- [memory-write-targets.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-targets.ts) 当前已开始把 namespace write routing 从“只给出 boundary”推进成更明确的 priority / fallback 结构：
  - `write_priority_layer`
  - `fallback_write_boundary`
- 当前最小规则已经成立：
  - `project` boundary 下：
    - `write_priority_layer = project`
    - `fallback_write_boundary = world`
    - primary routed target 只保留 `routed_project_id`
  - 也就是说，project namespace 写入当前已不再同时平权挂着 `world`，而开始显式收成 `project first, world fallback`
- [runtime-preview-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-preview-metadata.ts) 当前也已开始把这层 write priority / fallback 暴露到 preview
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `write_priority_layer = project`
  - `fallback_write_boundary = world`

当前已成立的第三刀代码事实：

- [memory-namespace.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-namespace.ts) 当前已开始把 namespace 的 retrieval / write 顺序收成正式 contract：
  - `retrieval_route_order`
  - `write_fallback_order`
- 当前最小规则已经成立：
  - `thread` primary namespace 下：
    - `retrieval_route_order = thread_state -> profile -> episode`
    - `write_fallback_order = thread -> project -> world -> default`
  - `project` primary namespace 下：
    - `retrieval_route_order = thread_state -> profile -> episode -> timeline`
    - `write_fallback_order = project -> world -> default`
- [memory-recall.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-recall.ts) 当前也已开始直接复用这层 `retrieval_route_order`，不再本地手写 route 顺序
- [memory-write-targets.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-targets.ts) 当前也已开始通过 `write_fallback_order` 解析 fallback 边界
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `thread` / `project` namespace 下的 retrieval/write 顺序

### 4.2 Retention layering / pruning strategy v3

P5 首批要把 retention 从：

- 单个 retention budget
- retained_fields pruning
- summary keep-drop

继续推进到：

- layered budget
- layered pruning strategy
- 更明确的 compacted section weighting

最小要求：

- 至少一条 pruning decision 开始同时受 `retention_mode + retention_budget + section class` 影响
- retention 不再只决定保留字段，还开始决定哪类 compacted context 更优先存活

当前已成立的第一刀代码事实：

- [compaction.ts](/Users/caoq/git/sparkcore/packages/core/memory/compaction.ts) 当前已开始把 retention 从单 budget 推进成 layered budget contract：
  - `retention_layers`
  - `retention_layer_budget`
- [thread-compaction.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-compaction.ts) 当前已开始把 compacted section 分成：
  - `anchor`
  - `context`
  - `window`
- 当前最小规则已经成立：
  - `focus_anchor` 下：
    - `retention_layers = anchor`
    - `retention_layer_budget = { anchor: 2, context: 0, window: 0 }`
  - 也就是说，`focus_mode / continuity_status` 当前已成为 anchor layer 的真实存活内容，而 `current_language_hint` 不再能越过 layer budget 自动留下
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `retention_layers = anchor`
  - `retention_layer_budget.anchor = 2`
  - prompt / assistant summary 中已能看到 `Retention layers: anchor`

当前已成立的第二刀代码事实：

- [thread-compaction.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-compaction.ts) 当前已开始把 layered retention 从“layer budget”继续推进成“section priority”：
  - `retention_section_order`
- 当前最小规则已经成立：
  - `focus_anchor` 下：
    - `retention_section_order = focus_mode -> continuity_status -> current_language_hint`
  - 也就是说，layer budget 现在不只是在数量上裁剪字段，还开始明确决定 summary/retained fields 的 section 生存顺序
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `retention_section_order = focus_mode,continuity_status,current_language_hint`
  - assistant summary 中已能看到 `Retention section order: focus_mode,continuity_status,current_language_hint`

当前已成立的第三刀代码事实：

- [thread-compaction.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-compaction.ts) 当前已开始把 retention 从“section priority”继续推进成“section weighting”：
  - `retention_section_weights`
- 当前最小规则已经成立：
  - `focus_anchor` 下：
    - `focus_mode = 120`
    - `continuity_status = 110`
    - `current_language_hint = 30`
  - 也就是说，当前 retained fields 的保留不只受 layer budget + order 影响，还开始受显式 section weight 影响
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `retention_section_weights.focus_mode = 120`
  - `retention_section_weights.continuity_status = 110`
  - assistant summary 中已能看到 `Retention section weights: focus_mode=120,continuity_status=110,current_language_hint=30`

### 4.3 Knowledge route weighting v3

P5 首批要把 knowledge 从：

- scope priority
- route influence
- assembly emphasis / rationale

继续推进到：

- 更明确的 route weighting
- 更明确的 context budget weighting

最小要求：

- 至少一条 route 决策开始从“开/关或排序”推进到“显式 weighting”
- 至少一条 knowledge budget 决策开始受 scope + namespace + pack 联合影响

当前已成立的第一刀代码事实：

- [memory-knowledge.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-knowledge.ts) 当前已开始把 knowledge prompt selection 从“隐式排序”推进成显式 weighting：
  - `buildKnowledgeRouteWeighting(...)`
  - `scope_weight`
  - `namespace_weight`
  - `pack_weight`
  - `total_weight`
- 当前最小规则已经成立：
  - 在 `project_ops + project primary namespace` 下：
    - `project > world > general`
  - 也就是说，knowledge 当前已不再只是按固定 scope 顺序选 prompt，而开始按 `scope + namespace + pack` 联合 weight 决定进入顺序
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `projectKnowledgeWeight.total_weight > worldKnowledgeWeight.total_weight`
  - `worldKnowledgeWeight.total_weight > generalKnowledgeWeight.total_weight`

当前已成立的第二刀代码事实：

- [memory-packs.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-packs.ts) 当前已开始把 knowledge influence 从“隐式 route/assembly 改写”推进成显式 weighting 输出：
  - `knowledge_route_weight`
  - `knowledge_budget_weight`
- 当前最小规则已经成立：
  - `project_namespace_priority / project_ops` 下：
    - `knowledge_route_weight = 1`
    - `knowledge_budget_weight = 0.9`
  - `world_knowledge_influence` 下：
    - `knowledge_route_weight = 0.75`
  - `default_companion_phase` 下：
    - `knowledge_route_weight = 0.3`
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - pack 会产出 route/budget weight
  - prompt 中已能看到 `Current knowledge route weight = 1; knowledge budget weight = 0.9.`

### 4.4 Scenario pack strategy layer v3

P5 首批要把 scenario pack 从：

- active pack selection
- pack-specific knowledge budget
- pack-specific layer consumption

继续推进到：

- 更明确的 pack strategy layer
- 更明确的 pack-specific budget bundle / weighting bundle

最小要求：

- 至少一条 pack strategy 不再只影响单个 layer slot，而开始影响一组 layer/budget 组合
- 至少一条 pack-specific strategy 开始进入更可复用的 contract/helper，而不只散落在 runtime 组装逻辑里

当前已成立的第一刀代码事实：

- [memory-packs.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-packs.ts) 当前已开始把 pack-specific consumption 从 runtime 分支收成共用 strategy helper：
  - `resolveScenarioMemoryPackStrategy(...)`
  - `strategy_bundle_id`
  - `layer_budget_bundle`
  - `dynamic_profile_strategy`
  - `memory_record_priority_order`
- 当前最小规则已经成立：
  - `project_ops -> project_execution`
    - relationship/static_profile/memory_record budget = `1/1/2`
  - `companion -> companion_continuity`
    - relationship/static_profile/memory_record budget = `2/2/1`
- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts) 当前已开始通过这层 strategy bundle 驱动：
  - relationship budget
  - static profile budget
  - memory record budget
  - dynamic profile coexist/suppress 规则
  - memory record subtype priority
- [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已开始显式校验：
  - `project_execution` strategy bundle
  - prompt 中已能看到 `Current strategy bundle = project_execution; relationship/static_profile/memory_record budget = 1/1/2.`

### 4.5 P5 regression / acceptance expansion

P5 首批要把 gate 扩大到：

- namespace multi-budget routing
- retention layering / pruning strategy
- knowledge route weighting
- scenario pack strategy layer

目标不是一次把所有策略锁死，而是确保 `P5` 的新增事实不会退回：

- 只存在于 prompt 文本
- 只存在于 metadata
- 只存在于文档

---

## 5. P5 明确不做的事项

P5 首批明确不做：

- 完整多 Agent 共享记忆仲裁系统
- 完整世界状态同步引擎
- 独立 knowledge CMS / ingestion 平台
- 可插拔 pack marketplace
- 大规模自动 retention / cleanup 后台任务系统

这些方向不是不做，而是不纳入 `P5` 首批闭环。

---

## 6. P5 建议推进顺序

建议顺序：

1. `P5-1 Namespace multi-budget routing`
2. `P5-2 Retention layering / pruning strategy v3`
3. `P5-3 Knowledge route weighting v3`
4. `P5-4 Scenario pack strategy layer v3`
5. `P5-5 regression / acceptance expansion`

原因：

- namespace 仍是最容易牵动主路径边界的线
- retention 继续深化后，compaction 才不会停在单 budget 规则
- knowledge 与 pack 的更深 weighting，应建立在 boundary 与 pruning 进一步稳定之后
- gate 应在前四条线已有真实事实后尽快跟上

---

## 7. 当前执行建议

如果继续沿 `Memory Upgrade` 主线推进，`P5` 最自然的第一刀是：

- **Namespace multi-budget routing**

原因：

- `P4` 已把 namespace 推到 boundary + routed target + recall budget
- 再往前一刀，最容易形成 `P5` 的第一条真实主路径事实
- 这也最能决定后续 retention / knowledge / pack strategy 是否能站在更稳定的预算边界上继续做深
