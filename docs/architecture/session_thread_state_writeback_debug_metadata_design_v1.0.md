# Session Thread State Writeback Debug Metadata 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- thread state writeback result 是否进入 `debug_metadata`

这一层的最小边界。

本文档重点回答：

- 当前 writeback result 是否值得显式暴露
- 如果暴露，为什么优先挂在 `debug_metadata`
- 第一版应该暴露哪些最小字段
- 它与 `RuntimeTurnResult` 顶层字段、retry、metrics、compaction 的边界是什么

本文档不是 writeback trigger 设计，也不是 runtime output 大改设计，而是：

**thread state 从“最小写回已进入主流程”推进到“是否需要最小调试可见性”前的设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state runtime integration next step
> 相关文档：
> - `docs/engineering/session_state_runtime_integration_decision_note_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_trigger_design_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 thread state writeback result 已经以最小摘要形式进入 `debug_metadata`；后续如果继续推进，最稳的下一步不是立刻提升成 `RuntimeTurnResult` 顶层字段，而是先观察这层调试可见性是否已经足够。**

一句话说：

**先让 writeback 对调试可见，再决定是否值得进入更正式的 runtime output contract。**

当前已落地的方向是：

- 顶层 `RuntimeTurnResult` 不扩字段
- `debug_metadata` 已增加一个很小的 `thread_state_writeback` 摘要
- 当前只暴露：
  - `status`
  - `repository`
  - `reason?`

---

## 3. 当前为什么值得补这层

现在 `session` 这条线已经具备：

- 默认真实后端读取
- `ThreadStateRepository.saveThreadState(...)`
- `maybeWriteThreadStateAfterTurn(...)`
- `runPreparedRuntimeTurn(...)` 内的 soft-fail writeback side effect

这意味着最小状态刷新链已经成立。

但当前还没有明确：

- 本轮到底有没有触发 writeback
- 是 `written`、`skipped`，还是 `failed`
- 失败时是逻辑 skip，还是后端保存失败

如果这层一直完全不可见，后面会有两个现实问题：

1. 调试 runtime 回合时，看不到 thread state side effect 是否真的发生
2. 一旦后面想加 retry / metrics，就会缺少第一版结果面

所以更稳的动作已经变成：

**先以最小调试可见面落地，再决定它是否值得升级成正式顶层 contract。**

---

## 4. 为什么优先挂在 `debug_metadata`

当前有三种候选落点：

### 方案 A：完全不暴露

优点：

- 最保守
- 不动 runtime output

缺点：

- 调试成本高
- 后面继续推进时缺少第一版观测面

### 方案 B：直接加进 `RuntimeTurnResult` 顶层

优点：

- 最显式
- 契约最强

缺点：

- 现在太重
- 会牵动 Web / IM / route / harness 全部对齐
- 过早把 side effect 提升成主结果一部分

### 方案 C：先挂进 `debug_metadata`

优点：

- 有可见性
- 对 runtime 主 contract 扰动最小
- 后续可以继续判断是否值得升级

缺点：

- 语义比顶层字段弱
- 更偏调试信息，而不是正式业务输出

### 当前推荐

**先选方案 C。**

因为当前 thread state writeback 的定位仍然是：

- runtime 附带 side effect

不是：

- 本轮核心业务输出

---

## 5. 当前最重要的边界判断

当前建议把这几层继续分开：

### 5.1 `RuntimeTurnResult`

负责：

> 当前回合的正式主结果

### 5.2 `debug_metadata`

负责：

> 对调试与验证有帮助，但当前不值得提升成顶层 contract 的附加结果

### 5.3 thread state writeback result

负责：

> 描述最小状态写回是否发生，以及为什么发生/未发生

### 5.4 retry / metrics

负责：

> 写回失败后的更重治理语义

一句话说：

**当前先让 writeback result 成为 debug-visible outcome，而不是正式 runtime outcome。**

---

## 6. 当前建议的最小字段

当前建议先把 `debug_metadata.thread_state_writeback` 收成：

```ts
type ThreadStateWritebackDebugMetadata = {
  status: "written" | "skipped" | "failed";
  repository: "supabase" | "in_memory" | "unknown";
  reason?: string;
};
```

字段解释：

### `status`

必须有。

它回答：

> 这一轮 thread state 写回最终发生了什么

### `repository`

建议有。

它回答：

> 当前这次写回最终是落在哪个 repository 上

因为现在默认读取已经优先走 Supabase，失败时才回退 in-memory，所以这个字段对调试很有价值。

### `reason`

仅在：

- `skipped`
- `failed`

时可选返回。

它只承接第一版最小原因，例如：

- `missing_assistant_message_id`
- `missing_thread_state`
- `save_failed`

当前不建议暴露：

- 完整 SQL error
- repository payload 明细
- state diff
- before/after 快照

---

## 7. 当前不建议暴露的内容

当前第一版明确不建议把这些塞进 `debug_metadata`：

- 完整 `ThreadStateRecord`
- 本轮保存前后的字段对比
- `Supabase` 原始错误对象
- `saveThreadState(...)` 的原始入参
- retry 次数或 retry 决策

原因很简单：

- 这会把 `debug_metadata` 从“最小调试摘要”变成“半个状态调试面板”
- 当前还没有足够证据证明这些信息值得长期保留

---

## 8. 当前建议的推进顺序

当前更稳的顺序是：

### Step 1

先接受当前 thread state writeback 已进入主流程，但仍然是 soft-fail side effect。

### Step 2

当前已经补上：

- `debug_metadata.thread_state_writeback`

### Step 3

等这层调试可见性再稳定一点后，再决定是否需要：

- 更正式的 writeback result contract
- retry / metrics
- 顶层 `RuntimeTurnResult` 扩字段

### Step 4

最后才考虑：

- compaction
- 更复杂的状态演化与治理

---

## 9. 结论

当前 thread state writeback result 最合理的下一步，不是立刻升级成顶层 runtime output，也不是继续保持完全不可见。

更稳的顺序当前已经前移成：

**先以最小摘要形式进入 `debug_metadata`，当前只提供 `status / repository / reason?` 这几个字段。**

也就是说，当前更好的动作是：

**先接受“调试可见”已经落地，再决定是否值得升级成更正式的 runtime contract。**
