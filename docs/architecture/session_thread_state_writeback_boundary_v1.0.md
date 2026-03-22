# Session Thread State 写回边界说明 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- `thread state` 写回边界

这一层的最小范围。

本文档重点回答：

- 在真实读取链已经成立后，为什么下一步最自然是先定义写回边界
- 写回应该先负责什么，不该提前负责什么
- 它与 `prepareRuntimeSession(...)`、`ThreadStateRepository`、compaction 的边界是什么

本文档不是 thread compaction 设计，也不是完整状态机设计，而是：

**thread state 从“真实读取已成立”推进到“最小写回语义已明确”前的边界说明。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state next step
> 相关文档：
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/architecture/session_thread_state_loading_boundary_v1.0.md`
> - `docs/architecture/session_thread_state_repository_design_v1.0.md`
> - `docs/architecture/session_thread_state_supabase_repository_design_v1.0.md`
> - `apps/web/lib/chat/thread-state.ts`
> - `apps/web/lib/chat/thread-state-repository.ts`

---

## 2. 一句话结论

**当前 `session` 主线如果继续推进，最稳的下一步不是立刻写 `upsertThreadState(...)` 代码，而是先明确：thread state 写回只应承接“最小状态刷新”，不应把 compaction、摘要、复杂 patch 语义一起拖进来。**

当前真实状态已经是：

- `thread_states` 已落远端库
- `SupabaseThreadStateRepository` 真实读取已验证通过
- 默认 `loadThreadState(...)` 已优先走 Supabase

所以下一步最值得先定清楚的是：

- **什么时点允许写回**
- **第一版写回写哪些字段**
- **写回层和 runtime / compaction 的边界**

---

## 3. 当前为什么该先补这层

现在 `session` 这条线已经具备：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `ThreadStateRepository`
- `SupabaseThreadStateRepository`
- 默认真实后端读取

这意味着读取链已经成立。下一步如果还继续，最自然就会碰到：

- `continuity_status` 何时更新
- `current_language_hint` 何时刷新
- `last_user_message_id / last_assistant_message_id` 何时推进

如果不先定义写回边界，后面很容易把：

- runtime 回合结束逻辑
- session 状态刷新
- compaction / summarization

重新混成一团。

所以当前更稳的动作不是直接写 repository 接口，而是先把：

**写回边界**

单独说清楚。

---

## 4. 当前最重要的边界判断

当前建议把这几层继续分开：

### 4.1 `prepareRuntimeSession(...)`

负责：

> 本轮如何消费 thread state

不负责：

> 决定何时写回 thread state

### 4.2 thread state writeback

负责：

> 在一轮执行结束后，把最小 session 状态刷新回去

### 4.3 `ThreadStateRepository`

未来负责：

> 写回后端接口

### 4.4 compaction / summarization

负责：

> 长链压缩与摘要沉淀

当前不建议把 4.2 和 4.4 混在一起。

一句话说：

**thread state 写回是“局部状态刷新”，不是“会话压缩系统”。**

---

## 5. 当前推荐的两种路线

### 方案 A：先做最小全量 replace 写回

形式类似：

```ts
saveThreadState(record: ThreadStateRecord): Promise<void>
```

优点：

- 最简单
- 最不容易把 patch 语义提前做复杂
- 和当前 `ThreadStateRecord` 代码壳对齐

缺点：

- 容易让上层过早构造“完整状态对象”
- 后面如果只想改两个字段，会显得偏重

### 方案 B：先做最小 patch 写回

形式类似：

```ts
updateThreadState(input: {
  threadId: string;
  agentId: string;
  patch: {
    current_language_hint?: ...
    continuity_status?: ...
    last_user_message_id?: ...
    last_assistant_message_id?: ...
  };
}): Promise<void>
```

优点：

- 更贴近真实使用场景
- 更容易把“本轮刷新什么”表达清楚

缺点：

- 容易太早卷入 patch 语义和冲突策略

### 当前推荐

**先按方案 A 的思路收边界，但字段面只允许“最小刷新字段集”。**

也就是说：

- 接口先保持简单
- 语义先只允许最小状态刷新
- 不急着进入复杂 patch / merge 规则

---

## 6. 当前建议第一版只写哪些字段

当前第一版最值得允许写回的，是那些：

- 已被主流程稳定使用
- 不涉及长链摘要
- 不需要复杂冲突合并

当前推荐只包括：

- `current_language_hint`
- `continuity_status`
- `last_user_message_id`
- `last_assistant_message_id`
- `updated_at`

当前不建议第一版就写：

- `focus_mode`
- `recent_turn_window_size`
- `state_version` 的复杂 bump 规则
- lifecycle 的复杂切换

原因很简单：

- 这些字段当前还没有稳定写回时机
- 过早加入只会把第一版写回做重

---

## 7. 当前建议的最小写回时机

当前更稳的写回时机应该是：

### 7.1 一轮 runtime 结束后

也就是已经有：

- 最新用户消息锚点
- 最新 assistant 消息锚点
- 本轮语言判断
- 本轮 continuity 判断

之后，再做一次最小状态刷新。

### 7.2 不在 `prepareRuntimeSession(...)` 内写

因为 `prepareRuntimeSession(...)` 是读路径。

如果把写回塞进去，很快就会变成：

- 读状态
- 推断状态
- 顺手写状态

这会把 session preparation 再次变成“半个状态系统”。

### 7.3 不在 compaction 里顺手写

compaction 是后续更重的一层。

第一版 thread state 写回不应该依赖 compaction 存在。

---

## 8. 当前不建议立刻做的事

即便下一步开始正式讨论写回，当前也不建议立刻一起做：

- `upsert + patch + merge` 三套接口
- `state_version` 冲突保护
- compare-and-swap
- compaction 触发
- lifecycle 自动切换
- “无消息也写回”的后台刷新

因为这些都会让当前这一步从：

**最小状态刷新**

膨胀成：

**完整 session state system**

---

## 9. 当前建议的推进顺序

### Step 1

先固定：

- thread state 写回边界

### Step 2

再固定：

- 第一版允许刷新的字段集

### Step 3

再决定：

- `ThreadStateRepository` 是否加最小写接口

### Step 4

再决定：

- runtime 回合结束后，哪一层触发写回

### Step 5

最后才讨论：

- patch 语义
- version 冲突
- compaction 耦合

---

## 10. 当前最合理的 DoD

当前这一步如果算完成，应该满足：

- 已明确 thread state 写回不是 compaction
- 已明确第一版只做最小状态刷新
- 已明确第一版最值得写回的字段集
- 已明确写回时机在 runtime 回合结束后，而不是 session preparation 内
- 已明确下一步应先做 repository 写接口设计，而不是直接写大量实现

---

## 11. 当前结论

**当前 `session` 主线在真实读取链已经成立后，最稳的下一步不是直接上 `upsertThreadState(...)`，而是先把“最小状态刷新”的写回边界定清楚。**

也就是说，下一轮如果继续推进，更合理的顺序应是：

1. 先定义写回边界
2. 再定义 repository 最小写接口
3. 再决定 runtime 回合结束后的触发位置
4. 最后才进入 compaction 与更复杂状态语义
