# Runtime Memory Preparation 边界说明 v1.0

## 1. 文档定位

本文档用于回答一个很具体的问题：

**在 `RuntimeTurnInput -> prepareRuntimeTurn(...) -> PreparedRuntimeTurn` 这条主线里，memory 应该以什么方式进入 preparation 模块。**

这不是 memory layer 总设计，也不是 memory write / follow-up 的延伸说明，而是一个面向当前 runtime 主线的边界说明。

> 状态：边界说明
> 对应阶段：Phase 1 / runtime preparation 收口
> 相关文档：
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/runtime_input_contract_v1.0.md`

---

## 2. 当前判断

一句话判断：

**memory 应该进入 preparation 模块，但当前只适合先进入“recall context 装配”这一层，不适合把 write / planner / executor 一起搬进 preparation。**

也就是说，当前最稳的边界是：

- `prepareRuntimeMemory(...)`
  - 负责把本轮 runtime 需要的 `RuntimeMemoryContext` 准备出来
- 不负责：
  - memory write planning
  - relationship memory subtype planning
  - memory write execution
  - correction / restore / admin-style mutation

---

## 3. 为什么 memory 不能像 session / role 一样直接整块搬

`session` 和 `role` 当前更适合先进入 preparation 模块，是因为它们主要承担：

- 每轮稳定存在的上下文装配
- 对 runtime 推理前的“前置准备”

而 `memory` 当前同时承载了三种性质不同的东西：

1. `recall`
   - 本轮运行前需要准备的长期记忆上下文
2. `planning`
   - 本轮运行后可能产出的写入建议
3. `execution`
   - 对写入建议的真实执行

如果现在把 memory 整块往 preparation 模块搬，很容易把：

- 前置准备
- 后置 planner
- 后置 executor

重新混成一个“看起来更干净、实际更重”的大模块。

所以 current best move 不是“memory 全进 preparation”，而是：

**只把 recall context 的装配先收进去。**

---

## 4. 当前最适合进入 preparation 的 memory 部分

当前最适合进入 preparation 模块的是：

### 4.1 `RuntimeMemoryContext`

也就是 runtime 真正推理前需要消费的记忆上下文对象。

当前这层已经有现实代码落点：

- [memory-recall.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-recall.ts)

它本质上回答的是：

> 这一轮运行前，关于用户、关系和长期偏好，当前有哪些记忆应该被带入 runtime。

这与 `SessionContext` 和 `RoleCorePacket` 的性质是一致的：

- 都属于前置装配依赖
- 都是为了本轮推理准备上下文
- 都不直接代表“执行结果”

所以它是最自然的 memory preparation 候选。

### 4.2 推荐的最小方向

当前推荐未来收敛成：

```ts
type PreparedRuntimeTurn = {
  input: RuntimeTurnInput
  role: { ... }
  session: SessionContext
  memory: {
    runtime_memory_context: RuntimeMemoryContext
  }
  resources: { ... }
}
```

也就是 memory 在 preparation 层先只体现为：

- `runtime_memory_context`

而不是更大的 memory subsystem。

---

## 5. 当前不适合进入 preparation 的 memory 部分

下面这些当前不建议并入 preparation：

### 5.1 memory write planning

包括：

- `memory_write_requests`
- `relationship_memory` subtype planning

原因：

- 它们属于 runtime 输出侧
- 是“本轮运行后可能建议做什么”
- 不属于推理前装配

### 5.2 memory write execution

包括：

- generic memory execute
- relationship memory execute

原因：

- 它们是后置副作用
- 与 runtime execution 边界不同
- 当前已经沿 `memory_write_requests -> executor` 主线收口，不应该再回塞到 preparation

### 5.3 correction / admin mutation

这类内容更不属于 preparation。

它们不服务于“本轮前置准备”，而是 memory layer 自己的治理能力。

---

## 6. 当前最稳的抽取顺序

当前建议顺序如下：

1. 先保持 `memory-recall.ts` 作为 recall 真实实现位置
2. 在 preparation 模块里补一个薄壳，例如：
   - `prepareRuntimeMemory(...)`
3. 让 `prepareRuntimeTurn(...)` 开始通过它拿 `RuntimeMemoryContext`
4. 暂时不动 write / planner / executor 的现有收口

这个顺序的价值在于：

- 可以让 memory 像 session / role 一样进入 preparation 主线
- 但不会把后置执行逻辑一并拖进来

---

## 7. 当前建议的代码边界

当前推荐的边界是：

### preparation 模块负责

- `prepareRuntimeMemory(...)`
- 产出 `RuntimeMemoryContext`
- 把 recall 结果放入 `PreparedRuntimeTurn.memory`

### memory layer 继续负责

- recall 具体查询实现
- ontology / scope / status 规则
- write planning
- write execution
- correction / restore

### runtime execution 继续负责

- 消费 `PreparedRuntimeTurn.memory.runtime_memory_context`
- 在回答阶段决定如何使用 recall 结果

---

## 8. 结论

当前最稳的判断是：

**memory 应该进入 preparation，但只进入 recall context 装配这一层。**

换句话说：

- 要推进的，不是“把 memory 搬进 preparation”
- 而是：
  **把 `RuntimeMemoryContext` 的准备过程纳入 preparation 主线**

这和前面 `session`、`role` 的收口节奏是一致的，也最符合当前阶段“先收装配边界，不扩大副作用面”的目标。
