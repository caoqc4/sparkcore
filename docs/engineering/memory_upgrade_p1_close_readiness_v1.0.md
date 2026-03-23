# SparkCore Memory Upgrade P1 Close Readiness v1.0

## 1. 文档定位

本文档用于在 `P1` 进入中后段后，明确：

- `P1-1 ~ P1-5` 当前各自处于什么状态
- 哪些已经可以视为基本成立
- 哪些还差最后几刀才能进入收口判断
- 当前是否已经适合准备 `P1 close note`

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_p1_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p1_execution_plan_v1.0.md) 的阶段性收口复盘
- 对当前 `P1` 代码事实的压缩判断

---

## 2. 当前总体判断

当前 `Memory Upgrade P1` 已从前中段推进到更明确的中段，并开始接近可准备收口判断的区间。

当前总判断：

- `P1-1 ~ P1-3` 主骨架已经成立
- `P1-4` 已从启动推进到接近可收口
- `P1-5` 已不再只是计划，而已成立第一版回归 gate
- 当前剩余项已从“立主结构”转向“最后几刀收口 + 正式 close gate 判断”

当前整体完成度评估：

- **约 70%**

---

## 3. P1-1 ~ P1-5 当前状态

### P1-1 episode / timeline retrieval

状态：

- **基本完成**

当前已成立：

- `selectMemoryRecallRoutes(...)` 已真实激活：
  - `thread_state`
  - `profile`
  - `episode`
  - `timeline`
- `buildRecalledEpisodeMemoryFromStoredMemory(...)`
- `buildRecalledTimelineMemoryFromStoredMemory(...)`
  已把 legacy `memory_record` 语义转成最小 recalled item
- runtime prompt 已开始在命中：
  - `episode`
  - `timeline`
  时注入 route-aware guidance
- `memory-upgrade-harness.ts` 已开始显式校验：
  - `episode / timeline` adapter
  - `episode / timeline` route selection
  - `episode / timeline` prompt guidance

结论：

- `P1-1` 已不再只是 contract
- 已可视为第一轮目标达成

### P1-2 DynamicProfile 最小真实化

状态：

- **基本完成**

当前已成立：

- `thread_local profile / preference` 已开始从 `thread_state_candidate` 迁移到：
  - `dynamic_profile`
- `buildDynamicProfileRecordFromStoredMemory(...)`
  已开始产出最小 `DynamicProfileRecord`
- dynamic-profile recalled item 已进入：
  - real recall
  - runtime semantic summary
  - system prompt guidance
- UI / summary 侧也已开始支持：
  - `dynamic_profile` semantic layer

结论：

- `P1-2` 的首批最小来源已经立住
- 当前不再需要继续扩来源来证明这条线成立

### P1-3 Context Assembly v2

状态：

- **大体完成**

当前已成立：

- runtime `buildAgentSystemPrompt(...)` 已显式注入：
  - `Context assembly order for this turn`
- 当前最小分层顺序已固定成：
  1. `thread_state`
  2. `dynamic_profile`
  3. `static_profile`
  4. `memory_record`
- `memory.semantic_summary` 与 `thread_state` 不只停在 metadata 层，而已进入真实 prompt
- `memory-upgrade-harness.ts` 已开始校验：
  - `includes_context_assembly_order`
  - `includes_dynamic_profile_order_slot`

结论：

- `P1-3` 已从“能表达语义层”推进到“有明确分层注入顺序”
- 对 `P1` 当前阶段来说已大体成立

### P1-4 legacy read-path tightening

状态：

- **接近完成**

当前已成立：

- `restoreMemory(...)` 已开始复用：
  - `resolveSupportedSingleSlotTarget(...)`
- chat page 的 memory 展示读路径已开始优先走：
  - `getMemoryCategory(...)`
  - `getMemoryScope(...)`
- `memory-records.ts` / `memory-recall.ts` 已开始复用共用 semantic predicate：
  - `isStoredMemoryStaticProfile(...)`
  - `isStoredMemoryDynamicProfile(...)`
  - `isStoredMemoryRelationshipMemoryRecord(...)`
  - `isStoredMemoryGenericMemoryRecord(...)`
- recall applicability 已开始优先走：
  - `getMemoryScope(...)`
- runtime 的 visible / hidden / incorrect / superseded memory list 已开始通过共用 normalizer 生成 canonical displayed record

剩余尾项：

- 仍可能存在少量边角 legacy 读点可继续收紧
- 但当前已不再缺主路径级别的收口事实

结论：

- `P1-4` 已从启动推进到接近可收口
- 继续深挖的边际收益已经开始下降

### P1-5 regression / acceptance expansion

状态：

- **第一版已成立**

当前已成立：

- `memory-upgrade-harness.ts` 已锁住：
  - `episode / timeline` retrieval
  - `dynamic_profile` adapter
  - `context assembly order`
  - runtime semantic summary
  - assistant metadata semantic summary
  - `P1-4` 相关 gate：
    - semantic predicates
    - `resolveSupportedSingleSlotTarget(...)`
- `tsc --noEmit -p apps/web/tsconfig.json` 已作为持续 gate

剩余尾项：

- 还没形成正式 `P1 close gate` 文档
- 还没把当前 gate 压成“收官判断模板”

结论：

- `P1-5` 已不再只是启动
- 已可以视为第一版成立

---

## 4. 当前最值得关注的剩余项

当前真正还值得继续处理的，不是重新开新线，而是：

1. `P1-4` 是否还需要最后一刀边角收口
2. `P1-5` 是否需要再补一层更正式的 close gate 表达
3. 当前是否已经适合准备：
   - `P1 close note`

---

## 5. 当前结论

当前 `Memory Upgrade P1` 的状态不是“已经完成”，但已经进入：

- **可以准备 close-readiness 判断**

更准确地说：

- `P1-1`：基本完成
- `P1-2`：基本完成
- `P1-3`：大体完成
- `P1-4`：接近完成
- `P1-5`：第一版已成立

当前这轮复盘已经完成，下一步更合理的不是继续发散做新主题，而是：

- 评估是否还需要最后 1-2 刀收口
- 或直接准备 `P1 close note`
