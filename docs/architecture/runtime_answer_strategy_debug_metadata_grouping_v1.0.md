# Runtime Answer Strategy Debug Metadata 分组文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `debug_metadata.answer_strategy`

这一小组调试字段的最小分组边界。

本文档重点回答：

- 为什么 `answer_strategy*` 值得从顶层平铺字段收成一个小分组
- 第一版分组应该收哪些字段
- 哪些信息仍然不建议继续塞进去
- 它与 `runtime_events.answer_strategy_selected` 的边界是什么

本文档不是 `debug_metadata` 全量 schema 设计，也不是立刻扩张顶层 `RuntimeTurnResult`，而是：

**runtime 输出治理从“metadata 命名收口”推进到“answer strategy 子域先收一刀”的最小说明稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前最稳的下一步，是把平铺在 `debug_metadata` 顶层的 `answer_strategy` 与 `answer_strategy_reason_code` 收成一个最小 `answer_strategy` 分组对象；事件继续留在 `runtime_events.answer_strategy_selected`，局部解释继续留在 `debug_metadata.answer_strategy`。**

一句话说：

**event 说“选了什么策略”，metadata group 说“这轮策略摘要是什么”。**

---

## 3. 当前为什么值得补这层

现在 `debug_metadata` 顶层已经有：

- `answer_strategy`
- `answer_strategy_reason_code`

这两个字段虽然数量不多，但已经明显属于同一个局部领域：

- reply strategy 的选择结果
- strategy 选择的原因码

如果继续保持平铺，后面一旦再出现类似字段，例如：

- strategy source
- strategy confidence
- strategy fallback_applied

顶层很快就会开始变乱。

所以当前最值钱的不是立刻给所有 metadata 大分组，而是先把最明显的一组先收掉：

- `answer_strategy*`

这会让顶层 `debug_metadata` 继续保持轻，同时给后续类似子域提供一个清楚样板。

---

## 4. 当前推荐的最小分组

当前建议第一版收成：

```ts
debug_metadata: {
  model_profile_id?: string
  reply_language?: string
  answer_strategy?: {
    selected: string
    reason_code?: string
  }
}
```

对应关系建议是：

- 现有顶层 `answer_strategy`
  -> `debug_metadata.answer_strategy.selected`
- 现有顶层 `answer_strategy_reason_code`
  -> `debug_metadata.answer_strategy.reason_code`

这样第一版只做两件事：

1. 保留原有信息量
2. 把明显同域的两个字段正式收成一组

当前不建议第一版就继续放入：

- 长文本 explanation
- prompt 片段
- rule trace
- 复杂 ranking 细节

因为这些会马上把这层从“最小摘要”推成“内部判定转储”。

---

## 5. 与 `runtime_events` 的边界

当前推荐边界是：

### 5.1 `runtime_events.answer_strategy_selected`

用于回答：

- 这一轮是否发生了标准策略选择过程
- 最终选中了哪个标准策略

它适合继续作为：

- 标准过程事件
- 面向 runtime timeline 的记录

### 5.2 `debug_metadata.answer_strategy`

用于回答：

- 这轮策略摘要是什么
- 为什么是这个策略

它适合继续承接：

- `selected`
- `reason_code`

所以同一件事在两层同时存在是允许的，但职责不同：

- `runtime_events`
  负责“发生过策略选择”
- `debug_metadata`
  负责“这轮策略摘要与原因码”

---

## 6. 当前不建议立刻做的事

当前不建议马上做：

- 把所有 `debug_metadata` 平铺字段一次性都收成分组
- 给 `answer_strategy` 分组继续长复杂 explanation
- 把 `reason_code` 搬去 `runtime_events`
- 为 `answer_strategy` 单独扩顶层 output 字段

这些动作都会把当前这一步从“局部收口”变成“输出层重排”。

---

## 7. 当前最合理的下一步

当前更稳的顺序是：

1. 先接受最小分组：
   - `debug_metadata.answer_strategy.selected`
   - `debug_metadata.answer_strategy.reason_code`
2. 再让代码从平铺字段迁到这层小分组
3. 观察一段时间后，再决定：
   - 是否还有别的策略字段值得并入
4. 最后才判断要不要做更广的 `debug_metadata` key 收口

---

## 8. 一句话总结

当前 `answer_strategy*` 最合理的收口方式，不是扩 event，不是扩顶层 output，而是：

**先把它作为 `debug_metadata` 里的一个最小局部分组收起来。**
