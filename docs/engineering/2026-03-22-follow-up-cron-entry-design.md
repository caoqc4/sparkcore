# Follow-up Cron 入口设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `follow_up` 默认 worker 在进入自动触发之前的最小 cron 风格入口边界。

本文档重点回答：

- 为什么当前阶段需要单独设计 cron 风格入口
- cron 入口与现有手动调试 route 的边界是什么
- 自动触发入口如何鉴权
- 默认 sender 如何选择
- 当前阶段哪些事情继续不做

> 状态：设计草案
> 对应阶段：Phase 1 / follow-up 自动入口前置设计
> 相关文档：
> - `docs/engineering/2026-03-22-default-follow-up-worker-design.md`
> - `docs/engineering/2026-03-22-proactive-sender-contract-design.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话定义

**follow-up cron 入口是 SparkCore 当前阶段用于把 `runDefaultFollowUpWorker(...)` 从手动调试入口推进到受控自动触发入口的最小接线层。**

---

## 3. 当前为什么要单独设计 cron 入口

当前阶段已经具备：

- `runDefaultFollowUpWorker(...)`
- 手动调试 route：
  - `app/api/test/followup-run/route.ts`
- `StubProactiveSender`
- `TelegramProactiveSender` 样本壳

这意味着现在真正缺的不是：

> worker 能不能跑

而是：

> 如果未来要自动触发，它应该通过什么入口跑、用什么权限跑、默认到底能不能真发

因此 cron 入口需要单独设计，因为它和手动入口解决的问题不同：

- 手动入口：验证 worker 执行路径
- cron 入口：受控自动触发

---

## 4. 当前阶段设计目标

当前阶段 cron 风格入口的目标是：

1. 定义自动触发入口与手动调试入口的边界
2. 明确 cron 入口的最小鉴权方式
3. 明确默认 sender 选择原则
4. 不把系统一下推进到真正长期运行的 scheduler

---

## 5. 当前阶段非目标

当前阶段 cron 风格入口 **不负责**：

- 平台级 retry
- worker 并发协调
- 多实例抢占治理
- 自动 requeue
- backoff
- cron 平台具体部署实现细节
- 告警与监控体系

这一步的目标不是：

**做完整生产调度系统**

而是：

**先把自动触发入口的边界定清楚。**

---

## 6. 手动 route 与 cron 入口的边界

### 6.1 手动 route 负责

- 人工调试
- 显式传参
- 默认只跑 `StubProactiveSender`
- 用于验证 worker 路径是否正常

### 6.2 cron 入口负责

- 自动定期触发
- 受专用 secret 或内部身份保护
- 运行更接近真实默认参数
- 为未来真实主动发送留入口

因此当前建议不要把两者混成一个入口。

更稳的做法是：

- 手动入口继续保留在 `api/test`
- cron 入口单独建在更明确的内部路径下

---

## 7. 建议的 cron 入口形态

当前建议先设计成一个最小 POST route，例如：

- `app/api/internal/followup/run/route.ts`

建议只接受最小参数：

- `limit?`
- `sender?`
- `platform?`

其中：

- `sender` 当前建议只允许：
  - `stub`
  - `telegram`

但默认值应该保守。

---

## 8. 鉴权建议

当前不建议 cron 入口复用 `x-smoke-secret`。

原因是：

- `x-smoke-secret` 的语义是测试与手动调试
- cron 入口的语义是内部自动执行

更稳的做法是单独定义，例如：

- `FOLLOW_UP_CRON_SECRET`
- 请求头：
  - `x-followup-cron-secret`

当前阶段最小规则：

- 未带正确 secret -> 404 或 401
- 不依赖用户会话
- 一律使用 admin / service-role 路径

---

## 9. 默认 sender 选择建议

这是当前最关键的风险点之一。

当前建议：

### 9.1 手动入口默认 `stub`

这已经成立，继续保持。

### 9.2 cron 入口默认也应保守

当前不建议一上来让 cron 入口默认走 `TelegramProactiveSender`。

更稳的策略是：

- cron 入口第一版默认仍走 `stub`
- 只有显式开启某个 flag 或配置后，才允许真实平台 sender

例如未来可演进成：

- `FOLLOW_UP_DEFAULT_SENDER=stub`
- 或 `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true`

但当前阶段不建议直接开。

---

## 10. 最小返回对象建议

cron 入口不需要复杂响应，最小返回即可：

```ts
{
  ok: true,
  sender: "stub",
  claimed_count,
  processed_count,
  executed_count,
  failed_count,
  skipped_count
}
```

如失败：

```ts
{
  ok: false,
  message
}
```

这样既方便日志观察，也不会把内部细节暴露得太多。

---

## 11. 当前阶段最小防误触发原则

### 原则 1：cron 入口与测试入口分离

不要继续把自动触发语义叠加到 `api/test` 路径上。

### 原则 2：cron 入口默认不真发

默认 sender 仍应保守为 `stub`。

### 原则 3：真实平台 sender 必须显式开启

不能因为 route 存在就默认开始 Telegram 主动发送。

### 原则 4：limit 要有上限

例如：

- 默认 `limit = 10`
- 最大 `limit = 50`

避免误触发时一次吞太多记录。

---

## 12. 当前建议的落地顺序

### Step 1

先补 cron 入口设计稿。

### Step 2

补一个最小内部 route，但默认仍走 `stub`。

### Step 3

单独做一次 cron route 的受控验证。

### Step 4

最后再决定是否允许 Telegram 真实主动发送在 cron 入口中启用。

---

## 13. 当前阶段 DoD

这一步完成建议收成：

- 已明确 cron 入口与手动入口的边界
- 已明确 cron 入口的最小鉴权方式
- 已明确默认 sender 选择原则
- 已明确自动入口当前不默认真实发送
- 已明确下一步先做内部 route，不做完整调度系统

---

## 14. 当前结论

当前最稳的下一步不是直接把 `runDefaultFollowUpWorker(...)` 挂到真实 Telegram proactive send 上，而是：

**先把 cron 风格入口收成一个受内部 secret 保护、默认仍走 stub sender 的最小自动触发入口。**

这样后面的真实主动回流，才能建立在：

- 已有手动调试入口
- 已有默认 worker 壳
- 已有清晰鉴权边界
- 已有 sender 选择控制

这四层之上，而不是一上来就把自动触发和真实发送绑死在一起。

---

## 15. 当前实现进展

当前已经补上的最小代码壳包括：

- `getFollowUpCronEnv()`
- `app/api/internal/followup/run/route.ts`
- `x-followup-cron-secret` 请求头鉴权
- `FOLLOW_UP_DEFAULT_SENDER`
- `FOLLOW_UP_ENABLE_TELEGRAM_SEND`

这意味着：

- cron 风格入口已不再只有设计稿
- 已有一个受内部 secret 保护的最小 internal route
- 当前默认 sender 仍然保守落在 `stub`
- Telegram proactive send 只有在显式开启时才允许进入 route 选择
