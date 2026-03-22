# Runtime Output 下一分支决策说明 v1.0

## 1. 文档定位

本文档用于固定 SparkCore 当前 `runtime` 输出治理在完成第一轮 metadata 子域收口之后的下一分支判断，重点回答：

- 当前 `runtime` 输出治理已经推进到哪里
- 下一步最值得进入哪条新分支
- 哪些分支现在明确不急着做

本文档不是新的 schema 设计，也不是立刻改代码的实施计划，而是：

**在 `answer_strategy`、`memory`、`follow_up` 三个最自然的 metadata 子域都已收成代码事实后，对下一档复杂度做一次最小决策收口。**

> 状态：阶段决策
> 对应阶段：Phase 1 / runtime output governance next branch
> 相关文档：
> - `docs/engineering/runtime_output_next_phase_decision_note_v1.0.md`
> - `docs/engineering/runtime_output_subdomain_prioritization_note_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`

---

## 2. 一句话结论

**当前 `runtime` 输出治理最稳的下一步，不是立刻继续扩新的 metadata 子域代码，而是先评估 `session / continuity` 是否值得成为下一个收口对象；`runtime_events` payload 规范化排第二，顶层 output contract 扩张继续排后。**

一句话说：

**先判断下一个子域值不值得收，再判断 event 要不要变细，顶层继续别急着长。**

---

## 3. 当前已经完成的第一轮收口

当前 `runtime` 输出治理已经完成的包括：

- `runtime_events vs debug_metadata` 边界
- `runtime event catalog`
- `debug_metadata` 命名收口方向
- `answer_strategy` 最小 metadata 分组
- `memory` 最小 metadata 分组
- `follow_up` 最小 metadata 分组

这意味着当前已经不再处于：

- “先把最自然的 metadata 子域补起来”

而是进入了：

- **要不要继续开新子域，还是转去别的治理层**

---

## 4. 当前最自然的三个候选分支

### 4.1 `session / continuity` 子域

当前最值得优先评估。

原因是：

- 它已经在 runtime 内部真实存在
- 已经有 continuity signal / context pressure / recent turn 等判断
- 它和当前 `session` 主线也已经有足够多代码事实

但它的问题也很明显：

- 很容易一脚踏进更重的 session diagnostics
- 很容易把最小摘要做成半个状态面板

所以当前最合适的动作不是直接开做代码，而是先判断：

- **它是否真的已经到了值得像前三个子域一样先收一刀的时机**

### 4.2 `runtime_events` payload 规范化

当前排第二。

原因是：

- 事件目录已经有了
- event 数量也开始增多

但它的问题是：

- 现在每个 event payload 还不算很多
- 太早规范，很容易先做出一套工整但未必真正稳定的字段格式

所以这一步值得做，但还不必先于下一个 metadata 子域判断。

### 4.3 顶层 output contract 扩张

当前继续排后。

原因是：

- 顶层 output 一旦扩出去，回收成本高
- 目前很多内容仍然更适合留在 `runtime_events` 或 `debug_metadata`

---

## 5. 当前推荐的优先级

当前建议优先级如下：

1. 评估 `session / continuity` 子域
2. `runtime_events` payload 规范化
3. 顶层 output contract 扩张

这个排序背后的判断是：

- 下一个 metadata 子域仍然比 event payload 规范化更自然
- 但新的子域已经不再像前三个那样显而易见，所以要先判断再动手
- 顶层扩张继续后置

---

## 6. 当前明确不建议立刻做的事

当前不建议马上做：

- 直接开始 `session / continuity` 代码改动
- 一次性重排所有 runtime event payload
- 因为输出治理再次拉大 runtime execution 内部改动
- 把更多局部摘要升级到顶层 output

这些动作都会让当前“先判断再推进”的节奏重新失控。

---

## 7. 当前最合理的下一步

如果下一轮继续推进 `runtime` 输出治理，当前最稳的顺序是：

1. 先写一份 `session / continuity` 子域的最小 metadata 分组判断
2. 再决定值不值得真的落代码
3. 然后再回头看 event payload 规范化

也就是说，下一轮最自然的问题不是：

- “event 要不要变整齐”

而是：

- “`session / continuity` 是否真的已经到了值得进入 `debug_metadata` 子域收口的时机”

---

## 8. 一句话总结

当前 `runtime` 输出治理已经完成第一轮最自然子域收口。

**下一步最推荐先判断的，不是 event payload，也不是顶层扩张，而是 `session / continuity` 这条下一分支是否值得打开。**
