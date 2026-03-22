# Session Thread State Writeback Counter 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- thread state writeback counter / aggregate metrics

这一层的最小边界。

本文档重点回答：

- 当前 thread state writeback 是否值得补聚合计数
- 如果补，第一版计数最适合挂在哪一层
- `written / skipped / failed` 是否都值得分别计数
- 它与 runtime event、统一 metrics 平台、retry、compaction 的边界是什么

本文档不是 observability 总设计，也不是统一 metrics 基础设施方案，而是：

**thread state 从“标准事件可见性已成立”推进到“是否需要最小聚合计数”前的设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state observability next step
> 相关文档：
> - `docs/architecture/session_thread_state_writeback_observability_design_v1.0.md`
> - `docs/engineering/session_state_governance_next_phase_decision_note_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_debug_metadata_design_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 thread state writeback 如果继续推进 observability，最稳的下一步不是立刻接统一 metrics 平台，而是先定义一个极小的 counter 语义面，但不急着默认落代码。**

一句话说：

**先把“要数什么”想清楚，再决定“在哪里记”和“怎么报”。**

当前推荐顺序是：

1. 先固定 counter 语义
2. 再决定是否要落轻量本地计数壳
3. 最后才考虑统一 metrics 平台接线

---

## 3. 当前为什么值得补这层

现在 `session` 这条线已经具备：

- `debug_metadata.thread_state_writeback`
- `runtime_events.thread_state_writeback_completed`

这意味着单轮内已经开始有：

- 调试摘要
- 标准事件

但当前还缺：

- 跨回合聚合视角

也就是说，我们现在能回答：

- 这一轮写没写

但还不太能方便回答：

- 最近到底写成了多少次
- `written / skipped / failed` 哪个更多
- 失败是不是已经值得为 retry 投入复杂度

所以如果继续往前，最自然的问题就是：

**是否要开始有最小 aggregate counter。**

---

## 4. 三种路线的对比

### 方案 A：先只定义 counter 语义，不落代码

形式类似：

- `thread_state_writeback_written_total`
- `thread_state_writeback_skipped_total`
- `thread_state_writeback_failed_total`

优点：

- 先把命名和边界固定
- 不会提前引入实现复杂度
- 方便后面统一接入 metrics 平台

缺点：

- 短期还不能直接产出聚合数据

### 方案 B：补一个轻量本地 counter 壳

形式类似：

- runtime 邻近层维护最小计数 helper
- 仅供受控调试入口或内部验证使用

优点：

- 能更快产出第一版聚合观察
- 不必立刻接完整 metrics 基础设施

缺点：

- 容易长成过渡期实现
- 如果没有统一出口，后面可能要重做

### 方案 C：直接接统一 metrics 平台

优点：

- 最接近长期正确答案
- 直接形成跨环境统一观测

缺点：

- 当前太重
- 会过早碰环境差异、出口策略、基础设施约定

### 当前推荐

**先选方案 A。**

因为当前最缺的不是“立刻打点”，而是：

- 先把聚合语义收清楚

---

## 5. 当前最重要的边界判断

当前建议把这几层继续分开：

### 5.1 `debug_metadata`

负责：

> 单轮调试摘要

### 5.2 `runtime_events`

负责：

> 单轮标准事件

### 5.3 counter / aggregate metrics

负责：

> 跨回合聚合统计

### 5.4 retry

负责：

> 根据失败情况改变行为

一句话说：

**counter 用来帮助判断系统趋势，不应该先承担行为控制责任。**

---

## 6. 当前建议的最小 counter 语义

当前建议第一版只定义这三个计数：

- `thread_state_writeback_written_total`
- `thread_state_writeback_skipped_total`
- `thread_state_writeback_failed_total`

原因是当前 writeback result 也只有三种最小状态：

- `written`
- `skipped`
- `failed`

这三种已经足够回答第一轮最关键的问题：

- 写回大多成功了吗
- skip 是否异常偏多
- failed 是否开始值得关心

当前不建议第一版就加：

- `by_repository` 多维计数
- `by_reason` 多维计数
- `latency histogram`
- per-route / per-channel 维度

这些都应后置。

---

## 7. 为什么现在不建议先做多维切片

虽然 `repository` 已经可见，但当前不建议第一版就把计数做成：

- `written_total{repository=supabase}`
- `failed_total{repository=in_memory}`

原因是：

- 维度一旦进来，后面很快会继续要求：
  - by route
  - by environment
  - by reason
- 当前阶段最重要的是先知道：
  - 总体是否稳定

不是先做完整分析面。

---

## 8. 当前建议的推进顺序

当前更稳的顺序是：

### Step 1

先接受当前已经有：

- 单轮 `debug_metadata`
- 单轮 `runtime event`

### Step 2

下一步优先补：

- counter 语义定义

### Step 3

等 counter 语义稳定后，再判断是否要：

- 落轻量本地计数壳
- 接统一 metrics 平台

### Step 4

最后才决定：

- retry
- compaction

---

## 9. 当前明确不建议立刻做的事

当前不建议马上做：

- 多维 label 计数
- latency histogram
- route / environment 分桶
- metrics 平台真实接线
- 根据 counter 结果直接驱动 retry

这些都超出了当前阶段“最小聚合语义”的目标。

---

## 10. 结论

当前 thread state writeback counter 最合理的下一步，不是立刻接统一 metrics 平台，也不是直接做复杂多维统计。

更稳的顺序是：

**先把 `written / skipped / failed` 三个最小 aggregate counter 的语义定义清楚，再决定是否值得落第一版代码壳。**

也就是说，当前更好的动作是：

**先回答“该数什么”，再回答“在哪里记”，最后才回答“怎么接到更大的 observability 体系”。**
