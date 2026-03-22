# Runtime 输出治理阶段决策说明 v1.0

## 1. 文档定位

本文档用于对 SparkCore 当前 `runtime` 主线里：

- `RuntimeTurnResult`
- `runtime_events`
- `debug_metadata`

这三层输出面做一次阶段性治理判断，并明确下一轮优先级。

本文档不重复 runtime 总设计，也不重复 input / preparation / execution 结构，而是重点回答：

- 为什么现在值得先治理输出层
- 三层各自现在更适合承接什么
- 哪些东西不该再继续往顶层结果或 `debug_metadata` 里堆
- 当前最值得先补的下一步边界是什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / runtime output governance
> 相关文档：
> - `docs/engineering/foundation_mainlines_reprioritization_note_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 `runtime` 最值得优先治理的不是 execution 再细拆，而是输出三层边界：顶层 `RuntimeTurnResult` 继续保持克制，`runtime_events` 承接标准过程事件，`debug_metadata` 承接最小调试摘要；下一步最值得补的是一份更明确的“什么该进 event、什么只留 metadata”的边界说明。**

---

## 3. 为什么现在值得优先回到输出治理

现在 `runtime` 已经不是只有：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`

而是已经开始同时承接：

- session state writeback summary
- thread state writeback runtime event
- 越来越多的调试与 side effect 可见性

这说明当前最真实的风险，已经不再是“runtime 没有统一输出”，而是：

- 顶层结果会不会越来越宽
- `runtime_events` 和 `debug_metadata` 会不会职责重叠
- side effect 结果会不会没有统一落点

如果不先治理这层，后面 memory、session、follow_up 再各自往上挂东西时，runtime 输出面会越来越杂。

所以现在最值钱的一刀，不是继续拆 execution，而是：

**先把输出三层的职责再收紧一次。**

---

## 4. 当前三层输出面的推荐职责

### 4.1 `RuntimeTurnResult` 顶层

当前仍应只承接：

- 本轮正式主结果
- 明确会被上层消费的标准产物

例如：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata`

它不适合继续长成：

- 每个 side effect 的详细结果仓库
- 各种局部治理信息的集合

一句话说：

**顶层结果继续做“正式输出包”，不要变成运行时杂项总线。**

### 4.2 `runtime_events`

当前更适合承接：

- 单轮内的标准事件
- 对 eval / observability / trace 有价值的过程节点

例如当前已经存在或开始存在的：

- `memory_recalled`
- `memory_write_planned`
- `follow_up_planned`
- `answer_strategy_selected`
- `assistant_reply_completed`
- `thread_state_writeback_completed`

一句话说：

**event 更适合回答“本轮发生了什么标准过程”。**

### 4.3 `debug_metadata`

当前更适合承接：

- 单轮调试摘要
- 对开发和验证有价值，但当前不值得升级成正式 contract 的最小信息

例如：

- answer strategy label
- recalled memory count
- thread state writeback reason

一句话说：

**metadata 更适合回答“这轮为什么这样、有哪些调试摘要”，而不是承接标准过程事件。**

---

## 5. 当前最重要的边界判断

当前建议把这三层继续分开：

### 5.1 什么应该进顶层结果

只有：

- 上层调用者明确会消费的正式产物

才值得继续留在顶层。

### 5.2 什么应该进 `runtime_events`

只要它是：

- 单轮标准过程
- 可归一命名
- 后续可能被 eval / observability 复用

就优先考虑进 `runtime_events`。

### 5.3 什么应该只进 `debug_metadata`

如果它更像：

- 调试摘要
- 局部原因
- 当前还不值得提升成标准 contract 的信息

那就继续留在 `debug_metadata`。

---

## 6. 当前明确不建议立刻做的事

当前不建议马上做：

- 给 `RuntimeTurnResult` 顶层继续加更多 side effect 字段
- 把所有调试信息都升级成 event
- 把所有 event 的详细原因都搬进 payload
- 为了治理输出层而继续细拆 execution

这些动作都会让系统先涨复杂度，而不是先涨清晰度。

---

## 7. 当前最值得优先补的下一层边界

如果下一轮继续推进 runtime 输出治理，我建议最先补的是：

- **`runtime_events` 与 `debug_metadata` 的准入边界说明**

更具体地说，就是单独收清：

- 哪些信息属于标准事件
- 哪些信息只属于调试摘要
- 哪些信息两边都不该放

因为当前最容易失控的，不是顶层结果，而是：

- event / metadata 这两层开始互相侵蚀

---

## 8. 当前建议的优先级

当前建议顺序是：

### Priority 1

补一份：

- `runtime_events vs debug_metadata` 的最小边界说明

### Priority 2

等边界清楚后，再决定是否需要：

- 标准 event catalog 收口
- metadata key 命名收口

### Priority 3

最后才考虑：

- 更正式的 output contract 扩张
- execution 再细拆

---

## 9. 结论

当前 `runtime` 这条线如果继续推进，最有杠杆的一刀不是 execution 继续变薄，而是：

**先治理输出三层的职责。**

更稳的顺序是：

**先把 `runtime_events` 与 `debug_metadata` 的边界想清楚，再决定是否还需要进一步扩 output contract。**

也就是说，当前更好的动作是：

**先治理输出层，再继续扩任何一条支线往 runtime 输出面挂东西。**
