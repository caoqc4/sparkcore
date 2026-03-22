# Runtime Input Contract 文档 v1.0

## 1. 文档定位

本文档用于单独定义 SparkCore 当前阶段 `single-agent runtime` 的标准输入 contract，重点回答：

- runtime 最小统一输入对象应该长什么样
- 哪些字段属于 runtime 必需输入
- 哪些对象应该在 runtime 外部先准备好
- `runAgentTurn(input)` 的统一入口未来应建立在什么输入边界上

本文档不重复 runtime output，也不重复整体 runtime 职责，而是专注于：

**single-agent runtime 到底应该“吃什么输入”。**

> 状态：设计草案
> 对应阶段：Phase 1 / runtime input 收口
> 相关文档：
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/role_layer_design_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/engineering/followup_next_phase_decision_note_v1.0.md`

---

## 2. 一句话定义

**runtime input contract 是 SparkCore 当前阶段 single-agent runtime 的统一入参协议，用于把 role、session、memory、adapter 与产品层之间的输入边界固定下来。**

---

## 3. 当前为什么要单独收 input

当前状态已经出现了一个明显不对称：

- runtime output 已经比以前清楚很多
- runtime input 仍然带着较多历史实现痕迹

当前已经较清楚的 output 包括：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata`

但 input 侧仍然存在这些问题：

- runtime 现在仍带有较多 Web 邻近层组装逻辑
- adapter port 还没有真正对齐到统一 runtime 入参
- role / memory / session 虽然已分层，但 input 协作面还不够明确
- `runAgentTurn(input)` 还没有真正成为清晰的统一入口

所以当前更值得做的，不是继续深推 `follow_up`，而是先把：

**runtime 吃进去的对象收清楚。**

---

## 4. 当前阶段设计目标

当前阶段 runtime input contract 的目标是：

1. 明确 single-agent runtime 的最小统一输入对象
2. 明确 runtime 外围应先准备哪些依赖对象
3. 明确 adapter / web / scheduler 与 runtime 的边界
4. 为后续 `runAgentTurn(input)` 提供统一基础

---

## 5. 当前阶段非目标

当前阶段 runtime input contract **不负责**：

- 多 Agent runtime 输入协议
- 产品 UI 表单协议
- 平台原始 webhook 事件结构
- 富媒体完整输入规范
- 世界层 / 模拟层输入
- 跨应用任务编排输入

当前重点不是：

**把所有未来输入情况一次做满**

而是：

**先把当前单 Agent runtime 的最小输入面固定下来。**

---

## 6. 当前最小统一输入建议

当前建议统一为：

- `RuntimeTurnInput`

推荐最小结构如下：

```ts
type RuntimeTurnInput = {
  actor: {
    user_id: string
    agent_id: string
    thread_id: string
    workspace_id?: string | null
  }

  message: {
    content: string
    message_type: "text"
    source: "web" | "im" | "scheduler" | "internal"
    timestamp?: string
    message_id?: string | null
    metadata?: Record<string, unknown>
  }

  context?: {
    source_platform?: string | null
    binding_id?: string | null
    trigger_kind?: string | null
  }
}
```

这个结构的重点不是字段多，而是把输入分成三块：

- 谁在和谁说话
- 这一轮说了什么
- 这轮输入来自什么上下文

---

## 7. 为什么要拆成 actor / message / context

### 7.1 actor

`actor` 负责回答：

> 这轮 runtime 是围绕哪一组内部身份运行的

当前至少包括：

- `user_id`
- `agent_id`
- `thread_id`

这是当前 single-agent runtime 最小不可缺的三元组。

`workspace_id` 当前可选，但建议预留。

原因是：

- 当前很多查询最终仍会落到 workspace 级范围
- adapter / product 层后面都很可能需要这个位

### 7.2 message

`message` 负责回答：

> 本轮真正进入 runtime 的输入消息是什么

当前最小先只做：

- `content`
- `message_type = "text"`
- `source`

并预留：

- `message_id`
- `timestamp`
- `metadata`

这样后续：

- web chat
- IM adapter
- scheduler 回流

都可以把输入统一成同一类消息对象。

### 7.3 context

`context` 负责回答：

> 这轮输入是从什么外围链路来的

它不应承载核心业务字段，但适合承接：

- `source_platform`
- `binding_id`
- `trigger_kind`

这能让 runtime 保持：

- 知道自己来自哪条链路
- 但不被平台专属字段直接污染

---

## 8. 当前哪些字段应是 runtime 必需输入

当前建议 runtime 必需输入是：

### 必需

- `actor.user_id`
- `actor.agent_id`
- `actor.thread_id`
- `message.content`
- `message.message_type`
- `message.source`

### 可选但建议预留

- `actor.workspace_id`
- `message.message_id`
- `message.timestamp`
- `message.metadata`
- `context.*`

原因是：

当前 runtime 要真正跑一轮，最少必须知道：

- 用户是谁
- 角色是谁
- thread 是哪条
- 本轮说了什么
- 这条输入来自哪种链路

如果少掉这些，就很难维持：

- role 连续性
- memory 召回范围
- session 组织
- adapter 回写一致性

---

## 9. 哪些对象不该作为 runtime 原始输入直接塞进来

当前最容易混淆的是：

- `RoleProfile`
- `SessionContext`
- `MemoryRecallResult`

它们很重要，但我建议：

**不要把它们当成原始 `RuntimeTurnInput` 字段直接塞进去。**

更稳的分层是：

### 9.1 原始输入

`RuntimeTurnInput`

只表达：

- actor
- message
- context

### 9.2 运行时装配依赖

由 runtime 外围装配或 runtime 入口加载：

- `RoleProfile`
- `SessionContext`
- `RuntimeMemoryContext`

这样能避免 `RuntimeTurnInput` 本身被放大成一个巨型对象。

---

## 10. 当前建议的两层输入模型

当前更稳的做法不是只有一层 input，而是两层：

### 层 1：外部输入层

- `RuntimeTurnInput`

这是 adapter / web / scheduler 真正传入 runtime 入口的统一对象。

### 层 2：内部装配层

例如可称为：

- `PreparedRuntimeTurn`

它在进入实际模型推理前，已经额外带上：

- `role`
- `session`
- `memory`

推荐结构类似：

```ts
type PreparedRuntimeTurn = {
  input: RuntimeTurnInput
  role: RoleProfile
  session: SessionContext
  memory: RuntimeMemoryContext
}
```

这样：

- 对外入口统一
- 对内推理上下文也统一

而不是让 `RuntimeTurnInput` 直接既当原始输入，又当准备完的运行时上下文。

---

## 11. runtime 应自己查什么，外围应先准备什么

这是当前最关键的边界问题。

当前建议如下：

### 11.1 runtime 外围应先准备好的

- 原始 `RuntimeTurnInput`
- 必要时的 thread / actor identity 解析
- 平台事件标准化

也就是说：

- IM adapter 不该把原始 webhook 直接喂给 runtime
- Web 页面层也不该把散乱表单字段直接喂给 runtime

应先统一成 `RuntimeTurnInput`。

### 11.2 runtime 入口或其邻近装配层应负责加载的

- `RoleProfile`
- `SessionContext`
- `RuntimeMemoryContext`

原因是这三者本身仍属于底座运行时依赖，而不是外围平台输入。

### 11.3 当前不建议 runtime 直接吃平台原始 binding / webhook 结构

比如：

- Telegram update
- IM adapter raw payload
- webhook headers

这些都应该在 runtime 外先被吸收掉。

---

## 12. input contract 与 adapter runtime port 的关系

当前最推荐的边界是：

**adapter runtime port 负责把接入层上下文组织成 `RuntimeTurnInput`，而不是直接调用一堆 Web 邻近实现细节。**

也就是说，理想状态应该是：

```ts
const input: RuntimeTurnInput = ...
const result = await runAgentTurn(input)
```

当前 `im-runtime-port.ts` 还没有完全走到这一步，但它已经很接近这个角色：

- 解析 thread / user / agent
- 插入 inbound message
- 调 runtime
- 写回 assistant message

后续最值得做的，就是把它从：

> “调用现有 chat runtime 流程的包装层”

推进成：

> “构造标准 runtime input 的接入层 port”

---

## 13. input contract 与 session 的关系

当前建议关系是：

### `RuntimeTurnInput` 不直接等于 `SessionContext`

它只包含：

- 当前输入消息
- actor identity
- 最小来源上下文

### `SessionContext` 是 runtime 根据 thread 组织出来的运行时依赖对象

它应继续承载：

- 当前 thread continuity
- recent turns
- context pressure

换句话说：

- `RuntimeTurnInput` 解决“这一轮从外面进来了什么”
- `SessionContext` 解决“这一轮在当前 thread 里应该怎么看”

这两个对象不应混成一个。

---

## 14. 当前推荐的最小入口形态

当前建议下一步统一往这个方向收：

```ts
runAgentTurn(input: RuntimeTurnInput): Promise<RuntimeTurnResult>
```

其中：

- input 是统一外部输入
- runtime 内部或邻近装配层再加载：
  - role
  - session
  - memory

这样可以让：

- web chat
- IM adapter
- scheduler 回流

最终都围绕同一个入口协作。

---

## 15. 当前阶段 DoD

当以下条件成立时，可认为 `runtime input contract` 已第一轮收口：

- 已有单独文档明确 `RuntimeTurnInput`
- 已明确 actor / message / context 三块结构
- 已明确 runtime 外围与 runtime 内部装配层的边界
- 已明确 `RuntimeTurnInput` 与 `SessionContext` 不等同
- 已明确下一步统一入口应朝 `runAgentTurn(input)` 收敛

---

## 16. 当前代码映射

当前这份 input contract 与现有实现最直接对应的是：

- `apps/web/lib/chat/im-runtime-port.ts`
- `apps/web/lib/chat/runtime.ts`

### 16.1 `im-runtime-port.ts` 当前对应的输入职责

`im-runtime-port.ts` 当前已经在做几件非常接近 `RuntimeTurnInput` 的事情：

- 解析并确认：
  - `user_id`
  - `agent_id`
  - `thread_id`
- 组织 inbound message：
  - `input.message`
  - `input.source`
  - `input.timestamp`
  - `input.metadata`
- 为 runtime 运行准备 thread / workspace / agent 上下文

也就是说，当前它虽然还没有显式构造一个名为 `RuntimeTurnInput` 的对象，但它实际上已经在承担：

**adapter input -> runtime turn input 候选结构**

这也是后续最适合先抽纯的一层。

### 16.2 `runtime.ts` 当前对应的输入职责

`runtime.ts` 里的 `generateAgentReply(...)` 当前吃进去的并不是一个统一输入对象，而是：

- `userId`
- `workspace`
- `thread`
- `agent`
- `messages`
- `assistantMessageId`
- `supabase`

这说明它现在仍然更像：

**Web 邻近层里的“已装配运行时调用”**

而不是一个真正的：

**single-agent runtime 统一入口**

这也是当前 input/output 不对称的根源之一：

- output 已较统一
- input 仍是装配后对象直接塞进 runtime

### 16.3 当前最适合拆出来的两层

当前更稳的拆法不是一步把 `generateAgentReply(...)` 改成最终形态，而是先拆成两层：

#### 层 1：外部输入组装层

例如未来可形成为：

- `buildRuntimeTurnInput(...)`

这层最适合从：

- `im-runtime-port.ts`
- web chat action / route
- scheduler 回流入口

里逐步抽出。

#### 层 2：runtime 装配执行层

例如未来可形成为：

- `runAgentTurn(input: RuntimeTurnInput)`

这层负责：

- 加载 role
- 加载 session
- 加载 memory
- 产出 `RuntimeTurnResult`

当前 `generateAgentReply(...)` 更接近这层的雏形，但还混着过多装配后对象。

---

## 17. 当前建议的抽取顺序

当前最推荐的顺序不是直接重写 runtime，而是：

### Step 1：先显式形成 `RuntimeTurnInput`

先在 adapter / web 邻近层把现有输入显式收成：

- `actor`
- `message`
- `context`

哪怕暂时只是一个中间对象，也值得先做。

### Step 2：让 `im-runtime-port.ts` 成为第一条标准输入构造路径

原因是：

- 它的输入来源清楚
- 已有 adapter contract
- 已有 thread / binding / identity 解析
- 最容易看清 `actor / message / context` 的边界

### Step 3：再给 `generateAgentReply(...)` 外面包一层真正的 `runAgentTurn(input)`

这一步不必一开始就移除现有参数结构，而是可以先做一层 wrapper：

- 外层吃 `RuntimeTurnInput`
- 内层暂时仍调用现有 `generateAgentReply(...)`

这样风险会小很多。

### Step 4：最后再把 role / session / memory 的装配逻辑从 Web 邻近层往 runtime 入口集中

也就是最后才进一步决定：

- role 在哪里加载
- session 在哪里组装
- memory recall 在哪里触发

而不是在第一刀里同时重写。

---

## 18. 当前结论

当前 SparkCore 最需要补的，不是再继续扩 `follow_up`，而是把 runtime 的输入面收成一个真正稳定的统一入口。

因此当前最合理的下一步不是继续深推调度，而是：

**先完成 `RuntimeTurnInput` 的收口，再往 `runAgentTurn(input)` 统一入口推进。**
