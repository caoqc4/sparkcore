# Runtime Event Catalog 文档 v1.0

## 1. 文档定位

本文档用于整理 SparkCore 当前阶段 `runtime_events` 已存在的最小事件目录，并定义当前阶段的命名与 payload 粒度原则。

本文档重点回答：

- 当前 runtime 已有哪些标准事件
- 这些事件各自回答什么问题
- payload 目前应该收多大
- 哪些事件当前不建议新增

本文档不是完整 observability 体系设计，也不是 event schema 平台化方案，而是：

**runtime 输出治理从“event vs metadata 边界”推进到“当前最小 event catalog”前的整理文档。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/engineering/runtime_output_governance_decision_note_v1.0.md`
> - `apps/web/lib/chat/runtime-contract.ts`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 runtime event catalog 的目标不是扩事件数量，而是先把已经存在的事件收成一个清楚、克制、可复用的最小目录。**

一句话说：

**先把已有事件讲清楚，再决定是否值得继续长新事件。**

---

## 3. 当前 catalog 设计原则

当前 event catalog 建议遵循三条最小原则：

### 3.1 事件名回答“发生了什么过程”

事件应使用：

- 过程动词
- 结果完成态
- 稳定命名

例如：

- `memory_recalled`
- `memory_write_planned`
- `follow_up_planned`
- `assistant_reply_completed`
- `thread_state_writeback_completed`

### 3.2 payload 只保留最小标准信息

当前 payload 更适合保留：

- count
- kind / type
- 结果状态
- 最小上下文 id

不适合一开始就保留：

- 完整原因
- 原始错误对象
- 大对象快照

### 3.3 事件先服务单轮可解释性

当前 event catalog 首先服务：

- 单轮过程可见性
- eval
- 最小 observability

而不是一开始就试图变成完整监控平台事件总线。

---

## 4. 当前最小事件目录

### 4.1 `memory_recalled`

它回答：

> 本轮 memory recall 是否发生，以及大致命中情况

当前适合的最小 payload：

- `count`
- `memory_types`
- `hidden_exclusion_count`
- `incorrect_exclusion_count`

### 4.2 `memory_write_planned`

它回答：

> 本轮有没有产出 memory write request，以及大致数量/类型

当前适合的最小 payload：

- `count`
- `memory_types`

### 4.3 `follow_up_planned`

它回答：

> 本轮有没有产出 follow-up request，以及大致种类

当前适合的最小 payload：

- count
- kinds

### 4.4 `answer_strategy_selected`

它回答：

> 本轮回复策略最终选成了什么

当前适合的最小 payload：

- `question_type`
- `strategy`
- `reason_code`
- `priority`
- `continuation_reason_code`
- `reply_language`

### 4.5 `assistant_reply_completed`

它回答：

> 本轮 assistant reply 是否已完成，以及最小 completion 摘要

当前适合的最小 payload：

- `thread_id`
- `agent_id`
- `recalled_count`
- `message_type`
- `language`

### 4.6 `thread_state_writeback_completed`

它回答：

> 本轮 thread state writeback 这一标准过程是否完成，以及最小结果状态

当前适合的最小 payload：

- `status`
- `repository`

当前明确不建议把：

- `reason`
- 原始错误
- state diff

直接塞进这个 event。

---

## 5. 当前事件间的职责分工

当前这些事件并不试图覆盖 runtime 的所有细节，而是共同回答三类问题：

### 5.1 recall / planning 是否发生

由：

- `memory_recalled`
- `memory_write_planned`
- `follow_up_planned`

承接。

### 5.2 reply 是按什么策略完成的

由：

- `answer_strategy_selected`
- `assistant_reply_completed`

承接。

### 5.3 附带状态刷新是否发生

由：

- `thread_state_writeback_completed`

承接。

一句话说：

**当前 catalog 已经足以覆盖“回忆、规划、回复、附带状态刷新”这四类最小过程。**

---

## 6. 当前不建议新增的事件

当前不建议马上新增：

- `thread_state_writeback_failed`
- `thread_state_writeback_skipped`
- `memory_write_executed`
- `follow_up_executed`
- 更细粒度的 prompt / model invoke 事件

原因是：

- 现在先用统一 completed event + status 已经够了
- 再细分会让 catalog 很快变重
- 这些更适合等 event catalog 稳一点后再决定

---

## 7. 当前与 `debug_metadata` 的关系

当前建议继续维持：

- event 回答：发生了什么标准过程
- metadata 回答：这轮为什么这样、有哪些最小调试摘要

例如：

### thread state writeback

- event:
  - `status`
  - `repository`
- metadata:
  - `status`
  - `repository`
  - `reason?`

也就是说，event catalog 不是为了替代 metadata，而是为了给标准过程建立统一事件面。

---

## 8. 当前最合理的下一步

当前更合理的下一步不是继续长新事件，而是：

1. 先接受当前最小 catalog 已成立
2. 再继续观察 typed payload 是否已经够稳定
3. 最后才决定是否要继续收：
   - event versioning
   - event source tagging

也就是说，当前先不追求“更多事件”，而是先守住“更清楚的最小事件目录”。

---

## 9. 结论

当前 runtime event catalog 最合理的状态，是：

**先用一个很克制的最小目录，把已存在事件的职责、命名和 payload 粒度讲清楚。**

更稳的顺序是：

**先整理已有事件，再决定是否值得扩新事件，而不是一边发现新信息一边继续往 catalog 里堆。**
