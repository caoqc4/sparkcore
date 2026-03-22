# Follow-up Pending Queue 设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `follow_up_requests` 从 executor stub 走向最小持久化执行链时的下一步设计边界。

本文档重点回答：

- 为什么当前需要一个最小 pending queue
- 当前 queue 最小要承接哪些字段与状态
- executor、repository、adapter 之间的边界应如何划分
- 当前阶段哪些事情先不做

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up 最小持久化预研
> 相关文档：
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/im_adapter_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**follow-up pending queue 是 SparkCore 当前阶段用于承接 `RuntimeFollowUpRequest` 的最小持久化层，用来把 runtime 产出的后续跟进请求先稳定存住、可见化、可领取，而不是立即把系统扩成完整 scheduler。**

---

## 3. 当前为什么要进入这一步

当前阶段已经具备：

- runtime 可显式产出 `follow_up_requests`
- `executeFollowUpRequests(...)` 已有第一版 stub
- executor stub 已能返回：
  - `accepted`
  - `skipped`
  - `unsupported`
  - `invalid`

这意味着 follow-up 已不再只是想法，而是已经成为：

- runtime 的显式输出
- 外层可观察的执行对象

当前下一步最自然的问题不再是：

> 能不能产出 follow-up

而是：

> 当一个 follow-up 被 accepted 后，最小应该被放到哪里、以什么状态存在、后续由谁领取执行

因此现在值得补的是一个 **最小 pending queue 设计**，而不是直接跳到完整 scheduler 系统。

---

## 4. 设计目标

当前阶段 pending queue 目标是：

1. 为 `accepted` 的 follow-up 提供最小持久化落点
2. 让 follow-up 从“执行结果”进入“可领取任务”
3. 为后续 adapter / scheduler 的主动消息回流保留统一入口
4. 在不扩张系统面的前提下，先固定最小状态与字段

---

## 5. 当前阶段非目标

当前阶段 pending queue **不负责**：

- 完整 scheduler 子系统
- 分布式任务竞争
- 高可用 claim / heartbeat / lease 机制
- 多种 follow-up 类型的复杂优先级
- 自动重试策略
- 长周期清理策略
- 多平台并行主动消息完备能力

也就是说，这一步的目标不是“做完调度系统”，而是先把：

**accepted follow-up -> pending record**

这条链固定下来。

---

## 6. 最小处理流程

当前建议的最小流程：

1. runtime 产出 `follow_up_requests`
2. `executeFollowUpRequests(...)` 做结构校验与最小分类
3. 对 `accepted` 结果，交给 pending queue repository 存储
4. repository 返回 `pending_follow_up_record`
5. 外层记录：
   - 接受数量
   - 入队数量
   - 被跳过或无效的原因

当前阶段先不做：

6. 真正定时扫描
7. 真正到时执行
8. 真正发送主动消息

---

## 7. 最小对象划分

### 7.1 `RuntimeFollowUpRequest`

当前保持不变，继续作为 runtime 输出对象。

当前最小字段：

- `kind`
- `trigger_at`
- `reason`
- `payload`

---

### 7.2 `FollowUpExecutionResult`

当前保持现有 executor stub 的返回对象思路。

最小字段：

- `request_index`
- `kind`
- `status`
- `reason`
- `trigger_at?`
- `payload?`

当前状态：

- `accepted`
- `skipped`
- `unsupported`
- `invalid`

---

### 7.3 `PendingFollowUpRecord`

这是当前设计稿新增的最小持久化对象。

建议最小字段：

- `id`
- `kind`
- `status`
- `trigger_at`
- `workspace_id`
- `user_id`
- `agent_id`
- `thread_id`
- `request_payload`
- `request_reason`
- `source_message_id?`
- `source_request_index`
- `created_at`
- `updated_at`

说明：

- `status` 当前最小只需要承接 pending queue 阶段，不需要一次到位做全状态机
- `request_payload` 保留 runtime 原始 payload，避免过早拆散字段
- `source_request_index` 让一个 assistant turn 内多个 follow-up 可被区分

---

## 8. 最小状态建议

当前建议只定义以下最小状态：

- `pending`
- `claimed`
- `executed`
- `failed`
- `skipped`

当前阶段真正需要落地的，只有：

- `pending`

其余状态先作为设计预留。

原因是：

- 现在还没有真实 scheduler
- 现在也还没有真实主动发送链
- 但如果完全不预留，后续会返工

---

## 9. 最小 repository 边界

当前建议先定义一层 `FollowUpRepository`，而不是直接把 SQL 写进 executor。

建议最小接口：

```ts
type FollowUpRepository = {
  enqueuePendingFollowUps(input: EnqueuePendingFollowUpsInput): Promise<EnqueuePendingFollowUpsResult>
}
```

建议最小输入：

- `workspace_id`
- `user_id`
- `agent_id`
- `thread_id`
- `accepted_requests`
- `source_message_id?`

建议最小输出：

- `inserted_count`
- `records`
- `skipped_count`

这样做的目的不是抽象而抽象，而是为了保证：

- executor 只负责判断“这个 request 是否 accepted”
- repository 负责“accepted request 如何落成 pending record”

---

## 10. executor 与 pending queue 的边界

### 10.1 executor 负责

- request 结构校验
- kind 支持性判断
- 最小业务合法性判断
- 返回 `FollowUpExecutionResult`

### 10.2 repository 负责

- 把 accepted request 持久化成 pending record
- 返回持久化结果

### 10.3 adapter / scheduler 后续负责

- 扫描 pending
- claim
- 执行主动消息
- 更新最终状态

这意味着当前阶段应坚持：

**executor != scheduler**

也即：

- executor 先只是“判断与接纳”
- queue 先只是“存住”
- 真正调度留到下一阶段

---

## 11. 为什么现在不直接做完整 queue 实现

因为如果现在直接做完整 queue，系统面会立刻膨胀到：

- dequeue 扫描
- claim 冲突
- lease 过期
- retry
- backoff
- dead letter
- adapter 主动发回路

这些都不是当前最小目标。

当前更稳的做法是先回答：

> accepted 的 follow-up 最小该怎样被存住

只要这个问题先稳定，后面再扩成 scheduler 就会轻很多。

---

## 12. 当前建议的落地顺序

### Step 1

先补一份 `follow_up_repository` 设计或最小代码壳。

### Step 2

再补 `pending_follow_ups` migration 草案。

### Step 3

然后把 `executeFollowUpRequests(...)` 的 `accepted` 结果接到 repository。

### Step 4

最后再考虑：

- claim / dequeue
- 最小主动消息执行器

---

## 13. 当前阶段 DoD

这一步完成的判断建议收成：

- 已存在 `PendingFollowUpRecord` 设计
- 已明确 `pending / claimed / executed / failed / skipped` 最小状态建议
- 已明确 executor 与 repository 的职责边界
- 已明确当前阶段只落 `accepted -> pending`
- 已明确下一步不是直接做 scheduler，而是先做 repository + migration

---

## 14. 当前结论

当前最稳的推进方式不是立刻做完整 scheduler，而是：

**先把 `follow_up_requests` 的 accepted 结果接到一个最小 pending queue 设计上。**

这样既能延续现在已经做好的：

- runtime contract
- executor stub
- adapter / port 消费结果

又不会过早把系统拖入完整调度复杂度。
