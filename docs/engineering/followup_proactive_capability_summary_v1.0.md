# Follow-up / Proactive Send 能力边界总结 v1.0

## 1. 文档定位

本文档用于单独总结 SparkCore 当前阶段 `follow_up / proactive send` 这条能力链已经推进到什么程度、哪些部分已经过真实验证、哪些能力仍然默认关闭，以及当前最重要的边界约束是什么。

本文档不是新的设计稿，也不是实现计划，而是当前能力成熟度说明。

> 状态：当前有效
> 对应阶段：Phase 1 / follow-up 主动回流阶段总结
> 相关文档：
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `docs/engineering/2026-03-22-follow-up-pending-queue-design.md`
> - `docs/engineering/2026-03-22-follow-up-claim-dequeue-design.md`
> - `docs/engineering/2026-03-22-proactive-sender-contract-design.md`
> - `docs/engineering/2026-03-22-default-follow-up-worker-design.md`
> - `docs/engineering/2026-03-22-follow-up-cron-entry-design.md`
> - `docs/engineering/2026-03-22-follow-up-sender-enable-strategy.md`

---

## 2. 一句话结论

**SparkCore 当前已经具备一条从 `runtime follow_up planner output` 到 `pending -> claim -> send -> mark` 的最小主动回流能力链，并且这条链不仅有代码壳，还已经分别完成了 stub 路径和受控真实 Telegram proactive send 的验证；但它仍然默认处于保守模式，而不是默认开启真实主动发送。**

---

## 3. 当前已经具备的能力

### 3.1 planner output 已成立

当前 runtime 已经能够显式产出：

- `follow_up_requests`

它已经不再只是概念上的“未来计划”，而是：

- 有统一字段
- 有最小 planner 逻辑
- 有 executor stub 的消费面

这意味着当前系统已经具备：

**“本轮对话建议生成 follow-up”**

而不是仍靠隐式逻辑推测。

### 3.2 pending 持久化已成立

当前 `accepted follow_up` 已经可以：

- 进入真实 `pending_follow_ups`
- 默认走真实持久化路径

对应状态包括：

- migration 已存在且已落远端库
- `SupabaseFollowUpRepository` 已存在
- 默认 enqueue 已切到真实持久化

这意味着当前系统已经具备：

**“把 follow-up 建议稳定存下来，等待后续处理”**

### 3.3 claim / result marking 已成立

当前已经具备最小状态推进 seam：

- `pending -> claimed`
- `claimed -> executed`
- `claimed -> failed`

而且：

- claim 有 repository seam
- claim 有一次性 harness
- result marking 有 repository seam

这意味着当前系统已经具备：

**“不是只会存住，还能最小推进状态流转”**

### 3.4 proactive sender contract 已成立

当前已经具备：

- 平台无关 `ProactiveSendTarget`
- 平台无关 `ProactiveSendRequest`
- 平台无关 `ProactiveSendResult`
- `ProactiveSender` 接口

并且：

- Telegram 只作为第一实现样本
- 没有被抬成顶层 sender 协议本身

这意味着当前系统已经具备：

**“主动发送的上层契约”**

而不是直接把 Telegram 细节写死进 worker 顶层。

### 3.5 default worker shell 已成立

当前 `runDefaultFollowUpWorker(...)` 已存在，并且能完成：

- `claim`
- `resolve binding`
- `map`
- `send`
- `mark`

当前它已经不是纸面设计，而是最小代码壳。

### 3.6 两类入口都已存在

当前已经有两个不同语义的触发入口：

- 手动测试入口：
  - `app/api/test/followup-run/route.ts`
- internal 入口：
  - `app/api/internal/followup/run/route.ts`

两者语义不同：

- `api/test`：偏人工调试
- `api/internal`：偏受控内部执行 / 未来 cron 样式入口

这意味着当前系统已经具备：

**“不是只有函数可调用，也有了最小执行入口层”**

---

## 4. 当前已经完成的真实验证

### 4.1 stub sender 路径已真实验证

当前已做过受控真实验证：

- seed 一条 due `pending_follow_up`
- 走 internal route
- 解析 binding
- 用 `StubProactiveSender`
- 完成 `mark executed`

验证结果是：

- internal route 返回 `200`
- `claimed_count = 1`
- `executed_count = 1`

这说明：

**internal route + default worker + stub sender** 这条链已经不是只靠 typecheck 成立，而是跑通过的。

### 4.2 真实 Telegram proactive send 已受控验证

当前还完成过一次更关键的验证：

- 显式开启 `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`
- internal route 请求里显式传 `sender=telegram`
- seed 测试 binding 和 due pending
- 真实发出 Telegram proactive message
- 成功 `mark executed`
- 测试数据随后清理

这说明：

**真实 Telegram proactive send 不是理论支持，而是已经被受控验证过。**

---

## 5. 当前默认没有开启的能力

这里是最重要的边界。

当前系统虽然已经“能发”，但下面这些能力仍然**没有默认打开**：

### 5.1 默认不真发

当前默认 sender 仍然是：

- `stub`

也就是说，系统默认不会因为有了 worker 和 internal route，就自动开始真实 Telegram proactive send。

### 5.2 没有常驻调度 loop

当前还没有：

- 常驻 worker
- while-loop
- 持续扫描执行器
- 真正的调度守护进程

### 5.3 没有 retry / requeue

当前失败就是：

- `mark failed`

还没有：

- 自动重试
- 回退到 `pending`
- backoff
- dead-letter

### 5.4 没有生产式 cron 默认接线

虽然 internal route 已经有了，但当前它仍然是：

- 受 secret 保护的内部入口
- 需要显式 sender 选择
- 需要显式 env 开关

还没有默认挂到正式生产调度。

### 5.5 没有多平台主动发送策略

当前 proactive send 仍然是：

- 平台无关 contract
- Telegram 第一实现样本

但并没有：

- 多平台策略编排
- 多 sender fallback
- 平台级发送治理

---

## 6. 当前 sender enable 边界

当前 sender enable 的核心原则非常明确：

### 原则 1：手动测试入口不默认真发

`api/test/followup-run` 继续只承担调试职责。

### 原则 2：internal route 默认保守

`api/internal/followup/run` 即使存在，也仍然默认走 `stub`。

### 原则 3：真实 Telegram send 必须三层同时满足

只有同时满足以下条件，才允许真实 Telegram proactive send：

1. 走的是 internal route
2. `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`
3. 请求里显式传 `sender=telegram`

否则一律降级成：

- `StubProactiveSender`

### 原则 4：sender policy 已有统一代码落点

当前 sender 选择 / 降级逻辑不再只散在 route 内部，而是已经收口到：

- `apps/web/lib/chat/follow-up-sender-policy.ts`

并且已经开始被这些地方复用：

- `api/test`
- `api/internal`
- `follow-up-send-harness`
- `runDefaultFollowUpWorker(...)` 默认 sender 初始化

---

## 7. 当前最准确的成熟度判断

如果要给这条能力链一个更准确的成熟度判断，我会这样分：

### 已成事实

- planner output
- pending 持久化
- claim seam
- result marking seam
- proactive sender contract
- sender shell
- default worker shell
- manual route
- internal route
- stub 真实验证
- 真实 Telegram proactive send 受控验证

### 已可用但仍保守

- internal route
- Telegram sender
- sender policy helper

也就是：

- 能用
- 但默认不放开
- 仍以受控验证为主

### 仍未进入生产式能力

- 常驻调度
- 自动触发常开
- retry / requeue
- 生产 cron 编排
- 多平台主动发送
- 主动发送运维治理

---

## 8. 当前最值得记住的结论

当前 `follow_up / proactive send` 这条线最容易被误判成两种极端：

### 误判 1：还只是概念设计

这不对。  
因为它已经有：

- repository
- pending 持久化
- worker shell
- route
- 真实 Telegram proactive send 验证

### 误判 2：已经是默认生产可用能力

这也不对。  
因为它仍然：

- 默认 `stub`
- 没有常驻调度
- 没有 retry
- 没有默认生产 cron

所以当前最准确的描述是：

**它已经从“设计中的主动回流能力”推进成“受控可运行、已被真实验证、但默认保守关闭”的主动回流能力。**

---

## 9. 下一步建议

如果后面继续推进，这条线最自然的下一个问题不再是：

> 能不能发

而是：

> 什么时候、以什么约束，允许它更接近默认运行

所以后续更合理的方向是：

1. 继续收 sender enable / worker 运行策略
2. 再决定是否逐步放开更稳定的 internal 运行模式
3. 最后才考虑生产式 cron / retry / requeue

---

## 10. 当前结论

**SparkCore 当前已经拥有一条最小但完整的 `follow_up / proactive send` 能力链，这条链既不是停留在概念层，也还没有进入默认生产常开阶段；它现在最准确的状态是：能力已形成、真实已验证、默认仍保守。**
