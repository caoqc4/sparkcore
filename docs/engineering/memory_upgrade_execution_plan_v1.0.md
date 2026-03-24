# SparkCore 记忆层升级执行方案 v1.0

## 1. 文档定位

本文档用于把以下三份指导型文档，压缩成一份可直接进入施工的执行基线：

- `doc_private/SparkCore_产品边界与商业路径_v0.1.md`
- `doc_private/SparkCore_记忆层升级方案_v0.1.md`
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`

本文档不是新的战略文档，也不是完整架构总纲，而是：

- 明确当前代码事实
- 明确 P0 第一批实施范围
- 明确本阶段不做什么
- 明确模块改动映射、验收标准与回退策略

阶段补充：

- 当 P0 进入后半段后，请结合 [memory_upgrade_p0_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p0_close_readiness_v1.0.md) 做收口判断，而不要继续无限扩张 P0 范围
- 当前 P0 收官结论，请以 [memory_upgrade_p0_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p0_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p1_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p1_execution_plan_v1.0.md) 作为执行起点
- 当前 P1 收官结论，请以 [memory_upgrade_p1_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p1_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p2_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p2_execution_plan_v1.0.md) 作为执行起点
- 当前 P2 收官结论，请以 [memory_upgrade_p2_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p2_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p4_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_execution_plan_v1.0.md) 作为执行起点
- 当前 P4 收官结论，请以 [memory_upgrade_p4_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p5_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p5_execution_plan_v1.0.md) 作为执行起点
- 当前 P5 收官结论，请以 [memory_upgrade_p5_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p5_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p6_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p6_execution_plan_v1.0.md) 作为执行起点
- 当前 P6 收官结论，请以 [memory_upgrade_p6_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p6_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p7_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p7_execution_plan_v1.0.md) 作为执行起点
- 当前 P7 收官结论，请以 [memory_upgrade_p7_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p7_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p8_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p8_execution_plan_v1.0.md) 作为执行起点
- 当前 P8 收官结论，请以 [memory_upgrade_p8_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p8_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p9_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p9_execution_plan_v1.0.md) 作为执行起点
- 当前 P9 收官结论，请以 [memory_upgrade_p9_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p9_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p10_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p10_execution_plan_v1.0.md) 作为执行起点
- 当前 P10 收官结论，请以 [memory_upgrade_p10_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p10_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p11_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_execution_plan_v1.0.md) 作为执行起点
- 当 P11 进入 close-readiness 判断区间后，请结合 [memory_upgrade_p11_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_close_readiness_v1.0.md) 做收口判断，而不要继续无限扩张 P11 范围
- 当前 P11 收官结论，请以 [memory_upgrade_p11_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p11_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p12_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_execution_plan_v1.0.md) 作为执行起点
- 当前 P12 收官结论，请以 [memory_upgrade_p12_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p12_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p13_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_execution_plan_v1.0.md) 作为执行起点
- 当前 P13 收官结论，请以 [memory_upgrade_p13_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p13_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p14_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_execution_plan_v1.0.md) 作为执行起点
- 当前 P14 收官结论，请以 [memory_upgrade_p14_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p15_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_execution_plan_v1.0.md) 作为执行起点
- 当前 P15 收官结论，请以 [memory_upgrade_p15_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p16_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_execution_plan_v1.0.md) 作为执行起点
- 当前 P16 收官结论，请以 [memory_upgrade_p16_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p17_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p17_execution_plan_v1.0.md) 作为执行起点
- 当前 P17 收官结论，请以 [memory_upgrade_p17_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p17_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p18_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_execution_plan_v1.0.md) 作为执行起点
- 当前 P18 收官结论，请以 [memory_upgrade_p18_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p19_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_execution_plan_v1.0.md) 作为执行起点
- 当前 P19 收官结论，请以 [memory_upgrade_p19_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p20_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_execution_plan_v1.0.md) 作为执行起点
- 当前 P20 收官结论，请以 [memory_upgrade_p20_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p21_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_execution_plan_v1.0.md) 作为执行起点
- 当前 P21 收官结论，请以 [memory_upgrade_p21_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p22_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p22_execution_plan_v1.0.md) 作为执行起点
- 当前 P22 收官结论，请以 [memory_upgrade_p22_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p22_close_note_v1.0.md) 为准
- 进入下一阶段时，请以 [memory_upgrade_p23_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p23_execution_plan_v1.0.md) 作为执行起点
- 当前 P23 收官结论，请以 [memory_upgrade_p23_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p23_close_note_v1.0.md) 为准
- `P0 ~ P23` 的非阻塞尾项当前已统一收束到 [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)，后续如需处理，请优先按 batch 方式推进，而不要回头阻塞主线

适用阶段：

- 三层重构已 `Phase Close`
- 项目正式进入 Memory Upgrade 第一阶段

---

## 2. 输入文档与执行前提

### 2.1 输入文档

当前执行判断以以下文档为上层依据：

- 战略边界：
  - `doc_private/SparkCore_产品边界与商业路径_v0.1.md`
- 技术基线：
  - `doc_private/SparkCore_记忆层升级方案_v0.1.md`
- 当前实施主基线：
  - `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- 阶段收官说明：
  - `doc_private/SparkCore_三层重构收官说明_v0.1.md`

### 2.2 执行前提

当前默认以下事实已经成立：

- `runtime` 主干已稳定，Web / IM 已统一接入 runtime 主路径
- `thread_state` 已成为真实读写链，不再只是设计草案
- `debug_metadata`、`runtime_events`、`assistant_message.metadata` 已有稳定注入点
- `memory_items` 已有最小统一读写底座
- `messages`、`follow_up`、`session-context` 等邻接模块已完成一轮收口

因此，本阶段不是从零发明一套记忆系统，而是：

**在现有 runtime / thread_state / memory_items 底座上，完成 SparkCore 记忆升级的第一批最小闭环。**

---

## 3. 当前实现现状与可直接依赖的代码事实

### 3.1 `thread_state` 已是正式事实层

当前已成立的代码面包括：

- `apps/web/lib/chat/thread-state.ts`
- `apps/web/lib/chat/thread-state-repository.ts`
- `apps/web/lib/chat/thread-state-supabase-repository.ts`
- `apps/web/lib/chat/thread-state-writeback.ts`

当前能力边界：

- 有独立 `ThreadStateRecord`
- 有默认读取链
- 有最小保存接口 `saveThreadState(...)`
- runtime 回合结束后已会 soft-fail 写回
- 最小摘要已进入 `debug_metadata.thread_state_writeback`
- 已有 `thread_state_writeback_completed` runtime event

结论：

- 本阶段不需要重新发明线程状态层
- 需要做的是把它与新的长期记忆结构协同起来

### 3.2 `memory_items` 已形成最小兼容底座

当前已成立的代码面包括：

- `apps/web/lib/chat/memory-v2.ts`
- `apps/web/lib/chat/memory-item-read.ts`
- `apps/web/lib/chat/memory-item-persistence.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory-recall.ts`

当前现实：

- `memory_items` 仍然是主存储事实层
- 已有：
  - `category`
  - `key`
  - `scope`
  - `stability`
  - `status`
  - `source_refs`
- 已有三类 scope：
  - `user_global`
  - `user_agent`
  - `thread_local`
- 已有状态迁移与 single-slot 语义

结论：

- `memory_items` 不应在 P0 被直接推翻
- 它应被视为：
  - 当前可工作的兼容底座
  - 后续 `MemoryRecord` / `ProfileRecord` 迁移的过渡承载层

### 3.3 `runtime` 已具备注入记忆升级结果的稳定落点

当前可直接依赖：

- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/runtime-debug-metadata.ts`
- `apps/web/lib/chat/assistant-message-metadata.ts`

当前稳定注入点：

- `assistant_message`
- `debug_metadata`
- `runtime_events`
- `memory_write_requests`
- `follow_up_requests`

结论：

- P0 的 memory upgrade 应优先利用现有 runtime 注入面
- 不应另起一套旁路记忆注入体系

---

## 4. 本阶段首批目标（P0）

P0 只做一件事：

**把 SparkCore 的长期记忆从“现有 memory_items + thread_state 的局部能力”推进成“可更新、可分流、可注入的最小状态闭环”。**

更具体地说，P0 必须交付以下五件事：

### 4.1 核心 record 定稿

首批正式定稿并进入工程实现的对象：

- `MemoryRecord`
- `StaticProfileRecord`
- `DynamicProfileRecord`
- `ThreadStateRecord`
- `MemoryRelationRecord`

当前代码事实：

- `packages/core/memory/records.ts` 已新增首版 core record types
- `apps/web/lib/chat/memory-records.ts` 已新增从 `StoredMemory` 到新 record 的最小 adapter
- `apps/web/lib/chat/memory-records.ts` 当前也已开始承接统一的 legacy semantic target classifier
- `StaticProfileRecord` 已开始接住 legacy `profile / preference` 语义
- `DynamicProfileRecord` 当前仍保持克制，不直接承接 legacy `goal`
- 该 classifier 当前也已开始进入 profile / relationship recall 过滤，而不再只停留在 adapter 层
- chat memory preview 当前也已开始暴露 legacy semantic target，可直接观察每条 memory 当前被映射到哪一层
- chat memory 卡片当前也已开始显式展示 semantic target，迁移期语义归属已不只停留在 preview
- chat thread memory visibility 当前也已开始按 semantic target 汇总，可直接看到当前会话里新语义层的大致分布
- `hide / restore / incorrect` 管理动作当前也已开始把 `semantic_target` 写入 metadata
- planner memory metadata 当前也已开始稳定写入 `semantic_target`
- restore 过程里被 supersede 的冲突 row 当前也已开始补写 `semantic_target`

### 4.2 最小写入闭环

首批必须成立：

- candidate extraction
- classification
- scope resolution
- update / invalidation check
- commit

当前代码事实：

- `apps/web/lib/chat/memory-write.ts` 已开始对 planner request 做首版 `record_target` 分类
- `apps/web/lib/chat/memory-write-targets.ts` 已开始承接统一 target resolution
- `apps/web/lib/chat/memory-write-rows.ts` 已开始承接 generic memory 的 insert / update row 组装
- `apps/web/lib/chat/memory-write-record-candidates.ts` 已开始承接 generic `StaticProfileRecord` candidate adapter
- relationship 写入当前也已开始先构造正式 `MemoryRecord` candidate，再进入 single-slot upsert
- `thread_state_candidate` 当前也已开始具备正式 candidate seam、preview 摘要入口与最小真实 commit
- 当前最小分类为：
  - `static_profile`
  - `memory_record`
  - `thread_state_candidate`
- `profile / preference` 当前默认进入 `static_profile`
- `relationship` 当前默认进入 `memory_record`
- legacy `goal` 语义当前保守进入 `thread_state_candidate`，并在具备 `threadId + repository` 时写入 `ThreadState`

### 4.3 最小四路检索

首批必须成立：

- `profile`
- `episode`
- `timeline`
- `thread_state`

P0 收口定义：

- `profile`
- `thread_state`

以上两路是 **P0 内必须成为真实读路径** 的 retrieval routes。

- `episode`
- `timeline`

以上两路在 P0 内保留为 **正式 contract / route name**，但不要求在 P0 内成为真实 recall 实现；其真实分流与读取实现转入 P1。

当前代码事实：

- `apps/web/lib/chat/memory-recall.ts` 已新增 `MemoryRecallRoute`
- `RecallOutcome` 已开始显式暴露 `appliedRoutes`
- `memory_write_planned` runtime event 当前也已开始显式暴露 `record_targets`
- `static_profile` 当前也已开始进入真实 profile recall 主路径，而不再只是停留在 write candidate seam
- `thread_state` route 当前也已开始通过正式 route selection 输入，而不再只在 recall 后补入 `appliedRoutes`
- `static_profile` 当前也已开始进入 runtime metadata 注入层，最小 `profile_snapshot` 已可见
- runtime / assistant metadata 当前也已开始显式暴露最小 `memory.semantic_summary`：
  - `primary_layer`
  - `observed_layers`
- chat runtime summary 当前也已开始消费这层 `memory.semantic_summary`
- `memory-upgrade-harness` 当前也已开始显式校验这层 `memory.semantic_summary`
- 当前已正式收口的 route name 包括：
  - `profile`
  - `episode`
  - `timeline`
  - `thread_state`
- 当前实际已接入的最小 route 为：
  - `profile`
  - `thread_state`
- 因此，`P0-4` 当前的完成标准不是“四路都做成真实 recall”，而是：
  - `profile / thread_state` 成为真实 retrieval routes
  - `episode / timeline` 保持正式 contract，不在 P0 内硬扩实现

### 4.4 最小 context assembly

首批必须把以上四路结果按固定预算注入 runtime，而不是只留在数据层。

当前代码事实：

- `prepareRuntimeMemory(...)` 已开始接收 `threadState`
- runtime memory context 已开始携带最小 `threadStateRecall`
- runtime preview metadata 当前也已开始显式暴露 memory write `record_targets`
- 当前已注入的最小 thread state 摘要包括：
  - `lifecycle_status`
  - `focus_mode`
  - `continuity_status`
  - `current_language_hint`
- `debug_metadata.session.thread_state` 已开始显式暴露该最小摘要
- assistant metadata 当前也已开始显式暴露该最小 `thread_state` 摘要
- assistant metadata read helper 与 chat summary 当前也已开始消费该最小 `thread_state` 摘要
- `buildAgentSystemPrompt(...)` 当前也已开始把最小 `thread_state` 摘要注入真实 system prompt context assembly，而不只停留在 metadata / summary 层
- `buildAgentSystemPrompt(...)` 当前也已开始把最小 `memory.semantic_summary` 注入真实 system prompt context assembly，让 route / layer 判断开始参与 prompt 级装配

### 4.5 兼容迁移策略

首批必须明确：

- 现有 `memory_items` 如何映射到新语义
- 哪些读路径仍保留 legacy
- 哪些路径开始切到新读法

---

## 5. 本阶段明确不做的事项

为防止范围膨胀，P0 明确不做以下事项：

- 不做重图基础设施
- 不做完整 multi-pack 插件系统
- 不做复杂 `Profile` 治理后台
- 不做 API / SDK 对外层
- 不做全量历史 backfill
- 不做复杂多 Agent 记忆仲裁
- 不做自动学习过强、不可控的自写入策略
- 不做 `Knowledge Layer` 的正式工程落地

P0 允许预留边界，但不提前施工。

---

## 6. 核心设计决策（本阶段定稿项）

### 6.1 `Profile` 采用“一级结构、轻量实现”

本阶段正式采用：

- `StaticProfileRecord`
- `DynamicProfileRecord`

这意味着：

- `Profile` 不再只是从长期记忆投影出来的 `ProfileView`
- 它在概念上就是一级语义对象

但本阶段实现约束为：

- 最小字段
- 最小读写闭环
- 最小检索路径
- 不做完整治理与复杂扩展

### 6.2 `DynamicProfile` 与 `ThreadState` 明确分层

本阶段必须写死以下边界：

- `DynamicProfile`
  - 表示当前阶段仍具有持续性的画像、偏好、项目状态
- `ThreadState`
  - 表示当前线程 / 当前 run 的进行态

禁止把：

- 当前线程目标
- 当前未完成事项
- 当前 run 的临时约束

写进 `DynamicProfile`。

当前已有 legacy `goal` 语义，P0 默认按以下策略处理：

- 不把现有 `goal` 直接升格成 `DynamicProfile`
- 先把它视为向 `ThreadState` 迁移的候选来源
- 等 `ThreadState` 首批字段升级后，再决定哪些阶段性状态值得进入 `DynamicProfile`

### 6.3 `memory_items` 是迁移过渡层，不是立刻废弃层

本阶段不直接删除 `memory_items`。

本阶段策略是：

- 在语义上引入新 record
- 在实现上允许新旧并存
- 优先迁移写入与主读路径
- 逐步降低 `memory_items` 的直接暴露度

### 6.4 `ThreadState` 保持正式并列一级层

`ThreadState` 在 P0 不降级，不退回“仅兼容层”。

后续写入、检索、注入都要把它当作正式一等输入源。

---

## 7. 数据模型与迁移策略

### 7.1 P0 目标模型

P0 建议的最小模型如下：

#### `MemoryRecord`

用于承载：

- episodic facts
- preference-like memory
- relationship memory
- feedback-like长期状态

最小字段建议：

- `memory_id`
- `memory_type`
- `scope`
- `subject`
- `canonical_text`
- `normalized_payload`
- `stability`
- `status`
- `confidence`
- `effective_at`
- `invalid_at`
- `updated_at`
- `source_refs`

当前代码事实：

- `StoredMemory` 已补齐 `updated_at`
- 新增 core record type 已开始统一把 legacy row 映射到：
  - `scope`
  - `subject`
  - `stability`
  - `source_refs`

#### `StaticProfileRecord`

用于承载长期稳定画像。

最小字段建议：

- `profile_id`
- `subject_type`
- `subject_id`
- `scope`
- `key`
- `value`
- `confidence`
- `source_refs`
- `updated_at`

当前代码事实：

- 现有 `profile_preference` 与 `user_preference` 已开始作为首批映射来源

#### `DynamicProfileRecord`

用于承载当前阶段但非线程级的动态画像。

最小字段建议：

- `profile_id`
- `subject_type`
- `subject_id`
- `scope`
- `key`
- `value`
- `confidence`
- `effective_at`
- `expires_at`
- `source_refs`
- `updated_at`

当前代码事实：

- legacy `goal` 当前未直接映射到 `DynamicProfileRecord`
- 这条约束已经进入当前执行基线，而不是后置讨论项

#### `MemoryRelationRecord`

最小支持：

- `updates`
- `extends`
- `derives`
- `supersedes`
- `invalidates`

### 7.2 与现有 `memory_items` 的映射策略

P0 不做一次性重建，而做三段式迁移：

#### 阶段 A：语义映射

先定义现有记录如何映射：

- `profile` / `preference` -> `StaticProfileRecord` 或 `DynamicProfileRecord`
- `relationship` -> `MemoryRecord`
- `goal` -> 先作为 `ThreadState` 迁移候选，不在 P0 直接进入 `DynamicProfile`
- `thread_local` scope -> 重新审查是否应转入 `ThreadState`

#### 阶段 B：新写入走新语义

P0 开始让新写入闭环以新 record 语义为主，但底层允许继续复用现有持久化能力。

#### 阶段 C：读路径逐步迁移

优先迁移：

- retrieval router
- context assembly
- profile query path

最后再评估：

- `memory_items` 是否退为 legacy layer

当前代码事实：

- `StoredMemory` 仍然是当前 chat runtime 的直接存储适配对象
- 但 `apps/web/lib/chat/memory-records.ts` 已开始把它桥接到新 record 语义
- 当前已经正式进入：
  - “保留 legacy 存储底座”
  - “新增语义层 adapter”
  的双层过渡阶段

### 7.3 是否允许双写

P0 允许有限双写，但要克制：

- 仅在新旧读路径并存且回归风险较高的阶段使用
- 明确每条双写的退出条件

默认目标不是长期双写，而是最短时间内把主读路径迁到新语义。

---

## 8. 模块改动映射

### 8.1 首批优先改动模块

#### 数据与语义层

- `apps/web/lib/chat/memory-v2.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/thread-state.ts`

目标：

- 把现有 memory v2 字段体系，提升成可映射到 `MemoryRecord / ProfileRecord / RelationRecord` 的正式语义层

#### 读写底座层

- `apps/web/lib/chat/memory-item-read.ts`
- `apps/web/lib/chat/memory-item-persistence.ts`
- `apps/web/lib/chat/thread-state-repository.ts`
- `apps/web/lib/chat/thread-state-writeback.ts`

目标：

- 为新语义提供最小 repository / read-model / persistence seam

#### 写入链

- `apps/web/lib/chat/memory-write.ts`

目标：

- 从当前 `profile / preference / relationship` 抽取与写入，升级成“可分类、可更新、可失效”的首版写入管线

当前代码事实：

- 写入链已开始显式暴露 `record_target`
- 写入链当前也已开始把 generic memory row 组装收成共用 builder
- generic `profile / preference` 写入当前也已开始先构造 `StaticProfileRecord` candidate，再进入 legacy row 组装
- 首批分类已覆盖：
  - `static_profile`
  - `memory_record`
  - `thread_state_candidate`

#### 检索链

- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`

目标：

- 把当前 recall 逻辑升级成四路最小分流，而不是单一 memory recall helper 集合

当前代码事实：

- 检索链已开始显式暴露 `appliedRoutes`
- `thread_state` 已进入 runtime memory preparation
- `memory_write_planned` 已能同步暴露最小 `record_targets`

#### 注入与输出层

- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/runtime-debug-metadata.ts`
- `apps/web/lib/chat/assistant-message-metadata.ts`

目标：

- 让新的 profile / thread / episode / timeline 路由结果进入 runtime 注入与调试可见性

当前代码事实：

- `debug_metadata.session.thread_state` 已能看到最小 thread state recall 摘要
- runtime preview metadata 已能看到 memory write `record_targets`
- runtime debug / assistant metadata 当前也已开始显式暴露最小 `profile_snapshot`

### 8.2 首批暂不直接改的大模块

- `follow_up` worker 主链
- IM adapter 主协议
- `Knowledge Layer` 相关新结构
- 多 Agent arbitration
- 对外 API/SDK contract

---

## 9. 写入 / 检索 / 注入的最小闭环流程

### 9.1 写入闭环

```text
Raw Turn / Tool Output
  -> Candidate Extraction
  -> Classification
  -> Scope Resolution
  -> Update / Invalidation Check
  -> Commit to Profile / Memory / ThreadState
```

P0 最小要求：

- 不是每轮都写
- 能区分：
  - profile
  - memory
  - thread state
- 能表达：
  - 新增
  - 补充
  - 覆盖
  - 失效

当前代码现实已经进入步骤 2：

- planner request -> `record_target` classification 已成立
- generic memory insert / update row builder 已成立
- generic `StaticProfileRecord` candidate adapter 已成立
- relationship `MemoryRecord` candidate adapter 已成立
- `thread_state_candidate` seam 已成立，并已开始进入最小真实 commit
- `static_profile` 当前已成为三条里第一条进入真实主读路径的分支
- `static_profile` 当前也已成为三条里第一条进入 runtime 注入层的分支
- `memory_record` 当前也已开始进入 relationship recall 的真实主读路径
- 当前 `goal` 不进入 reply recall prompt，而是保守沉淀为 `ThreadState.focus_mode`
- 下一步应继续把：
  - `canonical type`
  - `scope`
  - `record adapter`
  串成真正 commit 前的最小语义管线

### 9.2 检索闭环

```text
Runtime Query
  -> Query Type Classification
  -> Route Selection
  -> Candidate Fetch
  -> Time / Status Filtering
  -> Merge / Budgeting
  -> Context Assembly
```

P0 首批四路：

- `profile`
- `episode`
- `timeline`
- `thread_state`

当前代码现实：

- route name 与 `appliedRoutes` 已成立
- `thread_state` 已进入 runtime memory preparation
- `episode / timeline` 仍处于语义预留，尚未成为真实分流实现

### 9.3 注入闭环

P0 注入顺序建议：

1. `ThreadState`
2. `Profile`
3. relevant `MemoryRecord`
4. recent raw turns

默认原则：

- 先当前线程，再长期状态
- 先稳定画像，再补具体事件
- 避免长期记忆污染当前线程进行态

当前代码现实：

- `thread_state` 已先于其它新路由进入 runtime context 可见性
- 这与当前注入顺序建议保持一致

---

## 10. 验收标准

### 10.1 功能验收

P0 至少要验证：

- 长期偏好可被稳定写入与更新
- 冲突信息不会只做 append
- `ThreadState` 不会被长期记忆替代
- 检索能按四路最小分流
- runtime 能注入新结构结果

当前已部分满足：

- runtime 已能显式区分 `profile / thread_state` 两路
- `debug_metadata.session.thread_state` 已能显式看到 thread state 最小摘要
- `assistant metadata.session.thread_state` 已能看到相同最小摘要
- runtime system prompt 当前也已开始直接承接最小 `thread_state` 摘要
- runtime system prompt 当前也已开始直接承接最小 `memory.semantic_summary`
- `goal` 已可在具备 `threadId + repository` 时写入 `ThreadState.focus_mode`
- `relationship recall` 已开始经过 `MemoryRecord` adapter

P0 功能 gate 通过的最小条件：

- `profile / preference -> static_profile` 写入与主读路径都已成立
- `relationship -> memory_record` 写入与 recall 主读路径都已成立
- `goal -> thread_state_candidate -> ThreadState.focus_mode` 已成立
- runtime / assistant metadata 至少有一处能稳定暴露 `profile_snapshot`
- runtime / assistant metadata 至少有一处能稳定暴露最小 `thread_state` 摘要
- runtime system prompt 至少有一处能稳定承接最小 `thread_state` 摘要
- runtime system prompt 至少有一处能稳定承接最小 `memory.semantic_summary`

### 10.2 结构验收

P0 完成后应满足：

- `Profile` 已是一级结构，不再只是派生 view
- `ThreadState` 与 `DynamicProfile` 边界明确
- `memory_items` 已被纳入兼容迁移方案
- 新旧语义不会在主要路径里长期并行漂移

P0 结构 gate 通过的最小条件：

- `packages/core/memory/records.ts` 已成为正式 record 定义入口
- `apps/web/lib/chat/memory-records.ts` 已承接 legacy -> 新语义 adapter 与 semantic target classifier
- `record_target` 与 `semantic_target` 不是只留在文档中，而是至少进入：
  - 写入链
  - recall 链
  - 一处管理或可视化链路
- `DynamicProfileRecord` 仍保持克制，不提前吸收 legacy `goal`

### 10.3 回归验收

至少要覆盖：

- Web chat 正常主路径
- IM 正常主路径
- thread state 读写不回退
- memory write / recall 不引入明显行为倒退
- `tsc --noEmit -p apps/web/tsconfig.json` 持续通过

P0 回归 gate 通过的最小条件：

- `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json` 通过
- `pnpm --filter @sparkcore/web memory:upgrade:harness` 通过
- `memory:upgrade:harness` 当前至少覆盖：
  - semantic target classifier
  - record candidate adapter
  - runtime `memory.semantic_summary`
  - assistant metadata semantic summary reader
- Web chat 主路径仍可：
  - 发消息
  - 写 assistant reply
  - 展示 runtime summary
- memory 管理动作仍可：
  - hide
  - restore
  - incorrect
- `thread_state` 读取、写回、assistant metadata 注入没有被新语义层打断

---

## 11. 风险、回退与尾项处理

### 11.1 主要风险

- `Profile` 与 `ThreadState` 边界再次混淆
- `memory_items` 迁移策略不清，导致新旧读法并行过久
- P0 试图同时做太多 pack / graph / governance，导致范围失控
- context assembly 过早复杂化

### 11.2 回退原则

如果 P0 某一步超出控制范围，回退优先级如下：

1. 保住 `ThreadState` 正式一等层地位
2. 保住 `Profile` 一级结构，但缩减字段
3. 保住写入 / 检索 / 注入最小闭环
4. 后置复杂治理、重图、多 pack、API 边界

### 11.3 尾项处理原则

P0 完成后仍可能保留：

- 少量兼容读写路径
- 少量 legacy 字段
- 少量文档补细

这些尾项不阻塞 P1，但必须进入显式 backlog，而不是隐形拖延。

---

## 12. 一句话收口

**P0 不是重写记忆系统，而是在现有 runtime / thread_state / memory_items 底座上，把 SparkCore 记忆能力升级成“Profile 一级结构 + ThreadState 并列一级层 + 可更新可分流的最小长期状态闭环”。**
