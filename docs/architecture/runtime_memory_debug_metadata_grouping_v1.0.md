# Runtime Memory Debug Metadata 分组文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `debug_metadata.memory`

这一小组调试字段的最小分组边界。

本文档重点回答：

- 为什么当前 `memory` 相关摘要值得从顶层平铺字段开始收组
- 第一版分组应先收哪些字段
- 哪些 memory 信息仍然不建议继续塞进 `debug_metadata`
- 它与 `runtime_events.memory_recalled / memory_write_planned` 的边界是什么

本文档不是 memory layer 总设计，也不是立刻扩张顶层 output contract，而是：

**runtime 输出治理从 `answer_strategy` 子域分组推进到 `memory` 子域最小收口前的一份短说明。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/architecture/runtime_answer_strategy_debug_metadata_grouping_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前最稳的下一步，是把平铺在 `debug_metadata` 顶层的 memory 摘要字段先收成一个最小 `memory` 对象；标准 recall / write planning 过程继续留在 `runtime_events`，局部计数摘要继续留在 `debug_metadata.memory`。**

一句话说：

**event 说“发生了什么 memory 过程”，metadata group 说“这轮 memory 摘要是多少”。**

---

## 3. 当前为什么值得补这层

现在 `debug_metadata` 顶层已经有：

- `recalled_memory_count`
- `memory_write_request_count`

这两个字段虽然都很轻，但已经明显属于同一个局部领域：

- 这轮回忆出了多少 memory
- 这轮计划写多少 memory

如果继续保持平铺，后面很容易继续长出：

- `relationship_memory_count`
- `generic_memory_count`
- `memory_hidden_exclusion_count`
- `memory_incorrect_exclusion_count`

顶层很快就会出现一排 `memory_*` 字段。

所以当前最值钱的不是把 memory 所有内部统计都搬进来，而是先把已经存在的最小摘要正式收成一组。

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
  memory?: {
    recalled_count: number
    write_request_count: number
  }
}
```

对应关系建议是：

- 现有顶层 `recalled_memory_count`
  -> `debug_metadata.memory.recalled_count`
- 现有顶层 `memory_write_request_count`
  -> `debug_metadata.memory.write_request_count`

这样第一版只做两件事：

1. 保留原有信息量
2. 让 memory 摘要不再继续占用顶层 key

---

## 5. 当前不建议第一版继续放进去的内容

当前不建议第一版就继续放入：

- `memory_types_used`
- `hidden_exclusion_count`
- `incorrect_exclusion_count`
- subtype breakdown
- 具体 recalled memory 条目

原因很简单：

- 这些字段已经更接近 recall diagnostics
- 继续塞入会把 `debug_metadata.memory` 从“最小摘要”推成“半个 recall 调试面板”

如果后面真的需要这些信息，更适合先判断：

- 是不是仍然只该进 `debug_metadata`
- 还是应该通过更正式的 event payload 或 diagnostics 面消费

---

## 6. 与 `runtime_events` 的边界

当前推荐边界是：

### 6.1 `runtime_events.memory_recalled`

用于回答：

- 本轮是否发生了 recall
- recall 的标准过程结果是什么

它适合继续承接：

- `total_count`
- `memory_types`
- exclusion count

### 6.2 `runtime_events.memory_write_planned`

用于回答：

- 本轮是否发生了 memory write planning
- planning 的标准结果是什么

它适合继续承接：

- `count`
- `memory_types`

### 6.3 `debug_metadata.memory`

用于回答：

- 这轮 memory 摘要是多少

它适合继续承接：

- `recalled_count`
- `write_request_count`

所以同一件事在两层同时存在是允许的，但职责不同：

- `runtime_events`
  负责标准过程记录
- `debug_metadata.memory`
  负责最小摘要收口

---

## 7. 当前不建议立刻做的事

当前不建议马上做：

- 把 recall diagnostics 一次性全搬进 `debug_metadata.memory`
- 把所有 memory 相关 count 都定义成长期稳定 schema
- 因为收组就去改 `runtime_events.memory_*` payload
- 为 memory 摘要单独扩顶层 output 字段

这些动作都会把当前这一步从“最小分组”推成“memory output 重排”。

---

## 8. 当前最合理的下一步

当前更稳的顺序是：

1. 先接受最小分组：
   - `debug_metadata.memory.recalled_count`
   - `debug_metadata.memory.write_request_count`
2. 再让代码从平铺字段迁到这层小分组
3. 观察一段时间后，再决定：
   - memory 摘要里是否真的还需要更多字段
4. 最后才判断是否值得继续做 memory event payload 规范化

---

## 9. 一句话总结

当前 `memory` 子域最合理的收口方式，不是扩顶层 output，也不是先改 event payload，而是：

**先把最小计数摘要收成 `debug_metadata.memory`。**
