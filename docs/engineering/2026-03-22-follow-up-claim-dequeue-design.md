# Follow-up Claim / Dequeue 设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `pending_follow_ups` 在进入真实调度之前的下一步最小设计边界。

本文档重点回答：

- pending follow-up 由谁领取
- 最小 dequeue / claim 应该怎样工作
- 如何在当前阶段避免明显的重复执行
- 哪些事情仍然不做

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up 调度前置设计
> 相关文档：
> - `docs/engineering/2026-03-22-follow-up-pending-queue-design.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/im_adapter_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**follow-up claim / dequeue 是 SparkCore 当前阶段用于把 `pending_follow_ups` 从“已入队记录”推进到“可被单次安全领取”的最小调度前置层。**

---

## 3. 当前为什么要进入这一步

当前阶段已经具备：

- runtime 可产出 `follow_up_requests`
- executor stub 可返回 `accepted / skipped / unsupported / invalid`
- `accepted -> enqueue -> pending` 已接到真实 `pending_follow_ups`

这意味着现在真正缺的不是：

> follow-up 能不能被存住

而是：

> 一个 pending follow-up 什么时候可以被取走、由谁取走、怎样避免被多次同时执行

因此下一步最值得先设计的是：

- 最小 dequeue
- 最小 claim
- 最小状态推进

而不是直接开始“真发送主动消息”。

---

## 4. 当前阶段设计目标

当前阶段 claim / dequeue 目标是：

1. 给 `pending_follow_ups` 定义最小领取流程
2. 为未来单 worker / 单 cron 场景提供一致行为
3. 先解决“重复领取”的基本问题
4. 不把系统扩成完整任务调度器

---

## 5. 当前阶段非目标

当前阶段 claim / dequeue **不负责**：

- 多 worker 抢占优化
- lease 续约
- heartbeat
- backoff / retry policy
- dead letter queue
- 主动消息真正发送
- 平台发送失败补偿
- 优先级队列

换句话说，这一步的目标不是“做完整 scheduler”，而是：

**先把 pending 记录最小而安全地领出来。**

---

## 6. 最小状态推进建议

在当前阶段，只需要把以下状态真正用起来：

- `pending`
- `claimed`
- `executed`
- `failed`

其中：

- `pending`：已入队，尚未领取
- `claimed`：已被某次 dequeue 领取，正在等待后续执行
- `executed`：后续主动消息已成功发出
- `failed`：领取后执行失败，后续如何重试先不在当前阶段展开

`skipped` 保持预留，但当前阶段可不主动使用。

---

## 7. 最小 dequeue 规则

当前建议 dequeue 只做这件事：

> 找出 `status = pending` 且 `trigger_at <= now()` 的记录

再按 `trigger_at asc, created_at asc` 排序领取。

建议最小限制：

- `limit`
- `before_time`

这意味着最小 dequeue 输入可类似：

```ts
type DequeuePendingFollowUpsInput = {
  now: string
  limit: number
}
```

---

## 8. 最小 claim 规则

当前建议 claim 的本质是：

> 把一批满足条件的 `pending` 记录更新为 `claimed`

并给它们写入最小 claim 元信息，例如：

- `claimed_at`
- `claim_token`
- `claimed_by`

当前阶段这些字段可以先放在 `metadata`，不急着单独拆列。

原因是：

- 当前仍是最小设计阶段
- 还没有足够证据说明这些字段要长期固定成顶层列

---

## 9. 最小对象建议

### 9.1 `ClaimedFollowUpRecord`

可以先复用 `PendingFollowUpRecord`，只是在状态上变成 `claimed`。

当前不急着新增独立结构体。

### 9.2 `ClaimPendingFollowUpsResult`

建议最小字段：

- `claimed_count`
- `records`

### 9.3 `MarkFollowUpExecutedInput`

后续主动发送成功后，需要一个最小状态推进入口。

建议最小字段：

- `id`
- `executed_at`
- `execution_metadata?`

### 9.4 `MarkFollowUpFailedInput`

建议最小字段：

- `id`
- `failed_at`
- `failure_reason`
- `failure_metadata?`

---

## 10. repository 边界建议

当前建议在 `FollowUpRepository` 上新增三类能力：

1. `claimDuePendingFollowUps(...)`
2. `markFollowUpExecuted(...)`
3. `markFollowUpFailed(...)`

建议最小接口形态：

```ts
type FollowUpRepository = {
  enqueuePendingFollowUps(...)
  claimDuePendingFollowUps(...)
  markFollowUpExecuted(...)
  markFollowUpFailed(...)
}
```

当前阶段只要先把接口和最小行为定义清楚，不必一口气全接完。

---

## 11. claim / dequeue 与主动发送的边界

### 11.1 claim / dequeue 负责

- 读取 due pending records
- 将其更新为 `claimed`
- 返回被领取的记录

### 11.2 adapter / sender 负责

- 把 claimed record 转成平台主动消息
- 真正调用 Telegram / 其他平台 API

### 11.3 repository 后续负责

- 在发送成功后标记 `executed`
- 在发送失败后标记 `failed`

这意味着当前阶段必须坚持：

**claim != send**

也即：

- 先把“谁被领出来”做稳
- 再决定“怎么领出去发”

---

## 12. 当前阶段最小防重复原则

当前阶段只需要先保证以下两层：

### 原则 1：只领取 `pending`

任何 dequeue 都必须只从 `status = pending` 中选。

### 原则 2：claim 应该是原子状态推进

最小实现上，应尽量保证：

- 先选中 due pending
- 再立即把它们更新成 `claimed`

避免“查出来了，但还是 pending，被另一处重复捞走”。

### 原则 3：claim token 当前可选

如果当前只考虑单 worker / 单 cron，claim token 可以先设计预留、不急着硬落。

但文档里应明确：

- 一旦进入多 worker，就需要 claim token 或等价机制

---

## 13. 为什么当前不直接做发送器

因为一旦进入真实主动发送，就会同时引入：

- adapter proactive send
- 平台发送幂等
- 平台失败补偿
- 执行后状态推进
- 可能的 retry

这些都比当前 claim / dequeue 的边界大一截。

当前更稳的推进方式是：

1. 先把 enqueue 做稳
2. 再把 claim / dequeue 做稳
3. 最后再接发送器

---

## 14. 当前建议的落地顺序

### Step 1

先补 `claimDuePendingFollowUps(...)` 的设计与 repository seam。

### Step 2

再决定 `claimed_at / claimed_by / claim_token` 是否先放进 `metadata`，还是直接加列。

### Step 3

补最小 claim migration 调整草案。

### Step 4

最后再考虑：

- adapter proactive sender
- `markFollowUpExecuted(...)`
- `markFollowUpFailed(...)`

---

## 15. 当前阶段 DoD

这一步完成建议收成：

- 已明确 due pending 的选择规则
- 已明确最小 claim 状态推进
- 已明确 claim / send / mark-result 三层边界
- 已明确当前阶段最小防重复原则
- 已明确下一步先做 repository seam，而不是直接做 sender

---

## 16. 当前结论

当前最稳的下一步不是直接做主动发送，而是：

**先把 `pending_follow_ups` 的 claim / dequeue 边界设计清楚。**

这样才能让后面的主动消息回流建立在：

- 已可 enqueue
- 已可持久化
- 已可最小领取

这三层之上，而不是把发送、领取、失败处理一次揉在一起。

---

## 17. 当前实现进展

当前已经补上的最小代码壳包括：

- `ClaimDuePendingFollowUpsInput`
- `ClaimDuePendingFollowUpsResult`
- `FollowUpRepository.claimDuePendingFollowUps(...)`
- `InMemoryFollowUpRepository.claimDuePendingFollowUps(...)`
- `SupabaseFollowUpRepository.claimDuePendingFollowUps(...)`
- `claimDuePendingFollowUps(...)` 最小可复用 helper
- `follow-up-claim-harness.ts` 一次性真实 claim 验证脚本

这意味着：

- claim / dequeue 已不再只有文档概念
- 已可以用一次性 harness 验证真实 `pending -> claimed`
- 但当前还没有默认 claim 调用路径
- 也还没有接到真正的 proactive sender
