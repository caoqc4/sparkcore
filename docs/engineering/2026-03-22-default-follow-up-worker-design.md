# Default Follow-up Worker 设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `follow_up` 主动回流中的默认 `claim/send worker` 最小设计边界。

本文档重点回答：

- 默认 worker 负责什么，不负责什么
- 一次 worker run 的最小流程是什么
- worker 如何调用已有的 claim / mapper / sender / result marking seam
- 当前阶段如何避免误触发与重复执行
- 哪些问题继续后置

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up 主动回流前置设计
> 相关文档：
> - `docs/engineering/2026-03-22-follow-up-claim-dequeue-design.md`
> - `docs/engineering/2026-03-22-proactive-sender-contract-design.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**default follow-up worker 是 SparkCore 当前阶段用于把 due `pending_follow_ups` 做单次 `claim -> map -> send -> mark` 推进的最小执行入口。**

---

## 3. 当前为什么要进入这一步

当前阶段已经具备：

- `accepted -> enqueue -> pending`
- `pending -> claimed`
- `claimed -> executed / failed`
- 平台无关 proactive sender contract
- `claimed record + binding -> ProactiveSendRequest` mapper
- `claim -> map -> send -> mark` 一次性 harness

这意味着现在真正缺的不是：

> follow-up 能不能被存住、领出来、映射、发送、回写

而是：

> 这些已有的 seam 由谁在默认路径里按一次批处理方式串起来

因此下一步最值得先设计的是：

- 默认 worker 的单次运行边界
- 一次处理多少条
- 没有 binding / 没有 sender / 发送失败时的最小处理方式

而不是直接做常驻 loop、复杂 cron、retry 队列。

---

## 4. 当前阶段设计目标

当前阶段 default worker 的目标是：

1. 给 `follow_up` 提供一个最小默认执行入口
2. 复用现有 seam，而不是重新发明调度逻辑
3. 支持单次批处理执行
4. 避免把系统直接扩成完整 scheduler

---

## 5. 当前阶段非目标

当前阶段 default worker **不负责**：

- 常驻后台 loop
- 多 worker 抢占
- retry / requeue
- exponential backoff
- dead letter queue
- lease 续约
- 富媒体主动发送
- 多平台并行批处理优化

这一步的目标不是：

**做真正长期运行的 follow-up scheduler**

而是：

**先定义一个默认单次 worker run。**

---

## 6. 建议的默认 worker 形态

当前建议默认 worker 只暴露一个最小入口，例如：

```ts
runDefaultFollowUpWorker({
  now,
  limit,
  claimedBy,
  sender
})
```

建议最小输入字段：

- `now?`
- `limit`
- `claimedBy`
- `sender`
- `bindingLookup?` 或等价 binding resolver

建议最小返回字段：

- `claimed_count`
- `processed_count`
- `executed_count`
- `failed_count`
- `skipped_count`
- `records`

当前阶段不建议：

- 直接让 worker 自己无限 while-loop
- 直接绑 cron 语义

---

## 7. 单次 worker run 的最小流程

当前建议单次 run 固定走这 5 步：

### Step 1：claim due pending

- 调 `claimDuePendingFollowUps(...)`
- 只取 `status = pending` 且 `trigger_at <= now`
- 按 `trigger_at asc, created_at asc`
- 受 `limit` 限制

### Step 2：解析发送目标

- 对每条 claimed record 解析 binding / target
- 当前建议通过 thread / binding 路径拿到 `ChannelBinding`

### Step 3：映射 sender request

- 调 `buildProactiveSendRequestFromClaimedFollowUp(...)`
- 若无法映射，直接走 failure marking

### Step 4：发送

- 调 `sender.send(request)`
- 当前 sender 可以是：
  - `StubProactiveSender`
  - `TelegramProactiveSender`

### Step 5：回写结果

- `sent` -> `markFollowUpExecuted(...)`
- 其他状态 -> `markFollowUpFailed(...)`

---

## 8. binding resolution 边界

当前建议 default worker **不自己内联 binding 查询逻辑**。

更稳的边界是：

- worker 拿到 claimed record
- 通过独立的 binding resolver / lookup 辅助层解析 active binding
- 再交给 mapper 生成 `ProactiveSendRequest`

原因是：

- binding 已经在接入层是独立边界
- worker 若直接写死 SQL/平台路由，会把“执行器”和“接入层解析”重新揉在一起

---

## 9. 最小错误分类建议

当前阶段建议至少区分这 4 类：

### 9.1 claim 阶段失败

- 直接让整个 worker run fail fast
- 不继续处理后续记录

### 9.2 binding 未命中

- 对单条 record 标记 `failed`
- `failure_reason = binding_not_found`

### 9.3 mapper 无法生成 request

- 对单条 record 标记 `failed`
- `failure_reason = proactive_request_mapping_failed`

### 9.4 sender 返回失败

- 对单条 record 标记 `failed`
- 保留 sender metadata

当前阶段建议：

- 单条失败不应打爆整个批次
- 但 claim 本身失败可以直接终止本次 run

---

## 10. 最小防误触发原则

当前阶段建议默认 worker 遵守：

### 原则 1：必须显式传 `sender`

不要让默认 worker 自动选 Telegram sender。

原因：

- 当前仍在前置验证阶段
- 显式传 sender 更不容易误把测试环境跑成真实主动发送

### 原则 2：默认 limit 要保守

建议默认 `limit = 10` 或更小。

### 原则 3：默认不自动重试

任何失败先标记 `failed`，不自动回到 `pending`。

### 原则 4：先支持单平台样本，不并发扩平台

当前仍以 Telegram 样本为主，不在 worker 顶层做多平台策略分发。

---

## 11. 最小返回对象建议

建议 worker run 返回一份明确摘要，例如：

```ts
type DefaultFollowUpWorkerResult = {
  claimed_count: number
  processed_count: number
  executed_count: number
  failed_count: number
  skipped_count: number
  records: Array<{
    follow_up_id: string
    status: "executed" | "failed" | "skipped"
    reason?: string
  }>
}
```

这样：

- harness 能直接打印
- 后续 cron / route / admin action 也能直接消费

---

## 12. 当前建议的落地顺序

### Step 1

先补 `runDefaultFollowUpWorker(...)` 的最小代码壳。

### Step 2

先让它默认跑 `StubProactiveSender`。

### Step 3

再加一个 Telegram sample worker harness。

### Step 4

最后再决定是否把它接到：

- cron route
- 手动 admin action
- 定时任务入口

---

## 13. 当前阶段 DoD

这一步完成建议收成：

- 已定义默认 worker 的单次运行边界
- 已定义单次 run 的 5 步流程
- 已明确 binding / mapper / sender / result marking 的调用顺序
- 已明确最小错误分类
- 已明确默认防误触发原则
- 已明确先做单次 worker，不做常驻 loop

---

## 14. 当前结论

当前最稳的下一步不是直接把 Telegram proactive send 接成默认后台任务，而是：

**先把 default follow-up worker 收成一个单次、可显式传 sender、可返回清晰摘要的最小执行入口。**

这样后面的真实主动回流，才能建立在：

- 已可 enqueue
- 已可 claim
- 已可 map
- 已可 send
- 已可 mark
- 已有默认 worker 边界

这六层之上，而不是把 worker、sender、retry、cron 一次揉在一起。

---

## 15. 当前实现进展

当前已经补上的最小代码壳包括：

- `FollowUpBindingResolver`
- `createAdminFollowUpBindingResolver(...)`
- `runDefaultFollowUpWorker(...)`
- `DefaultFollowUpWorkerResult`
- 手动调试 route：
  - `app/api/test/followup-run/route.ts`

这意味着：

- default worker 已不再只有设计稿
- 已有单次 `claim -> resolve binding -> map -> send -> mark` 的最小代码壳
- 已有一个受 `x-smoke-secret` 保护的手动调试入口
- 当前默认仍走 `StubProactiveSender`
- 仍未接默认 cron / loop / retry / requeue
