# Single-Agent Runtime 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段的 `single-agent runtime` 模块边界，明确其在整体架构中的职责、输入输出、依赖关系与当前不负责的内容。

本文档服务于以下目标：

- 统一当前单 Agent 运行时的设计语言
- 为角色记忆层开发提供运行时边界
- 为后续 IM adapter 接入提供统一调用面
- 为项目拆分提供核心模块划分依据

> 状态：当前有效  
> 对应阶段：Phase 1  
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/runtime_input_contract_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`

---

## 2. 一句话定义

**single-agent runtime 是 SparkCore 当前阶段的最小可运行智能体核心，负责把 role、memory、session、scheduler 组织起来，处理单个角色实例的持续会话与基础任务推进。**

---

## 3. 当前阶段设计目标

当前阶段的 single-agent runtime 目标不是做一个复杂多 Agent 编排器，而是做一个：

- 可稳定运行
- 可接入 IM
- 可调用长记忆
- 可维持角色一致性
- 可承接定时任务回流
- 可被第一阶段产品直接使用

的单 Agent 核心。

---

## 4. 当前阶段非目标

当前阶段 runtime **不负责**：

- 多 Agent 编排
- 多角色协同对话
- 世界层 / 模拟层
- 跨 app 调度
- 产品 onboarding
- 角色领取流程
- 付费逻辑
- IM 平台专属适配
- 复杂事务对象系统

这些能力后续可在接入层或产品层扩展，不应污染当前 runtime 主干。

---

## 5. 运行时核心职责

single-agent runtime 当前应承担以下职责：

### 5.1 角色加载
- 加载 role profile
- 读取角色设定、风格、关系定义
- 准备运行时角色上下文

### 5.2 会话处理
- 接收标准化后的用户输入
- 组织当前 session / thread 上下文
- 调用记忆层进行召回
- 组装推理输入
- 产出响应结果

### 5.3 长记忆协作
- 根据输入与输出决定是否触发记忆写入
- 调用记忆层接口完成写入 / 更新 / 读取
- 不直接承担底层记忆存储逻辑

### 5.4 定时任务回流
- 接收 scheduler 回流事件
- 将定时提醒 / 跟进事件转成运行时输入
- 触发相应回复或状态推进

### 5.5 角色一致性维持
- 确保角色输出尽量稳定
- 保持说话风格与关系设定连续
- 在运行时层面统一 role / memory / session 的协作

---

## 6. 运行时在整体架构中的位置

当前推荐分层如下：

- 底座层
  - role
  - memory
  - session
  - scheduler
  - single-agent runtime

- 接入层
  - IM adapter
  - message normalization
  - binding
  - routing

- 产品层
  - onboarding
  - 角色领取
  - 配置页面
  - 付费与套餐
  - 运营逻辑

single-agent runtime 属于 **底座层**，其职责是作为底座层对外可调用的统一智能体核心。

---

## 7. 运行时依赖模块

## 7.1 role

用于提供角色基础信息：

- 角色名称
- 角色设定
- 关系设定
- 语气风格
- 基础行为约束
- 初始 persona 配置

runtime 负责读取 role，但不负责角色配置页面。

---

## 7.2 memory

用于提供长期记忆能力：

- 记忆写入接口
- 记忆更新接口
- 记忆查询与召回接口
- 记忆存储抽象

runtime 调用 memory，但不直接实现记忆底层存储。

---

## 7.3 session

用于管理运行时会话上下文：

- 当前消息
- 当前 thread
- 最近几轮上下文
- 会话级状态

runtime 依赖 session 组织当次处理。

---

## 7.4 scheduler

用于管理延迟任务和提醒任务：

- 定时提醒
- 延迟回流
- 未来时间点事件触发

runtime 可以注册或消费 scheduler 事件，但不负责底层调度器实现。

---

## 8. 运行时输入输出设计

## 8.1 输入

当前建议统一为：

- `RuntimeTurnInput`

当前更推荐的最小输入结构不是平铺字段，而是：

- `actor`
- `message`
- `context`

其中：

- `actor` 负责内部身份三元组：
  - `user_id`
  - `agent_id`
  - `thread_id`
- `message` 负责当前标准化输入消息
- `context` 负责外围链路上下文，例如平台、binding、trigger 来源

当前建议：

- adapter / web / scheduler 应先把输入统一成 `RuntimeTurnInput`
- runtime 再在内部或邻近装配层加载：
  - `RoleProfile`
  - `SessionContext`
  - `RuntimeMemoryContext`

---

## 8.2 输出

当前建议运行时输出统一为标准结果对象，例如：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata`

输出的核心原则：

- runtime 只负责产出标准结果
- 是否发送到 IM，由接入层负责
- 是否展示为产品 UI，由产品层负责

---

## 9. 运行时最小处理流程

推荐的最小处理流程如下：

1. 接收 `RuntimeTurnInput`
2. 加载角色 profile
3. 加载当前 `SessionContext`
4. 加载 `RuntimeMemoryContext`
5. 组装本轮推理上下文
6. 调用模型生成结果
7. 解析结果并形成标准输出
8. 触发必要的记忆写入
9. 触发必要的定时任务 / follow-up 请求
10. 返回 `RuntimeTurnResult`

当前推荐后续统一往这个入口收敛：

- `runAgentTurn(input: RuntimeTurnInput): Promise<RuntimeTurnResult>`

---

## 10. 当前建议的模块边界

## 10.1 runtime 应负责的

- 运行时主流程编排
- role / memory / session / scheduler 的组织
- 模型调用入口
- 输出标准化
- 基础记忆写入触发
- 基础 follow-up 触发

---

## 10.2 runtime 不应负责的

- IM 平台 SDK 细节
- webhook / polling
- binding 码生成
- 用户套餐校验
- onboarding 页面
- 网站配置逻辑
- 运营后台
- 多 Agent 路由
- 复杂产品策略

---

## 11. 与 IM adapter 的边界

runtime 与 IM adapter 的关系应为：

### IM adapter 负责
- 接消息
- 识别用户身份
- 标准化消息格式
- 查 binding
- 调用 runtime
- 发回回复

### runtime 负责
- 理解消息
- 读取角色
- 调用记忆
- 生成回应
- 产生定时任务或记忆写入请求

原则：

**adapter 负责“接和转”，runtime 负责“理解和处理”。**

---

## 12. 与记忆层的边界

runtime 与 memory 的关系应为：

### memory 层负责
- 记忆结构定义
- 存储
- 查询
- 更新
- 召回接口

### runtime 负责
- 决定本轮是否应写记忆
- 决定本轮需要召回哪些记忆
- 消费 memory 提供的结果

原则：

**runtime 不直接承载记忆系统实现，只消费其能力。**

---

## 13. 当前版本最小接口建议

当前阶段至少应抽象以下接口：

### 13.1 `loadRoleProfile(agentId)`
加载角色信息。

### 13.2 `loadSession(threadId)`
加载当前会话上下文。

### 13.3 `recallMemory(agentId, input, session)`
召回相关记忆。

### 13.4 `runAgentTurn(input)`
单轮运行入口。

### 13.5 `scheduleFollowUp(request)`
注册后续提醒或任务。

### 13.6 `commitMemoryWrites(requests)`
提交记忆写入请求。

---

## 14. 当前阶段设计原则

### 14.1 单 Agent 优先
当前一切设计围绕单 Agent 跑通，不为未来多 Agent 提前引入复杂实现。

### 14.2 运行时保持瘦核心
不要把产品层逻辑塞进 runtime。

### 14.3 接口先于实现细节稳定
先把调用面与边界定清，再逐步补实现。

### 14.4 可被 IM 和 app 内入口复用
运行时不应写死为“只服务某个 IM 产品”。

---

## 15. 后续演进方向

当前 runtime 后续可兼容的升级方向包括：

- 更复杂的记忆策略
- 更丰富的 task / follow-up 输出
- 事务对象系统
- 内部 planner / reviewer 子模块
- 多 Agent 编排适配层

但这些不应影响当前 v1.0 的单 Agent 边界清晰性。

---

## 16. 当前结论

当前阶段的 single-agent runtime 应被视为 SparkCore 的最小智能核心：

- 它不是产品壳
- 它不是 IM adapter
- 它不是多 Agent 系统
- 它是角色、记忆、会话、调度的统一编排层

**先把 single-agent runtime 做稳，是 SparkCore 当前阶段所有后续产品化动作的前提。**
