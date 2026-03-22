# Runtime Prepared Turn 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `RuntimeTurnInput` 进入 single-agent runtime 之后的**装配层对象**，重点回答：

- 为什么 `RuntimeTurnInput` 之后还需要一层 `PreparedRuntimeTurn`
- `SessionContext` 在 runtime 装配链路里处于什么位置
- `role / session / memory` 应该如何与原始输入组合
- 后续 `runAgentTurn(input)` 该如何逐步从薄壳推进成更稳定的 runtime 入口

本文档不重复输入 contract，也不重复输出 contract，而是专注于：

**runtime 在真正推理前，应该先把哪几类依赖装配成什么对象。**

> 状态：设计草案
> 对应阶段：Phase 1 / runtime 装配层收口
> 相关文档：
> - `docs/architecture/runtime_input_contract_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/role_layer_design_v1.0.md`

---

## 2. 一句话定义

**PreparedRuntimeTurn 是 SparkCore 当前阶段 single-agent runtime 的内部装配对象，用于把原始 `RuntimeTurnInput` 与本轮实际运行所需的 role、session、memory 依赖组织成统一上下文。**

---

## 3. 当前为什么需要这层

当前已经出现了一个非常具体的过渡态：

- `RuntimeTurnInput` 已经开始落代码
- `runAgentTurn(input)` 已经有第一版薄壳
- 但 `generateAgentReply(...)` 仍然直接吃装配后的对象：
  - `workspace`
  - `thread`
  - `agent`
  - `messages`
  - `assistantMessageId`

这意味着目前 runtime 入口虽然开始收口了，但装配层仍然隐含在：

- `im-runtime-port.ts`
- `actions.ts`
- `runtime.ts`

之间。

如果不把这层单独定义出来，后面很容易出现两个问题：

1. `RuntimeTurnInput` 被越塞越大，最后变成一个“假统一输入、真巨型对象”
2. `SessionContext`、`RoleProfile`、`RuntimeMemoryContext` 的来源和归属越来越含混

所以当前更稳的做法不是直接重写 runtime，而是先明确：

**原始输入之后，还需要一层内部装配对象。**

---

## 4. 当前阶段设计目标

当前阶段 `PreparedRuntimeTurn` 的目标是：

1. 把 runtime 内部装配依赖显式化
2. 让 `SessionContext` 的职责更清楚
3. 为后续 `runAgentTurn(input)` 真正成为统一入口做准备
4. 降低 role / memory / session 继续抽层时的返工成本

---

## 5. 当前阶段非目标

当前阶段 `PreparedRuntimeTurn` **不负责**：

- 引入完整 planner / reviewer 子系统
- 重做 prompt 组装器
- 多 Agent 编排
- 完整替换现有 `generateAgentReply(...)`
- 提前抽成跨 package 的稳定 core API

当前重点不是把 runtime 一次性纯化，而是：

**先把装配层边界定清楚。**

---

## 6. 推荐最小结构

当前推荐结构如下：

```ts
type PreparedRuntimeTurn = {
  input: RuntimeTurnInput

  role: {
    agent: AgentRecord
    role_core: RoleCorePacket
  }

  session: SessionContext

  memory: {
    runtime_memory_context: RuntimeMemoryContext
  }

  resources: {
    workspace: WorkspaceRecord
    thread: ThreadRecord
    messages: MessageRecord[]
    assistant_message_id?: string
    supabase?: unknown
  }
}
```

这里的重点不是字段一定一步到位，而是把对象分成五层：

- `input`
- `role`
- `session`
- `memory`
- `resources`

这样可以把：

- 原始输入
- 装配依赖
- 执行资源

三个维度分开。

---

## 7. 为什么 `SessionContext` 应处在这层

`SessionContext` 最容易被误放在两个错误位置：

### 7.1 错误位置一：放进 `RuntimeTurnInput`

这样会导致：

- 原始输入不再原始
- adapter / web / scheduler 要负责准备 session
- 输入对象被 runtime 内部依赖污染

这不适合当前分层。

### 7.2 错误位置二：继续完全藏在 `runtime.ts` 内部

这样会导致：

- session 仍然只是“实现细节”
- 后续无法明确 `runAgentTurn(input)` 到底装配了什么
- 很难继续把 session 正式化

### 7.3 当前更合适的位置

`SessionContext` 更适合处于：

**PreparedRuntimeTurn 的内部装配层。**

也就是：

- 它不属于外围原始输入
- 但它也不应该完全隐身

这样后续才容易继续推进：

- `loadSession(...)`
- `prepareRuntimeTurn(...)`
- `runAgentTurn(prepared)`

这类更清楚的边界。

---

## 8. `PreparedRuntimeTurn` 与 `RuntimeTurnInput` 的关系

当前建议关系是：

### `RuntimeTurnInput`

回答：

> 这一轮从外部进来了什么

它只包含：

- actor
- message
- context

### `PreparedRuntimeTurn`

回答：

> 为了让这一轮真正运行，runtime 内部已经准备好了什么

它额外包含：

- role
- session
- memory
- resources

这两层不应混成一个对象。

如果混在一起，会出现两个坏结果：

- 对外输入面越来越不稳定
- 对内装配依赖越来越不透明

---

## 9. `PreparedRuntimeTurn` 与 `runAgentTurn(input)` 的关系

当前最稳的演进路径不是：

`RuntimeTurnInput -> generateAgentReply(...)`

而是逐步过渡成：

1. `RuntimeTurnInput`
2. `prepareRuntimeTurn(input)`
3. `runPreparedRuntimeTurn(prepared)`
4. `RuntimeTurnResult`

但当前阶段不必一下做成这么完整。

当前推荐的过渡方式是：

### 第一阶段

- 保留现有 `runAgentTurn(input)` 薄壳
- 在文档里先明确它未来要吃到的内部装配对象

### 第二阶段

- 给 `runAgentTurn(input)` 内部补一层最小 `prepareRuntimeTurn(...)`
- 先集中 session / role / memory 装配

### 第三阶段

- 让 `generateAgentReply(...)` 逐步退成底层执行函数
- 让 `runAgentTurn(input)` 变成真正稳定的统一入口

---

## 10. 当前代码映射

当前这层装配边界在代码里大致散落在以下位置：

- `apps/web/lib/chat/runtime-input.ts`
- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/role-loader.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/im-runtime-port.ts`
- `apps/web/app/chat/actions.ts`

当前事实是：

- `RuntimeTurnInput` 已经在 `runtime-input.ts` 中存在
- `runAgentTurn(input)` 已经在 `runtime.ts` 中存在第一版薄壳
- `SessionContext` 已经在 `session-context.ts` 中有第一版稳定对象
- 但 `PreparedRuntimeTurn` 还没有对应的显式代码对象

这正是下一步最自然的收口点。

---

## 11. 当前建议的抽取顺序

### Step 1：先把 `PreparedRuntimeTurn` 当作文档对象固定下来

先不急着上代码，先把它的存在和边界写清楚。

### Step 2：先明确 `SessionContext` 的装配层地位

也就是把它从“runtime 内部实现细节”提升成：

- runtime 装配对象的一部分

### Step 3：在 `runAgentTurn(input)` 内部引入最小 `prepareRuntimeTurn(...)`

这一步建议先只做：

- load role
- build session
- load memory

并把它们组织成一个明确对象。

### Step 4：最后再考虑把 `generateAgentReply(...)` 的参数面收瘦

也就是先别同时改外层入口和底层实现。

---

## 12. 当前结论

当前 SparkCore 最值得补的，不是继续增加 runtime 顶层字段，而是让输入后的内部装配依赖也变得清楚。

因此当前更合理的方向是：

**在 `RuntimeTurnInput` 之后，补出 `PreparedRuntimeTurn` 这层装配对象，并优先把 `SessionContext` 的位置固定在这里。**
