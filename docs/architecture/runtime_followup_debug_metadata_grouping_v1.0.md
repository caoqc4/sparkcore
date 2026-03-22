# Runtime Follow-up Debug Metadata 分组文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `debug_metadata.follow_up`

这一小组调试字段的最小分组边界。

本文档重点回答：

- 为什么当前 `follow_up` 摘要值得开始从顶层平铺字段收组
- 第一版分组应该先收哪些字段
- 哪些 follow-up 相关信息当前仍然不建议继续塞进 `debug_metadata`
- 它与 `follow_up_requests`、`runtime_events.follow_up_planned` 的边界是什么

本文档不是 follow-up 主线设计，也不是 sender / worker / cron 设计，而是：

**runtime 输出治理从 `answer_strategy`、`memory` 子域推进到 `follow_up` 子域最小收口前的一份短说明。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/engineering/runtime_output_subdomain_prioritization_note_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前最稳的下一步，是把平铺在 `debug_metadata` 顶层的 follow-up 摘要字段先收成一个最小 `follow_up` 对象；顶层 `follow_up_requests` 继续承接正式 planner 输出，`runtime_events.follow_up_planned` 继续承接标准过程事件，而局部计数摘要继续留在 `debug_metadata.follow_up`。**

一句话说：

**顶层结果回答“产出了什么 follow-up request”，event 回答“发生了 follow-up planning”，metadata group 回答“这轮 follow-up 摘要是多少”。**

---

## 3. 当前为什么值得补这层

现在 `runtime` 输出层里，follow-up 已经有三层现实：

- 顶层有 `follow_up_requests`
- `runtime_events` 里有 `follow_up_planned`
- `debug_metadata` 顶层仍有：
  - `follow_up_request_count`

这说明 follow-up 已经不再只是一个抽象能力，而是：

- 有正式顶层结果
- 有标准过程事件
- 有最小调试摘要

既然 `answer_strategy` 与 `memory` 都已经开始从顶层平铺摘要收组，那么 `follow_up_request_count` 继续平铺在顶层的理由就已经越来越弱。

所以当前最值钱的不是继续长新的 follow-up debug 字段，而是先把已存在的最小摘要收成一组。

---

## 4. 当前推荐的最小分组

当前建议第一版收成：

```ts
debug_metadata: {
  answer_strategy?: {
    selected: string
    reason_code?: string
  }
  memory?: {
    recalled_count: number
    write_request_count: number
  }
  follow_up?: {
    request_count: number
  }
}
```

对应关系建议是：

- 现有顶层 `follow_up_request_count`
  -> `debug_metadata.follow_up.request_count`

这样第一版只做一件事：

- 让 follow-up 摘要不再继续占用顶层 key

---

## 5. 当前不建议第一版继续放进去的内容

当前不建议第一版就继续放入：

- follow-up kinds breakdown
- accepted / skipped / failed breakdown
- sender 选择结果
- `pending_follow_ups` persistence 结果
- executor / worker 执行细节

原因是这些都已经更接近：

- follow-up execution
- sender policy
- delivery / scheduler / worker diagnostics

继续塞入会把 `debug_metadata.follow_up` 从“最小摘要”推成“半个 follow-up 调试面板”。

---

## 6. 与顶层结果和 `runtime_events` 的边界

当前推荐边界是：

### 6.1 顶层 `follow_up_requests`

用于回答：

- 这一轮正式产出了哪些 follow-up request

它是：

- runtime 顶层显式结果
- 接入层、worker、scheduler 可以继续消费的正式产物

### 6.2 `runtime_events.follow_up_planned`

用于回答：

- 本轮是否发生了标准 follow-up planning
- planning 的标准结果是什么

它适合继续承接：

- `count`
- `kinds`

### 6.3 `debug_metadata.follow_up`

用于回答：

- 这轮 follow-up 摘要是多少

它适合继续承接：

- `request_count`

所以同一件事在三层同时有影子是允许的，但职责不同：

- 顶层结果：
  负责正式 planner 产物
- `runtime_events`：
  负责标准过程记录
- `debug_metadata.follow_up`：
  负责最小调试摘要

---

## 7. 当前不建议立刻做的事

当前不建议马上做：

- 因为 follow-up 收组就去改 `follow_up_requests` 顶层 contract
- 把 sender / executor / persistence 结果塞进 `debug_metadata.follow_up`
- 把 follow-up 调试信息继续扩成一个大对象
- 让 runtime 输出治理倒逼 follow-up 主线再次扩张

这些动作都会把当前这一步从“最小收口”推成“follow-up 侧重新发散”。

---

## 8. 当前最合理的下一步

当前更稳的顺序是：

1. 先接受最小分组：
   - `debug_metadata.follow_up.request_count`
2. 再让代码从平铺字段迁到这层小分组
3. 观察一段时间后，再决定 follow-up 摘要是否真的还需要更多字段
4. 最后才判断是否值得继续治理 follow-up event payload

---

## 9. 一句话总结

当前 `follow_up` 子域最合理的收口方式，不是继续长顶层字段，也不是先扩执行调试，而是：

**先把最小计数摘要收成 `debug_metadata.follow_up`。**
