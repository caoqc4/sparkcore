# Session 下一阶段决策说明 v1.0

## 1. 文档定位

本文档用于说明 SparkCore 当前 `session` 主线为什么适合先停在当前节点，以及下一阶段更合理的推进顺序是什么。

本文档不重复 session 总设计，也不重复阶段总结，而是专门回答：

- 为什么当前不应立刻进入 `thread_state` 持久化
- 为什么当前不应直接进入 compaction
- session 下一阶段真正值得推进的第一步是什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / session mainline 收口后
> 相关文档：
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`

---

## 2. 当前状态的最准确判断

当前 session 主线已经达到一个健康节点：

- `SessionContext` 已有第一版可执行实现
- `ThreadStateRecord` 已有第一版代码壳
- `prepareRuntimeSession(...)` 已开始最小消费 `thread_state`
- 设计文档、主文档、阶段总结都已经同步

这意味着当前状态不是：

- “session 还只是 runtime helper”

也不是：

- “session 已经成熟到该立刻做持久化状态系统”

而是：

**session 主干已经形成，正式状态层已开始进入主流程，但仍处于受控、未持久化阶段。**

---

## 3. 为什么现在不建议立刻进入 `loadThreadState(...) / persistence`

原因不是这件事不重要，而是：

### 3.1 当前边界刚刚稳定

我们刚刚才把下面这条线收清楚：

- `thread`
- `thread state`
- `SessionContext`
- `prepareRuntimeSession(...)`

如果这时立刻接数据库 / repository，很容易把：

- 状态 contract
- 状态读取边界
- 持久化模型

三件事重新揉在一起。

### 3.2 当前仍缺“什么值得持久化”的更强证据

虽然 `ThreadStateRecord` 已经有了最小字段，但当前：

- `continuity_status`
- `current_language_hint`
- `last_user_message_id`
- `last_assistant_message_id`

还主要是以“默认构造 + 主流程消费”的方式在被验证。

也就是说，我们已经知道：

- 这层边界值得存在

但还没有足够证据说明：

- 哪些字段现在就值得落表
- 哪些字段后面会变

### 3.3 继续往前推，复杂度会明显上升

一旦进入持久化，你马上就会碰到：

- 表结构
- migration
- repository seam
- 何时写回
- 谁更新状态
- 并发与覆盖策略

这已经不再只是“session formalization”，而是进入了真正的状态系统。

---

## 4. 为什么现在也不建议直接进入 compaction

因为 compaction 比持久化还重。

它会连带引入：

- 状态压缩策略
- 摘要生成
- 长链裁剪
- 回写与再展开

而当前 session 主线刚刚到：

- 状态层存在
- 状态层开始被主流程感知

现在直接做 compaction，会让系统过早从：

- “收边界”

滑到：

- “建重系统”

这不是当前最优动作。

---

## 5. 当前更合理的下一阶段顺序

当前更稳的顺序是：

### Step 1

先接受当前 session 主线已经成立：

- `SessionContext`
- `ThreadStateRecord`
- `prepareRuntimeSession(...)`

### Step 2

下一轮优先做：

- `loadThreadState(...)` 的最小边界设计  
  先回答“读取入口长什么样”，而不是立刻做持久化。

### Step 3

等读取边界稳定后，再决定是否需要：

- repository seam
- migration 草案
- 默认写回策略

### Step 4

最后才考虑 compaction / summarization。

---

## 6. 当前最合理的暂停点

当前最合理的判断不是“继续猛推 session”，而是：

**先停在“状态层开始进入主流程”这个节点。**

这是一个很健康的暂停点，因为它同时满足：

- 有设计
- 有代码壳
- 有最小接线
- 有阶段总结
- 工作树干净

这意味着下次继续时，不需要再重新解释上下文。

---

## 7. 结论

当前 session 主线最合理的下一阶段，不是直接进入 `thread_state` 持久化，也不是直接进入 compaction。

更稳的顺序是：

**先把 `loadThreadState(...)` 的最小读取边界想清楚，再决定是否进入 repository / migration。**

也就是说，当前更好的动作是：

**停在这里，把下一轮主线明确为“thread state 读取边界”，而不是“thread state 持久化实现”。**
