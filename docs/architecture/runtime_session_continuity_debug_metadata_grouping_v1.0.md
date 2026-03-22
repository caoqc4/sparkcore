# Runtime Session Continuity Debug Metadata 分组文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `debug_metadata.session`

这一小组调试字段的最小分组边界。

本文档重点回答：

- 为什么 `session / continuity` 已经值得被单独评估
- 第一版如果真的收组，最适合先收哪些字段
- 哪些 session 相关信息当前仍然不建议继续塞进 `debug_metadata`
- 它与 session layer、thread state、runtime event 的边界是什么

本文档不是 session layer 总设计，也不是 thread state schema 设计，而是：

**runtime 输出治理在完成 `answer_strategy / memory / follow_up` 三个最自然子域后，对 `session / continuity` 是否值得成为下一个 metadata 子域做的最小判断。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next branch
> 相关文档：
> - `docs/engineering/runtime_output_next_branch_decision_note_v1.0.md`
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**`session / continuity` 当前确实已经到了值得单独评估的时机，但还不适合像 `answer_strategy / memory / follow_up` 那样立刻落代码；更稳的判断是：先承认它适合形成一个最小 `debug_metadata.session` 候选分组，但第一版只建议保留很轻的 continuity 摘要，不要把 session diagnostics 整块搬进来。**

一句话说：

**可以开始评估，但先别急着真的开做代码。**

---

## 3. 当前为什么值得单独评估

现在 runtime 里已经真实存在一批 session / continuity 相关判断，例如：

- `continuation_reason_code`
- `recent_raw_turn_count`
- `approx_context_pressure`
- `same_thread_continuation_applicable`
- `same_thread_continuation_preferred`

这说明 `session / continuity` 已经不是一个抽象背景概念，而是正在真实影响：

- reply strategy
- language continuity
- memory fallback
- thread state writeback

也正因为如此，它已经值得被单独评估是否进入 `debug_metadata` 子域。

但和 `answer_strategy / memory / follow_up` 相比，这一域的风险更大：

- 很容易从“最小摘要”滑进“半个 session 诊断面板”

所以当前最关键的不是立刻收，而是先判断：

- **它最小能收成什么**
- **哪些东西绝不能一起带进来**

---

## 4. 当前推荐的最小候选分组

如果后续真的要落第一版代码，当前建议最小候选是：

```ts
debug_metadata: {
  session?: {
    continuation_reason_code?: string
    recent_turn_count?: number
    context_pressure?: "low" | "medium" | "high" | "overflow"
  }
}
```

当前最适合先考虑的字段是：

- `continuation_reason_code`
- `recent_raw_turn_count`
- `approx_context_pressure`

这三个字段的共同特点是：

- 都已经是当前 runtime 真实使用的最小摘要
- 都能回答“这轮为什么倾向这样延续”
- 都还没直接变成完整状态层对象

---

## 5. 当前不建议第一版继续放进去的内容

当前不建议第一版就继续放入：

- 完整 `continuity_signals`
- `same_thread_continuation_applicable`
- `same_thread_continuation_preferred`
- `distant_memory_fallback_allowed`
- `thread_state`
- `recent_raw_turns`

原因是这些字段已经开始接近：

- 内部 decision flags
- session implementation details
- state layer consumption object

继续塞入会让 `debug_metadata.session` 很快从“最小摘要”变成“半个内部调试面板”。

---

## 6. 与 session layer / thread state / runtime event 的边界

当前推荐边界是：

### 6.1 session layer / thread state

负责回答：

- 会话对象是什么
- thread state 当前是什么
- 这些状态如何被加载、写回、消费

这部分不应因为要做 metadata 收组就被重新塞进 output 摘要面。

### 6.2 `debug_metadata.session`

如果后续启用，应该只回答：

- 这轮 continuity 摘要是什么

它更适合承接：

- 原因码
- turn count
- context pressure

### 6.3 `runtime_events`

当前不建议为了这一域马上新增新 event。

原因是：

- 现有 session / continuity 还更像“本轮解释信息”
- 它暂时更适合先留在 `debug_metadata` 候选层，而不是立刻升级成标准过程事件

---

## 7. 当前不建议立刻做的事

当前不建议马上做：

- 直接把 `session / continuity` 落成代码
- 因为评估这个子域就新增 session event
- 把 thread state 和 continuity diagnostics 一股脑都挂进 `debug_metadata`
- 因为 output 治理去扩大 session layer 的实现改动

这些动作都会把当前这一步从“分支判断”推成一次新的复杂度跃迁。

---

## 8. 当前最合理的下一步

当前更稳的顺序是：

1. 先接受这一判断：
   - `session / continuity` 值得评估
   - 但还不适合立刻开做代码
2. 如果后续仍想推进，再先写一份更短的：
   - `debug_metadata.session` 第一版字段确认
3. 再决定是否真的落代码

也就是说，当前最合理的动作不是：

- 立刻改 `runtime.ts`

而是：

- **先把这个子域继续停在“已评估、未落地”的状态**

---

## 9. 一句话总结

当前 `session / continuity` 已经值得成为下一个被认真考虑的 metadata 子域，但还没到应该立刻像前三个子域那样直接落代码的程度。

**最稳的结论是：先确认它是下一候选，但继续后置一拍。**
