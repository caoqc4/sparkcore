# Memory Upgrade P5 Close Readiness v1.0

## 1. 评估定位

本文档用于在 `P5` 进入中后段后，对当前阶段是否已接近 `close-ready` 做一次正式复盘。

它不等于：

- `P5 close note`
- 下一阶段执行文档
- 全量尾项清理清单

它的目的只有一个：

- 判断 `P5-1 ~ P5-5` 当前分别推进到了什么程度
- 判断 `P5` 是否已经进入 `close-readiness` 前置区间
- 判断还差的是“最后 1-2 刀”，还是仍需要继续推进主线

---

## 2. 当前分项状态

### 2.1 `P5-1 Namespace multi-budget routing`

当前判断：

- **中段**

当前已经成立的事实：

- namespace boundary 已不再只有单层 recall budget
- `parallel_timeline_budget` 已进入真实 recall 行为
- `write_priority_layer / fallback_write_boundary` 已进入真实 write 路由
- `retrieval_route_order / write_fallback_order` 已进入 recall 和 write target resolution 主路径

当前还没完全走到“接近完成”的原因：

- 这条线虽然已经从 helper 推到了真实 route/order/budget 组合
- 但还没有形成更完整的多层 fallback/budget 组合策略

所以当前更适合定义成：

- 主骨架已成立
- 但仍属于 `P5` 中段主线，而不是收口项

### 2.2 `P5-2 Retention layering / pruning strategy v3`

当前判断：

- **中后段**

当前已经成立的事实：

- `retention_layers`
- `retention_layer_budget`
- `retention_section_order`
- `retention_section_weights`

而且这些已经真实影响：

- `retained_fields`
- summary section composition
- keep/drop decision
- assistant metadata / debug metadata
- harness

这条线目前已经明显超过“起步成立”，并且开始进入：

- layered pruning strategy 真正成为系统事实

当前仍未直接定义成“接近完成”，是因为：

- 还没有进一步压成更完整的阶段收口判断

### 2.3 `P5-3 Knowledge route weighting v3`

当前判断：

- **中段**

当前已经成立的事实：

- knowledge selection 已进入显式 weighting：
  - `scope_weight`
  - `namespace_weight`
  - `pack_weight`
  - `total_weight`
- pack 侧已开始显式暴露：
  - `knowledge_route_weight`
  - `knowledge_budget_weight`

而且这些已经进入：

- prompt
- assistant metadata
- debug metadata
- harness

这说明 `P5-3` 已经从隐式排序推进到了真实 runtime-visible weighting。

但它当前仍更像：

- 稳定中段

还没有到“只差最后一刀”的状态。

### 2.4 `P5-4 Scenario pack strategy layer v3`

当前判断：

- **中段偏后**

当前已经成立的事实：

- `resolveScenarioMemoryPackStrategy(...)`
- `strategy_bundle_id`
- `layer_budget_bundle`
- `dynamic_profile_strategy`
- `memory_record_priority_order`
- `assembly_layer_order`

而且这条线现在已经真实影响：

- relationship/static_profile/memory_record budget
- dynamic_profile coexist/suppress
- memory_record subtype priority
- memory layer prompt assembly order
- assistant/debug metadata 可见性
- `P5` harness gate

这意味着 `P5-4` 已经从“pack-specific behavior scattered in runtime”推进成了：

- 可复用的 strategy layer
- 可观测的 strategy layer
- 可回归校验的 strategy layer

但它当前仍然更像：

- 中段偏后，并开始接近“再补最后一刀就可进入收口判断”的区间

而不是已经可直接收口。

### 2.5 `P5-5 regression / acceptance expansion`

当前判断：

- **第一版已成立，并已开始进入更像正式阶段 gate 的形态**

当前已经成立的事实：

- `memory-upgrade-harness` 已显式产出 `p5_regression_gate`
- 当前 gate 已开始锁：
  - `namespace_multi_budget_routing_ok`
  - `retention_layering_v3_ok`
  - `knowledge_route_weighting_v3_ok`
  - `strategy_metadata_consistency_v3_ok`
  - `scenario_pack_strategy_v3_ok`
- 当前也已提供：
  - `checks_passed`
  - `checks_total`
  - `failed_checks`
  - `all_green`
  - `close_candidate`

更关键的是：

- `scenario_pack_strategy_v3_ok` 已不再只锁 prompt 文案
- 现在也已开始锁：
  - assistant metadata
  - runtime debug metadata
  - prompt
  的三面一致

这说明 `P5-5` 已经不是“harness 雏形”，而是：

- 一版明确可运行、并已开始具备阶段聚合判断能力的 gate

---

## 3. 当前整体判断

如果把 `P5` 当前状态压成一句话：

**`P5` 已进入更明确的中后段，并已达到可进入正式 `close-ready` 判断的节点。**

如果给整体进度一个量化判断：

- **约 `85%`**

这个判断的依据是：

- `P5-1 ~ P5-4` 都已经有真实代码事实
- `P5-5` 也已经不再只是雏形，而是更像正式阶段 gate 的第一版
- `P5-4` 现在已足够支撑阶段收口，不需要再专门补最后一刀
- 当前剩余项已经更像非阻塞尾项，而不是主目标缺口

所以当前最准确的定义不是：

- `P5 仍在前置区间`

而是：

- **`P5 close-ready / 可收官`**

---

## 4. 还差什么

当前剩余项已经不再构成主阻塞，主要属于两类：

### 4.1 Gate strengthening

当前 gate 已经成立，并且已经足以支撑 `P5` close-ready 判断。

后续仍可继续补强：

- 更完整的阶段级聚合判断
- 更多跨 metadata / prompt / runtime event 的一致性校验

### 4.2 深化型尾项

`P5-4` 当前虽然还可以继续深化，但这些深化已经更像：

- strategy layer 的增强项
- 后续 phase 吸收项
- 或 tail cleanup batch

---

## 5. 当前建议

当前最合理的下一步是：

1. 正式写出 `P5 close note`
2. 从 `P5` 主施工切到下一阶段规划
3. 将剩余项纳入 tail / gate strengthening backlog

当前已经可以直接进入 `P5 close note`。

原因是：

- `P5` 主目标已成立
- `P5-5` 已足以支撑阶段 close-ready 判断
- 剩余事项不再构成主阻塞

一句话结论：

**`P5` 已达到 close-ready，可以正式写 `P5 close note`。**
