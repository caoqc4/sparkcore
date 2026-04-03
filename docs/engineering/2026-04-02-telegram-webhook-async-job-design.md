# Telegram Webhook 异步 Job 化设计稿 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 Telegram IM 入站链路从“同步 webhook 执行”迁移到“receipt + job + worker”异步执行的最小落地方案。

本文档重点回答：

- 当前 Telegram webhook 为什么仍然慢
- 为什么现有 `after(...)` 不是完整解法
- 最小异步 job 方案的职责边界是什么
- webhook、job、worker 三段应该分别负责什么
- 状态机、幂等、失败重试、灰度上线该怎么设计

> 状态：设计草案
> 对应阶段：IM runtime / Telegram 接入性能收口
> 相关文档：
> - `docs/engineering/telegram_poc_runbook_v1.0.md`
> - `docs/engineering/2026-03-22-default-follow-up-worker-design.md`
> - `docs/product/output_governance_handbook_design_v1.0.md`

---

## 2. 一句话定义

**Telegram webhook 异步 job 化，是把“接收事件”和“生成/发送回复”解耦：webhook 只负责收件与入队，worker 再异步完成 runtime、出站发送和后处理。**

---

## 3. 当前为什么值得进入这一步

当前链路虽然已经做了部分异步：

- `deferred_artifact_generation` 走 `after(...)`
- `deferred_post_processing` 走 `after(...)`

但真正最重的主链仍然同步挂在 webhook 上：

- `handleInboundChannelMessage(...)`
- `sendTelegramOutboundMessages(...)`

这导致当前 Telegram webhook 仍然会等待：

1. 线程加载与 bootstrap
2. runtime memory / governance 组装
3. 文本生成
4. assistant message 持久化
5. Telegram outbound 发送

从现有观测看，Telegram webhook 仍然可能稳定落在：

- `39s`
- `45s`
- `50s+`

这会带来三个直接问题：

- Telegram 侧容易出现长等待、重试和用户体验异常
- webhook 路由本身承担了不应承担的高时延风险
- 后续即使更换模型/官方接口，这个接入层耦合问题依然存在

---

## 4. 目标

当前阶段的目标是：

1. 让 Telegram webhook 在完成 receipt claim 和 job enqueue 后尽快返回 `200`
2. 让 runtime / outbound / post-processing 从 webhook 主响应中剥离
3. 保持现有 `im-runtime-port` 与 Telegram sender 逻辑尽可能复用
4. 建立明确的状态机与幂等边界，避免重复执行

---

## 5. 非目标

当前阶段不追求：

- 一次性重构所有 IM 平台接入
- 完整通用队列平台抽象
- 多 worker 高并发调度优化
- 复杂 backoff / DLQ / lease 续约
- 把所有 `after(...)` 全部移除
- 同时解决所有 Supabase 网络抖动问题

当前阶段的目标不是做一个“大而全调度系统”，而是：

**先把 Telegram webhook 从同步长链路里解放出来。**

---

## 6. 当前现状复盘

### 6.1 已经具备的基础能力

当前代码已经具备：

- `im_inbound_receipts` 去重与 claim
- `handleInboundChannelMessage(...)`
- `sendTelegramOutboundMessages(...)`
- `runDeferredImPostProcessing(...)`
- `runDeferredImArtifactGeneration(...)`
- 一定程度的 timing 观测：
  - `[telegram-webhook]`
  - `[im-runtime]`
  - `[runtime-turn]`
  - `[runtime-turn:prepared]`

### 6.2 当前真正卡在哪里

从最近观测看，主耗时通常集中在：

- `adapter_duration_ms`
- `run_agent_turn`
- `generate_text_duration_ms`
- `bootstrap_load_thread_messages`
- `persist_assistant_message_duration_ms`

也就是说，webhook 当前仍然承担了“完整业务执行器”的职责。

---

## 7. 为什么现有 `after(...)` 不够

`after(...)` 适合做：

- 轻量补充任务
- 非关键路径后处理
- 最多是“回复已经产出后的补写”

但不适合承载：

- 主回复生成
- 主消息持久化
- 主出站发送

原因：

1. 这些任务本身是主产品路径，不是附属路径
2. 失败重试、幂等和状态可见性不够强
3. 本地开发和平台运行时上都不适合作为长期主执行机制
4. “先 ack 再执行”这个目标，靠 `after(...)` 仍然不够彻底

所以当前建议是：

- 保留 `after(...)` 用于轻量后处理
- 把“主生成链”迁到真正的 job + worker

---

## 8. 推荐方案概述

### 8.1 推荐架构

建议引入一个最小的 Telegram inbound job 层：

1. webhook
   - 验签
   - normalize / enrich
   - claim receipt
   - enqueue job
   - 立即返回 `200`

2. worker
   - 读取 `queued` job
   - claim job
   - 执行 `handleInboundChannelMessage(...)`
   - 执行 `sendTelegramOutboundMessages(...)`
   - 执行 deferred post-processing / artifact generation
   - 回写 job 与 receipt 状态

3. diagnostics
   - webhook 看 receipt 与 job enqueue
   - worker 看 runtime/outbound/postprocess

### 8.2 推荐数据分层

这里的执行状态建议分三层：

- `im_inbound_receipts`
  - 负责“这条平台事件有没有被认领、处理、失败”
- `im_inbound_jobs`
  - 负责“这条已认领事件的实际执行任务”
- runtime / message / outbound records
  - 负责“执行结果本身”

---

## 9. 新增表：`im_inbound_jobs`

### 9.1 最小字段建议

建议新增表：

```sql
im_inbound_jobs
```

建议最小字段：

- `id uuid primary key`
- `receipt_id uuid not null references im_inbound_receipts(id)`
- `platform text not null`
- `channel_slug text not null`
- `job_type text not null`
- `status text not null`
- `attempt_count integer not null default 0`
- `claimed_by text null`
- `claimed_at timestamptz null`
- `available_at timestamptz not null default now()`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `failed_at timestamptz null`
- `last_error text null`
- `payload jsonb not null default '{}'::jsonb`
- `result jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 9.2 `job_type` 建议

当前阶段先只支持：

- `telegram_inbound_turn`

后续如果要支持别的平台或分拆 artifact worker，再扩。

### 9.3 `status` 建议

当前阶段最小状态集：

- `queued`
- `claimed`
- `processing`
- `completed`
- `failed`
- `cancelled`

---

## 10. receipt 与 job 的职责边界

### 10.1 receipt 负责什么

`im_inbound_receipts` 继续负责：

- webhook 去重
- 事件归一化元数据
- 事件有没有被 claim
- 事件最终处理状态

### 10.2 job 负责什么

`im_inbound_jobs` 负责：

- 真正的执行排队
- worker claim
- 失败重试
- 结果回写
- 详细运行记录

### 10.3 二者关系

建议关系为：

- 一条 `receipt`
- 对应一条主 `telegram_inbound_turn` job

当前阶段不建议一条 receipt 直接拆多条主 job，先保一对一，复杂度最低。

---

## 11. 最小状态机

### 11.1 receipt 状态机

receipt 当前可保持已有设计：

- `received`
- `processing`
- `processed`
- `binding_not_found`
- `processing_failed`
- `duplicate`

建议调整执行时机：

- webhook claim 成功后，先写 `received`
- job 被 worker claim 时，再写 `processing`
- worker 成功后，写 `processed`
- worker 失败后，写 `processing_failed`

### 11.2 job 状态机

建议 job 状态如下：

1. `queued`
2. `claimed`
3. `processing`
4. `completed` 或 `failed`

建议最小规则：

- `queued -> claimed`
  只能由 worker claim 发生
- `claimed -> processing`
  worker 正式进入执行时发生
- `processing -> completed`
  全链成功
- `processing -> failed`
  执行链失败

---

## 12. webhook 最小改造方案

### 12.1 当前 webhook 新职责

改造后，Telegram webhook 路由只负责：

1. 验签
2. parse / normalize
3. enrich
4. `claimImInboundReceipt(...)`
5. enqueue `im_inbound_job`
6. 返回 `200`

### 12.2 当前 webhook 不再同步负责

改造后，不再在 webhook 主链同步执行：

- `handleInboundChannelMessage(...)`
- `sendTelegramOutboundMessages(...)`
- `runDeferredImPostProcessing(...)`
- `runDeferredImArtifactGeneration(...)`

### 12.3 返回语义

建议 webhook 返回：

```json
{
  "ok": true,
  "status": "accepted",
  "receipt_id": "...",
  "job_id": "..."
}
```

对于 duplicate：

```json
{
  "ok": true,
  "status": "skipped_duplicate_receipt"
}
```

---

## 13. worker 最小执行流程

### Step 1：claim queued jobs

- 只取：
  - `status = queued`
  - `job_type = telegram_inbound_turn`
  - `available_at <= now()`
- 按：
  - `created_at asc`

### Step 2：切换 receipt / job 状态

- job -> `claimed` / `processing`
- receipt -> `processing`

### Step 3：执行 inbound turn

worker 调用现有：

- `handleInboundChannelMessage(...)`

得到：

- user message
- assistant result
- outbound messages
- deferred payload

### Step 4：执行 outbound 发送

worker 调用：

- `sendTelegramOutboundMessages(...)`

### Step 5：执行轻量后处理

worker 成功后再串：

- `runDeferredImPostProcessing(...)`
- `runDeferredImArtifactGeneration(...)`

### Step 6：回写结果

成功：

- job -> `completed`
- receipt -> `processed`

失败：

- job -> `failed`
- receipt -> `processing_failed`

---

## 14. 幂等与去重原则

### 14.1 webhook 幂等

仍然由 `im_inbound_receipts` 去重承担第一层幂等。

### 14.2 job 幂等

建议保证：

- 一个 `receipt_id`
- 只能存在一个 active `telegram_inbound_turn` job

建议通过唯一索引实现：

- `unique(receipt_id, job_type)`

### 14.3 outbound 幂等

当前阶段先复用现有 outbound 逻辑，不额外扩独立 outbound idempotency key。

但建议在 job `result` 中保留：

- `outbound_count`
- `delivery_ok`
- `delivery_summary`

为后续 outbound 幂等加强留 seam。

---

## 15. 失败与重试建议

### 15.1 当前阶段最小策略

当前阶段建议的最小失败策略：

- job 失败后可重试
- 但重试次数先限制在很小范围

建议：

- `attempt_count < 3`
- 固定延迟重试即可，例如：
  - 第 1 次：`+30s`
  - 第 2 次：`+5m`

### 15.2 哪些错误可以重试

建议先只重试：

- Telegram delivery 临时失败
- Supabase / network 瞬时失败
- 上游模型 / provider 临时失败

不建议自动重试：

- binding 不存在
- webhook payload 非法
- 明确业务约束错误

---

## 16. 观测与日志

### 16.1 webhook 侧

继续保留：

- `[telegram-webhook]`

但含义改为：

- 入队耗时
- receipt claim 耗时
- enqueue 耗时
- 总接收耗时

### 16.2 worker 侧

建议新增：

- `[telegram-inbound-worker]`

建议记录：

- `job_id`
- `receipt_id`
- `claim_duration_ms`
- `runtime_duration_ms`
- `outbound_duration_ms`
- `post_processing_duration_ms`
- `artifact_duration_ms`
- `total_duration_ms`
- `status`

### 16.3 receipt / job metadata

建议在 job `result` 中保留：

- runtime timing 摘要
- outbound timing 摘要
- error summary

避免以后只能翻终端日志。

---

## 17. 与现有代码边界的关系

### 17.1 可直接复用

当前建议直接复用：

- `claimImInboundReceipt(...)`
- `handleInboundChannelMessage(...)`
- `sendTelegramOutboundMessages(...)`
- `runDeferredImPostProcessing(...)`
- `runDeferredImArtifactGeneration(...)`

### 17.2 新增边界

建议新增：

- `enqueueImInboundJob(...)`
- `claimQueuedImInboundJobs(...)`
- `runTelegramInboundWorker(...)`

### 17.3 当前不建议重写

当前不建议重写：

- `im-runtime-port`
- Telegram sender contract
- receipt schema 主语义

也就是说，这次应该是“加一层调度”，不是“重做主业务执行器”。

---

## 18. 最小落地顺序

建议按下面顺序推进：

### Phase A：数据层

1. 新增 `im_inbound_jobs` migration
2. 新增 enqueue / claim / complete / fail repository seam

### Phase B：worker harness

3. 新增 `runTelegramInboundWorker(...)`
4. 先支持单次 `claim -> process -> mark`

### Phase C：webhook 改造

5. webhook 改成：
   - claim receipt
   - enqueue job
   - return `200`

### Phase D：后处理迁移

6. 把 deferred post-processing / artifact generation 挪进 worker 成功尾部

### Phase E：重试

7. 增加最小失败重试策略

---

## 19. 当前阶段推荐实施范围

当前阶段最推荐的最小实现范围是：

- 只支持 Telegram
- 只支持单 job type：`telegram_inbound_turn`
- 只支持单 worker run
- 先不做常驻进程
- 可以先通过：
  - admin route
  - cron route
  - 手动触发 route
  任意一种方式驱动 worker

这样能先尽快验证：

- webhook 是否已快速返回
- Telegram 用户体验是否明显改善
- 主链耗时是否成功转移到 worker

---

## 20. 风险与注意点

### 20.1 用户感知延迟

即使 webhook 快速返回，真正回复仍然需要 runtime 时间。

所以这一步改善的是：

- Telegram 接入可靠性
- 平台重试/超时

不等于立刻让回复变成 1 秒。

### 20.2 worker 丢任务风险

如果只有 enqueue 没有可靠 worker，任务可能卡在 `queued`。

所以最小 worker harness 必须尽快补齐。

### 20.3 重复执行

如果 worker claim 设计不好，可能重复回复。

因此：

- receipt 去重
- job 唯一约束
- claim 原子性

这三点必须一起设计。

---

## 21. 一句话结论

**Telegram webhook 当前最大的结构问题，不是还缺一点 `after(...)`，而是“主生成链仍然同步挂在接入路由上”。当前最合理的下一步，是引入 `im_inbound_jobs`，把 Telegram webhook 改成“receipt + enqueue + fast ack”，再由 worker 异步完成 runtime、outbound 与后处理。**
