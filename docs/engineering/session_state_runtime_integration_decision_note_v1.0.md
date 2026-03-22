# Session State Runtime Integration 阶段决策说明 v1.0

## 1. 文档定位

本文档用于说明 SparkCore 当前 `session state` 为什么适合先停在“读取链已成立、最小写回已进入 runtime 主流程”的节点，以及下一阶段更合理的推进顺序是什么。

本文档不重复 session 总设计，也不重复 thread state 读写接口设计，而是专门回答：

- 为什么当前不应立刻进入 retry / metrics / compaction
- 为什么当前不应直接继续扩 `RuntimeTurnResult`
- 当前 `session state` runtime integration 最值得先补的下一层边界是什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / session state runtime integration
> 相关文档：
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_trigger_design_v1.0.md`
> - `docs/architecture/session_thread_state_write_repository_design_v1.0.md`
> - `docs/architecture/session_thread_state_supabase_repository_design_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 当前状态的最准确判断

当前 `session` 主线已经从“状态读取开始进入主流程”，推进到了“最小状态写回开始进入 runtime 主流程”。

当前已经具备：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `ThreadStateRepository`
- `SupabaseThreadStateRepository`
- 默认真实后端读取
- `saveThreadState(...)`
- `maybeWriteThreadStateAfterTurn(...)`
- `runPreparedRuntimeTurn(...)` 中的 soft-fail writeback trigger

这意味着当前状态不是：

- “session state 还只是设计稿”

也不是：

- “session state 已经进入完整状态系统阶段”

而是：

**session state 的最小 runtime integration 已经成立，但仍处于受控、轻量、未扩张的第一版写回阶段。**

---

## 3. 为什么现在不建议立刻做 retry / metrics / compaction

原因不是这些事情不重要，而是当前最小 integration 刚刚稳定。

### 3.1 当前写回语义刚刚被主流程验证

现在主流程已经具备：

- 主 reply 成功后触发 thread state 最小写回
- 写回失败不影响主 reply
- 默认真实读取与最小 upsert 写回

这说明当前最值钱的信息是：

- 这条 side effect 链能不能稳定存在

而不是：

- 它现在就应该有多复杂的失败恢复机制

### 3.2 一旦进入 retry / metrics，execution 边界会明显变重

如果现在继续往前推，很快就会碰到：

- trigger result 是否要进入 `RuntimeTurnResult`
- 失败是否要记录专门事件
- retry 是同步还是异步
- metrics 打点放在哪一层

这些问题都不是不能做，而是会明显增加 runtime execution 的复杂度。

### 3.3 compaction 仍然属于再下一层

当前 thread state 写回的定位仍然是：

- 最小状态刷新

不是：

- 长链摘要
- 状态压缩
- 状态演化策略系统

如果现在直接进入 compaction，会让系统从：

- “边界刚成立的状态刷新”

过早滑到：

- “更重的状态治理系统”

---

## 4. 为什么当前也不建议立刻扩 `RuntimeTurnResult`

当前 `runPreparedRuntimeTurn(...)` 已开始触发 thread state 写回，但仍然没有把结果显式塞回 `RuntimeTurnResult`。

这个边界当前值得先维持，原因有三点：

### 4.1 当前 soft-fail 语义是清楚的

现在的真实判断已经很明确：

- reply 主结果更重要
- thread state 写回是附带 side effect
- 写回失败先不打爆主回合

既然如此，第一版不把它提升成顶层 runtime 输出，是合理的。

### 4.2 结果显式化一旦开始，就会牵动更多 contract

如果现在就把 writeback result 放进 `RuntimeTurnResult` 或 `debug_metadata`，下一步很快就会碰到：

- 字段命名
- 成功/失败/skip 的标准形状
- Web / IM / internal route 是否都要透出
- 哪些属于调试信息，哪些属于正式输出

这已经不是单纯的 session state 问题，而是 runtime output contract 的下一轮扩张。

### 4.3 当前更需要先确认“是否真的值得暴露”

现在这条链刚刚接进主流程，最合理的顺序是：

1. 先接受当前 soft-fail trigger 成立
2. 再判断 writeback result 是否真的值得显式化
3. 最后才决定挂到哪里

---

## 5. 当前更合理的下一阶段顺序

当前更稳的顺序是：

### Step 1

先接受当前 `session state` runtime integration 已成立：

- 真实读取已成立
- 默认真实后端读取已成立
- 最小写回已成立
- runtime 主流程已开始 soft-fail 触发写回

### Step 2

下一轮优先补：

- thread state writeback result 是否需要显式进入 `debug_metadata` 的边界说明

这一步先回答：

- 是否要暴露
- 暴露到哪层
- 暂时不暴露哪些信息

### Step 3

等结果显式化边界清楚后，再决定是否需要：

- retry
- metrics
- 更正式的 trigger result contract

### Step 4

最后才考虑：

- compaction
- summary
- 更复杂的状态演化策略

---

## 6. 当前最合理的暂停点

当前最合理的判断不是“继续顺手把 thread state 系统一直往下推”，而是：

**先停在“最小写回已进入 runtime 主流程”这个节点。**

这是一个很健康的暂停点，因为它同时满足：

- 有设计
- 有 repository contract
- 有真实后端读取
- 有真实表结构
- 有写接口
- 有 writeback helper
- 有 runtime 主流程接线
- 工作树干净

这意味着下次继续时，不需要再重新解释上下文。

---

## 7. 结论

当前 `session state` runtime integration 最合理的下一阶段，不是立刻进入 retry / metrics / compaction，也不是立刻把 writeback result 扩进顶层 runtime 输出。

更稳的顺序是：

**先把“thread state writeback result 是否进入 `debug_metadata`”这层边界想清楚，再决定是否继续扩 runtime contract。**

也就是说，当前更好的动作是：

**停在这里，把下一轮主线明确成“writeback result 显式化边界”，而不是“继续扩写回系统实现”。**
