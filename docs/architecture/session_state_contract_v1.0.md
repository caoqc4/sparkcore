# Session State Contract 文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session layer` 的下一步正式化方向，重点回答：

- `SessionContext` 之后，什么才算真正的 session state
- `thread`、`thread state`、`SessionContext` 三者的边界是什么
- 哪些信息应该沉淀成较稳定的状态层 contract
- 哪些信息仍然只适合停留在 runtime 当轮装配对象里

本文档不是 thread compaction 设计，也不是 scheduler 设计，而是当前阶段最小 `session state / thread state` contract 说明。

> 状态：设计稿已落第一版代码壳
> 对应阶段：Phase 1 / session formalization
> 相关文档：
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/architecture/runtime_input_contract_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`

---

## 2. 一句话定义

**session state 是 SparkCore 当前阶段用于表达“这条 thread 当前处在什么状态”的最小正式状态层；它不等于最近消息列表，也不等于 runtime 当轮装配对象，而是位于二者之间的稳定状态 contract。**

---

## 3. 当前为什么要补这层

当前 runtime 主线已经逐步收成：

1. `RuntimeTurnInput`
2. `runAgentTurn(input)`
3. `prepareRuntimeSession(...)`
4. `prepareRuntimeRole(...)`
5. `prepareRuntimeMemory(...)`
6. `prepareRuntimeTurn(...)`
7. `PreparedRuntimeTurn`
8. `runPreparedRuntimeTurn(prepared)`

其中 `session` 这块已经有现实代码对象：

- [session-context.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/session-context.ts)

但当前最明显的不对称是：

- `SessionContext` 已经被 runtime 真实使用
- 但 `SessionContext` 仍更像“本轮装配结果”
- 还没有一层更正式的 `thread state / session state` 来回答：
  - 当前 thread 正处在什么局部状态
  - 哪些东西值得跨 turn 保持
  - 哪些只是最近消息的即时推断

所以现在最值得补的不是立刻做 compaction，而是先把：

**session state 的最小 contract**

定清楚。

---

## 4. 当前最重要的边界判断

一句话判断：

**`SessionContext` 不应直接等于 `SessionState`。**

更合适的关系是：

- `thread`
  - 对话容器与归属信息
- `session state`
  - 当前这条 thread 的最小正式局部状态
- `SessionContext`
  - 本轮 runtime 消费的装配对象

也就是说：

### `thread`

回答：

> 这是哪条对话

### `session state`

回答：

> 这条对话当前处在什么局部状态

### `SessionContext`

回答：

> 为了执行这一轮，runtime 当前要消费什么 session 相关上下文

如果把三者混成一个对象，后面会出现两个问题：

1. runtime 装配对象会越来越像状态存储层
2. session layer 会继续停留在“运行时 helper”阶段，难以正式化

---

## 5. 当前推荐最小结构

当前推荐先定义两层：

### 5.1 `ThreadStateRecord`

```ts
type ThreadStateRecord = {
  thread_id: string
  agent_id: string
  state_version: number
  lifecycle_status: "active" | "paused" | "closed"
  focus_mode?: string | null
  current_language_hint?: "zh-Hans" | "en" | "unknown" | null
  recent_turn_window_size?: number | null
  continuity_status?: "cold" | "warm" | "engaged" | null
  last_user_message_id?: string | null
  last_assistant_message_id?: string | null
  updated_at: string
}
```

这里先不追求复杂，只解决：

- 当前 thread 是否还活跃
- 当前语言连续性大致是什么
- 当前局部承接状态大致是什么
- 最近一轮锚点消息是谁

当前第一版代码壳已落在：

- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

其中当前已具备：

- `ThreadStateRecord`
- `ThreadLifecycleStatus`
- `ThreadContinuityStatus`
- `buildDefaultThreadState(...)`

### 5.2 `SessionContext`

继续作为 runtime 装配对象存在，但开始更明确地包含：

- 来自消息序列的即时信息
- 来自 `ThreadStateRecord` 的最小状态信息

也就是说，后续更合理的形态会是：

```ts
type SessionContext = {
  thread_id: string
  agent_id: string
  current_user_message: string | null
  current_message_id?: string
  recent_raw_turns: RecentRawTurn[]
  continuity_signals: SessionContinuitySignal
  current_language_hint: SessionReplyLanguage
  recent_raw_turn_count: number
  approx_context_pressure: ApproxContextPressure
  thread_state?: ThreadStateRecord | null
}
```

当前重点不是字段一次到位，而是：

**明确 `thread_state` 是 session 正式状态层，`SessionContext` 是其运行时消费层。**

---

## 6. 当前哪些字段适合进入正式状态层

当前更适合进入 `ThreadStateRecord` 的，是那些：

- 跨 turn 有意义
- 不只是即时推断
- 不必每次都重新从全量消息序列现算

当前最推荐先收的有：

### 6.1 lifecycle / continuity

- `lifecycle_status`
- `continuity_status`

因为它们更像 thread 的当前阶段性状态。

### 6.2 language hint

- `current_language_hint`

因为它已经在当前 session 里被反复使用，而且属于弱稳定状态。

### 6.3 锚点消息

- `last_user_message_id`
- `last_assistant_message_id`

这能为后续：

- claim / follow-up 回流
- thread continuation
- 未来 compaction

提供更清楚的状态锚点。

---

## 7. 当前不适合进入正式状态层的

下面这些当前不建议直接沉到 `ThreadStateRecord`：

### 7.1 `recent_raw_turns`

原因：

- 它本质上仍然是最近消息窗口
- 更适合从 messages 序列构造
- 不是稳定状态，而是运行时消费窗口

### 7.2 `approx_context_pressure`

原因：

- 这是对当前窗口的即时估计
- 更适合作为 runtime consumption signal
- 不是长期稳定状态

### 7.3 复杂 thread-local agreements

原因：

- 当前还没到需要正式状态化的程度
- 一旦提前做重，会很快滑向 compaction / planner 复杂度

---

## 8. 当前建议的层间关系

当前更合理的关系是：

### message layer

提供：

- 最近消息序列
- 当前消息锚点

### session state layer

提供：

- 当前 thread 的最小正式状态

### runtime preparation

通过：

- messages
- thread state

构造：

- `SessionContext`

也就是说，后续更合理的 preparation 边界会是：

1. 先拿 thread container
2. 再拿 thread state
3. 再拿 recent messages
4. 最后构造 `SessionContext`

---

## 9. 当前最稳的演进顺序

当前建议顺序如下：

### Step 1

先把 `ThreadStateRecord` 作为最小 contract 固定下来。

### Step 2

在 session layer 里补一个最小 `loadThreadState(...)` 或 `buildDefaultThreadState(...)` 的边界设计。

这一步当前已经迈出第一步：

- `buildDefaultThreadState(...)` 已存在
- 但 `loadThreadState(...)` 和真实持久化入口仍未开始

### Step 3

再决定是否把 `prepareRuntimeSession(...)` 从“只用 messages 推断”推进到：

- `messages + thread state -> SessionContext`

### Step 4

最后才考虑是否需要最小持久化表 / migration 草案。

这个顺序的价值在于：

- 先让 session 正式状态层存在
- 但不直接掉进 compaction / summarization / worker 复杂度

---

## 10. 当前结论

当前最稳的判断是：

**session 下一步最值得补的，不是 thread compaction，也不是更重的会话系统，而是最小 `thread state / session state` contract。**

这样后面才能更清楚地形成：

- `thread`
- `thread state`
- `SessionContext`
- `PreparedRuntimeTurn`

这条更稳定的 session 主线。  
