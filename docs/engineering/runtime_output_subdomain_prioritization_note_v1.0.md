# Runtime Output 子域优先级说明 v1.0

## 1. 文档定位

本文档用于固定 SparkCore 当前 `runtime` 输出治理在子域层面的下一阶段优先级判断，重点回答：

- 当前 `debug_metadata` 哪些子域已经开始收口
- 下一步最值得继续收的子域是哪一个
- 哪些子域现在明确不急着做

本文档不是新的 output schema，也不是立刻改代码的实现计划，而是：

**在 `answer_strategy` 与 `memory` 两个子域都已进入最小 metadata 分组之后，对下一刀优先级做一次最小决策收口。**

> 状态：阶段决策
> 对应阶段：Phase 1 / runtime output governance subdomain prioritization
> 相关文档：
> - `docs/engineering/runtime_output_next_phase_decision_note_v1.0.md`
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_answer_strategy_debug_metadata_grouping_v1.0.md`
> - `docs/architecture/runtime_memory_debug_metadata_grouping_v1.0.md`

---

## 2. 一句话结论

**当前 `runtime` 输出治理最稳的下一步，不是继续随机挑一个 metadata 域往下收，而是优先评估 `follow_up` 子域；`session / continuity` 排第二，`model / provider` 继续后置。**

一句话说：

**先看已经有真实 side effect 回流意义的子域，再看更偏内部诊断的子域。**

---

## 3. 当前已经开始收口的子域

当前已经开始进入最小 metadata 分组的包括：

- `answer_strategy`
- `memory`

它们的共同特点是：

- 都已经有稳定的最小摘要
- 都已经有对应的标准过程事件或邻近输出
- 都适合先以轻量对象形式进入 `debug_metadata`

这意味着下一步已经不再需要继续证明“子域分组有没有价值”，而是要开始判断：

- **下一个值得被这样处理的子域是谁**

---

## 4. 当前最自然的几个候选子域

### 4.1 `follow_up`

当前最值得优先评估。

原因是：

- `follow_up_requests` 已经是 runtime 顶层显式产物
- 也已经有 executor / persistence / sender 相关链路
- 当前如果需要最小摘要，能很自然回答：
  - request count
  - accepted / planned 情况
  - sender / execution 相关最小信息是否值得保留在 metadata

它的优点是：

- 与现有系统能力强相关
- 信息价值高
- 很可能比纯内部诊断字段更值得先治理

### 4.2 `session / continuity`

这个方向也合理，但排第二。

原因是：

- 它和当前 runtime/session 主线是强相关的
- 已经有 continuity / context pressure 相关判断

但它的问题是：

- 很容易一步走进更重的 session diagnostics
- 边界比 `follow_up` 更容易变宽

所以当前更适合第二优先。

### 4.3 `model / provider`

当前继续后置。

原因是：

- 现有 `model_profile_id`、reply language 等摘要已经够用
- 这一域更偏内部推理/模型选择调试
- 现在继续扩，很容易长成一组低信息密度字段

---

## 5. 当前推荐的优先级

当前建议优先级如下：

1. `follow_up`
2. `session / continuity`
3. `model / provider`

这个排序背后的判断是：

- `follow_up` 最接近已有真实 side effect 与产品行为
- `session / continuity` 值得做，但更容易扩宽
- `model / provider` 当前信息价值相对最低

---

## 6. 当前明确不建议立刻做的事

当前不建议马上做：

- 三个子域一起并行收组
- 为了收组就去扩顶层 output contract
- 因为 metadata 治理重新拉大 runtime execution 代码改动
- 把所有内部 diagnostics 都往 `debug_metadata` 里搬

这些动作都会让当前这轮“轻量治理”重新失控。

---

## 7. 当前最合理的下一步

如果下一轮继续推进 `runtime` 输出治理，当前最稳的顺序是：

1. 先为 `follow_up` 子域写一份最小 metadata 分组设计稿
2. 再判断这个方向是否值得真的落代码
3. 然后再回头看 `session / continuity`

也就是说，下一轮最自然的问题不是：

- “还有什么都能收”

而是：

- “`follow_up` 是否已经到了值得像 `answer_strategy`、`memory` 一样先收一刀的时机”

---

## 8. 一句话总结

当前 `runtime` 输出治理已经进入“子域优先级选择”阶段。

**下一步最推荐优先评估的不是 `session` 或 `model`，而是 `follow_up`。**
