# SparkCore Memory Upgrade P3 Close Readiness v1.0

## 1. 文档定位

本文档用于在 `P3` 进入中后段后，明确：

- `P3-1 ~ P3-5` 当前各自处于什么状态
- 哪些已经可以视为基本成立
- 哪些还差最后几刀才能进入收口判断
- 当前是否已经适合准备 `P3 close note`

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p3_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_execution_plan_v1.0.md) 的阶段性收口复盘
- 对当前 `P3` 代码事实的压缩判断

---

## 2. 当前总体判断

当前 `Memory Upgrade P3` 已从中段推进到更明确的中后段，并开始进入更清晰的 close-readiness 区间。

当前总判断：

- `P3-1 ~ P3-3` 主结构已经从 seam 推进到了真实作用边界
- `P3-4` 已不再只是单 pack 占位，而开始进入真实选择与真实 prompt budget 消费逻辑
- `P3-5` 已不再只是零散断言，而已成立第一版阶段聚合 gate
- 当前剩余项已从“立高阶能力”继续压缩到“收口判断前的最后少量尾项”

当前整体完成度评估：

- **约 85%**

---

## 3. P3-1 ~ P3-5 当前状态

### P3-1 Namespace boundary expansion

状态：

- **接近完成**

当前已成立：

- namespace 已进入 recall 主路径
- namespace 已进入 write 去重 / refresh 过滤
- `resolvePlannedMemoryWriteTarget(...)` 已显式产出：
  - `write_boundary`
  - `namespace_primary_layer`
  - `target_namespace_id`
  - `routed_scope`
  - `routed_target_agent_id`
  - `routed_target_thread_id`
- thread namespace 下，generic `profile / preference` 已开始走真实 `thread_local` routed scope
- runtime preview / `memory_write_planned` event 已开始暴露 namespace-aware write routing
- harness 已开始锁：
  - in/out-of-namespace recall
  - namespace write boundary
  - routed scope preview

结论：

- `P3-1` 已不再只是“namespace 可见”
- 已推进到接近完成

### P3-2 Thread retention strategy v1

状态：

- **接近完成**

当前已成立：

- `retention_mode`
- `retained_fields`
- `retention_reason`
  已成为正式 contract
- retention strategy 已能根据：
  - `focus_mode`
  - `continuity_status`
  - `recent_turn_count`
  推导 mode / reason
- keep/drop decision 已成立：
  - `closed + minimal` 会被主动丢弃
- `retention_reason` 已开始真实影响：
  - `retained_fields`
  - `summary_text` section selection
- prompt / assistant metadata / debug metadata / harness 全部已接上

结论：

- `P3-2` 已从“有 retention 名字”推进到“真实保留策略”
- 已接近完成

### P3-3 Knowledge scope materialization

状态：

- **接近完成**

当前已成立：

- `KnowledgeScopeLayer`
  - `project`
  - `world`
  - `general`
  已成为正式 contract
- knowledge summary 已稳定产出：
  - `count`
  - `scope_layers`
  - `scope_counts`
- prompt 已开始按 scope 显式标出：
  - `[project/... ]`
  - `[world/... ]`
- prompt selection 已开始受：
  - scope priority
  - `activeNamespace.primary_layer`
  共同影响
- 当前最小规则已成立：
  - `project -> world -> general`
  - `world -> project -> general`
- harness 已开始锁：
  - summary 中保留 `project / world / general`
  - prompt budget 中的 scope priority
  - world-primary 下的排序切换

结论：

- `P3-3` 已不再只是“能区分 knowledge scope”
- 已推进到接近完成

### P3-4 Scenario pack expansion point v1

状态：

- **接近完成**

当前已成立：

- 第二个内建 pack：
  - `project_ops`
  已存在
- `resolveActiveScenarioMemoryPack(...)` 已开始同时考虑：
  - `activeNamespace.primary_layer`
  - `relevantKnowledge`
- 当前最小规则已成立：
  - 默认路径仍是 `companion`
  - `project` primary namespace 下切到 `project_ops`
  - 即使 `world` primary，只要 `project` knowledge 占主导，也可切到 `project_ops`
- runtime prompt / assistant metadata / debug metadata 已承接 pack 切换
- harness 已开始锁：
  - 默认 `companion`
  - project namespace -> `project_ops`
  - world-primary + project knowledge -> `project_knowledge_priority`
- `apps/web/lib/chat/memory-knowledge.ts` 当前也已开始让 knowledge prompt budget 受 `activePackId` 影响
- 当前最小规则已成立：
  - `companion` 继续使用更紧的 knowledge budget，只保留 `project / world`
  - `project_ops` 在 `project / world` 优先的前提下，可在预算允许时额外带入一条 `general` knowledge
- `apps/web/lib/chat/runtime.ts` 当前也已开始把 active scenario pack 传入 knowledge prompt section，使 pack 选择开始真实影响 knowledge 消费预算
- harness 当前也已开始显式校验：
  - `project_ops` prompt 会带入 `General reply policy`
  - `companion` prompt 仍不会带入 `General reply policy`

结论：

- `P3-4` 已越过“只有第二个 pack 存在”的阶段
- 当前已经从 pack 选择推进到 pack-specific knowledge budget
- 已可视为接近完成

### P3-5 regression / acceptance expansion

状态：

- **第一版已成立**

当前已成立：

- `memory-upgrade-harness.ts` 已开始显式产出：
  - `p3_regression_gate`
- 当前第一版 `P3` gate 已开始锁：
  - `namespace_recall_ok`
  - `namespace_write_boundary_ok`
  - `retention_strategy_ok`
  - `knowledge_scope_ok`
  - `scenario_pack_ok`
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

结论：

- `P3-5` 已不再只是零散断言集合
- 已可视为第一版成立

---

## 4. 当前最值得关注的剩余项

当前真正还值得继续处理的，不是重新开新主题，而是：

1. `P3-5` 是否需要再补一层更正式的 close gate 表达
2. 当前是否已经适合准备：
   - `P3 close note`

---

## 5. 当前结论

当前 `Memory Upgrade P3` 的状态不是“已经完成”，但已经进入：

- **可以准备 close-readiness 判断**

更准确地说：

- `P3-1`：接近完成
- `P3-2`：接近完成
- `P3-3`：接近完成
- `P3-4`：接近完成
- `P3-5`：第一版已成立

当前这轮复盘已经完成，下一步更合理的不是继续发散做新主题，而是：

- 判断是否已经可以开始准备 `P3 close note`
