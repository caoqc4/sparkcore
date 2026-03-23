# SparkCore Memory Upgrade P4 Close Note v1.0

## 1. 文档定位

本文档用于正式记录：

- `Memory Upgrade P4` 当前已达到什么程度
- 为什么可以视为进入 `close-ready / 可收官`
- 当前仍剩哪些尾项
- 下一阶段建议如何继续推进

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p4_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_readiness_v1.0.md) 的正式收官判断
- 对当前 `P4` 代码事实和阶段边界的定稿说明

---

## 2. 当前结论

**`Memory Upgrade P4` 已达到 `close-ready / 可收官`。**

更准确地说：

- `P4` 的主目标已经成立
- `P4-1 ~ P4-5` 都已有真实代码事实，而不再只是执行文档里的方向描述
- 当前剩余项已进入：
  - 非阻塞尾项
  - 后续增强项
  - 下一阶段可继续深化的边界

因此：

**项目可以把 `P4` 正式视为阶段性收官，并把重心切到下一阶段规划或少量 tail cleanup。**

---

## 3. 已成立的 P4 主目标

### 3.1 Namespace retrieval / write boundary v2 已成立主路径

- `resolveRuntimeMemoryBoundary(...)` 已显式产出：
  - `retrieval_boundary`
  - `write_boundary`
  - `allow_timeline_fallback`
- thread-primary namespace 下：
  - recall route 会关闭 `timeline` fallback
  - `thread_state,profile,episode,timeline` 会收紧成 `thread_state,profile,episode`
- target resolver 已统一复用 namespace boundary helper
- write routing 已开始显式产出：
  - `routedProjectId`
  - `routedWorldId`
- namespace boundary 已开始显式产出：
  - `profile_budget`
  - `episode_budget`
  - `timeline_budget`
- recall 主路径已开始按 namespace budget 选 recall 结果

### 3.2 Retention budget / pruning v2 已进入真实 pruning 行为

- `retention_budget` 已进入正式 contract
- 当前最小 budget 已成立：
  - `focus_anchor = 2`
  - `continuity_anchor = 2`
  - `recent_window = 3`
  - `minimal = 1`
- budget 已开始真实影响：
  - `retained_fields`
  - summary section composition
  - keep/drop decision
- 当前最小规则已成立：
  - `focus_anchor` 会把保留字段从三项收紧到两项
  - `current_language_hint` 只有在 survives pruning 时才会进入 summary
  - `paused + minimal_context + retention_budget <= 1` 的 compaction summary 会被主动丢弃

### 3.3 Knowledge route influence v2 已成立更高一层决策事实

- knowledge scope 已会影响 prompt selection priority
- `world` knowledge 已会真实改写 active pack 的有效：
  - `preferred_routes`
  - `assembly_order`
- 当前已显式产出：
  - `knowledge_priority_layer`
  - `assembly_emphasis`
  - `route_influence_reason`
- 这层决策已进入：
  - prompt
  - assistant metadata
  - debug metadata
  - metadata reader
  - harness

### 3.4 Scenario pack consumption expansion v2 已进入跨 layer 消费差异

- `scenario pack` 已真实影响 relationship memory 消费预算：
  - `companion` 最多 2 条
  - `project_ops` 最多 1 条
- `scenario pack` 已真实影响 `static_profile` 消费预算：
  - `companion` 最多 2 条
  - `project_ops` 最多 1 条
- `scenario pack` 已真实影响 `memory_record` 消费预算：
  - `project_ops` 最多 2 条
  - `companion` 最多 1 条
- `scenario pack` 已真实影响 `dynamic_profile` 与 `memory_record` 的并存优先级：
  - `project_ops` 会压低 `dynamic_profile`
  - `companion` 允许并存
- `scenario pack` 已真实影响 `memory_record` 内部的 subtype selection priority：
  - `project_ops` 优先 `timeline -> episode`
  - `companion` 优先 `episode -> timeline`

### 3.5 P4 regression / acceptance expansion 已成立第一版

- `memory-upgrade-harness.ts` 已开始显式产出：
  - `p4_regression_gate`
- 当前第一版 `P4` gate 已开始锁：
  - `namespace_boundary_v2_ok`
  - `retention_budget_v2_ok`
  - `knowledge_route_influence_v2_ok`
  - `scenario_pack_consumption_v2_ok`
- 这层 gate 当前也已开始把 `P4-4` 里更完整的 pack-specific consumption 差异锁进同一组阶段级断言：
  - relationship slot budget
  - static_profile slot budget
  - memory_record subtype priority
  - dynamic_profile coexistence rule
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

---

## 4. 为什么现在可以收官

`P4` 之所以可以收官，不是因为 namespace / retention / knowledge / pack 都已经做满，而是因为：

1. **四条主线都已经进入真实作用面**
   - namespace 已开始真实影响 retrieval boundary、write boundary 与 recall budget
   - retention 已开始真实影响 pruning 和 keep/drop
   - knowledge 已开始真实影响 route / assembly 决策
   - scenario pack 已开始真实影响跨 layer、跨 subtype 的消费差异

2. **至少一条完整消费链已经成立**
   - 不再只是 metadata 可见
   - 而是已经进入：
     - runtime prompt
     - retrieval / selection
     - write routing
     - pruning / keep-drop
     - pack-specific slot control

3. **回归面已经能守住 P4 的新增事实**
   - 不是只验证类型存在
   - 而是已经验证：
     - namespace boundary v2
     - retention budget v2
     - knowledge route influence v2
     - scenario pack consumption v2

也就是说，当前剩余工作不再决定：

- `P4` 能不能成立

而更多决定：

- `P4` 之后哪条线继续深化最值

---

## 5. 当前剩余项的性质

当前剩余项主要包括：

- namespace boundary 再往更复杂的 retrieval / write routing 深化
- retention budget 再往更细的 budget / field 组合深化
- knowledge route influence 再往更复杂的 route weighting / budget 深化
- scenario pack consumption 再扩到更多 layer 或更复杂的 budget 差异
- 更正式的 `P4` close gate 扩展

这些项的性质是：

- **非阻塞尾项**
- **后续增强项**
- **下一阶段输入**

它们不是：

- `P4` 阶段能否成立的前置阻塞

---

## 6. 下一步建议

当前最合理的下一步有两种：

### 6.1 直接进入下一阶段规划

如果继续沿记忆升级主线推进，建议下一步直接进入：

- `P5` 的执行文档 / 第一批任务拆解

优先考虑的方向：

- namespace boundary 再向更完整的 route / budget / scope 规则深化
- retention 向更明确的 multi-budget / pruning strategy 深化
- knowledge 向更深的 route weighting / context budget 作用深化
- scenario pack 向更真实的消费策略与扩展点深化

### 6.2 少量 tail cleanup 后再切阶段

如果想让当前仓库再更平一点，也可以只做少量尾项清扫：

- 补更正式的 `P4` gate 表达
- 收少数边角读写路径
- 再进行下一阶段切换

但这不应阻塞阶段转换。

---

## 7. 最终判断

**`Memory Upgrade P4` 已达到 `close-ready / 可收官`。**

当前剩余项已属于：

- 非阻塞尾项
- 后续增强项
- 下一阶段输入

因此，项目可以正式把 `P4` 视为阶段性收官，并进入下一阶段。 
