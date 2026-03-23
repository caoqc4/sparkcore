# SparkCore Memory Upgrade P4 Close Readiness v1.0

## 1. 文档定位

本文档用于在 `P4` 进入中后段后，明确：

- `P4-1 ~ P4-5` 当前各自处于什么状态
- 哪些已经可以视为基本成立
- 哪些还差最后几刀才能进入收口判断
- 当前是否已经适合准备 `P4 close note`

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p4_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_execution_plan_v1.0.md) 的阶段性收口复盘
- 对当前 `P4` 代码事实的压缩判断

---

## 2. 当前总体判断

当前 `Memory Upgrade P4` 已从中段推进到更明确的中后段，并开始进入更清晰的 close-readiness 前置区间。

当前总判断：

- `P4-1 ~ P4-2` 已不再只是 budget / boundary 名字，而开始进入真实 route、target、pruning 与 keep-drop 行为
- `P4-3` 已不再只是 knowledge snippet 选择，而开始进入 pack-level route / assembly influence 及其 rationale
- `P4-4` 已不再只是单条 pack-specific 差异，而已进入跨 layer、跨 subtype 的真实 consumption 差异
- `P4-5` 已不再只是零散断言，而已成立第一版阶段聚合 gate

当前整体完成度评估：

- **约 80%**

---

## 3. P4-1 ~ P4-5 当前状态

### P4-1 Namespace retrieval / write boundary v2

状态：

- **中段**

当前已成立：

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

结论：

- `P4-1` 已经越过 seam 阶段
- 但仍停在中段，尚未进入接近完成

### P4-2 Retention budget / pruning v2

状态：

- **中段**

当前已成立：

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

结论：

- `P4-2` 已经从“有 budget”推进到“真实 pruning 行为”
- 但仍更像中段，不适合现在直接收口

### P4-3 Knowledge route influence v2

状态：

- **中后段**

当前已成立：

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

结论：

- `P4-3` 已不再只是“knowledge 影响 snippet 选择”
- 已进入中后段

### P4-4 Scenario pack consumption expansion v2

状态：

- **中后段**

当前已成立：

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

结论：

- `P4-4` 已经不只是“有几条 pack-specific 预算差异”
- 已推进到跨 layer、跨 subtype 的真实消费差异
- 已进入中后段

### P4-5 regression / acceptance expansion

状态：

- **第一版已成立**

当前已成立：

- `memory-upgrade-harness.ts` 已开始显式产出：
  - `p4_regression_gate`
- 当前第一版 `P4` gate 已开始锁：
  - `namespace_boundary_v2_ok`
  - `retention_budget_v2_ok`
  - `knowledge_route_influence_v2_ok`
  - `scenario_pack_consumption_v2_ok`
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

结论：

- `P4-5` 已不再只是零散断言集合
- 已可视为第一版成立

---

## 4. 当前最值得关注的剩余项

当前真正还值得继续处理的，不是重新开新主题，而是：

1. `P4-1 / P4-2` 是否还需要最后 1-2 刀，才能从中段推到更接近完成
2. `P4-5` 是否需要再补一层更正式的 close gate 表达
3. 当前是否已经适合准备：
   - `P4 close note`

---

## 5. 当前结论

当前 `Memory Upgrade P4` 的状态不是“已经完成”，但已经进入：

- **可以开始准备 close-readiness 判断**

更准确地说：

- `P4-1`：中段
- `P4-2`：中段
- `P4-3`：中后段
- `P4-4`：中后段
- `P4-5`：第一版已成立

当前这轮复盘已经完成，下一步更合理的不是继续盲推单点，而是：

- 判断是否还需要最后 1-2 刀收口
- 或直接准备 `P4 close note`
