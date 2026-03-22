# Follow-up Sender 开关与运行策略 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `follow_up` 主动回流链路中，`sender` 的启用边界、环境策略、入口差异和防误触发原则。

本文档重点回答：

- 哪些入口允许真实主动发送
- 哪些环境允许开启 Telegram proactive send
- route 参数、env 开关和默认 sender 的优先级如何判定
- 如何避免把“已具备能力”误用成“默认生产行为”

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up sender enable 策略
> 相关文档：
> - `docs/engineering/2026-03-22-proactive-sender-contract-design.md`
> - `docs/engineering/2026-03-22-default-follow-up-worker-design.md`
> - `docs/engineering/2026-03-22-follow-up-cron-entry-design.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**当前阶段的 sender enable 策略，不是为了让 SparkCore 默认开始主动发消息，而是为了确保真实主动发送只能在明确入口、明确环境和明确开关条件下发生。**

---

## 3. 当前已知事实

当前已经成立的事实有：

- `follow_up` 已可走到真实 `pending_follow_ups`
- `runDefaultFollowUpWorker(...)` 已存在
- `app/api/test/followup-run/route.ts` 已存在
- `app/api/internal/followup/run/route.ts` 已存在
- `StubProactiveSender` 已可跑通整条链
- `TelegramProactiveSender` 已作为样本实现壳存在
- `follow-up-sender-policy.ts` 已形成统一 sender 选择 / 降级 helper
- internal route 已完成两类受控验证：
  - `stub sender` 真实验证
  - Telegram proactive send 真实验证

这意味着当前真正的问题已经不是：

> 能不能发

而是：

> 什么情况下允许发、谁能触发发、默认是不是该发

---

## 4. 当前阶段设计目标

当前阶段 sender enable 策略的目标是：

1. 明确不同入口的 sender 权限边界
2. 明确环境变量与请求参数的优先级
3. 明确真实 Telegram proactive send 的最小准入条件
4. 把真实发送维持在“受控启用”而非“默认开启”

---

## 5. 当前阶段非目标

当前阶段本策略 **不负责**：

- 多平台 sender 选择编排
- 生产级告警与审计系统
- 自动回滚策略
- retry / requeue / dead-letter
- 多实例并发调度治理
- 不同环境的部署平台细节

当前阶段的重点是：

**把 sender enable 的安全边界写清楚。**

---

## 6. 入口分层与 sender 权限

### 6.1 手动测试入口

当前入口：

- `app/api/test/followup-run/route.ts`

语义：

- 人工调试
- 面向开发阶段的 smoke / 手工验证

当前建议：

- 默认只允许 `StubProactiveSender`
- 不建议在该入口上直接开放真实 Telegram proactive send

原因：

- `api/test` 的语义是验证执行路径
- 一旦允许真实 sender，测试入口的风险就会被放大
- 真实平台发送应留在更明确的 internal 入口下控制

### 6.2 internal route

当前入口：

- `app/api/internal/followup/run/route.ts`

语义：

- 受控的内部触发入口
- 更接近未来 cron / scheduler 的调用语义

当前建议：

- 默认 sender 仍然是 `stub`
- 可在受控条件下显式选择 `telegram`
- 当前真实 Telegram proactive send 只允许通过该入口验证

### 6.3 未来 cron 入口

当前阶段还未单独实现生产式 cron runner。

未来如果存在平台或基础设施层 cron，只应调用：

- internal route
- 或内部 worker wrapper

而不是直接绕过现有 sender enable 判断逻辑。

---

## 7. 环境策略

当前建议按环境分成三类：

### 7.1 本地开发环境

默认策略：

- `FOLLOW_UP_DEFAULT_SENDER=stub`
- `FOLLOW_UP_ENABLE_TELEGRAM_SEND=false`

允许的例外：

- 开发者在单次验证时，临时显式设置：
  - `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`
- 并通过 internal route 请求体显式传：
  - `sender=telegram`

这正是本轮真实验证采用的方式。

### 7.2 预发布 / 预览环境

默认策略：

- 仍建议默认 `stub`
- 只有在明确验证窗口内才临时开启 Telegram proactive send

原因：

- 预览环境常常不具备稳定 webhook / bot / binding 状态
- 更容易因为配置漂移造成误发

### 7.3 生产环境

当前建议：

- 在没有更明确审计与运维约束前，生产环境仍默认 `stub`
- 如果要允许真实 Telegram proactive send，必须是显式受控放开

换句话说：

**当前阶段不建议把生产环境默认 sender 改成 `telegram`。**

---

## 8. 开关与优先级

当前已存在的配置位：

- `FOLLOW_UP_CRON_SECRET`
- `FOLLOW_UP_DEFAULT_SENDER`
- `FOLLOW_UP_ENABLE_TELEGRAM_SEND`

当前建议的判定顺序如下：

### Step 1：先过入口鉴权

- 没有正确 `x-followup-cron-secret`
- 直接拒绝

### Step 2：确定请求想要的 sender

优先级：

1. route body 中显式传入的 `sender`
2. 若未传，则回退到 `FOLLOW_UP_DEFAULT_SENDER`

### Step 3：做能力开关判断

如果请求 sender 为 `telegram`，则必须同时满足：

- `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`
- 当前入口是 internal route

否则一律降级为：

- `StubProactiveSender`

### Step 4：执行时仍以 sender 实际选中结果为准

返回对象中应显式暴露：

- `requested_sender`
- `sender`
- `telegram_send_enabled`

这样便于区分：

- 用户请求了什么
- 系统实际用了什么

当前代码里，这层判断已经由：

- `apps/web/lib/chat/follow-up-sender-policy.ts`

统一承接，而不是继续散在各个 route 内部。

---

## 9. 当前阶段推荐的策略矩阵

| 场景 | 入口 | 默认 sender | 允许真实 Telegram send |
| --- | --- | --- | --- |
| 开发自测 | `api/test/followup-run` | `stub` | 不建议 |
| 受控内部验证 | `api/internal/followup/run` | `stub` | 可以，但需显式开启 |
| 未来 cron 调用 | internal route 或内部 wrapper | `stub` | 仅在明确放开后 |

当前最关键的一条原则是：

**真实 Telegram proactive send 不是入口一存在就默认开启，而是必须同时满足“internal route + env 开关开启 + 请求显式选择”三层条件。**

---

## 10. 防误触发原则

### 原则 1：测试入口不默认真发

`api/test` 继续只服务调试，不承担真实主动发送职责。

### 原则 2：internal route 默认保守

即使 internal route 存在，也仍然默认走 `stub`。

### 原则 3：真实 sender 必须显式选择

不允许只因为 `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`，就自动开始真实 Telegram proactive send。

还必须在请求里显式传：

- `sender=telegram`

### 原则 4：真实 sender 验证必须受控

每次真实主动发送验证都应该：

- 明确验证窗口
- 明确测试 binding
- 明确清理测试记录

### 原则 5：返回结果必须可观察

每次 internal route 调用，都应能看清：

- 实际 sender
- claimed / processed / executed / failed 数

避免“以为发了”和“其实只是 stub”混淆。

---

## 11. 推荐的近期运行策略

当前最推荐的近期策略不是：

**把 Telegram proactive send 开成默认行为**

而是：

**继续维持默认 `stub`，并把真实 Telegram proactive send 保留在受控 internal route 验证模式下。**

更具体地说：

1. 开发与日常调试默认 `stub`
2. internal route 保留真实 sender 能力
3. 每次真实验证都显式开启 env
4. 暂不做长期常开

这样既保住了能力，也不会过早把系统推到“默认真发”的风险区。

---

## 12. 下一步建议

### Step 1

先把本文档作为当前 sender enable 的策略基线。

### Step 2

如果要继续推进，继续把现有 sender policy helper 扩到更多入口，统一做：

- 请求 sender 解析
- env 开关判断
- sender 降级决策

### Step 3

再决定是否要把“真实 Telegram proactive send”从受控验证提升到更稳定的内部运行策略。

在那之前，不建议直接把默认 sender 改成 `telegram`。

---

## 13. 当前阶段 DoD

当以下条件成立时，可以认为当前 sender enable 策略已收口：

- 已有清晰的入口分层
- 已有清晰的环境策略
- 已有清晰的 sender 判定优先级
- 已有明确的防误触发原则
- 已明确当前阶段不默认开启真实 Telegram proactive send

---

## 14. 当前结论

当前 SparkCore 在 `follow_up` 主动回流这条线上，已经不缺“能不能主动发”的能力，而更缺“什么情况下允许主动发”的清晰边界。

所以当前最稳的选择不是立刻扩大真实发送默认面，而是：

**把 sender enable 策略收清楚，并继续坚持“默认 stub、受控 real send”的运行原则。**
