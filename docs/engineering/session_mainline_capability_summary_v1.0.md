# Session Mainline 能力总结 v1.0

## 1. 文档定位

本文档用于总结 SparkCore 当前 `session` 主线已经推进到什么程度，重点回答：

- 当前 session 主线已经形成了哪些稳定层次
- 哪些能力已经是代码事实
- 哪些边界只是设计 contract
- 哪些部分已经开始进入 runtime preparation 主流程
- 下一步更适合继续推进什么，而不适合继续推进什么

本文档不是新的 session 总设计，而是当前 session 主线的阶段性能力盘点。

> 状态：阶段总结
> 对应阶段：Phase 1 / session mainline 收口
> 相关文档：
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前 session 主线已经从“runtime.ts 里的局部上下文组织逻辑”推进成了一个开始具备显式 `SessionContext`、显式 `ThreadStateRecord`、并开始进入 runtime preparation 主流程的 session 主干，但 thread state 仍处在默认构造、未持久化的阶段。**

---

## 3. 当前已经形成的主线结构

当前 session 主线已经能比较清楚地描述成：

1. `thread`
2. `ThreadStateRecord`
3. `messages`
4. `buildSessionContext(...)`
5. `prepareRuntimeSession(...)`
6. `SessionContext`
7. `PreparedRuntimeTurn`

这意味着当前已经不再只是：

- `runtime.ts` 里的一段连续性判断
- recent messages 的临时拼接
- 若干语言判断 helper

而是开始有一条真正可描述、可继续正式化的 session 主线。

---

## 4. 当前已成为代码事实的部分

### 4.1 `SessionContext` 已成立

当前已经有：

- [session-context.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/session-context.ts)

其中已具备：

- `SessionContext`
- `RecentRawTurn`
- `SessionContinuitySignal`
- `ApproxContextPressure`
- `buildSessionContext(...)`

这意味着 session consumption 层已经不再只是文档概念。

### 4.2 `ThreadStateRecord` 已成立第一版代码壳

当前已经有：

- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

其中已具备：

- `ThreadStateRecord`
- `ThreadLifecycleStatus`
- `ThreadContinuityStatus`
- `buildDefaultThreadState(...)`

这意味着 session 正式状态层已经不再只是纯设计。

### 4.3 session preparation 已开始显式化

当前已经有：

- [runtime-prepared-turn.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-prepared-turn.ts)

其中已具备：

- `prepareRuntimeSession(...)`

而且它当前已经开始：

- 最小消费 `ThreadStateRecord`
- 用 `buildDefaultThreadState(...)` 为 `SessionContext` 填充 `thread_state`

这意味着 session 主线已经不是“只有类型定义”，而是已经开始进入 runtime preparation 主流程。

---

## 5. 当前已接入真实主流程的部分

当前 session 主线已经不只是“代码存在”，而是已经进入 runtime 主流程：

### 5.1 runtime preparation 主流程

- [runtime-prepared-turn.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-prepared-turn.ts)
- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts)

当前已做到：

- `prepareRuntimeSession(...)`
- `SessionContext`
- `PreparedRuntimeTurn.session`

都已经是实际 runtime 主线的一部分。

### 5.2 Web / IM 双主入口的间接接入

因为：

- Web chat 已走 `runAgentTurn(input)`
- IM 已走 `runAgentTurn(input)`
- runtime 已走 `prepareRuntimeTurn(...)`

所以 session 主线当前其实已经被两条真实主入口共享消费。

---

## 6. 当前仍处于受控过渡期的部分

### 6.1 `ThreadStateRecord` 仍是默认构造态

当前 `thread_state` 虽然已经开始进入 `SessionContext`，但它目前仍然主要来自：

- `buildDefaultThreadState(...)`

而不是：

- `loadThreadState(...)`
- 数据库持久化读取
- 真正独立的状态层服务

也就是说，它现在更适合被理解成：

- 正式状态层的第一版代码壳
- 以及进入主流程的最小接线

而不是已经成熟的状态持久化能力。

### 6.2 session 尚未进入 compaction / summarization 阶段

当前仍未开始的包括：

- `thread_state` 持久化表
- `loadThreadState(...)`
- thread compaction
- summarization / 压缩回写
- thread-local agreements 的正式状态化

这不是缺陷，而是当前阶段有意保守。

---

## 7. 当前最准确的成熟度判断

如果只看 session 主线，我认为当前最准确的判断是：

### 已经完成的

- `SessionContext` 显式化
- recent raw turns / continuity / context pressure 显式化
- `ThreadStateRecord` 第一版代码壳
- `prepareRuntimeSession(...)` 显式化
- `thread_state` 最小进入 session preparation
- runtime 主流程接入

### 还没有完成的

- `thread_state` 持久化
- `loadThreadState(...)`
- `messages + persisted thread state -> SessionContext`
- compaction / summarization
- 更正式的 session repository / service

所以现在的状态不是：

- “session 还只是 runtime helper”

也不是：

- “session 已经成为完整状态层”

而是：

**session 主干已经形成，正式状态层 contract 和代码壳已经成立，但状态读取与持久化仍处在未开始阶段。**

---

## 8. 当前最适合的下一步

当前更适合的下一步不是立刻进入 compaction。

更稳的顺序是：

1. 先接受当前 session 新边界已经成立  
   `thread -> thread state -> SessionContext -> prepareRuntimeSession(...)`

2. 再决定是否进入 `loadThreadState(...) / persistence`

3. 只有在状态读取边界稳定后，再考虑 compaction / summarization

也就是说，当前更重要的是：

**守住 session 正式化的新边界，不要因为已经有了 `ThreadStateRecord` 就立刻掉进重状态系统。**

---

## 9. 结论

当前 session 主线已经到了一个健康停点：

- 设计边界已形成
- 代码壳已出现
- 最小主流程接线已完成
- 但持久化与 compaction 仍未开始

因此当前最合理的判断不是“继续猛推 session 状态系统”，而是：

**先把这条主线当作当前有效 session 架构接受下来，再决定下一步是否进入 `loadThreadState(...) / persistence`。**
