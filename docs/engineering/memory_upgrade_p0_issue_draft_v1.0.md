# SparkCore 记忆层升级 P0 Issue 草案 v1.0

## 1. 文档定位

本文档用于把 `memory_upgrade_execution_plan_v1.0.md` 进一步压成可进入 GitHub / Linear 的第一批 P0 issue 草案。

当前原则：

- 先服务执行，不先追求完整项目管理体系
- issue 以当前代码现实为边界
- 先拆主 issue，不先拆过细子任务

---

## 2. P0 主 Issue 列表

### P0-1 核心 record 定稿

建议 issue 标题：

- `P0-1 Finalize core memory/profile/thread-state record types`

目标：

- 正式引入 `MemoryRecord`
- 正式引入 `StaticProfileRecord`
- 正式引入 `DynamicProfileRecord`
- 正式引入 `MemoryRelationRecord`
- 建立 legacy row -> 新 record 的最小适配层

当前状态：

- 进行中
- 已有：
  - `packages/core/memory/records.ts`
  - `apps/web/lib/chat/memory-records.ts`
  - legacy -> `StaticProfileRecord` / `MemoryRecord` 最小 adapter

依赖：

- 无

候选涉及模块：

- `packages/core/memory/records.ts`
- `apps/web/lib/chat/memory-records.ts`
- `packages/core/memory/example.ts`

验收：

- 新 record 类型已成为正式代码对象
- 有最小 legacy 适配入口
- `typecheck` 通过

### P0-2 Profile / ThreadState / Memory 边界落地

建议 issue 标题：

- `P0-2 Lock profile, thread-state, and memory boundary mapping`

目标：

- 明确 `StaticProfile` / `DynamicProfile` / `ThreadState` / `MemoryRecord` 的迁移边界
- 把 legacy `goal` 默认归入 `ThreadState` 迁移候选
- 避免 `DynamicProfile` 与 `ThreadState` 污染

候选涉及模块：

- `apps/web/lib/chat/thread-state.ts`
- `apps/web/lib/chat/memory-records.ts`
- `apps/web/lib/chat/memory-write-targets.ts`
- `apps/web/lib/chat/memory-write-record-candidates.ts`
- `docs/engineering/memory_upgrade_execution_plan_v1.0.md`

当前状态：

- 进行中
- 已有：
  - `goal -> thread_state_candidate`
  - `profile / preference -> static_profile`
  - `relationship -> memory_record`

依赖：

- `P0-1`

验收：

- 边界在代码和执行文档里一致
- 不再出现把当前线程进行态直接塞进 `DynamicProfile` 的实现

### P0-3 Write Pipeline v1

建议 issue 标题：

- `P0-3 Implement memory write pipeline v1`

目标：

- 把现有 memory write 逻辑升级成：
  - extraction
  - classification
  - scope resolution
  - update / invalidation
  - commit

候选涉及模块：

- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory-write-targets.ts`
- `apps/web/lib/chat/memory-write-record-candidates.ts`
- `apps/web/lib/chat/memory-write-rows.ts`
- `apps/web/lib/chat/memory-v2.ts`
- `apps/web/lib/chat/memory-item-persistence.ts`
- `apps/web/lib/chat/thread-state-repository.ts`

当前状态：

- 进行中
- 已有：
  - `record_target` classification
  - `StaticProfileRecord` write candidate
  - `MemoryRecord` relationship candidate
  - `thread_state_candidate` seam
  - `goal -> ThreadState.focus_mode` 最小真实 commit

依赖：

- `P0-1`
- `P0-2`

验收：

- 至少一条主写入链开始以新 record 语义组织
- 支持新增 / 补充 / 覆盖 / 失效的最小闭环

### P0-4 Retrieval Router v1

建议 issue 标题：

- `P0-4 Implement memory retrieval router v1`

目标：

- 把 recall 从单路 helper 提升成四路最小分流：
  - `profile`
  - `episode`
  - `timeline`
  - `thread_state`

候选涉及模块：

- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-records.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`

当前状态：

- 进行中
- 已有：
  - `MemoryRecallRoute`
  - `thread_state` route
  - `profile` 主读路径已开始经过 `StaticProfileRecord`
  - `relationship recall` 已开始经过 `MemoryRecord`

依赖：

- `P0-1`
- `P0-2`

验收：

- runtime 准备阶段能拿到四路最小结果
- 不再只靠单一路径拼凑 recall

### P0-5 Context Assembly v1

建议 issue 标题：

- `P0-5 Implement memory context assembly v1`

目标：

- 把 profile / thread / memory / recent turns 按固定预算注入 runtime

候选涉及模块：

- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/runtime-debug-metadata.ts`
- `apps/web/lib/chat/assistant-message-metadata.ts`
- `apps/web/lib/chat/runtime-assistant-metadata.ts`

当前状态：

- 进行中
- 已有：
  - `thread_state` 最小摘要注入
  - `profile_snapshot` 已进入 runtime / assistant metadata
  - runtime preview 已暴露 `record_targets`

依赖：

- `P0-3`
- `P0-4`

验收：

- runtime 有稳定注入顺序
- debug metadata 能反映最小注入摘要

### P0-6 `memory_items` 兼容迁移策略

建议 issue 标题：

- `P0-6 Define legacy memory_items migration strategy`

目标：

- 定义 legacy 到新语义的映射
- 定义主读路径何时迁移
- 定义是否需要有限双写

候选涉及模块：

- `apps/web/lib/chat/memory-item-read.ts`
- `apps/web/lib/chat/memory-item-persistence.ts`
- `apps/web/lib/chat/memory-records.ts`
- `docs/engineering/memory_upgrade_execution_plan_v1.0.md`

当前状态：

- 进行中
- 当前已具备：
  - legacy semantic target classifier
  - profile / relationship recall 过滤
  - chat preview / memory card 可视化
  - memory 管理动作 semantic_target 标注

依赖：

- `P0-1`
- `P0-3`
- `P0-4`

验收：

- 迁移策略不再停留在方向描述
- 有明确的主读路径迁移顺序

### P0-7 验收与回归 Gate

建议 issue 标题：

- `P0-7 Define memory upgrade acceptance and regression gate`

目标：

- 给 P0 建立最小验收门槛

候选涉及模块：

- `docs/engineering/memory_upgrade_execution_plan_v1.0.md`
- `docs/engineering/current_phase_progress_summary_v1.0.md`
- 邻近 smoke / runtime regression 路径

当前状态：

- 进行中
- 当前已具备：
  - 功能 / 结构 / 回归三类 gate 框架
  - 最小功能 gate 草案
  - 最小结构 gate 草案
  - 最小回归 gate 草案
  - `apps/web/scripts/memory-upgrade-harness.ts` 最小回归脚手架
    - semantic target classifier
    - record candidate adapter
    - runtime `memory.semantic_summary`
    - assistant metadata semantic summary reader

依赖：

- `P0-3`
- `P0-4`
- `P0-5`
- `P0-6`

验收：

- 有功能、结构、回归三类检查项
- `typecheck` 与主路径行为回归都被列入 gate
- `memory:upgrade:harness` 可稳定运行
- gate 不只停留在标题级，而已具备最小可执行门槛

---

## 3. 当前建议的执行顺序

建议顺序：

1. `P0-1` 核心 record 定稿
2. `P0-2` 边界落地
3. `P0-3` Write Pipeline v1
4. `P0-4` Retrieval Router v1
5. `P0-5` Context Assembly v1
6. `P0-6` 兼容迁移策略
7. `P0-7` 验收与回归 Gate

---

## 4. 建 issue 时的最小字段建议

每条正式 issue 建议至少包含：

- 标题
- 背景
- 目标
- 当前状态
- 依赖
- 涉及模块
- 完成定义

如果放进 GitHub / Linear，建议额外补：

- `phase: memory-upgrade`
- `priority: p0`
- `track: execution`

---

## 5. 当前一句话状态

- `P0-1` 进行中
- `P0-2` 进行中
- `P0-3` 进行中
- `P0-4` 进行中
- `P0-5` 进行中
- `P0-6` 进行中
- `P0-7` 进行中

---

## 6. 一句话收口

**P0 issue 拆分的目标不是把计划写满，而是保证记忆层升级可以沿着“record -> boundary -> write -> retrieve -> inject -> migrate -> validate”的顺序稳定推进。**
