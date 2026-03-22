# Runtime Event vs Debug Metadata 边界说明 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `runtime_events`
- `debug_metadata`

这两层之间的最小准入边界。

本文档重点回答：

- 哪类信息应该进入 `runtime_events`
- 哪类信息应该只留在 `debug_metadata`
- 哪类信息两边都不该放
- 当前已落代码的 session state writeback 应该如何理解其 event / metadata 分工

本文档不是 runtime 总 contract 重写，也不是 event catalog 全量设计，而是：

**runtime 输出治理从“总决策说明”推进到“event 与 metadata 具体准入边界”前的最小说明稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/engineering/runtime_output_governance_decision_note_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_debug_metadata_design_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_observability_design_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前最稳的边界是：`runtime_events` 只承接“本轮发生了什么标准过程”，`debug_metadata` 只承接“这轮为什么这样、有哪些最小调试摘要”；同一件事可以同时有 event 与 metadata，但两者必须服务不同问题。**

一句话说：

**event 讲“发生了什么”，metadata 讲“为什么这样”。**

---

## 3. 为什么现在必须把这层讲清楚

现在 runtime 输出已经不只包含：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`

还开始包含越来越多的运行期信息，例如：

- answer strategy
- recalled memory count
- thread state writeback result
- thread state writeback event

如果不把 `runtime_events` 和 `debug_metadata` 的边界收清，后面很容易发生三种问题：

1. 同一份信息在两边无差别重复
2. event 越来越像调试垃圾桶
3. metadata 越来越像半个过程日志

所以这一步的目标不是减少信息，而是：

**让两层输出回答不同问题。**

---

## 4. `runtime_events` 当前应该回答什么

当前 `runtime_events` 更适合回答：

> 这一轮里，发生了哪些标准、可命名、可复用的过程节点？

它更像：

- 单轮标准事件流
- 后续 eval / observability / trace 的统一事件面

所以适合进 event 的信息通常具备三个特征：

### 4.1 它是过程节点，而不是局部解释

例如：

- `memory_recalled`
- `memory_write_planned`
- `follow_up_planned`
- `assistant_reply_completed`
- `thread_state_writeback_completed`

### 4.2 它有稳定命名空间

也就是说，它应该能比较自然地收成：

- `type`
- `payload`

并且在不同入口、不同环境下仍有同样语义。

### 4.3 它未来可能被复用

例如可能被：

- route 调试
- eval
- 观测面
- trace

复用。

---

## 5. `debug_metadata` 当前应该回答什么

当前 `debug_metadata` 更适合回答：

> 这一轮为什么会这样、有哪些最小调试摘要值得看？

它更像：

- 单轮局部说明
- 开发期调试摘要
- 当前还不值得升级成标准 contract 的附加信息

所以适合进 metadata 的信息通常具备三个特征：

### 5.1 它是局部原因或摘要

例如：

- `answer_strategy_reason_code`
- `recalled_memory_count`
- `thread_state_writeback.reason`

### 5.2 它对主流程调试有用，但不值得进入标准事件面

它可能很有价值，但如果进入 event，会让 event payload 太重或太碎。

### 5.3 它仍处在可变阶段

也就是说，它当前还可能调整命名、字段、粒度，所以先留在 metadata 更稳。

---

## 6. 哪些信息可以同时存在于两层

当前允许同一件事在 event 与 metadata 同时存在，但前提是：

- 两边回答的问题不同

### 当前最典型样本：thread state writeback

当前合理分工应是：

#### `runtime_events`

回答：

> thread state writeback 这件标准过程有没有完成，结果状态是什么？

因此当前只保留最小：

- `status`
- `repository`

#### `debug_metadata`

回答：

> 如果这次写回被 skip 或失败，局部原因是什么？

因此当前保留：

- `status`
- `repository`
- `reason?`

一句话说：

**event 保留标准过程面，metadata 保留局部解释面。**

---

## 7. 哪些信息两边都不该放

当前有些信息，不论 event 还是 metadata，都不该急着放进去：

- 原始 SQL error 对象
- 完整 state diff
- repository save payload
- 大段 prompt / model 原始输入
- 过多的实现细节字段

这些信息的问题不是“完全没用”，而是：

- 现在进入哪一层都会让输出面变脏
- 更适合留在更局部的调试入口或未来专门 observability 工具

---

## 8. 当前建议的准入规则

当前可以用一个很简单的判断顺序：

### Rule 1

如果它回答的是：

> “本轮发生了什么标准过程？”

优先考虑进 `runtime_events`。

### Rule 2

如果它回答的是：

> “这轮为什么这样，或者有哪些局部调试摘要？”

优先考虑进 `debug_metadata`。

### Rule 3

如果它既不是稳定过程，也不是最小调试摘要，就先别进任何一层。

---

## 9. 当前明确不建议立刻做的事

当前不建议马上做：

- 把 `debug_metadata` 里所有信息都升级成 event
- 把 event payload 扩成带完整原因的大对象
- 为了统一而强行删除所有 metadata
- 为了方便而继续让 event / metadata 字段自由增长

这些动作都会让输出治理变成“形式统一”，而不是“职责清楚”。

---

## 10. 结论

当前 `runtime_events` 与 `debug_metadata` 最合理的边界，不是二选一，而是：

**让两层回答不同问题。**

更稳的顺序是：

- event 负责标准过程
- metadata 负责最小调试摘要
- 两边都不承接重实现细节

也就是说，当前更好的动作是：

**先用“发生了什么 / 为什么这样”这条线把输出层分清，再决定后面每条支线的新信息该往哪里挂。**
