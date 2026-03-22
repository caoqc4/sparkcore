# Runtime Contract 文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `single-agent runtime` 的标准输入输出 contract。

本文档不重复 runtime 的整体职责边界，而重点回答：

- runtime 的标准输入对象是什么
- runtime 的标准输出对象是什么
- role、memory、session 如何被 runtime 消费
- output 为什么必须先收口，才能继续做接入层与产品层

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/role_layer_design_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`

---

## 2. 一句话定义

**runtime contract 是 SparkCore 当前阶段 single-agent runtime 对外暴露的统一输入输出协议，用于确保接入层、产品层和底座层都围绕同一套运行时对象协作。**

---

## 3. 设计目标

当前阶段 runtime contract 目标是：

1. 固定 runtime 的统一入口
2. 固定 runtime 的统一输出包
3. 明确 role / memory / session 的消费方式
4. 为 IM adapter 与产品层提供统一调用面

---

## 4. 当前阶段非目标

当前阶段 runtime contract **不负责**：

- 多 Agent 编排协议
- 产品 UI contract
- 具体 IM 平台 SDK 事件格式
- 复杂任务编排协议

---

## 5. 标准输入对象

当前建议统一为 `RuntimeInput`。

最小字段：

- `user_id`
- `agent_id`
- `thread_id`
- `message`
- `message_type`
- `source`
- `timestamp`
- `metadata`

说明：

- `source` 可标识 `im / web / scheduler / internal`
- `message_type` 当前至少支持 `text`，后续再扩图片、语音、附件说明

---

## 6. runtime 内部依赖对象

runtime 在处理一轮时，至少要消费：

- `RoleProfile / role_core_packet`
- `SessionContext`
- `MemoryRecallResult`

这三者不是 runtime input 原始字段本身，但属于 runtime 必须加载与组织的标准依赖对象。

---

## 7. 标准输出对象

当前建议统一为 `RuntimeOutput`。

最小字段：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata?`

---

## 7.1 `assistant_message`

当前建议最小字段：

- `role`
- `content`
- `language`
- `message_type`
- `metadata?`

它回答的是：

> 这一轮最终应该返回给用户的内容是什么

---

## 7.2 `memory_write_requests`

当前建议为数组。

每项应符合 `MemoryWriteRequest` contract。

它回答的是：

> 这一轮结束后，哪些长期记忆候选需要写入或更新

当前实现补充：

- runtime 顶层暂不新增 `relationship_write_requests`
- `relationship memory` 先收口为 `memory_write_requests` 内的显式 subtype
- 当前 request 至少分为：
  - `kind = "generic_memory"`
  - `kind = "relationship_memory"`

这样可以先把 relationship 的旁路写入收回统一 pipeline，而不扩张新的顶层协议面。

---

## 7.3 `follow_up_requests`

当前建议为数组。

最小字段可包括：

- `kind`
- `trigger_at`
- `reason`
- `payload`

它回答的是：

> 这一轮是否需要后续提醒、延迟跟进或 scheduler 回流

---

## 7.4 `runtime_events`

当前建议为数组。

用于承载运行过程中的标准事件，例如：

- `memory_recalled`
- `memory_write_planned`
- `answer_strategy_selected`
- `follow_up_planned`

它主要服务：

- debug
- observability
- 后续 eval

---

## 7.5 `debug_metadata`

当前可选。

用于承载：

- recall summary
- role packet summary
- answer strategy label
- continuity signal
- provider/model details

它不应成为业务主逻辑依赖，但应作为当前阶段的重要调试位。

---

## 8. 当前最重要的输出协议原则

### 原则 1：runtime 不只返回文本

如果 runtime 只返回 `reply_text`，后续：

- IM adapter 会自己发明 follow-up 结构
- 产品层会自己发明 memory write 结构
- runtime 会再次被污染

因此当前必须先收口 `RuntimeOutput`。

### 原则 2：runtime 负责产出标准结果，不负责平台发送

- 是否发给 IM，由接入层负责
- 是否展示给用户，由产品层负责
- runtime 只负责标准产物

### 原则 3：memory / follow-up 必须是显式结果，而不是隐式副作用

这样才能：

- 便于调试
- 便于重放
- 便于后续接入层复用

---

## 9. 当前推荐最小处理流程

1. 接收 `RuntimeInput`
2. 加载 `RoleProfile`
3. 加载 `SessionContext`
4. 发起 `MemoryRecallQuery`
5. 获取 `MemoryRecallResult`
6. 组装推理上下文
7. 生成 `assistant_message`
8. 产出 `memory_write_requests`
9. 产出 `follow_up_requests`
10. 返回 `RuntimeOutput`

---

## 10. 当前实现映射

当前 runtime 相关逻辑主要集中在：

- `apps/web/lib/chat/runtime.ts`

当前已有：

- role packet 组装倾向
- answer strategy 逻辑
- memory recall 消费
- reply 生成
- `RuntimeOutput` 已以代码形式初步落地
- `assistant_message` 已有统一最小字段
- `memory_write_requests` 已有最小 planner output
- `follow_up_requests` 已有最小 planner output
- `runtime_events` 已有标准事件类型雏形

当前代码中的主要落点已包括：

- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-write.ts`

当前已落实的最小输出事实：

- `generateAgentReply(...)` 已返回统一 `RuntimeTurnResult`
- `assistant_message` 当前至少包含 `role / content / language / message_type / metadata`
- `memory_write_requests` 当前已能产出 `profile / preference` 的建议写入请求
- `follow_up_requests` 当前已能产出最小 `gentle_check_in` 请求
- `actions.ts` 已开始消费统一输出对象，而不是只依赖隐式副作用

当前仍缺：

- `RuntimeInput` 的独立 contract 文档化
- `RuntimeInput` 到调用方入口的完全统一
- `memory_write_requests` 与真实执行器之间的进一步解耦与标准化
- `follow_up_requests` 与 scheduler / adapter 的真实接线
- `runtime_events` 事件字典与 payload schema 的进一步固定

---

## 11. 当前阶段 DoD

- `RuntimeInput` 最小字段已固定
- `RuntimeOutput` 最小字段已固定
- `assistant_message / memory_write_requests / follow_up_requests / runtime_events / debug_metadata` 的角色已明确
- runtime 与 role / memory / session 的输入边界已明确
- 接入层与产品层都可以围绕这一 contract 设计，而不再自行发明结构

当前代码进度补充判断：

- `RuntimeOutput` 已不是纯文档概念，而是已有第一版可执行实现
- 当前仍属于“最小 contract 已落地，细部 schema 继续收口”的阶段

---

## 12. 当前结论

当前阶段最需要先做稳的 runtime contract，不是“模型怎么调得更聪明”，而是：

**让所有下游都围绕同一套输入输出对象协作。**

只有先把 contract 收口，接入层、产品层与底座层才不会继续互相污染。
