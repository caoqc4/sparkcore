# Session Thread State Writeback Observability 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- thread state writeback observability

这一层的最小边界。

本文档重点回答：

- 当前 thread state writeback 是否值得补 observability
- 如果补，第一版最适合先落在哪一层
- `runtime event / counter / log` 三种观测方式里，当前优先级如何
- 它与 retry、metrics 平台化、compaction 的边界是什么

本文档不是 retry 设计，也不是 metrics 基础设施建设方案，而是：

**thread state 从“最小写回与最小调试可见性已成立”推进到“最小观测边界是否值得成立”前的设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state governance next step
> 相关文档：
> - `docs/engineering/session_state_governance_next_phase_decision_note_v1.0.md`
> - `docs/architecture/session_thread_state_writeback_debug_metadata_design_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 thread state writeback 已经有了最小 `runtime event`；后续如果继续推进观测层，最稳的下一步不是立刻做独立 metrics 平台接线，也不是先加日志洪泛，而是先观察这层标准事件是否已经足够。**

一句话说：

**先让 writeback 对 runtime event 可见，再决定是否值得继续扩到 counter 或日志。**

当前已前移成：

1. `runtime event`
2. counter / aggregate metrics
3. log / trace 细节化

---

## 3. 当前为什么值得补这层

现在 `session` 这条线已经具备：

- 默认真实后端读取
- 最小写回接口
- `runPreparedRuntimeTurn(...)` 内的 soft-fail writeback
- `debug_metadata.thread_state_writeback`

这意味着：

- 单轮调试已经开始可见
- 但跨回合、跨入口、跨运行观察仍然不够

当前缺的不是：

- “这一次有没有写”

而更像是：

- “最近大概写了多少次”
- “`written / skipped / failed` 主要在发生什么”
- “后面是否真的值得为 retry 投入复杂度”

所以现在最值得补的，不是更重的治理逻辑，而是：

**最小观测面。**

---

## 4. 三种观测方式的对比

### 方案 A：先补 `runtime event`

形式类似：

```ts
{
  type: "thread_state_writeback_completed",
  payload: {
    status: "written" | "skipped" | "failed",
    repository: "supabase" | "in_memory" | "unknown"
  }
}
```

优点：

- 和现有 runtime event 机制一致
- 对现有 contract 扰动最小
- 能被后续 eval / trace / route 调试复用

缺点：

- 仍然是单轮事件
- 还不是聚合指标

### 方案 B：直接补 counter / aggregate metrics

形式类似：

- `thread_state_writeback_written_total`
- `thread_state_writeback_failed_total`
- `thread_state_writeback_skipped_total`

优点：

- 最接近长期运营观测
- 对稳定性判断很直接

缺点：

- 当前还没有统一 metrics 接入策略
- 太快进入基础设施层

### 方案 C：先补 log / trace

形式类似：

- `console.info`
- structured log
- trace annotation

优点：

- 最灵活
- 实现很快

缺点：

- 最容易失控
- 输出面容易分散
- 难以成为稳定 contract

### 当前推荐

**当前已经按方案 A 落下第一版代码事实。**

因为现在最需要的是：

- 先在 runtime 统一输出面内，给 writeback 一个标准事件位置

而不是：

- 立刻开一套新的 metrics 或日志路径

---

## 5. 当前最重要的边界判断

当前建议把这几层继续分开：

### 5.1 `debug_metadata`

负责：

> 单轮调试摘要

### 5.2 `runtime_events`

负责：

> 单轮内的标准事件可见性

### 5.3 metrics / counter

负责：

> 跨回合聚合观测

### 5.4 retry

负责：

> 对失败进行行为级补偿

一句话说：

**当前先补事件，不急着补聚合指标，也不急着补重试行为。**

---

## 6. 当前建议的最小 event 形状

当前已补上一个最小 runtime event，例如：

```ts
type RuntimeEvent =
  | ...
  | {
      type: "thread_state_writeback_completed";
      payload?: {
        status: "written" | "skipped" | "failed";
        repository: "supabase" | "in_memory" | "unknown";
      };
    };
```

当前第一版只暴露：

- `status`
- `repository`

当前不建议第一版就暴露：

- 完整 `reason`
- 原始错误字符串
- 完整 thread state diff
- save payload

因为这些更适合继续留在：

- `debug_metadata`

而不是先进入标准 event 面。

---

## 7. 为什么现在不建议先做 counter

当前不建议先做 counter，不是因为它不重要，而是因为：

- 现在还没有统一 metrics 命名与出口约定
- 当前更需要先验证 runtime event 是否已足够支撑观察
- 一旦先做 counter，下一步就会连带要求：
  - flush 时机
  - 环境差异
  - route / worker / test 路径统一打点

这些都比当前阶段需要的更重。

---

## 8. 为什么现在也不建议先做 log / trace

log / trace 不是永远不做，而是当前不宜优先。

原因是：

- 它最容易变成局部临时输出
- 代码里很快会长出多种风格的日志
- 后面反而更难收回统一 contract

如果当前已经有：

- `debug_metadata`
- `runtime_events`

那么更稳的顺序应该是：

- 先把这两个既有 runtime 输出面用好

而不是另开一条日志旁路。

---

## 9. 当前建议的推进顺序

当前更稳的顺序是：

### Step 1

先接受当前已经有：

- `debug_metadata.thread_state_writeback`

### Step 2

当前已经补上：

- `runtime_events` 中的最小 `thread_state_writeback_completed`

### Step 3

等 event 稳定后，再决定是否值得继续补：

- counter
- trace
- 更细的失败分类

### Step 4

最后才决定：

- retry
- compaction

---

## 10. 结论

当前 thread state writeback observability 最合理的下一步，不是立刻做 metrics 平台化，也不是先加散落日志。

更稳的顺序当前已经前移成：

**先把 thread state writeback 补成最小 `runtime event`，再决定是否值得继续扩到 counter 或 trace。**

也就是说，当前更好的动作是：

**先接受“标准事件观测”已经落地，再回答“是否需要更重的 observability 基础设施”。**
