# Follow-up 下一阶段决策说明 v1.0

## 1. 文档定位

本文档用于在当前 `follow_up / proactive send` 能力已经基本收口后，帮助判断：

- 为什么现在不宜继续无节制往前推
- 当前更适合停在哪个成熟度层级
- 如果后续继续推进，最值得继续的方向是什么
- 如果暂时不继续推进，当前这条线是否已经足够服务 Phase 1

本文档是一个**阶段决策说明**，不是新的实现设计稿。

> 状态：当前有效
> 对应阶段：Phase 1 / follow-up 阶段决策
> 相关文档：
> - `docs/engineering/followup_proactive_capability_summary_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `docs/engineering/2026-03-22-follow-up-sender-enable-strategy.md`

---

## 2. 一句话判断

**当前 `follow_up / proactive send` 已经足够从“设计支线”进入“受控可运行能力”，因此下一阶段不应再默认继续深推生产化，而应先明确它是否真是当前主线最优先事项。**

---

## 3. 当前为什么适合先停一下

这条线现在已经具备：

- runtime planner output
- pending 持久化
- claim / mark seam
- proactive sender contract
- sender shell
- default worker shell
- manual route
- internal route
- stub 真实验证
- 真实 Telegram proactive send 受控验证
- sender policy helper

也就是说，当前已经不是：

> 这条线还没站起来

而是：

> 这条线已经能用，但是否值得继续推进成默认生产能力，需要重新判断

如果现在继续直接往下做：

- 常驻 cron
- retry / requeue
- 生产级开关治理
- 多平台主动回流

那复杂度会明显上升，而且会把主线重新拉向“运行系统 / 调度系统”。

这未必是当前整个项目最优先的方向。

---

## 4. 当前最准确的停点

当前最合适的停点不是：

- 只停在设计稿

也不是：

- 继续推进到默认常开生产主动发送

而是停在：

**受控可运行、真实已验证、默认仍保守**

这意味着：

### 已经足够的部分

- 已能证明主动回流能力成立
- 已能证明 Telegram 样本发送成立
- 已能证明 worker 链路成立
- 已有统一 sender 策略

### 仍刻意不打开的部分

- 默认真实 Telegram send
- 常驻自动调度
- retry / requeue
- 生产式 cron 常开

这个停点现在是健康的，因为它既避免了：

- “能力还没证明就停”

也避免了：

- “为了证明能做，继续把系统做重”

---

## 5. 如果后续继续推进，最合理的方向

如果后续还要继续推进 `follow_up`，当前最合理的方向不再是“补更多底层 seam”，而是更靠近运行策略：

### 方向 1：更稳定的 internal 运行策略

例如：

- sender enable policy helper 再扩一层
- internal route 的运行说明更完整
- 更清晰的 sender 开关治理

### 方向 2：受控 cron 接入

例如：

- 平台侧 cron 调 internal route
- 仍默认 `stub`
- 明确日志与调用约束

### 方向 3：生产化防线

例如：

- retry / requeue 策略
- 幂等 / 重复执行治理
- 更清晰的 sender 失败分类

但这三类都已经明显比当前阶段更重。

---

## 6. 为什么当前更值得回到底座主线

相比继续深推 `follow_up`，当前更值得回到底座主线，原因有三个：

### 6.1 output 已明显比 input 更成熟

现在：

- output contract 已较清楚
- input contract 仍不够统一

所以当前最大的不对称，不在 `follow_up`，而在 runtime input。

### 6.2 单 Agent runtime 统一入口仍未完全成立

当前已经有：

- runtime output contract
- role / memory / session 最小落点
- adapter port

但还没有一个同样成熟的：

- `runAgentTurn(input)`

统一入口。

### 6.3 session 仍比 follow_up 更需要继续底座化

`follow_up` 已经推进到“受控可运行”，而 `session` 还停留在“最小 contract 已落地，但状态层尚未正式化”。

从底座价值看，下一阶段继续收 `runtime input + session` 的收益更高。

---

## 7. 当前最建议的决策

当前最建议的决策是：

### 决策 A：把 `follow_up` 暂时停在当前成熟度

当前就停在：

- 受控可运行
- 真实已验证
- 默认保守关闭

### 决策 B：主线切回 runtime input / single-agent runtime

优先做：

1. `runtime input contract`
2. `runAgentTurn(input)`
3. `session` 的进一步底座化

这会比继续深推主动回流系统更符合当前整体项目收益。

---

## 8. 当前结论

**当前 `follow_up / proactive send` 这条线已经推进到了一个很好的阶段停点：它足够真实、足够完整、足够可验证，但还没有把整个项目拖进生产级调度系统复杂度。**

所以当前更正确的选择不是继续默认深推，而是：

**先把这条线停在“受控可运行”层级，把主线切回 single-agent runtime 的 input 收口与底座化。**
