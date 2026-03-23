# SparkCore 当前阶段成果总结 v1.0

## 1. 文档定位

本文档用于收束本轮 Phase 1 准备阶段已经完成的规划与代码落点，明确：

- 当前已经做到了什么
- 当前代码与文档已经对齐到什么程度
- 还缺哪些关键收口
- 下一阶段最建议按什么顺序推进

本文档不是新的总纲，而是当前阶段的阶段性总结与下一步执行入口。

> 状态：当前有效
> 对应阶段：Phase 1 准备阶段
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/engineering/telegram_poc_runbook_v1.0.md`
> - `docs/engineering/litellm_dev_runbook_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前已经从“重定位后的规划阶段”进入“最小底座开始落代码”的阶段，memory、runtime、session、role、im-adapter 五条主线都已出现第一版工程落点；Telegram 单通道 PoC 也已完成一次真实闭环验证，但整体仍处于收口和沉淀阶段。**

补充进展：

- `P5-1 namespace multi-budget routing` 已把 namespace boundary 从单层 recall budget 推进到了：
  - `parallel_timeline_budget`
  - `write_priority_layer`
  - `fallback_write_boundary`
  - `retrieval_route_order`
  - `write_fallback_order`
- `P5-2 retention layering / pruning strategy v3` 已开始把 thread compaction retention 推进成 layered budget：
  - `retention_layers`
  - `retention_layer_budget`
  - `anchor / context / window` section class
  - `retention_section_order`
  - `retention_section_weights`

---

## 3. 当前已经完成的事情

### 3.1 主线与文档体系已收口

当前主线已经明确收敛到：

- 单 Agent
- 长记忆角色层
- IM 接入
- Phase 1 以虚拟伴侣 / 助理闭环为验证对象

相关文档已完成第一轮收口：

- `docs/strategy/sparkcore_repositioning_v1.0.md`
- `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`
- `docs/engineering/module_inventory_v1.0.md`
- `docs/engineering/legacy_04_05_reuse_plan_v1.0.md`

旧文档也已完成重新定位：

- `04`：过渡参考文档
- `05`：过渡任务库
- `06`：过渡设计资产

---

### 3.2 memory 已有第一版工程落点

当前 memory 相关代码已经从原来的单文件混合状态，收成了较清晰的几层：

- `packages/core/memory/contract.ts`
- `packages/core/memory/records.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/memory-records.ts`
- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory.ts`

当前已经完成的关键收口包括：

- 纯 contract 已开始进入 `packages/core/memory`
- core record types 也已开始进入 `packages/core/memory`
- recall / write / shared 已在 `apps/web/lib/chat` 内部分层
- `StoredMemory -> MemoryRecord / StaticProfileRecord` 的最小 adapter 已出现
- `StoredMemory -> semantic target` 的最小 classifier 也已开始进入 `apps/web/lib/chat/memory-records.ts`
- 该 classifier 当前也已开始进入 profile / relationship recall 过滤
- chat memory preview 当前也已开始暴露 semantic target，可直接观察当前 legacy row 的新语义归属
- chat memory 卡片当前也已开始显式展示 semantic target，迁移期语义归属已不只停留在 preview
- chat thread memory visibility 当前也已开始按 semantic target 汇总，可直接看到当前会话里新语义层的大致分布
- `hide / restore / incorrect` 管理动作当前也已开始写入 `semantic_target`
- planner memory metadata 当前也已开始稳定写入 `semantic_target`
- restore 过程里被 supersede 的冲突 row 当前也已开始补写 `semantic_target`
- `memory.ts` 已退成兼容入口
- `P0-6` 当前已不再只是迁移方向说明，而已进入：
  - classifier
  - recall
  - UI preview
  - memory card UI
  - memory visibility summary
  - memory 管理动作
  - planner metadata
  - superseded writeback metadata
- `P0-7` 当前也已开始形成明确 gate：
  - 功能 gate
  - 结构 gate
  - 回归 gate
- `apps/web/scripts/memory-upgrade-harness.ts` 当前也已开始承接最小 P0 回归脚手架，用于锁住：
  - semantic target classifier
  - candidate adapter
  - runtime `memory.semantic_summary`
  - assistant metadata semantic summary reader
- `profile / preference` 已形成 planner -> executor 最小闭环
- `relationship memory` 已收进 `memory_write_requests` 的显式 subtype
- relationship 写入已不再走额外旁路，而是回到统一 write pipeline
- 写入链当前也已开始显式暴露最小 `record_target` 分类：
  - `static_profile`
  - `memory_record`
  - `thread_state_candidate`
- `memory-write-targets.ts` 已开始承接统一 target resolution
- `memory-write-rows.ts` 已开始承接 generic memory insert / update row 组装
- `memory-write-record-candidates.ts` 已开始承接 generic `StaticProfileRecord` candidate adapter
- relationship 写入当前也已开始先构造正式 `MemoryRecord` candidate，再进入 single-slot upsert
- `thread_state_candidate` 当前也已开始具备正式 candidate seam、preview 摘要入口与最小真实 commit
- `static_profile` 当前也已开始进入真实 profile recall 主路径
- `thread_state` route 当前也已开始通过正式 route selection 输入，而不再只在 recall 后补入 `appliedRoutes`
- `static_profile` 当前也已开始进入 runtime metadata 注入层，最小 `profile_snapshot` 已可见
- runtime / assistant metadata 当前也已开始显式暴露最小 `memory.semantic_summary`：
  - `primary_layer`
  - `observed_layers`
- chat runtime summary 当前也已开始消费这层 `memory.semantic_summary`
- `memory-upgrade-harness.ts` 当前也已开始显式校验这层 `memory.semantic_summary`
- runtime system prompt 当前也已开始直接承接最小 `thread_state` 摘要，而不只停留在 metadata / summary 层
- runtime system prompt 当前也已开始直接承接最小 `memory.semantic_summary`
- `P0-4` 的阶段边界当前也已更清楚：
  - `profile / thread_state` 是 P0 内的真实 retrieval routes
  - `episode / timeline` 在 P0 内保留为正式 route contract，真实实现后移到 P1
- `memory_upgrade_p0_close_readiness_v1.0.md` 当前也已新增，用于对 `P0-1 ~ P0-7` 做整体完成度复盘，避免继续盲推单点
- `memory_upgrade_p0_close_note_v1.0.md` 当前也已新增，用于正式收口“P0 已达到 close-ready，剩余项转入非阻塞尾项”的阶段判断
- `memory_upgrade_p1_execution_plan_v1.0.md` 当前也已新增，用于把下一阶段从方向说明推进成正式执行起点
- `memory_upgrade_p1_close_readiness_v1.0.md` 当前也已新增，用于对 `P1-1 ~ P1-5` 做整体完成度复盘，避免继续无边界扩张 `P1`
- `memory_upgrade_p1_close_note_v1.0.md` 当前也已新增，用于正式收口“P1 已达到 close-ready，剩余项转入非阻塞尾项”的阶段判断
- `memory_upgrade_p2_execution_plan_v1.0.md` 当前也已新增，用于把 `P2` 从 v0.2 中的高阶方向推进成正式执行起点
- `memory_upgrade_p2_close_readiness_v1.0.md` 当前也已新增，用于对 `P2-1 ~ P2-5` 做整体完成度复盘，避免继续无边界扩张 `P2`
- `memory_upgrade_p2_close_note_v1.0.md` 当前也已新增，用于正式收口“P2 已达到 close-ready，剩余项转入非阻塞尾项”的阶段判断
- `memory_upgrade_p3_execution_plan_v1.0.md` 当前也已新增，用于把下一阶段从 `P2` 已成立 seam 推进成正式执行起点
- `P3-1 Namespace boundary expansion` 当前也已开始进入真实实现：
  - `apps/web/lib/chat/memory-namespace.ts` 当前已开始提供 namespace-aware memory applicability 判断
  - `apps/web/lib/chat/memory-recall.ts` 当前已开始支持 `activeNamespace` 输入，并先按 namespace 过滤可参与 recall 的 memory row
  - `apps/web/lib/chat/runtime-prepared-turn.ts` / `apps/web/lib/chat/runtime.ts` 当前也已开始把 active namespace 传入 memory preparation 主路径
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 in-namespace / out-of-namespace project memory 的过滤行为
  - `apps/web/lib/chat/memory-write.ts` 当前也已开始支持 `activeNamespace` 输入，并在 generic / relationship write 执行中先按 namespace 过滤 existing row，避免 project/world 跨 namespace 的错误 refresh / dedupe
  - `apps/web/lib/chat/memory-namespace.ts` 当前也已开始提供 namespace-scoped write metadata helper，把 `project / world` scope 真实写入 planner metadata
  - `apps/web/lib/chat/runtime-turn-post-processing.ts` / `apps/web/app/chat/actions.ts` 当前也已开始把 runtime 期的 active namespace 传入 post-processing write path
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 namespace-scoped planner metadata
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始把 active namespace 纳入 `resolvePlannedMemoryWriteTarget(...)`，并显式产出 `write_boundary / namespace_primary_layer / target_namespace_id`
  - `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把 namespace-aware write routing 暴露到 runtime memory write preview
  - `apps/web/lib/chat/runtime.ts` 当前也已开始把 `write_boundaries` 写入 `memory_write_planned` event
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 project namespace 下的 write boundary 解析与 preview metadata 暴露
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始显式产出 `routed_scope / routed_target_agent_id / routed_target_thread_id`
  - 在 thread namespace 下，generic `profile / preference` 写入当前也已开始走真实 `thread_local` routed scope，而不再只停在 `write_boundary = thread` 的元信息层
  - `apps/web/lib/chat/memory-write-rows.ts` 当前也已开始把这层 routed scope / routed target ids 真正写进 generic insert / update row
  - `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把这层 routed scope 暴露到 memory write preview
- `P3-2 Thread retention strategy v1` 当前也已开始进入真实实现：
  - `packages/core/memory/compaction.ts` 当前已开始把 retention 明确成正式 contract：
    - `retention_mode`
    - `retained_fields`
  - `apps/web/lib/chat/thread-compaction.ts` 当前也已开始提供最小 retention strategy helper，并根据 `focus_mode / continuity_status / recent_turn_count` 推导最小 retention mode
  - runtime prompt / assistant metadata / debug metadata 当前也已开始承接这层 retention 结果，而不再只暴露压缩摘要文本
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` retention mode
  - `apps/web/lib/chat/thread-compaction.ts` 当前也已开始提供 `shouldRetainCompactedThreadSummary(...) / selectRetainedThreadCompactionSummary(...)` 这层 keep/drop decision helper
  - `apps/web/lib/chat/runtime.ts` 当前也已开始在主路径中先走 retention selection，再决定 compaction summary 是否进入 prompt / metadata / debug
  - 当前最小规则已经成立：`closed + minimal` 的 thread compaction summary 会被主动丢弃
  - `memory-upgrade-harness.ts` 当前也已开始显式校验这条 keep/drop 行为
  - `packages/core/memory/compaction.ts` 当前也已开始把 `retention_reason` 收成正式 contract
  - `apps/web/lib/chat/thread-compaction.ts` 当前已开始让 `retention_reason` 真实影响 `retained_fields` 与实际保留的摘要 section
  - `focus_mode_present` 当前会保留 `focus_mode / continuity_status / current_language_hint`，但不会再顺手带入 `latest_user_message`
  - `recent_turn_window` 当前会显式保留 `latest_user_message / recent_turn_window`
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` 摘要不会错误保留 `Latest user message`
- `P3-3 Knowledge scope materialization` 当前也已开始进入真实实现：
  - `packages/core/memory/knowledge.ts` 当前已开始把 `KnowledgeScopeLayer` 收成正式 contract：
    - `project`
    - `world`
    - `general`
  - `apps/web/lib/chat/memory-knowledge.ts` 当前已开始提供 `resolveKnowledgeScopeLayer(...)`
  - knowledge summary 当前也已开始显式产出：
    - `scope_layers`
    - `scope_counts`
  - knowledge prompt 当前也已开始按 scope 显式标出：
    - `[project/... ]`
    - `[world/... ]`
    而不再只显示 `source_kind`
  - assistant metadata / debug metadata 当前也已开始暴露 knowledge scope layers
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 namespace 过滤后的 `project / world` knowledge 以及 prompt 中的 scope 区分
  - `apps/web/lib/chat/memory-knowledge.ts` 当前也已开始提供 `selectKnowledgeForPrompt(...)`
  - knowledge summary 当前继续保留完整统计：
    - `count`
    - `scope_layers`
    - `scope_counts`
    但 prompt budget 当前已开始按 `project -> world -> general` 的优先级选择注入项
  - `general` knowledge 当前不会再自动与 `project/world` 平权进入 prompt
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 summary 中会保留 `project / world / general`，但 prompt 会优先选择 `project / world`
  - `apps/web/lib/chat/memory-knowledge.ts` 当前也已开始让 knowledge prompt selection priority 受 `activeNamespace.primary_layer` 影响
  - 当前最小规则已经成立：
    - `project` primary 时，prompt 优先 `project -> world -> general`
    - `world` primary 时，prompt 优先 `world -> project -> general`
  - 也就是说，knowledge scope 当前已经不只影响“是否可见”，还开始影响“谁先吃到 prompt budget”
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 world-primary namespace 下的排序切换
- `P3-4 Scenario pack expansion point v1` 当前也已开始进入真实实现：
  - `packages/core/memory/packs.ts` 当前已开始提供第二个内建 pack：
    - `project_ops`
  - `apps/web/lib/chat/memory-packs.ts` 当前已开始让 `resolveActiveScenarioMemoryPack(...)` 受 `activeNamespace.primary_layer` 影响
  - 当前最小规则已经成立：
    - 无 namespace 提示时，仍默认 `companion`
    - `project` primary namespace 下，会切到 `project_ops`
  - `project_ops` 当前也已开始带出更偏 project execution 的：
    - `preferred_routes`
    - `assembly_order`
    - prompt guidance
  - runtime prompt / assistant metadata / debug metadata 当前也已开始承接这层 pack 切换
  - `memory-upgrade-harness.ts` 当前也已开始显式校验默认 `companion` 路径与 project namespace 下的 `project_ops` 切换
  - `apps/web/lib/chat/memory-packs.ts` 当前也已开始让 `resolveActiveScenarioMemoryPack(...)` 同时考虑 `activeNamespace.primary_layer` 与 `relevantKnowledge`
  - 当前最小规则已经成立：
    - 即使 `activeNamespace.primary_layer = world`
    - 只要当前上下文里的 `project` knowledge 开始占主导
    - active pack 也可以切到 `project_ops`
  - 也就是说，pack selection 当前已经不只受 namespace 影响，而开始变成 `namespace + knowledge` 的联合判断
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 world-primary namespace 下的 `project_knowledge_priority`
  - `apps/web/lib/chat/memory-knowledge.ts` 当前也已开始让 knowledge prompt budget 受 `activePackId` 影响
  - 当前最小规则已经成立：
    - `companion` 继续使用更紧的 knowledge budget，只保留 `project / world`
    - `project_ops` 在 `project / world` 优先的前提下，可在预算允许时额外带入一条 `general` knowledge
  - `apps/web/lib/chat/runtime.ts` 当前也已开始把 active scenario pack 传入 knowledge prompt section，使 pack 选择开始真实影响 knowledge 消费预算
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` prompt 会带入 `General reply policy`
    - `companion` prompt 仍不会带入 `General reply policy`
- `P3-5 regression / acceptance expansion` 当前也已开始进入真实实现：
  - `memory-upgrade-harness.ts` 当前已开始显式产出 `p3_regression_gate`
  - 第一版 `P3` gate 当前已开始锁：
    - `namespace_recall_ok`
    - `namespace_write_boundary_ok`
    - `retention_strategy_ok`
    - `knowledge_scope_ok`
    - `scenario_pack_ok`
  - 也就是说，`P3-1 ~ P3-4` 当前已经不只是零散断言，而开始有了一组阶段聚合 gate
- `P3` 当前也已进入 close-readiness 复盘阶段：
  - [memory_upgrade_p3_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_close_readiness_v1.0.md)
    已开始对 `P3-1 ~ P3-5` 的阶段状态做集中判断
  - 当前最新判断已经推进到：
    - `P3-1 ~ P3-4`：接近完成
    - `P3-5`：第一版已成立
  - 整体 `P3` 当前约在 `85%`，已进入更明确的 close-readiness 区间
  - [memory_upgrade_p3_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_close_note_v1.0.md)
    当前也已新增，用于正式收口“P3 已达到 close-ready，剩余项转入非阻塞尾项”的阶段判断
- `memory_upgrade_p4_execution_plan_v1.0.md` 当前也已新增，用于把下一阶段从 `P3` 已成立主骨架推进成正式执行起点：
  - namespace retrieval / write boundary v2
  - retention budget / pruning v2
  - knowledge route influence v2
  - scenario pack consumption expansion v2
  - `P4` regression / acceptance expansion
- `P4-1 Namespace retrieval / write boundary v2` 当前也已开始进入真实实现：
  - `apps/web/lib/chat/memory-namespace.ts` 当前已开始提供统一的 `resolveRuntimeMemoryBoundary(...)`
  - 这层 boundary 当前已开始把 namespace 显式收成：
    - `retrieval_boundary`
    - `write_boundary`
    - `allow_timeline_fallback`
  - `apps/web/lib/chat/memory-recall.ts` 当前已开始复用这层 boundary，使 thread-primary namespace 下的 recall route 会主动关闭 `timeline` fallback
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始复用同一层 boundary helper，使 write boundary 与 retrieval boundary 不再各自手写
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 thread-primary namespace 下的 `thread` retrieval/write boundary 与 timeline fallback 收紧
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始在 namespace-aware target resolution 中显式产出 `routed_project_id / routed_world_id`
  - `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把这层 routed project/world ids 暴露到 memory write preview
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 project boundary 下的 routed project/world ids 与 preview 暴露
  - `apps/web/lib/chat/memory-namespace.ts` 当前也已开始把 namespace boundary 显式收成最小 recall budget：
    - `profile_budget`
    - `episode_budget`
    - `timeline_budget`
  - `apps/web/lib/chat/memory-recall.ts` 当前也已开始复用这层 budget，使 thread-primary namespace 下的 recall selection 不再只受 route 开关影响，也开始受 namespace budget 影响
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 thread-primary namespace 下的 tighter recall budget
- `P4-2 Retention budget / pruning v2` 当前也已开始进入真实实现：
  - `packages/core/memory/compaction.ts` 当前已开始把 `retention_budget` 收成正式 contract
  - `apps/web/lib/chat/thread-compaction.ts` 当前已开始根据 `retention_mode / retention_reason` 推导最小 retention budget
  - 当前最小规则已经成立：
    - `focus_anchor = 2`
    - `continuity_anchor = 2`
    - `recent_window = 3`
    - `minimal = 1`
  - runtime prompt / assistant metadata / debug metadata 当前也已开始承接这层 retention budget
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` 下的 `retention_budget = 2`
  - `apps/web/lib/chat/thread-compaction.ts` 当前也已开始让 retention budget 真实影响 `retained_fields`
  - 当前最小规则已经成立：
    - `focus_anchor` 下的 `retained_fields` 会从 `focus_mode / continuity_status / current_language_hint`
      收紧成 `focus_mode / continuity_status`
  - 也就是说，retention budget 当前已不再只是 summary 里的数字，而开始成为真实 pruning 行为
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` 下的 `retained_fields` 收紧
  - `apps/web/lib/chat/thread-compaction.ts` 当前也已开始让 `current_language_hint` 在存活时进入真实 summary section：
    - `Language hint: ...`
  - 也就是说，retention budget 当前不仅影响 `retained_fields`，也开始真实影响 summary section composition
  - keep/drop decision 当前也已开始进一步收紧：
    - `paused + minimal_context + retention_budget <= 1`
      的 compaction summary 会被主动丢弃
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 `focus_anchor` 下不会错误保留 `Language hint: en.`，以及 paused-minimal pruning
- `P4-3 Knowledge route influence v2` 当前也已开始进入真实实现：
  - `apps/web/lib/chat/memory-packs.ts` 当前已开始让 `world` knowledge 真实影响 active pack 的有效 `preferred_routes / assembly_order`
  - 当前最小规则已经成立：
    - 在 `world > project` 的 knowledge context 下，`companion` pack 仍保持 `companion`
    - 但有效 `preferred_routes` 会提升成：
      - `thread_state -> knowledge -> profile -> episode -> timeline`
    - 有效 `assembly_order` 会提升成：
      - `thread_state -> knowledge -> dynamic_profile -> static_profile -> memory_record`
  - 也就是说，knowledge influence 当前已经不只体现在 knowledge snippet 的 prompt selection，而开始进入 pack-level route / assembly 决策
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `world_knowledge_influence`
    - knowledge-promoted preferred routes
    - knowledge-promoted assembly order
  - `ActiveScenarioMemoryPack` 当前也已开始显式产出：
    - `knowledge_priority_layer`
    - `assembly_emphasis`
  - 也就是说，knowledge influence 当前不再只是隐含在 route/order 结果里，而开始成为可读的 runtime decision 输出
  - 这层输出当前已进入：
    - scenario pack prompt section
    - assistant metadata
    - runtime debug metadata
  - `ActiveScenarioMemoryPack` 当前也已开始显式产出：
    - `route_influence_reason`
  - 也就是说，knowledge-driven pack routing 当前不再只是“结果可见”，而开始把“为什么这样排 route/order”收成正式 runtime fact
- `P4-4 Scenario pack consumption expansion v2` 当前也已开始进入真实实现：
  - `apps/web/lib/chat/runtime.ts` 当前已开始让 `scenario pack` 真实影响 relationship memory 的消费预算
  - 当前最小规则已经成立：
    - `companion` 最多保留 2 条 relationship memory
    - `project_ops` 收紧到最多 1 条 relationship memory
  - 也就是说，pack-specific consumption 当前已不再只停在 knowledge budget，而开始进入 memory-layer assembly 的真实 slot 控制
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` 下只有 `RM1`
    - `companion` 下允许出现 `RM2`
  - `apps/web/lib/chat/runtime.ts` 当前也已开始让 `scenario pack` 真实影响 `static_profile` 的消费预算
  - 当前最小规则已经成立：
    - `companion` 最多保留 2 条 static profile
    - `project_ops` 收紧到最多 1 条 static profile
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` 下只有 `SP1`
    - `companion` 下允许出现 `SP2`
  - `apps/web/lib/chat/runtime.ts` 当前也已开始让 `scenario pack` 真实影响 `memory_record` 的消费预算
  - 当前最小规则已经成立：
    - `project_ops` 最多保留 2 条 memory record
    - `companion` 收紧到最多 1 条 memory record
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` 下允许出现 `MR2`
    - `companion` 下不会出现 `MR2`
  - `apps/web/lib/chat/runtime.ts` 当前也已开始让 `scenario pack` 真实影响 `dynamic_profile` 的消费条件
  - 当前最小规则已经成立：
    - `project_ops` 在 `memory_record` 已承接执行上下文时，会压低 `dynamic_profile`
    - `companion` 仍会保留 `dynamic_profile` 与 `memory_record` 并存
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` 下 `dynamic_profile` 会被压下去
    - `companion` 下 `dynamic_profile` 仍会保留
  - `apps/web/lib/chat/runtime.ts` 当前也已开始让 `scenario pack` 真实影响 `memory_record` 内部的 `episode / timeline` 消费优先级
  - 当前最小规则已经成立：
    - `project_ops` 会优先保留 `timeline -> episode`
    - `companion` 会优先保留 `episode -> timeline`
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `project_ops` 下 `MR1` 会优先变成 `timeline`
    - `companion` 下单槽 `memory_record` 会优先保留 `episode`
- `P4-5 regression / acceptance expansion` 当前也已开始进入真实实现：
  - `memory-upgrade-harness.ts` 当前已开始显式产出 `p4_regression_gate`
  - 当前第一版 `P4` gate 已开始锁：
    - `namespace_boundary_v2_ok`
    - `retention_budget_v2_ok`
    - `knowledge_route_influence_v2_ok`
    - `scenario_pack_consumption_v2_ok`
  - 当前这层 gate 也已开始把 `P4-4` 里更完整的 pack-specific consumption 差异锁进同一组阶段级断言：
    - relationship slot budget
    - static_profile slot budget
    - memory_record subtype priority
    - dynamic_profile coexistence rule
  - 也就是说，`P4-1 ~ P4-4` 当前已不再只是分散断言，而开始有一组阶段级聚合 gate
- `P4` 当前也已进入 close-readiness 复盘阶段：
  - [memory_upgrade_p4_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_readiness_v1.0.md)
    已开始对 `P4-1 ~ P4-5` 的阶段状态做集中判断
  - 当前最新判断已经推进到：
    - `P4-1 / P4-2`：中段
    - `P4-3 / P4-4`：中后段
    - `P4-5`：第一版已成立
  - 整体 `P4` 当前约在 `80%`，并已进入更清晰的 close-readiness 前置区间
  - [memory_upgrade_p4_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_note_v1.0.md)
    当前也已新增，用于正式收口“P4 已达到 close-ready，剩余项转入非阻塞尾项”的阶段判断

当前 `P4` 的阶段判断：

- `P4-1`：中段
- `P4-2`：中段
- `P4-3`：中后段
- `P4-4`：中后段
- `P4-5`：第一版已成立

整体上，`P4` 当前大约在 `80%` 左右。
这意味着：

- `P4` 已经从前中段推进到更明确的中后段
- 并且已经开始接近 `close-readiness` 前的最后区间
- 当前不再有明显落后的单项，`P4-1 / P4-2` 仍是相对更浅的两条线
- `P4` 当前已达到 `close-ready / 可收官`
- 下一步更合理的是切到下一阶段规划，或只做少量 tail cleanup
- `P0 ~ P4` 当前的非阻塞尾项也已统一收束到：
  - [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
  - 用于后续按 batch 处理 tail cleanup / gate strengthening / deepening backlog，而不再回头阻塞主线
- `memory_upgrade_p5_execution_plan_v1.0.md` 当前也已新增，用于把下一阶段从 `P4` 已成立的 boundary / pruning / route influence / pack consumption 推进成正式执行起点：
  - namespace multi-budget routing
  - retention layering / pruning strategy v3
  - knowledge route weighting v3
  - scenario pack strategy layer v3
  - `P5` regression / acceptance expansion
- `P5-1 Namespace multi-budget routing` 当前也已开始进入真实实现：
  - `apps/web/lib/chat/memory-namespace.ts` 当前已开始把 namespace boundary 从单层 recall budget 推进成更明确的 multi-budget 结构：
    - `profile_budget`
    - `episode_budget`
    - `timeline_budget`
    - `parallel_timeline_budget`
  - 当前最小规则已经成立：
    - `thread` primary namespace 下：`parallel_timeline_budget = 0`
    - `project / world` primary namespace 下：`parallel_timeline_budget = 1`
  - `apps/web/lib/chat/memory-recall.ts` 当前也已开始复用这层 budget：
    - 当 namespace 允许 `parallel_timeline_budget > 0` 时，timeline recall 不再只能在 `episode = 0` 时触发，而开始允许与 episode 并行保留一条 timeline
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - thread boundary 下 `parallel_timeline_budget = 0`
    - project boundary 下 `parallel_timeline_budget = 1`
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始把 namespace write routing 从“只给出 boundary”推进成更明确的 priority / fallback 结构：
    - `write_priority_layer`
    - `fallback_write_boundary`
  - 当前最小规则已经成立：
    - `project` boundary 下：
      - `write_priority_layer = project`
      - `fallback_write_boundary = world`
      - primary routed target 只保留 `routed_project_id`
  - `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把这层 write priority / fallback 暴露到 preview
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `write_priority_layer = project`
    - `fallback_write_boundary = world`
  - `apps/web/lib/chat/memory-namespace.ts` 当前也已开始把 namespace 的 retrieval / write 顺序收成正式 contract：
    - `retrieval_route_order`
    - `write_fallback_order`
  - 当前最小规则已经成立：
    - `thread` primary namespace 下：
      - `retrieval_route_order = thread_state -> profile -> episode`
      - `write_fallback_order = thread -> project -> world -> default`
    - `project` primary namespace 下：
      - `retrieval_route_order = thread_state -> profile -> episode -> timeline`
      - `write_fallback_order = project -> world -> default`
  - `apps/web/lib/chat/memory-recall.ts` 当前也已开始直接复用 `retrieval_route_order`
  - `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始通过 `write_fallback_order` 解析 fallback 边界
  - `memory-upgrade-harness.ts` 当前也已开始显式校验：
    - `thread` / `project` namespace 下的 retrieval/write 顺序
- `P2-1 Scenario Memory Pack seam` 当前也已开始进入真实实现：
  - `packages/core/memory/packs.ts` 已新增首版 `ScenarioMemoryPack` contract 与内建 `companion` pack
  - `apps/web/lib/chat/memory-packs.ts` 已新增默认 active-pack resolver 与 prompt section builder
  - runtime `buildAgentSystemPrompt(...)` 当前也已开始显式注入 active scenario memory pack guidance
  - assistant metadata / debug metadata 当前也已开始暴露最小 pack 摘要
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 companion pack seam
- `P2-2 Knowledge Layer minimal separation` 当前也已开始进入真实实现：
  - `packages/core/memory/knowledge.ts` 已新增首版 `KnowledgeResource / KnowledgeSnapshot / KnowledgeLink` contract
  - `apps/web/lib/chat/memory-knowledge.ts` 已新增最小 knowledge snapshot / runtime snippet / prompt section builder
  - runtime `buildAgentSystemPrompt(...)` 当前也已开始显式注入最小 knowledge-layer section
  - assistant metadata / debug metadata 当前也已开始暴露最小 knowledge summary
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 knowledge seam
- `P2-3 Thread Compaction / Retention v1` 当前也已开始进入真实实现：
  - `packages/core/memory/compaction.ts` 已新增首版 `CompactedThreadSummary` contract
  - `apps/web/lib/chat/thread-compaction.ts` 已新增最小 compaction summary builder / prompt section / metadata summary helper
  - runtime `buildAgentSystemPrompt(...)` 当前也已开始显式注入最小 compaction section
  - assistant metadata / debug metadata 当前也已开始暴露最小 thread compaction 摘要
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 compaction metadata reader 与 prompt 注入
- `P2-4 Scope / Namespace expansion` 当前也已开始进入真实实现：
  - `packages/core/memory/namespace.ts` 已新增首版 `MemoryNamespaceLayer / MemoryNamespaceRef / ActiveMemoryNamespace` contract
  - `apps/web/lib/chat/memory-namespace.ts` 已新增最小 namespace resolver / prompt section / metadata summary helper
  - runtime `buildAgentSystemPrompt(...)` 当前也已开始显式注入最小 namespace section
  - namespace 当前也已开始影响真实 knowledge 过滤边界，out-of-namespace knowledge 不再进入 prompt / summary
  - assistant metadata / debug metadata 当前也已开始暴露最小 memory namespace 摘要
  - `memory-upgrade-harness.ts` 当前也已开始显式校验 namespace metadata reader 与 project-layer prompt 注入
- `P2-5 regression / acceptance expansion` 当前也已开始进入真实实现：
  - `memory-upgrade-harness.ts` 当前不只锁 `P2-1 ~ P2-4` 的 seam 存在
  - 也已开始显式校验：
    - scenario memory pack summary
    - knowledge summary
    - thread compaction summary
    - memory namespace summary
    - prompt 中的 compaction / namespace 注入
- `P1-1 episode / timeline retrieval` 当前也已开始进入真实实现，而不再只是 contract：
  - `selectMemoryRecallRoutes(...)` 已开始真实激活 `episode / timeline`
  - `buildRecalledEpisodeMemoryFromStoredMemory(...)`
  - `buildRecalledTimelineMemoryFromStoredMemory(...)`
    已开始把 legacy `memory_record` 语义转成最小 recalled item
  - runtime `buildAgentSystemPrompt(...)` 当前也已开始在命中 `episode / timeline` 时注入对应 route-aware 指令
  - `memory-upgrade-harness.ts` 当前也已开始显式校验这条 `P1-1` retrieval 线
- `P1-2 dynamic profile minimal activation` 当前也已开始进入真实实现：
  - `thread_local profile / preference` 当前已开始从 `thread_state_candidate` 迁移到 `dynamic_profile`
  - `buildDynamicProfileRecordFromStoredMemory(...)` 当前已开始产出最小 `DynamicProfileRecord`
  - dynamic-profile recalled item 当前也已开始进入 real recall、runtime semantic summary 与 system prompt guidance
- `P1-3 context assembly v2` 当前也已开始进入真实实现：
  - runtime `buildAgentSystemPrompt(...)` 当前已开始显式注入 `Context assembly order for this turn`
  - 当前最小顺序已开始收成：
    1. `thread_state`
    2. `dynamic_profile`
    3. `static_profile`
    4. `memory_record`
  - 每层当前也已开始带最小片段注入，而不再只停留在语义摘要层
- `P1-4 legacy read-path tightening` 当前也已开始进入真实实现：
  - `restoreMemory(...)` 当前已不再本地手写 `category / key / scope -> single-slot` 判定
  - `resolveSupportedSingleSlotTarget(...)` 当前已开始承接 legacy single-slot restore target 解析
  - memory 管理链路当前也已开始把冲突查询前提收成共用 helper，而不再散落在 action 内联逻辑里
  - chat page 的 memory 展示读路径当前也已开始优先走 canonical getter：
    - `getMemoryCategory(...)`
    - `getMemoryScope(...)`
    而不再直接依赖 raw `memory.category / memory.scope`
  - `memory-records.ts` / `memory-recall.ts` 当前也已开始把：
    - `static_profile`
    - `dynamic_profile`
    - `relationship memory_record`
    - generic `memory_record`
    的判定收成共用 semantic predicate，而不再在 recall 主路径里散落 raw `category / scope` 判断
  - recall applicability 当前也已开始优先走 `getMemoryScope(...)`，而不再直接依赖 raw `memory.scope`
  - runtime 的 visible / hidden / incorrect / superseded memory list 当前也已开始通过共用 normalizer 生成 canonical displayed record，而不再各自重复拼装 legacy row 的 category / scope / source 字段
- `P1-5 regression / acceptance expansion` 当前也已开始进入真实实现：
  - `memory-upgrade-harness.ts` 当前不只锁 `P1-1 ~ P1-3`
  - 也已开始显式校验：
    - `isStoredMemoryStaticProfile(...)`
    - `isStoredMemoryDynamicProfile(...)`
    - `isStoredMemoryRelationshipMemoryRecord(...)`
    - `isStoredMemoryGenericMemoryRecord(...)`
    - `resolveSupportedSingleSlotTarget(...)`
    - `buildVisibleMemoryRecord(...)`
    这些 `P1-4` 相关 gate
- legacy `goal` 当前默认不进入 `DynamicProfileRecord`，而是保守视为 `ThreadState` 迁移候选
- 在具备 `threadId + repository` 时，legacy `goal` 当前也已开始写入 `ThreadState.focus_mode`

这意味着：

- memory 已不再只是“页面内部 helper”
- 已开始具备“legacy row + new semantic record”双层过渡结构
- 但仍未完全迁出 `apps/web`

---

### 3.3 runtime 已有统一输出对象

当前 `apps/web/lib/chat/runtime.ts` 已不再只是“生成一段 reply 文本”，而是开始返回统一 `RuntimeTurnResult`。

当前已具备的最小输出对象包括：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata`

当前已落实的事实包括：

- `assistant_message` 已有最小统一字段
- `RuntimeTurnInput` 已有第一版代码壳：
  - `apps/web/lib/chat/runtime-input.ts`
- `im-runtime-port.ts` 已开始显式构造 `RuntimeTurnInput`
- `actions.ts` 的正常发送与重试路径也已开始显式构造 `RuntimeTurnInput`
- `runAgentTurn(input)` 已有第一版薄壳，并已接入：
  - IM 入口
  - Web chat 主入口
- `PreparedRuntimeTurn` 已有第一版代码壳：
  - `apps/web/lib/chat/runtime-prepared-turn.ts`
- `runtime.ts` 已开始在主流程中显式构造 `PreparedRuntimeTurn`
- `prepareRuntimeTurn(...)` 已有第一版装配函数壳，并已开始被 `runtime.ts` 调用
- `prepareRuntimeSession(...)` 已有第一版 session 装配函数壳，并已开始被主流程使用
- `prepareRuntimeRole(...)` 已有第一版 role 装配函数壳，并已开始被主流程使用
- `prepareRuntimeMemory(...)` 已有第一版 memory recall 装配函数壳，并已开始被主流程使用
- `prepareRuntimeMemory(...)` 当前也已开始接收 `thread_state`
- `runPreparedRuntimeTurn(...)` 已有第一版执行薄壳，并已开始被主流程使用
- `memory_write_requests` 已有最小 planner output
- `follow_up_requests` 已有最小 planner output
- `runtime_events` 已有第一版标准事件类型
- `memory recall` 当前也已开始显式暴露 `appliedRoutes`
- `memory_write_planned` 当前也已开始显式暴露 `record_targets`
- `runtime` 输出治理也已开始进入文档收口阶段，当前已开始明确：
  - `runtime_events` 负责“本轮发生了什么标准过程”
  - `debug_metadata` 负责“这轮为什么这样、有哪些最小调试摘要”
- `runtime event catalog` 也已开始收成最小目录，当前已明确包括：
  - `memory_recalled`
  - `memory_write_planned`
  - `follow_up_planned`
  - `answer_strategy_selected`
  - `assistant_reply_completed`
  - `thread_state_writeback_completed`
- `RuntimeEvent` 现在也已开始从裸 `payload` 收成更明确的 typed union
- `runtime_events` payload 命名也已开始进入第一轮规范化，例如：
  - `memory_recalled.count`
  - `answer_strategy_selected.strategy`
  - `answer_strategy_selected.reason_code`
  - `assistant_reply_completed.recalled_count`
- IM adapter / harness 这一侧也已开始跟上这层 typed runtime event 约束
- `debug_metadata` 的命名收口方向也已开始明确：
  - 顶层只保留少量稳定 summary key
  - 局部子域信息优先逐步收成嵌套对象
- `answer_strategy*` 现在也已开始进入最小 metadata 分组：
  - `debug_metadata.answer_strategy.selected`
  - `debug_metadata.answer_strategy.reason_code`
- `memory*` 现在也已开始进入最小 metadata 分组：
  - `debug_metadata.memory.recalled_count`
  - `debug_metadata.memory.write_request_count`
- `follow_up*` 现在也已开始进入最小 metadata 分组：
  - `debug_metadata.follow_up.request_count`
- `session / continuity` 现在也已开始进入最小 metadata 分组：
  - `debug_metadata.session.continuation_reason_code`
  - `debug_metadata.session.recent_turn_count`
  - `debug_metadata.session.context_pressure`
- `debug_metadata.session.thread_state` 当前也已开始进入最小摘要分组：
  - `lifecycle_status`
  - `focus_mode`
  - `continuity_status`
  - `current_language_hint`
- assistant metadata 的 `session` 分组当前也已开始进入相同最小 `thread_state` 摘要
- assistant metadata read helper 与 `chat-thread-view` 当前也已开始消费该最小 `thread_state` 摘要
- `buildAgentSystemPrompt(...)` 当前也已开始直接消费该最小 `thread_state` 摘要
- `buildAgentSystemPrompt(...)` 当前也已开始直接消费 `memory.semantic_summary`
- `assistant_message.metadata` 也已开始进入统一 builder 收口：
  - `apps/web/lib/chat/assistant-message-metadata.ts`
- `runtime.ts` 已不再直接内联拼接整块 assistant metadata，而是开始通过统一 builder 生成
- 当前 assistant metadata 已开始形成 grouped shape，例如：
  - `model_profile`
  - `language`
  - `answer_strategy`
  - `session`
  - `memory`
- `session-context.ts` 已开始优先读取 grouped assistant metadata：
  - `metadata.language.detected`
- `smoke.ts` 的 continuity helper 也已开始优先读取 grouped assistant metadata：
  - `metadata.language.detected`
- `chat-thread-view.tsx` 的 runtime summary 也已开始优先读取 grouped assistant metadata：
  - `model_profile`
  - `memory`
- smoke 生成的 assistant metadata 当前也已开始补出兼容式 grouped shape：
  - `model_profile`
  - `language`
  - `session`
  - `memory`
- 但为了兼容 smoke / eval / continuity 邻近读取面，关键平铺字段当前仍然保留
- `assistant_message.metadata` 当前也不再只是“有 grouped shape”，而是开始具备：
  - 统一 builder
  - 统一 read helper
  - Web / IM 两侧 runtime preview metadata 的统一 builder / updater
- `runtime user message` 这条线当前也已开始进一步收口：
  - user message metadata builder 已并回真实 persistence 入口
  - Webhook binding lookup factory 这类单跳 helper 也已开始被继续裁掉
- `thread activity` 这条线当前也已更直接：
  - title summarize 已并回 `thread activity patch` builder
- 也就是说，assistant / runtime metadata 这条线当前已经从“开始收组”前移到了：
  - 写出面开始共用 builder
  - 读取面开始共用 grouped + fallback helper
  - preview metadata 也开始共用更新路径
- `runtime preview metadata` 当前也已开始显式暴露 memory write `record_targets`
- `smoke` 这条测试 harness 线当前也已不再是少数超长文件混合：
  - turn orchestration
  - prompt routing
  - reply routing
  - assistant metadata
  - seed / persistence
  这些层都已拆成更明确 helper
- 并且在当前这一轮收尾里，`smoke` 里大量 type shell / wrapper / facade 已被继续裁掉
- 当前更准确的判断是：
  - `smoke` harness 已进入尾段清扫
  - 剩余小文件大多已经是稳定公共原语，而不是明显多余的中转层
- `chat` 主线当前也开始进入相似的收尾区：
  - `thread message` 单跳 persistence shell 已裁掉
  - `runtime user message` metadata 小壳已裁掉
  - `thread title` 小壳已裁掉
- `follow_up claim` 单跳 shell 也已裁掉，worker 与 harness 直接走 repository claim method
- 记忆升级 P0 也已正式进入代码起步阶段：
  - core `MemoryRecord / StaticProfileRecord / DynamicProfileRecord / MemoryRelationRecord` 已有首版 record type
  - chat 侧 `StoredMemory -> record` adapter 已出现
  - recall route 已开始从单 helper 走向 `profile / thread_state` 的显式分流
  - `thread_state` 已不只存在于 session 读取链，也已进入 runtime memory preparation 与 debug 可见性
  - write target 语义已开始同时进入：
    - planner classification
    - commit 前 row builder
    - runtime preview metadata
    - `memory_write_planned` runtime event
  - generic `profile / preference` 写入当前也已开始先构造 `StaticProfileRecord` candidate，再进入 legacy row 组装
  - relationship 写入当前也已开始先构造正式 `MemoryRecord` candidate，再进入 single-slot upsert
  - `thread_state_candidate` seam 也已成立，并已开始进入最小真实 commit
  - `static_profile` 当前已成为三条里第一条进入真实主读路径的分支
  - `static_profile` 当前也已成为三条里第一条进入 runtime 注入层的分支
  - `memory_record` 当前也已开始进入 relationship recall 的真实主读路径
  - `goal` 当前不进入 reply recall prompt，而是保守沉淀为 `ThreadState.focus_mode`
- 当前 runtime 主线的下一阶段优先级也已前移成：
  - 先治理输出层
  - 再决定是否继续细拆 execution
- `actions.ts` 已开始消费统一 runtime 输出对象
- `relationship memory` 已通过 `memory_write_requests` subtype 显式产出
- `follow_up_requests` 已有第一版 executor stub 与显式执行结果对象
- `accepted follow_up` 已默认进入真实 `pending_follow_ups` 持久化路径
- `follow_up` 已具备最小 claim / result marking repository seam
- `follow_up` 已具备平台无关 proactive sender contract、mapper 与 sender shell
- `follow_up` 已具备统一 sender policy helper，用于收口 sender 选择 / 降级逻辑
- `follow_up` 已能通过一次性 harness 跑通 `claim -> map -> send -> mark`
- `follow_up` 已具备默认 `claim -> resolve binding -> map -> send -> mark` worker shell
- `follow_up` 的 harness 与 default worker 默认 sender 初始化都已开始复用统一 sender helper
- `follow_up` 的 route、harness、worker 默认值三层现在都已开始向统一 sender helper 收口
- `follow_up` 已具备受 `x-smoke-secret` 保护的手动调试 route：
  - `app/api/test/followup-run/route.ts`
- `follow_up` 已具备受 `x-followup-cron-secret` 保护的 internal route：
  - `app/api/internal/followup/run/route.ts`
- `follow_up` 的 internal route 已完成两类受控真实验证：
  - 默认 `stub sender` 路径已验证 `pending -> claimed -> resolve binding -> send(stub) -> mark executed`
  - 显式开启 `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true` 且指定 `sender=telegram` 后，已完成一次真实 Telegram proactive send 验证
- `api/test` 与 `api/internal` 两条 route 已开始共用统一 sender policy helper，而不是各自维护 sender 选择逻辑

这意味着：

- runtime 的对外 contract 已从文档概念变成代码事实
- runtime input 也已经不只是设计稿，而是开始出现：
  - IM
  - Web chat
  这两条真实标准输入路径
- runtime 装配层也已经不只是文档概念，而是开始出现第一版显式对象
- runtime 装配函数入口也已经出现第一版代码事实
- 但事件 schema、默认 worker 的真实自动调度语义、scheduler 常驻执行仍未完成

---

### 3.4 session 已有最小代码落点

当前 session 相关逻辑不再完全散落在 `runtime.ts` 中，已经出现了第一版统一会话对象：

- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`

当前已落实的 `SessionContext` 组织字段包括：

- `current_user_message`
- `current_message_id`
- `recent_raw_turns`
- `continuity_signals`
- `recent_raw_turn_count`
- `approx_context_pressure`

另外，session 装配本身也开始出现第一版 preparation 落点：

- `prepareRuntimeSession(...)`

当前 runtime 已开始显式消费这层 session object，而不是继续直接拼 recent turns 和 thread continuity。

另外，session 正式状态层也已经有了第一版设计起点：

- [session_state_contract_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/session_state_contract_v1.0.md)
- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

其中已经开始明确：

- `thread`
- `thread state`
- `SessionContext`

三者的分层关系。

这意味着：

- `role-memory-session` 三者协作面中，session 已不是纸面概念
- 正式 `thread_state` contract 已开始
- `ThreadStateRecord` 第一版代码壳已开始
- `prepareRuntimeSession(...)` 已开始最小消费 `thread_state`
- `loadThreadState(...)` 第一版代码壳已开始
- `prepareRuntimeSession(...)` 已开始通过 `loadThreadState(...)` 进入 thread state 读取边界
- `ThreadStateRepository` 第一版代码壳已开始
- `loadThreadState(...)` 已开始复用默认 repository
- `SupabaseThreadStateRepository` 第一版代码壳已开始
- `thread_states` migration 草案已完成并已落远端库
- `SupabaseThreadStateRepository` 真实读取已验证通过
- 默认 `loadThreadState(...)` 已优先走 Supabase，初始化失败时回退 in-memory
- `ThreadStateRepository.saveThreadState(...)` 第一版代码壳已开始
- `InMemoryThreadStateRepository.saveThreadState(...)` 与 `SupabaseThreadStateRepository.saveThreadState(...)` 已存在
- `thread-state-writeback.ts` 第一版 trigger helper 已开始
- `runPreparedRuntimeTurn(...)` 已开始以 soft-fail side effect 触发最小 thread state 写回
- `debug_metadata.thread_state_writeback` 也已开始承接最小 writeback 摘要
- `runtime_events` 也已开始承接最小 `thread_state_writeback_completed` 标准事件
- 但 `thread_state` 仍未进入 retry 与 compaction

---

### 3.5 role 已有最小代码落点

当前 role 相关逻辑已经不再完全内嵌于 `runtime.ts`，已经出现了第一版独立角色层文件：

- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`

当前已落实的 role 侧事实包括：

- `RoleProfile` 已有第一版代码 contract
- `RoleCorePacket` 已有第一版独立定义
- `buildRoleCorePacket(...)` 已从 `runtime.ts` 中抽出
- `loadRoleProfile(...)` 已形成最小读取面
- `RoleRepository` 第一版代码壳已开始：
  - `apps/web/lib/chat/role-repository.ts`
- `RoleResolver` 第一版代码壳已开始：
  - `apps/web/lib/chat/role-service.ts`
- runtime 已开始显式消费 role layer，而不是只维护本地匿名类型
- runtime / IM 主路径已开始直接消费 repository + resolver 分层
- `role repository / service` 的最小边界设计已开始：
  - `docs/architecture/role_repository_service_design_v1.0.md`

这意味着：

- `role-memory-session` 三者协作面中，role 也已经有了第一版代码落点
- role 的下一层边界已经前移成：
  - `repository`
  - `resolver / service`
  - `runtime preparation`
- `repository` 第一版代码壳已开始
- `resolver / service` 第一版代码壳也已开始
- runtime / IM 主调用面也已开始迁到新分层
- 但 metadata 收口、默认模型配置边界仍未进一步抽层

---

### 3.6 IM adapter 已有最小代码骨架

当前 IM adapter 已不再只停留在文档层，已经出现了第一版接入层 package：

- `packages/integrations/im-adapter/contract.ts`
- `packages/integrations/im-adapter/bridge.ts`
- `packages/integrations/im-adapter/example.ts`
- `apps/web/lib/chat/im-runtime-port.ts`

当前已落实的 adapter 侧事实包括：

- `InboundChannelMessage` 已有第一版代码 contract
- `OutboundChannelMessage` 已有第一版代码 contract
- binding 最小结构已落代码
- `BindingLookup` 已形成最小查询接口
- `InMemoryBindingLookup` 已形成最小 stub
- `BindingRepository` 已形成最小预留壳
- `InMemoryBindingRepository` 已形成最小 repository stub
- `SupabaseBindingRepository` 已形成数据库映射壳
- Web 侧真实 binding lookup 工厂已形成
- `channel_bindings` 已有第一版 migration 草案
- `AdapterRuntimePort` 已形成 runtime 边界接口
- `handleInboundChannelMessage(...)` 已能表达最小 `incoming -> runtime -> outgoing` 骨架
- Web 侧 runtime 已有第一版 adapter port 适配器
- `binding_not_found` 已有最小统一出站处理
- Telegram 单通道 PoC 骨架已形成：
  - `apps/web/lib/integrations/telegram.ts`
  - `apps/web/app/api/integrations/telegram/webhook/route.ts`
  - `apps/web/lib/supabase/admin.ts`
- Telegram 单通道 PoC 已完成一次真实闭环验证：
  - webhook 已成功注册并命中过真实入站
  - 真实 Telegram 身份已完成 binding 查询验证
  - `binding lookup -> runtime -> outbound reply` 已跑通
  - 验证结束后测试 binding 与 webhook 已完成清理
- Telegram PoC 已补齐重跑脚本与 runbook：
  - webhook set / delete script
  - binding upsert / delete script
  - `telegram_poc_runbook_v1.0.md`
  - `litellm_dev_runbook_v1.0.md`

这意味着：

- 接入层已经开始有独立代码落点
- 已经证明“最快验证闭环”的单通道接入路径是成立的
- Telegram 当前已进入“可重复重跑的 PoC 入口”阶段，但仍不是稳定常驻接入入口
- scheduler 接线、富媒体支持、真实绑定流程仍未开始

---

## 4. 当前阶段代码结构判断

### 4.1 已经开始长出来的底座

当前最明确的底座候选有：

- `packages/core/memory`
- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `packages/integrations/im-adapter`

其中：

- `packages/core/memory` 是最明确的 core 落点
- runtime 和 session 仍处于 Web 邻近层落点

---

### 4.2 当前仍然属于过渡态的部分

以下部分已经分层，但仍处于过渡态：

- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `apps/web/lib/chat/runtime.ts`

当前合理判断不是“这些设计还不成立”，而是：

- 这些边界已经成立
- 但仍未完全迁入更稳定的 package 落点

---

## 5. 当前还没有完成的关键点

当前最明显还没完成的，不是 memory 本身，而是下面几块：

### 5.1 role 已有落点，但仍是第一版

虽然 role 已经有了 `role-core.ts` 与 `role-loader.ts`，但当前仍缺：

- 独立的 role repository / service 边界
- role metadata 的结构化收口
- role 与 model profile 的更明确独立边界
- 更稳定的 `loadRoleProfile(...)` 底座化位置

---

### 5.2 session 仍未进入正式状态层

当前已有 `SessionContext`，但仍未具备：

- 正式 `thread_state`
- 正式 compaction
- thread-local agreement 的显式结构位

因此当前 session 仍处于：

- 最小 contract 已落地
- 但状态层尚未正式化

---

### 5.3 runtime 输出仍是第一版

虽然统一输出对象已经有了，但当前仍缺：

- `runtime_events` 的完整字典与 payload schema
- `follow_up_requests` 的真实调度执行器
- `RuntimeInput` 的正式代码 contract
- `runAgentTurn(input)` 这种更明确的统一运行入口

---

### 5.4 IM adapter 已有骨架，并已完成 Telegram 单通道 PoC 验证

当前 `im_adapter_contract_v1.0.md` 已经有对应代码骨架，但当前仍缺：

- Telegram webhook 的稳定常驻运行入口
- binding 的正式创建流程
- `follow_up_requests` 到 scheduler / adapter 的真实闭环
- 更稳定的平台级重试 / 幂等执行

当前近期已经完成的关键补强包括：

- LiteLLM 开发运行说明已补齐
- Telegram PoC 重跑脚本已补齐
- `relationship memory` 已完成显式 contract 收口
- `follow_up executor stub` 已落地，可返回显式执行结果
- `follow_up pending queue` 设计稿、repository seam、migration 草案已完成
- `pending_follow_ups` 已在远端库落表
- `accepted -> enqueue -> pending` 已完成真实持久化验证
- 默认 enqueue 路径已切到 `SupabaseFollowUpRepository`
- `pending -> claimed` 已有 repository seam 与真实 claim harness
- `claimed -> executed / failed` 已有 repository seam
- proactive sender contract / mapper / stub / Telegram sample sender shell 已形成
- `claim -> map -> send -> mark` 已可通过一次性 harness 跑通（当前默认走 stub sender）
- `runDefaultFollowUpWorker(...)` 已落成最小代码壳，默认仍走 `StubProactiveSender`
- `app/api/test/followup-run/route.ts` 已可作为最小手动调试入口
- `app/api/internal/followup/run/route.ts` 已可作为最小受控自动触发入口壳
- `app/api/internal/followup/run/route.ts` 已完成一次 `stub` 路径真实验证与一次 Telegram proactive send 受控真实验证
- `follow-up-sender-policy.ts` 已形成统一 sender 选择 / 降级层

当前已经明确暴露出的关键依赖是：

- webhook 运行路径不能依赖 request-scope Supabase client
- memory planner 不能因 JSON 解析失败打爆整轮 turn
- LiteLLM 是否可用，会直接决定 Telegram PoC 是否能真正回复

---

## 6. 下一阶段建议顺序

当前最推荐的推进顺序如下：

### Step 1：先同步阶段总结与当前代码现实

目标：

- 让总结文档准确反映当前真实状态
- 明确 Telegram、relationship memory、follow-up executor 三条线都已前进一步

建议动作：

- 持续把阶段总结作为当前进度入口
- 避免后续再靠 commit 历史反推当前状态

---

### Step 2：决定是继续接入层稳定化，还是进入 follow-up 的下一阶段 worker 接线

原因：

- Telegram 已经从“一次性验证”进入“可重复重跑的 PoC 入口”
- `follow_up` 已经从 planner 输出推进到默认 worker shell、手动入口、internal route 都已落代码的阶段
- 下一步重点不再是证明方向，而是选择先稳哪一条执行链

建议动作：

- 如果继续平台化：
  - 保持单通道
  - 继续补 Telegram 稳定运行入口
  - 不扩附件与复杂命令
- 如果继续 follow-up：
  - 先决定 Telegram proactive send 何时从“受控验证”进入“更稳定的默认运行策略”
  - 暂不直接落 loop / retry / requeue

---

### Step 3：再决定是继续平台化、follow-up 调度，还是回到底座深化

原因：

- 当前最小平台接入已跑通且可重跑
- relationship memory 与 follow-up 持久化链也已各自收口一轮
- 这时再决定继续哪条线，返工会更少

建议动作：

- 如果继续平台化：
  - 只补 Telegram 单通道必需能力
  - 不并行开第二个平台
- 如果继续调度：
  - 先决定 internal route 的 sender 开关、环境隔离与运行约束
  - 再决定是否接真实扫描执行、主动发送与 retry
- 如果回到底座深化：
  - 回到 `role / session / runtime input` 这几块仍未底座化的边界

---

## 7. 当前结论

当前这一阶段最重要的成果，不是“已经接了多个 IM 平台”或者“已经把 packages 全搬完”，而是：

**SparkCore 已经从“规划重定位”走到了“memory、runtime、session、role、adapter 五个核心边界开始在代码里成形，并且 Telegram PoC、relationship memory contract、follow-up pending / claim / proactive send / default worker / manual route / internal route 都已有真实工程落点，其中 internal route 的 stub 路径与真实 Telegram proactive send 也都已受控验证”的阶段。**

这意味着下一阶段已经不需要再大面积补总纲，而更适合围绕：

- 继续稳定 Telegram 单通道接入
- 或进入 follow-up 的默认 worker cron/admin 分化
- 或回到底座进一步抽纯 runtime / role / session 边界

按这个顺序继续推进，返工会最少。
