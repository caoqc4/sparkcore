# SparkCore Memory Upgrade P0 Close Readiness v1.0

## 1. 文档定位

本文档用于在 P0 进入后半段后，明确：

- `P0-1 ~ P0-7` 当前各自处于什么状态
- 哪些已经可以视为基本成立
- 哪些还差最后一刀才能进入收口判断
- 当前是否已经适合准备 `P0 close note`

本文档不是新的执行方案，也不是新的 issue 列表，而是：

- 对 [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md) 的阶段性收口复盘
- 对 [memory_upgrade_p0_issue_draft_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p0_issue_draft_v1.0.md) 的状态压缩

---

## 2. 当前总体判断

当前 `Memory Upgrade P0` 已进入后半段，并开始接近可准备收口的区间。

当前总判断：

- `P0` 主骨架已经成立
- 主要语义边界已经稳定
- `P0-4` 的阶段定义已收口
- `P0-7` 已具备最小可执行 gate
- 剩余项已经从“搭骨架”转向“最后几刀的收口判断”

当前整体完成度评估：

- **约 85%**

---

## 3. P0-1 ~ P0-7 当前状态

### P0-1 核心 record 定稿

状态：

- **基本完成**

当前已成立：

- `packages/core/memory/records.ts` 已存在正式 core record types
- `apps/web/lib/chat/memory-records.ts` 已存在 legacy -> 新 record 的最小 adapter
- `StaticProfileRecord`
- `MemoryRecord`
- `ThreadStateRecord`
- `MemoryRelationRecord`

剩余尾项：

- `DynamicProfileRecord` 仍保持保守占位，未在 P0 内扩成真实主路径

结论：

- 不阻塞 P0 收口
- 可在 P0 close 时视为基本成立

### P0-2 Profile / ThreadState / Memory 边界落地

状态：

- **基本完成**

当前已成立：

- `profile / preference -> static_profile`
- `relationship -> memory_record`
- `goal -> thread_state_candidate`
- `goal` 未被误塞进 `DynamicProfile`

结论：

- 边界已经稳定
- 可视为 P0 已达目标

### P0-3 Write Pipeline v1

状态：

- **大体完成**

当前已成立：

- `record_target` 分类
- `memory-write-targets.ts`
- `memory-write-record-candidates.ts`
- `memory-write-rows.ts`
- `StaticProfileRecord` candidate
- `MemoryRecord` relationship candidate
- `goal -> ThreadState.focus_mode` 最小真实 commit

剩余尾项：

- 仍主要是“新语义组织下的 legacy 承载”，还不是完全迁出的新存储层

结论：

- 对 P0 来说已足够成立

### P0-4 Retrieval Router v1

状态：

- **接近完成**

当前已成立：

- `MemoryRecallRoute`
- `appliedRoutes`
- `profile` 为真实 route
- `thread_state` 为真实 route

当前已收口定义：

- `profile / thread_state` 是 P0 的真实 retrieval routes
- `episode / timeline` 在 P0 内保留为正式 contract，真实实现后移到 P1

结论：

- 这一项此前最摇摆
- 现在已通过边界澄清进入可收口区间

### P0-5 Context Assembly v1

状态：

- **大体完成**

当前已成立：

- `profile_snapshot` 已进入 runtime / assistant metadata
- `thread_state` 最小摘要已进入 runtime / assistant metadata
- `memory.semantic_summary` 已进入 runtime / assistant metadata
- `chat-thread-view` 已开始消费这些摘要
- runtime system prompt 已开始直接承接：
  - 最小 `thread_state` 摘要
  - 最小 `memory.semantic_summary`

结论：

- 已不只停在 summary / metadata 层
- 已进入真实 prompt/context assembly

### P0-6 legacy `memory_items` 兼容迁移策略

状态：

- **完成度较高，但仍在进行中**

当前已成立：

- legacy semantic target classifier
- recall 过滤
- preview / card / visibility 可视化
- 管理动作 metadata 标注
- planner metadata 标注

剩余尾项：

- 还需要一次最终判断：
  - 当前这套 semantic target / migration 策略，是否已经足够稳定到可以视为 P0 成立

结论：

- 这是当前最像“还差最后一刀判断”的一项

### P0-7 验收与回归 Gate

状态：

- **已成立第一版**

当前已成立：

- 功能 gate
- 结构 gate
- 回归 gate
- `memory-upgrade-harness.ts`

当前 harness 已锁住：

- semantic target classifier
- record candidate adapter
- runtime `memory.semantic_summary`
- assistant metadata semantic summary reader
- runtime system prompt `thread_state` 注入
- runtime system prompt `memory.semantic_summary` 注入

结论：

- 已经不只是文档标题
- 已具备最小可执行 gate

---

## 4. 当前最值得关注的剩余项

当前真正还值得继续处理的，不是再发散做新能力，而是：

1. `P0-6` 最终收口判断  
2. `P0-7` 是否已经足够支撑正式 `P0 close` 判断  
3. 是否还需要最后一刀小代码，来补齐当前 gate 中最薄的一项

---

## 5. 当前结论

当前 `Memory Upgrade P0` 的状态不是“已经完成”，但已经进入：

- **可以准备收口判断**

更准确地说：

- `P0-1`：基本完成
- `P0-2`：基本完成
- `P0-3`：大体完成
- `P0-4`：接近完成
- `P0-5`：大体完成
- `P0-6`：高完成度进行中
- `P0-7`：第一版已成立

当前最合理的下一步不是继续盲推新点，而是：

- 围绕 `P0-6 / P0-7` 做最后一轮收口判断
- 再决定是否需要补最后一刀代码
- 然后准备 `P0 close note`
