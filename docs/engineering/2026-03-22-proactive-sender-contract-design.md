# Proactive Sender Contract 设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `follow_up` 主动回流中的 `proactive sender` 最小契约边界。

本文档重点回答：

- proactive sender 负责什么，不负责什么
- `claimed follow_up` 如何转成可发送输入
- sender 返回什么结果给上层
- 平台无关 contract 应如何设计
- Telegram 当前应如何作为第一实现样本来校验 contract

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up 主动发送前置设计
> 相关文档：
> - `docs/engineering/2026-03-22-follow-up-claim-dequeue-design.md`
> - `docs/engineering/im_adapter_contract_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**proactive sender 是 SparkCore 当前阶段位于 claim/dequeue 之后、真实平台发送之前的一层平台无关发送契约，用于把已 `claimed` 的 follow-up 记录转成一次可观察、可回写结果的主动发送动作。**

---

## 3. 当前为什么要进入这一步

当前阶段已经具备：

- runtime 可产出 `follow_up_requests`
- `accepted` request 已默认落到真实 `pending_follow_ups`
- `pending -> claimed` 已有 repository seam 与真实 claim harness
- `claimed -> executed / failed` 已有 repository seam

这意味着现在真正缺的不是：

> follow-up 能不能被存住、领出来、标记结果

而是：

> 领出来之后，谁来发、按什么输入发、发完如何把结果回写

因此下一步最值得先设计的是：

- 平台无关的 proactive sender contract
- claimed record 到 sender input 的最小映射
- sender result 到 repository result marking 的最小回写关系

而不是直接把 Telegram 发送逻辑写死在 claim worker 里。

---

## 4. 当前阶段设计目标

当前阶段 proactive sender contract 的目标是：

1. 定义平台无关的主动发送输入输出协议
2. 防止 Telegram 细节过早固化成顶层发送边界
3. 为后续 `claimed -> send -> mark-result` 流程建立清晰接口
4. 让 Telegram 作为第一实现样本来验证 contract 是否足够

---

## 5. 当前阶段非目标

当前阶段 proactive sender contract **不负责**：

- worker loop
- 定时扫描
- 多平台并行发送调度
- 平台失败重试策略
- 重新入队 / backoff
- rich media / 附件
- 多 bot 多租户复杂路由

这一步的目标不是：

**做完整主动消息系统**

而是：

**先把主动发送的 contract 收清楚。**

---

## 6. 为什么当前不先做 Telegram 专属顶层 sender contract

当前更稳的做法是：

- 先做平台无关 sender contract
- 再用 Telegram 作为第一实现样本验证这个 contract

而不是：

- 先把 Telegram 的 webhook / chat id / 发送参数直接升成顶层 sender 协议

原因是：

1. 当前系统边界刚刚从 `pending -> claimed -> result marking` 收稳
2. 如果现在把 Telegram 细节抬到顶层，后面接第二个平台时很容易返工
3. 当前最需要先稳定的是：
   - sender 吃什么输入
   - sender 返回什么输出
   - 发送后如何回写 executed / failed

因此当前推荐路径是：

**顶层平台无关，Telegram 作为第一实现样本，不作为顶层 contract 本身。**

---

## 7. 建议的最小分层

当前建议将主动发送拆成三层：

### 7.1 claim 层

负责：

- 从 `pending_follow_ups` 中领取 due 记录
- 推进 `pending -> claimed`

### 7.2 proactive sender 层

负责：

- 接收 `claimed follow_up`
- 生成平台无关发送输入
- 调用具体平台 sender
- 返回统一发送结果

### 7.3 result marking 层

负责：

- 根据 sender 结果调用
  - `markFollowUpExecuted(...)`
  - `markFollowUpFailed(...)`

这意味着当前必须坚持：

**claim != send != mark-result**

---

## 8. 平台无关 sender contract 建议

### 8.1 `ProactiveSendTarget`

建议最小字段：

- `platform`
- `channel_id`
- `peer_id`
- `platform_user_id?`
- `binding_id?`

说明：

- 这层只保留主动发送真正必要的目标信息
- 不把 Telegram `chat_id`、Discord channel 结构、企业微信细节直接抬成顶层字段

### 8.2 `ProactiveSendMessage`

建议最小字段：

- `message_type`
- `content`
- `metadata?`

当前阶段建议：

- `message_type` 先只支持 `text`

### 8.3 `ProactiveSendRequest`

建议最小字段：

- `follow_up_id`
- `kind`
- `target`
- `message`
- `claim_token?`
- `trace_id?`

### 8.4 `ProactiveSendResult`

建议最小字段：

- `follow_up_id`
- `status`
- `platform_message_id?`
- `failure_reason?`
- `metadata?`

其中 `status` 当前可最小定义为：

- `sent`
- `failed`
- `unsupported`
- `invalid`

---

## 9. sender interface 建议

当前建议的最小接口类似：

```ts
type ProactiveSender = {
  send(
    request: ProactiveSendRequest
  ): Promise<ProactiveSendResult>
}
```

如果想保留批量能力预留，也可以写成：

```ts
type ProactiveSender = {
  sendBatch(
    requests: ProactiveSendRequest[]
  ): Promise<ProactiveSendResult[]>
}
```

但当前阶段更推荐：

- 先做单条 `send(...)`
- 不先把批处理复杂度带进来

---

## 10. claimed record 到 sender request 的最小映射

当前建议新增一个最小 mapper，负责：

- 输入：`PendingFollowUpRecord` + binding 信息
- 输出：`ProactiveSendRequest`

当前阶段建议映射规则：

1. `PendingFollowUpRecord.kind` -> `ProactiveSendRequest.kind`
2. `PendingFollowUpRecord.id` -> `follow_up_id`
3. binding -> `target`
4. `request_payload` / `request_reason` -> 平台无关 `message.content / metadata`

这里的关键是：

**不要让 sender 自己再去理解 `pending_follow_ups` 的数据库行结构。**

sender 应只消费标准 `ProactiveSendRequest`。

---

## 11. sender 与 binding 的边界

当前建议 proactive sender **不自己查 binding**。

更稳的边界是：

1. claim 后拿到 `PendingFollowUpRecord`
2. 上层通过 binding / thread / channel route 解析目标身份
3. mapper 生成 `ProactiveSendRequest`
4. sender 只负责发

原因是：

- binding 已经是接入层的一条独立边界
- sender 若再自己查 binding，会把“发消息”和“找谁发”重新揉在一起

---

## 12. sender result 与 repository 回写关系

当前建议：

- `sent` -> `markFollowUpExecuted(...)`
- `failed` -> `markFollowUpFailed(...)`
- `unsupported / invalid` -> 当前也走 `markFollowUpFailed(...)`

当前阶段不建议：

- 因为 `failed` 就立即重入 `pending`
- sender 自己直接做 retry

理由是：

- 当前先把结果回写边界做清楚
- retry / requeue 是后续阶段的事情

---

## 13. Telegram 作为第一实现样本的校验方式

当前建议 Telegram 只承担：

- 校验 `ProactiveSendRequest -> Telegram API` 是否足够
- 校验 `ProactiveSendResult` 字段是否够用
- 校验 `binding -> target` 的平台身份映射是否合理

Telegram 当前不应该承担：

- 定义顶层 sender 协议
- 决定所有未来平台字段命名

当前最小 Telegram 样本只需要覆盖：

1. 纯文本 proactive send
2. 成功返回 `platform_message_id`
3. 失败时返回 `failure_reason`

---

## 14. 当前阶段 DoD

这一步完成建议收成：

- 已定义平台无关 `ProactiveSendRequest`
- 已定义平台无关 `ProactiveSendResult`
- 已定义 `ProactiveSender` 最小接口
- 已明确 claimed record 到 sender request 的 mapper 边界
- 已明确 sender 与 binding 的边界
- 已明确 sender result 与 repository marking 的回写关系
- 已明确 Telegram 只是第一实现样本，不是顶层 contract 本身

---

## 15. 当前结论

当前最稳的下一步不是直接写 Telegram 主动发送 worker，而是：

**先把平台无关的 proactive sender contract 收清楚，再用 Telegram 做第一实现样本验证。**

这样后面的主动消息回流，才能建立在：

- 已可 enqueue
- 已可 claim
- 已可 mark result
- 已有 sender contract

这四层之上，而不是把平台发送、调度和状态回写一次揉在一起。

---

## 16. 当前实现进展

当前已经补上的最小代码壳包括：

- 平台无关的：
  - `ProactiveSendTarget`
  - `ProactiveSendMessage`
  - `ProactiveSendRequest`
  - `ProactiveSendResult`
  - `ProactiveSender`
- `buildProactiveSendTargetFromBinding(...)`
- `buildProactiveSendRequestFromClaimedFollowUp(...)`

这意味着：

- proactive sender 已不再只有文档概念
- 已有 `claimed record + binding -> sender request` 的最小 mapper seam
- 当前仍未接真实 sender，也未接 Telegram 主动发送实现
