# Runtime Output 下一阶段决策说明 v1.0

## 1. 文档定位

本文档用于固定 SparkCore 当前 `runtime` 输出治理进入下一阶段前的优先级判断，重点回答：

- 当前 `runtime` 输出层已经推进到哪里
- 下一步最值得继续推进的方向是什么
- 哪些事情现在不建议立刻做

本文档不是新的 output schema 设计，也不是立刻改代码的实施计划，而是：

**在 `runtime_events`、`debug_metadata`、`answer_strategy` 分组都已成立之后，对下一阶段做一次最小决策收口。**

> 状态：阶段决策
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/engineering/runtime_output_governance_decision_note_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_answer_strategy_debug_metadata_grouping_v1.0.md`

---

## 2. 一句话结论

**当前 `runtime` 输出治理最稳的下一步，不是立刻继续扩顶层 contract，也不是马上做 event payload 重排，而是先继续做少量 `debug_metadata` 子域收组；event payload 规范化排第二，顶层 output contract 扩张继续排后。**

一句话说：

**先继续把 metadata 整理好，再决定 event 要不要更细，最后才考虑顶层要不要再长。**

---

## 3. 当前已经成立的输出治理骨架

当前 `runtime` 输出层已经具备：

- `runtime_events` vs `debug_metadata` 的准入边界
- 最小 `runtime event catalog`
- `debug_metadata` 的命名收口方向
- `thread_state_writeback` 的最小调试摘要
- `answer_strategy` 的最小 metadata 分组

这意味着当前已经不再是“先把东西都挂上去再说”，而是已经形成了最小治理骨架。

所以现在新的问题不再是：

- 需不需要治理

而是：

- **下一刀该先治理哪一层**

---

## 4. 当前最自然的三个候选方向

### 4.1 继续做 `debug_metadata` 子域收组

例如继续观察并评估：

- memory 相关摘要
- follow_up 相关摘要
- session / continuity 相关摘要

这一方向的优点是：

- 继续沿当前已经开始的命名收口方向推进
- 风险相对较低
- 不会立刻牵动 runtime event 语义或顶层 contract

这一方向的代价是：

- 更偏整理和治理
- 用户侧直接可感知收益较小

### 4.2 做 `runtime_events` payload 规范化

例如统一：

- payload 字段命名
- count/status/reason 的分层方式
- event payload 粒度

这一方向的优点是：

- 标准事件目录会更工整
- 后续 observability / eval 消费会更顺

这一方向的问题是：

- 现在 event 种类还不算多
- 太早规范，容易先收出一套“看起来很整齐但还没被充分证明”的格式

### 4.3 扩顶层 `RuntimeTurnResult`

例如考虑：

- 是否把更多 side effect 结果升到顶层
- 是否让更多摘要进入正式 output contract

这一方向当前最不推荐。

原因是：

- 顶层 contract 一旦扩出去，回收成本高
- 现在很多信息仍然更适合留在 `runtime_events` 或 `debug_metadata`

---

## 5. 当前推荐的优先级

当前建议优先级如下：

1. `debug_metadata` 子域继续收组
2. `runtime_events` payload 规范化
3. 顶层 `RuntimeTurnResult` 扩张

这个排序背后的判断是：

- metadata 收组是当前最自然的延续动作
- event payload 规范化值得做，但还不需要立刻做
- 顶层扩张应尽量继续后置

---

## 6. 当前明确不建议立刻做的事

当前不建议马上做：

- 一次性重排所有 `runtime_events` payload
- 给 `debug_metadata` 定重型 schema
- 把更多局部 side effect 一股脑升到顶层 output
- 因为整理输出层而再次引发 execution 内部大改

这些动作都会把当前这轮“输出治理收口”推成一次更大的结构重排。

---

## 7. 当前最合理的下一步

如果下一轮继续推进 `runtime` 输出治理，当前最稳的顺序是：

1. 先继续挑一个最清楚的 `debug_metadata` 子域做最小收组
2. 再回头判断 event payload 是否已经值得统一规范
3. 最后才考虑顶层 output contract 是否还需要新增字段

也就是说，下一轮最自然的问题不是：

- “顶层还要不要长东西”

而是：

- “还有哪个 metadata 子域已经值得像 `answer_strategy` 一样先收一刀”

---

## 8. 一句话总结

当前 `runtime` 输出治理已经从“先把边界立起来”推进到了“可以开始小规模收组”的阶段。

**下一步最推荐继续治理的是 `debug_metadata` 子域，而不是立刻扩 event payload 或顶层 output。**
