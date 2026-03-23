# SparkCore Memory Upgrade P3 Close Note v1.0

## 1. 文档定位

本文档用于正式记录：

- `Memory Upgrade P3` 当前已达到什么程度
- 为什么可以视为进入 `close-ready / 可收官`
- 当前仍剩哪些尾项
- 下一阶段建议如何继续推进

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p3_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_close_readiness_v1.0.md) 的正式收官判断
- 对当前 `P3` 代码事实和阶段边界的定稿说明

---

## 2. 当前结论

**`Memory Upgrade P3` 已达到 `close-ready / 可收官`。**

更准确地说：

- `P3` 的主目标已经成立
- `P3-1 ~ P3-5` 都已有真实代码事实，而不再只是文档上的高阶方向
- 当前剩余项已进入：
  - 非阻塞尾项
  - 后续增强项
  - 下一阶段可继续深化的边界

因此：

**项目可以把 `P3` 正式视为阶段性收官，并把重心切到下一阶段规划或少量 tail cleanup。**

---

## 3. 已成立的 P3 主目标

### 3.1 Namespace boundary expansion 已接近完成

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
- runtime preview / `memory_write_planned` event / harness 都已消费这层 namespace-aware routing

### 3.2 Thread retention strategy v1 已接近完成

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

### 3.3 Knowledge scope materialization 已接近完成

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
- harness 已开始锁：
  - summary 中保留 `project / world / general`
  - prompt budget 中的 scope priority
  - world-primary 下的排序切换

### 3.4 Scenario pack expansion point v1 已接近完成

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
- pack selection 已不只影响 metadata / prompt 标题
- `project_ops` 当前也已开始真实影响 knowledge prompt budget：
  - `companion` 继续只保留 `project / world`
  - `project_ops` 可在预算允许时额外带入一条 `general` knowledge
- harness 已开始锁：
  - 默认 `companion`
  - project namespace -> `project_ops`
  - world-primary + project knowledge -> `project_knowledge_priority`
  - `project_ops` prompt 会带入 `General reply policy`
  - `companion` prompt 不会带入 `General reply policy`

### 3.5 P3 regression / acceptance expansion 已成立第一版

- `memory-upgrade-harness.ts` 已开始显式产出：
  - `p3_regression_gate`
- 当前第一版 `P3` gate 已开始锁：
  - `namespace_recall_ok`
  - `namespace_write_boundary_ok`
  - `retention_strategy_ok`
  - `knowledge_scope_ok`
  - `scenario_pack_ok`
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

---

## 4. 为什么现在可以收官

`P3` 之所以可以收官，不是因为 namespace / retention / knowledge / pack 都已经做满，而是因为：

1. **高阶边界已经从 seam 推进到真实作用面**
   - namespace 已开始真实影响 recall / write / scope routing
   - retention 已开始真实影响 keep/drop 与 retained section selection
   - knowledge scope 已开始真实影响 prompt selection priority
   - scenario pack 已开始真实影响 pack selection 与 knowledge prompt budget

2. **至少一条真实消费链已经成立**
   - 不再只是 metadata 可见
   - 而是已经进入：
     - runtime prompt
     - write target resolution
     - retrieval / filtering
     - prompt budget selection

3. **回归面已经能守住 P3 的新增事实**
   - 不是只验证类型存在
   - 而是已经验证：
     - namespace recall / write boundary
     - retention strategy
     - knowledge scope priority
     - scenario pack selection

也就是说，当前剩余的工作不再决定：

- `P3` 能不能成立

而更多决定：

- `P3` 之后要继续把哪条线做深

---

## 5. 当前剩余项的性质

当前剩余项主要包括：

- namespace 再往更多 retrieval / write boundary 扩展
- retention strategy 继续深化到更细的 budget / retained-fields 组合
- knowledge scope 再往更深的 retrieval / route 面推进
- scenario pack 扩展点继续做深
- 更正式的 `P3` close gate 扩展

这些项的性质是：

- **非阻塞尾项**
- **后续增强项**
- **下一阶段输入**

它们不是：

- `P3` 阶段能否成立的前置阻塞

---

## 6. 下一步建议

当前最合理的下一步有两种：

### 6.1 直接进入下一阶段规划

如果继续沿记忆升级主线推进，建议下一步直接进入：

- `P4` 的执行文档 / 第一批任务拆解

优先考虑的方向：

- namespace 向更完整的 retrieval / write boundary 深化
- retention 向更明确的 budget / pruning strategy 深化
- knowledge 与 project/world/general 的更深层 route 作用
- scenario pack 的更真实扩展与差异化消费

### 6.2 少量 tail cleanup 后再切阶段

如果想让当前仓库再更平一点，也可以只做少量尾项清扫：

- 补更正式的 `P3` gate 表达
- 收少数边角读写路径
- 再进行下一阶段切换

但这不应阻塞阶段转换。

---

## 7. 最终判断

**`Memory Upgrade P3` 已达到足以收官的程度。**

当前剩余项属于：

- 非阻塞尾项
- 后续增强项

因此项目可以正式认为：

**`P3` 已完成到可收官程度，可以切入下一阶段。**
