# Session Layer 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session layer` 的模块边界、最小 contract，以及它与 role、memory、runtime 的协作关系。

本文档重点回答：

- 当前 session layer 到底负责什么
- `thread`、`message`、`recent raw turns`、`thread_local` 的关系是什么
- session 为什么不能被 memory 或 role 替代
- 当前阶段为什么不直接进入正式 thread compaction 实现

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`

---

## 2. 一句话定义

**session layer 是 SparkCore 当前阶段用于承载“当前这条 thread 正在发生什么”的核心状态层，负责 thread、messages、recent raw turns 与局部上下文的组织，为 runtime 提供当前轮处理所需的会话连续性。**

---

## 3. 当前阶段设计目标

当前阶段 session layer 的目标是：

1. 支撑同一 thread 内的自然连续性
2. 维持 current message 与 recent turns 的局部上下文
3. 与长期记忆形成清晰分工
4. 为未来 thread state / compaction 保留兼容口
5. 为 runtime 提供稳定 `SessionContext`

---

## 4. 当前阶段非目标

当前 session layer **不负责**：

- 正式的 thread compaction 系统
- 大规模长链压缩策略
- 世界层 scene / encounter continuity
- 独立会话协调器集群
- IM 平台接入逻辑

当前阶段不应因为未来长链问题，就提前把 session 设计成重系统。

---

## 5. session layer 的核心职责

### 5.1 thread 管理

- 当前 thread 标识
- 当前 thread 归属 agent
- 当前 thread 生命周期状态

### 5.2 message 管理

- 当前轮输入消息
- 最近几轮消息
- 消息顺序与最小状态

### 5.3 recent raw turns

- 为代词、省略、承接提供最近几轮上下文
- 支撑 same-thread continuation

### 5.4 thread-local 约定

- 当前 thread 的临时格式要求
- 当前 thread 的局部语气
- 当前 thread 的临时工作上下文

---

## 6. thread、message、session 的关系

## 6.1 thread

thread 是当前一次持续对话的容器。

它回答的是：

> 这条对话是谁的、归属哪个 agent、历史消息属于哪一组

当前最小字段包括：

- `thread_id`
- `workspace_id`
- `owner_user_id`
- `agent_id`
- `title`
- `status`

---

## 6.2 message

message 是 thread 内的单条交互记录。

它回答的是：

> 这轮具体说了什么

当前最小字段包括：

- `message_id`
- `thread_id`
- `role`
- `content`
- `status`
- `metadata`
- `created_at`

---

## 6.3 session

session 不是单独一张表，而是 runtime 当前轮消费的会话上下文对象。

当前建议至少包括：

- `thread_id`
- `agent_id`
- `current_user_message`
- `recent_raw_turns`
- `current_language_hint`
- `thread_local_agreements?`
- `continuity_signals?`

它回答的是：

> 当前这一轮在这条 thread 中该如何理解上下文

当前补充判断是：

- `SessionContext` 不应直接等于正式 `session state`
- 更合理的关系是：
  - `thread`
  - `thread state`
  - `SessionContext`

---

## 7. 与 memory 的边界

memory 回答的是：

> 跨 thread 长期记得什么

session 回答的是：

> 当前这条 thread 正在发生什么

因此：

- recent raw turns 属于 session，不属于长期记忆
- `thread_local` 约定属于 session / 局部层，不属于长期记忆主干
- 长期记忆不应承担 thread continuity 的全部职责

---

## 8. 与 role 的边界

role 回答的是：

> 它默认是谁

session 回答的是：

> 它在这条 thread 里最近怎么说、当前局部状态是什么

因此：

- role 不负责当前轮局部状态
- session 不负责定义角色身份
- 当前轮表现必须由 role + session + memory 共同决定

---

## 9. 与 runtime 的边界

runtime 应：

- 加载 session
- 读取 recent raw turns
- 结合当前输入构造 `SessionContext`
- 决定是否需要 thread-local continuation 或 thread-local agreements

session layer 不应：

- 自己决定回答策略
- 自己做长期记忆召回
- 自己做产品层页面行为

---

## 10. 当前建议 contract

## 10.1 `SessionContext`

当前建议最小字段：

- `thread_id`
- `agent_id`
- `current_user_message`
- `recent_raw_turns`
- `current_message_id?`
- `current_language_hint?`
- `recent_raw_turn_count?`
- `approx_context_pressure?`
- `thread_local_agreements?`
- `continuity_signals?`

---

## 10.2 `RecentRawTurn`

当前建议最小字段：

- `role`
- `content`
- `created_at`
- `message_id`

---

## 10.3 `ThreadStateRecord`

当前建议作为下一阶段正式化对象预留。

推荐最小字段：

- `thread_id`
- `agent_id`
- `state_version`
- `lifecycle_status`
- `continuity_status?`
- `current_language_hint?`
- `last_user_message_id?`
- `last_assistant_message_id?`
- `updated_at`

它回答的是：

> 当前这条 thread 的最小正式局部状态是什么

这层当前已经有第一版代码壳，且设计方向已明确，见：

- [session_state_contract_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/session_state_contract_v1.0.md)
- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

---

## 10.4 `ThreadLocalAgreement`

当前建议只作为局部层概念预留，不进入长期记忆主面板。

示例：

- `answer_format = bullet_points`
- `tone = more_formal_for_this_thread`
- `focus = roadmap_planning_only`

规则：

- 只在当前 thread 生效
- 默认不提升为长期记忆

---

## 11. 当前实现映射

当前现实承载主要是：

- `threads` 表
- `messages` 表
- `threads.agent_id`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`
- `apps/web/lib/chat/runtime.ts`

当前已具备：

- thread container
- message history
- agent-thread 绑定
- recent raw turns 的天然支撑
- `SessionContext` 第一版代码落点
- `prepareRuntimeSession(...)` 第一版装配落点
- `thread state / session state` 第一版设计 contract
- `thread-state.ts` 第一版代码壳

这意味着当前 session 不再只是 `runtime.ts` 内部直接调用的一段实现，而是已经开始通过 runtime preparation 模块进入主流程。
- runtime 对显式 session object 的消费起点

当前未正式具备：

- `thread_state` 持久化 / 读取入口
- 正式 compaction 层

当前代码中已落实的 session 组织字段包括：

- `current_user_message`
- `current_message_id`
- `recent_raw_turns`
- `continuity_signals`
- `recent_raw_turn_count`
- `approx_context_pressure`

这意味着当前 session layer 已不再只是设计概念，而是已经有一层最小可执行实现。

---

## 12. Layer D 当前判断

当前虽然已经出现长链连续性问题，但仍不建议立刻正式实现 thread compaction。

当前更合理的策略是：

- 继续使用 recent raw turns
- 继续强化 same-thread continuation
- 继续观察 drift 是否稳定集中在 thread continuity

这意味着：

- Layer D 已进入观察期
- 但尚未进入正式实现期

---

## 12.1 当前代码文件映射

### A. `apps/web/lib/chat/session-context.ts`

当前角色：

- session layer 的最小代码落点
- 承载 thread continuity、recent raw turns、context pressure 的组织逻辑

当前主要承载：

- `SessionContext`
- `RecentRawTurn`
- `SessionContinuitySignal`
- `buildSessionContext(...)`

当前判断：

- 这是当前阶段很合适的最小 session 模块
- 它把原来散落在 runtime 内部的会话组织逻辑收成了统一对象
- 但目前仍是 runtime 近邻模块，不是最终 core package 形态

### B. `apps/web/lib/chat/runtime.ts`

当前与 session 相关的角色：

- 消费 `SessionContext`
- 使用 `continuity_signals`
- 使用 `recent_raw_turn_count`
- 使用 `approx_context_pressure`

当前判断：

- runtime 已开始围绕显式 session object 工作
- 这使 `role-memory-session` 三者的协作面更接近文档中的目标状态
- 后续如果继续抽离，优先级应低于当前把 contract 完全迁出 `apps/web`

---

## 13. 当前推荐实现顺序

1. 固化 `SessionContext`
2. 固化 `thread state / session state` 最小 contract
3. 固化 recent raw turns 的最小结构
4. 明确 `thread_local` 与长期记忆的边界
5. 让 runtime 显式消费 session contract
6. 再决定是否需要独立 `thread_state` 代码壳与 compaction 层

---

## 14. 当前阶段 DoD

- `SessionContext` 最小结构已明确
- thread、message、session 三者分工已明确
- recent raw turns 的角色已明确
- `thread_local` 与长期记忆边界已明确
- 当前不进入正式 Layer D 实现的判断已固定

当前代码进度补充判断：

- `SessionContext` 已有第一版可执行实现
- runtime 已开始消费显式 session object
- `thread state / session state` 最小 contract 已开始
- `ThreadStateRecord` 第一版代码壳已开始
- 当前仍属于“最小 session contract 已落地，thread state 代码壳已开始，但尚未接入主流程与持久化”的阶段

---

## 15. 当前结论

当前阶段的 session layer，不是“消息表本身”，而是：

**runtime 当前轮理解 thread 局部连续性的最小状态层。**

只有把这一层定清楚，memory 才不会被迫承载 thread continuity，role 才不会被迫承载局部状态，runtime 才能真正做到稳定持续对话。
