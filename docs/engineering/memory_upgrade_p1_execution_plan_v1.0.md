# SparkCore Memory Upgrade P1 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P0 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0` 收官说明
- 完整长期架构总纲
- `P2` 路线图

本文档是：

- `P1` 的第一批实施基线
- 从 `P0` 已成立事实，推进到更完整长期状态系统的执行文档

上层输入：

- [memory_upgrade_p0_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p0_close_note_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P1 的一句话目标

**在 P0 已建立的 `record / boundary / write / retrieve / inject / gate` 最小闭环之上，把 SparkCore 记忆系统推进成“真正可分层检索、可按阶段状态演化、可继续扩到多场景”的长期状态内核。**

---

## 3. P1 与 P0 的分界

P0 已经解决的，是：

- 核心 record 语义立住
- `profile / thread_state` 成为真实主路径
- `memory_items -> semantic_target` 迁移策略不再只是文档
- runtime / assistant metadata / system prompt 已能消费最小语义摘要
- 最小 gate 和 harness 已成立

P1 不再重复做这些基础工作。

P1 重点解决的是：

1. `episode / timeline` 从 contract 变成真实 retrieval 路径
2. `DynamicProfile` 从保守占位变成最小真实对象
3. `context assembly` 从“最小语义摘要”推进到“更明确的分层预算与注入顺序”
4. legacy `memory_items` 与新语义层的关系进一步收紧

---

## 4. P1 首批目标

P1 首批不追求把 v0.2 一次做满，而是先完成以下四件事。

### 4.1 Retrieval Router 扩成真实四路

P0 内：

- `profile`
- `thread_state`

已是主读路径。

P1 首批要做的，是把：

- `episode`
- `timeline`

从正式 route contract 推进成真实读取分支。

最小要求：

- 有明确的 route selection 条件
- 至少有最小 adapter / selector
- `appliedRoutes` 不再只是名义上的四路

### 4.2 DynamicProfile 最小真实化

P0 内：

- `DynamicProfileRecord` 只保留语义位置
- legacy `goal` 保守归入 `ThreadState`

P1 首批要做的，是把一类“非线程级、但阶段性持续存在”的状态正式提升进 `DynamicProfile`。

首批建议只做最小子集，例如：

- 当前阶段偏好变化
- 项目阶段状态
- 持续性但非线程级的 working mode

禁止首批做成大而泛的“什么都能往 DynamicProfile 塞”的容器。

### 4.3 Context Assembly v2

P0 已做到：

- metadata 摘要可见
- chat summary 可见
- system prompt 已消费最小 `thread_state`
- system prompt 已消费最小 `memory.semantic_summary`

P1 首批要做的，是把 context assembly 从“能表达语义层”推进到“按层预算注入”。

最小要求：

- `profile`
- `memory_record`
- `thread_state`
- `episode / timeline`

各自有更明确的注入位置和优先级。

### 4.4 Legacy 读路径继续收紧

P0 主要完成的是：

- legacy row 的 semantic target 定义
- 主路径开始消费新语义

P1 首批要做的，是把更多 legacy 直接读写点继续收紧成：

- 优先走新语义 adapter
- legacy 只保留为底层承载层

---

## 5. P1 明确不做的事项

P1 首批明确不做：

- 不做重图基础设施
- 不做复杂知识层
- 不做 multi-pack 插件系统
- 不做完整多 Agent 共享记忆仲裁
- 不做 API / SDK 外部产品化
- 不做全量历史 backfill

P1 仍然保持：

- 核心语义先行
- 场景扩展后置
- 范围克制

---

## 6. P1 第一批实施顺序

建议顺序：

1. `P1-1 episode / timeline retrieval`
2. `P1-2 dynamic profile minimal activation`
3. `P1-3 context assembly v2`
4. `P1-4 legacy read-path tightening`
5. `P1-5 regression / acceptance expansion`

原因：

- `retrieval` 先补，才能让 `context assembly v2` 有真实输入
- `DynamicProfile` 要在 retrieval 之前至少立出最小对象边界
- 读路径收紧应跟着 retrieval / assembly 一起推进

---

## 7. 模块改动映射

### 7.1 Retrieval

候选模块：

- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-records.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`
- `apps/web/lib/chat/session-context.ts`

### 7.2 DynamicProfile

候选模块：

- `packages/core/memory/records.ts`
- `apps/web/lib/chat/memory-records.ts`
- `apps/web/lib/chat/memory-write-record-candidates.ts`
- `apps/web/lib/chat/memory-write.ts`

### 7.3 Context Assembly

候选模块：

- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/runtime-debug-metadata.ts`
- `apps/web/lib/chat/assistant-message-metadata.ts`
- `apps/web/lib/chat/runtime-assistant-metadata.ts`

### 7.4 Regression

候选模块：

- `apps/web/scripts/memory-upgrade-harness.ts`
- 邻近 runtime / smoke regression 路径

---

## 8. P1 第一批验收标准

P1 首批至少应满足：

- `episode / timeline` 至少有一条真实 retrieval 路径成立
- `DynamicProfile` 至少有一类真实状态进入正式对象层
- runtime context assembly 能按更明确的分层顺序注入
- 新语义路径进一步收紧，legacy 直接暴露继续减少
- `memory-upgrade-harness` 增强后仍稳定通过
- `tsc --noEmit -p apps/web/tsconfig.json` 持续通过

---

## 9. 当前结论

`P1` 不应从抽象规划重新开始，而应直接建立在：

- `P0 close note`
- 当前执行文档
- 当前代码事实

之上推进。

一句话说：

**P1 的任务不是再证明记忆升级值不值得做，而是把 P0 已建立的最小闭环推进成更真实的长期状态系统分层。**
