# Session State Governance 下一阶段决策说明 v1.0

## 1. 文档定位

本文档用于对 SparkCore 当前 `session state` 这条线里：

- retry
- metrics
- compaction

这三类下一阶段能力做一次并排判断，并明确下一轮的优先级。

本文档不重复 thread state 的读取、写回、debug metadata 设计，而是重点回答：

- 为什么现在不建议三件事一起推进
- 三者里当前最值得优先推进的是哪个
- 另外两件为什么先不动
- 当前明确不建议立刻做什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / session state governance next step
> 相关文档：
> - `docs/engineering/session_state_runtime_integration_decision_note_v1.0.md`
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_trigger_design_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_debug_metadata_design_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话结论

**当前 `session state` 已经到达“最小读取 + 最小写回 + 最小调试可见性”都成立的健康节点；下一轮如果继续推进治理层，最值得优先推进的是 `metrics / observability` 的边界说明，而不是 retry，也不是 compaction。**

---

## 3. 当前三类能力的共同背景

当前 `session state` 已经具备：

- `ThreadStateRecord`
- 默认真实后端读取
- `ThreadStateRepository.saveThreadState(...)`
- `runPreparedRuntimeTurn(...)` 内的 soft-fail writeback
- `debug_metadata.thread_state_writeback`

这意味着：

- 最小状态刷新链已经成立
- 主流程与 side effect 的边界已经成立
- 写回结果也已经开始有最小可见性

所以现在下一步如果继续，已经不再是“先把基本边界立起来”，而是开始进入：

- 失败后怎么治理
- 结果怎么观测
- 状态怎么演化

这三件事都重要，但性质并不一样，不能一起推进。

---

## 4. 为什么现在不建议优先做 retry

retry 看起来很自然，但当前并不是最值得先开的那一刀。

### 4.1 当前还缺足够稳定的失败分类

现在我们只知道 writeback 可能：

- `written`
- `skipped`
- `failed`

但还没有足够清楚地区分：

- 临时后端失败
- 输入条件不足导致的 skip
- 持久化冲突
- 代码错误

如果现在直接做 retry，很容易把：

- 失败语义
- 重试策略
- side effect 边界

一起揉进 execution 层。

### 4.2 retry 会明显加重 runtime 责任

一旦进入 retry，你马上就会碰到：

- 同步重试还是异步补偿
- retry 次数
- 是否需要 dead-letter
- writeback 是否还算 soft-fail

这已经接近“状态任务系统”了，而不是当前阶段最该先做的事。

---

## 5. 为什么现在也不建议优先做 compaction

compaction 比 retry 还重。

### 5.1 当前 thread state 仍然是最小刷新态

现在真正落地的 thread state 刷新内容仍然只是：

- `current_language_hint`
- `continuity_status`
- `last_user_message_id`
- `last_assistant_message_id`

这还远远没到需要做摘要压缩的程度。

### 5.2 compaction 会直接把系统推进到状态演化层

一旦开始 compaction，你很快就会碰到：

- 状态压缩策略
- 历史窗口裁剪
- summary 字段
- 再展开与回填

这不再是“最小 session state”，而是下一阶段的状态治理系统。

所以 compaction 现在并不是最优先，而是明显应该后置。

---

## 6. 为什么当前更值得先补 metrics / observability

三者里，当前最值得先推进的是：

**metrics / observability 边界说明**

原因有三点。

### 6.1 它不会破坏当前 soft-fail 语义

相比 retry，metrics 不会立刻改变主流程行为。

它更像在回答：

- 这条 side effect 链到底发生了多少次
- `written / skipped / failed` 大概比例如何
- 当前真实后端写回是否稳定

这能先帮助我们判断系统状态，而不是先改变系统行为。

### 6.2 它比 compaction 更贴近当前阶段问题

当前真正值得知道的是：

- 写回稳定不稳定
- skip 多不多
- debug_metadata 是否已经够用

而不是：

- 状态怎么做长期压缩

所以 metrics 更贴近当前真实问题。

### 6.3 它能为 retry 是否值得做提供证据

如果没有最小观测面，我们就很难判断：

- retry 是否真的需要
- 失败是否只是偶发
- 失败是不是主要来自输入不满足，而不是后端异常

所以 metrics 其实是 retry 的前置证据层。

---

## 7. 下一阶段优先级建议

当前建议优先级如下：

### Priority 1

`metrics / observability`：

- 先写一个最小边界说明  
  重点回答 thread state writeback 是否需要：
  - runtime event
  - counter
  - log / trace

### Priority 2

`retry`：

- 暂不实现  
- 等最小观测面明确后，再判断是否真的需要

### Priority 3

`compaction`：

- 明确后置  
- 当前阶段先不进入

---

## 8. 当前明确不建议立刻做的事

当前不建议马上做：

- 同步 retry
- 异步补偿队列
- dead-letter
- `RuntimeTurnResult` 顶层扩字段
- thread state compaction
- session summary 回写

这些事情不是永远不做，而是当前阶段做它们的收益明显低于复杂度。

---

## 9. 结论

当前 `session state` 这条线如果继续推进治理层，不应该把 retry / metrics / compaction 一起开。

更稳的顺序是：

**先补 metrics / observability 的最小边界说明，再决定 retry 是否真的值得做，compaction 继续后置。**

也就是说，当前更好的动作是：

**先回答“怎么观测”，再回答“要不要重试”，最后才回答“要不要压缩”。**
