# Runtime Debug Metadata 命名收口文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `runtime` 输出层里：

- `debug_metadata`

这一层的最小命名与分组边界。

本文档重点回答：

- 当前 `debug_metadata` key 为什么值得开始收口
- 命名应优先采用什么风格
- 哪些字段适合继续平铺，哪些字段更适合分组
- 它与 `runtime_events`、顶层 `RuntimeTurnResult` 的边界是什么

本文档不是 `debug_metadata` 全量 schema 设计，也不是立刻改代码的实施方案，而是：

**runtime 输出治理从“event vs metadata 边界”推进到“metadata 自身命名收口”前的最小说明稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / runtime output governance next step
> 相关文档：
> - `docs/engineering/runtime_output_governance_decision_note_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 `debug_metadata` 最稳的下一步，不是立刻变成一套严格 schema，而是先把命名风格和分组方式收清：顶层继续保留少量稳定 summary key，局部 side effect 与子域摘要逐步收成嵌套对象。**

一句话说：

**少量稳定摘要可以平铺，局部子域信息优先分组。**

---

## 3. 当前为什么值得补这层

现在 `debug_metadata` 已开始承接：

- `model_profile_id`
- `answer_strategy`
- `answer_strategy_reason_code`
- `reply_language`
- `recalled_memory_count`
- `memory_write_request_count`
- `follow_up_request_count`
- `thread_state_writeback`

这说明当前它已经不是一个空白保留位，而是开始成为真实的调试摘要面。

如果现在不开始收命名，后面很容易出现：

- 顶层 key 越来越多
- memory / session / follow_up 各自长出不同风格字段
- 平铺字段和嵌套对象混杂但没有规则

所以当前最值钱的不是立刻把它 schema 化，而是先回答：

**什么适合继续平铺，什么应该开始分组。**

---

## 4. 当前推荐的命名原则

当前建议 `debug_metadata` 遵循三条最小原则：

### 4.1 顶层只保留跨回合都稳定的 summary key

适合继续放在顶层的，应该是：

- 简单、稳定、横向常见的摘要

例如：

- `model_profile_id`
- `reply_language`

这些字段的特点是：

- 不属于某个局部子系统
- 不需要额外命名空间解释

### 4.2 局部子域信息优先收成嵌套对象

只要某组字段明显属于某个局部子系统，就更适合收成对象，例如：

- `thread_state_writeback`

而不是继续长成：

- `thread_state_writeback_status`
- `thread_state_writeback_repository`
- `thread_state_writeback_reason`

一句话说：

**一旦出现明显领域前缀，就优先考虑分组，而不是无限平铺。**

### 4.3 key 保持 snake_case

当前 `debug_metadata` 已经基本使用 snake_case。

这一点建议继续保持，不混入：

- camelCase
- kebab-case

---

## 5. 当前推荐的分组方式

当前建议把 `debug_metadata` 理解成两层：

### 5.1 顶层 summary

适合保留：

- 简单摘要
- 低耦合字段
- 跨子系统都容易理解的调试字段

例如当前已有：

- `model_profile_id`
- `reply_language`

### 5.2 子域 debug group

适合承接：

- 某个局部能力的最小摘要
- 某个 side effect 的局部结果
- 某个子系统的一组相关字段

例如当前已有：

- `thread_state_writeback`

后面如果继续扩，也更适合考虑类似：

- `answer_strategy`
- `memory`
- `follow_up`

这种分组方向，而不是继续平铺越来越多 `*_count / *_reason / *_status`。

---

## 6. 对当前已有字段的最小判断

### 当前适合继续平铺的

- `model_profile_id`
- `reply_language`

这两个字段目前仍然足够轻、足够稳定。

### 当前已经适合分组的

- `thread_state_writeback`

因为它本身已经是一组局部 side effect 结果。

### 当前最值得下一步考虑收组的

- `answer_strategy`
- `answer_strategy_reason_code`
- 以及相关策略字段

因为它们已经开始形成一个明显的局部领域：

- 策略选择
- 策略原因
- 回复语言来源/优先级

如果继续增长，平铺会很快变乱。

### 当前暂时还可以平铺但要谨慎观察的

- `recalled_memory_count`
- `memory_write_request_count`
- `follow_up_request_count`

这几个当前还只是 summary count，所以还能接受。

但如果后面继续出现：

- memory subtype count
- follow_up accepted count
- recall source breakdown

那就更适合开始收成分组对象。

---

## 7. 当前不建议立刻做的事

当前不建议马上做：

- 给 `debug_metadata` 定一套重型 schema
- 一次性重命名所有现有 key
- 为所有顶层字段都强行补 namespace
- 把所有 summary count 都立即收成嵌套对象

这些动作都会让当前这层从“轻量收口”变成“大规模重排”。

---

## 8. 当前最合理的下一步

当前更稳的顺序是：

1. 先接受当前命名收口原则：
   - 少量稳定摘要可平铺
   - 局部子域优先分组

2. 下一步如果继续实现，优先考虑：
   - `answer_strategy*` 是否要进入一个小分组

3. 再决定是否需要：
   - memory debug group
   - follow_up debug group

也就是说，当前不该一口气“统一所有 key”，而是：

**先从最容易继续失控的那一组开始。**

---

## 9. 结论

当前 `debug_metadata` 命名收口最合理的方向，不是全面 schema 化，而是：

**让顶层继续只保留少量稳定摘要，把明显属于局部子域的信息逐步收成嵌套对象。**

也就是说，当前更好的动作是：

**先把“平铺摘要”和“局部分组”的边界讲清楚，再决定具体哪一组字段先重构。**
