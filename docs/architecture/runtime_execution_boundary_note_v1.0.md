# Runtime Execution 边界说明 v1.0

## 1. 文档定位

本文档用于回答当前 runtime 主线里的一个具体问题：

**在 `RuntimeTurnInput -> prepareRuntimeTurn(...) -> PreparedRuntimeTurn -> runPreparedRuntimeTurn(...)` 这条链已经形成之后，`generateAgentReply(...)` 现在应该如何定位。**

这不是新的 runtime 总设计，而是一份面向当前阶段的小边界说明，帮助后续决定 execution 层是否继续抽纯。

> 状态：边界说明
> 对应阶段：Phase 1 / runtime execution 收口
> 相关文档：
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/architecture/runtime_input_contract_v1.0.md`

---

## 2. 当前判断

一句话判断：

**`generateAgentReply(...)` 现在更适合被看作“兼容型底层执行函数”，而不是继续作为长期统一入口。**

当前更合理的链路已经开始成形：

1. `RuntimeTurnInput`
2. `runAgentTurn(input)`
3. `prepareRuntimeTurn(...)`
4. `PreparedRuntimeTurn`
5. `runPreparedRuntimeTurn(prepared)`
6. `RuntimeTurnResult`

在这个结构里，`generateAgentReply(...)` 的更合适定位是：

- 继续承载历史实现与兼容面
- 在过渡期被 `runAgentTurn(...)` 复用
- 后续逐步退成更薄的底层 helper

---

## 3. 当前最稳的边界

当前最稳的 execution 边界是：

### `runAgentTurn(input)`

回答：

> 单轮 runtime 的统一外部入口是什么

### `prepareRuntimeTurn(...)`

回答：

> 为了执行这一轮，runtime 先把哪些前置依赖装配好

### `runPreparedRuntimeTurn(prepared)`

回答：

> 当装配已经完成后，runtime 真正如何执行这一轮

### `generateAgentReply(...)`

回答：

> 在当前过渡期，旧主流程如何继续被复用

也就是说，当前不应该再把：

- `runAgentTurn`
- `runPreparedRuntimeTurn`
- `generateAgentReply`

理解成三个平级长期入口。

更合理的理解是：

- `runAgentTurn` 是未来统一入口
- `runPreparedRuntimeTurn` 是正在显式化的 execution 层
- `generateAgentReply` 是过渡期兼容执行函数

---

## 4. 当前不建议做的事

当前不建议立刻做：

### 4.1 直接删除 `generateAgentReply(...)`

原因：

- 现有 Web / IM 主路径刚完成 input 和 preparation 收口
- 这时立刻硬删旧函数，收益不高，风险偏大

### 4.2 现在就把 execution 再拆成更多子函数

例如一下把下面全拆开：

- prompt builder
- model invoke
- assistant persistence
- runtime event builder
- memory write planner
- follow-up planner

这会让当前阶段从“边界收口”滑向“执行层细碎重构”。

### 4.3 让 `runPreparedRuntimeTurn(...)` 立刻脱离现有主流程语义

当前它更适合先作为：

- execution 边界的显式第一版

而不是马上变成另一套全新实现。

---

## 5. 当前更合适的下一步

当前更稳的方向是：

1. 保留 `generateAgentReply(...)` 作为过渡期底层执行函数
2. 继续让 `runPreparedRuntimeTurn(...)` 成为 execution 边界的显式主入口
3. 等主入口稳定后，再考虑把 `generateAgentReply(...)` 往更薄 helper 收

如果后面继续推进，最自然的顺序会是：

### Step 1

先让文档和代码都接受这个新关系：

- `runAgentTurn` 外部入口
- `prepareRuntimeTurn` 装配入口
- `runPreparedRuntimeTurn` execution 入口
- `generateAgentReply` 兼容底层函数

### Step 2

再决定是否把 `generateAgentReply(...)` 退成更薄的内部 helper。

### Step 3

最后才考虑 execution 层更细颗粒度的拆分。

---

## 6. 结论

当前最稳的判断是：

**runtime 主线已经完成 input / preparation / prepared execution 三层显式化，`generateAgentReply(...)` 不必立刻被重写，但它的角色已经应该从“主入口”退成“过渡期兼容执行函数”。**

这意味着当前下一步重点不是继续大拆 execution，而是：

**先把 execution 层的新边界定清楚，再决定是否继续缩薄旧函数。**
