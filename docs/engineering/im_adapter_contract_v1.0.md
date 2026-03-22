# IM Adapter 契约文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段接入层中的 `IM adapter` 最小契约，明确接入层与底座层之间的边界。

本文档重点回答：

- IM adapter 负责什么，不负责什么
- 入站消息标准结构是什么
- 出站消息标准结构是什么
- binding / routing 的最小字段是什么
- 主动消息、幂等、重试、平台差异当前如何处理

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`

---

## 2. 一句话定义

**IM adapter 是 SparkCore 当前阶段接入层中的“接和转”模块，负责把外部 IM 平台事件转成 runtime 可理解的标准输入，并把 runtime 的标准输出转成平台可发送的消息。**

---

## 3. 当前阶段设计目标

当前 IM adapter contract 目标是：

1. 先定义接入层与底座层之间的统一协议
2. 防止具体平台 SDK 细节污染 runtime
3. 支撑首次绑定、持续聊天、follow-up 回流
4. 只做一个最小接入闭环，不做平台完备能力

---

## 4. 当前阶段非目标

当前阶段 IM adapter **不负责**：

- 长记忆策略
- 角色一致性逻辑
- runtime 主流程
- 产品 onboarding / 领取流程
- 用户套餐逻辑
- 多平台并行完备接入

---

## 5. 接入层与底座层的边界

## 5.1 IM adapter 负责

- 接收平台消息 / webhook / polling 结果
- 解析平台事件
- 标准化消息结构
- 识别平台身份
- 查询 binding
- 构造 `RuntimeInput`
- 调用 runtime
- 将 `RuntimeOutput` 转为平台出站消息

## 5.2 runtime 负责

- 理解消息
- 读取 role
- 读取 memory
- 读取 session
- 生成 `assistant_message`
- 产出 `memory_write_requests / follow_up_requests / runtime_events`

---

## 6. 身份模型

当前 IM contract 至少应明确以下标识：

- `platform`
- `channel_id`
- `peer_id`
- `platform_user_id`
- `user_id`
- `agent_id`
- `thread_id`

说明：

- `platform`：平台类型，如 telegram / discord / wecom
- `channel_id`：平台中的会话容器标识
- `peer_id`：平台中的对话对端标识
- `platform_user_id`：平台原生用户标识
- `user_id`：SparkCore 内部用户标识
- `agent_id`：SparkCore 内部角色标识
- `thread_id`：SparkCore 内部 thread 标识

---

## 7. binding contract

binding 负责建立：

> 平台身份 <-> SparkCore 用户 / 角色 / thread

当前最小字段建议：

- `platform`
- `channel_id`
- `peer_id`
- `platform_user_id`
- `workspace_id`
- `user_id`
- `agent_id`
- `thread_id?`
- `status`
- `created_at`
- `updated_at`

当前判断：

- `thread_id` 可选，因为首次绑定后可能先绑定用户与 agent，再进入具体 thread
- 但 `user_id + agent_id` 当前必须可解析

---

## 8. 入站标准消息结构

当前建议统一为 `InboundChannelMessage`。

最小字段：

- `platform`
- `event_id`
- `channel_id`
- `peer_id`
- `platform_user_id`
- `message_id`
- `message_type`
- `content`
- `attachments?`
- `timestamp`
- `raw_event?`
- `metadata?`

说明：

- `event_id` 用于幂等去重
- `message_type` 当前至少支持 `text`
- `attachments` 先做预留位，不要求当前完整支持

---

## 9. 出站标准消息结构

当前建议统一为 `OutboundChannelMessage`。

最小字段：

- `platform`
- `channel_id`
- `peer_id`
- `message_type`
- `content`
- `attachments?`
- `send_mode`
- `metadata?`

说明：

- `send_mode` 可区分 `reply / proactive`
- 主动消息与回复消息应共用一套最小出站协议

---

## 10. 与 runtime contract 的对接

接入层应做的事情是：

1. `InboundChannelMessage`
2. 查 binding
3. 组装 `RuntimeInput`
4. 调用 runtime
5. 获取 `RuntimeOutput`
6. 把 `assistant_message` 转成 `OutboundChannelMessage`
7. 把 `follow_up_requests` 交给 scheduler / adapter 协作层

接入层不应：

- 自己做 memory write 判定
- 自己做回答策略选择
- 自己重写 runtime 输出结构

---

## 11. 主动消息能力

当前阶段不仅要支持：

- 收到消息 -> 回复

也要支持：

- scheduler / follow-up 回流 -> 主动发消息

因此 contract 必须预留：

- 是否允许主动发
- 主动发走哪套出站协议
- 主动发需要哪些身份字段

当前建议：

- 主动发与回复消息共用 `OutboundChannelMessage`
- 通过 `send_mode = proactive` 区分

---

## 12. 幂等与重试

当前阶段最小规则必须明确：

### 12.1 入站幂等

- 同一个 `event_id` 不应重复处理
- 若平台没有可靠 `event_id`，需退化到 `platform + message_id + timestamp` 去重

### 12.2 出站重试

- 出站失败可按有限次数重试
- 重试应带幂等键，避免平台重复发送

### 12.3 重复回调

- 重复 webhook / polling 结果必须能识别并跳过

---

## 13. 平台能力差异预留

当前 contract 应为以下差异预留结构位：

- 纯文本
- 图片 / 附件引用
- typing / delivery / ack 元信息
- 平台特有 metadata

当前阶段判断：

- 先预留
- 不要求一开始全部实现
- 不能因为当前只做文本，就把协议写死成只支持文本

---

## 14. 当前推荐最小接入验证范围

当前只建议选择 **一个接入通道** 做最小闭环验证。

Success criteria：

- 能完成一次 binding 查询
- 能把一条入站文本消息转成 `RuntimeInput`
- 能调用 runtime 并获得 `assistant_message`
- 能把回复发回平台
- 能触发至少一种 `follow-up / reminder` 的主动回流
- 不追求 UI、后台、平台完备能力

---

## 15. 当前阶段 DoD

- 身份模型已明确 `platform / channel_id / peer_id / platform_user_id / user_id / agent_id / thread_id`
- `InboundChannelMessage` 已固定最小字段
- `OutboundChannelMessage` 已固定最小字段
- binding 最小字段已固定
- 主动消息能力已纳入 contract
- 幂等与重试最小规则已明确
- 平台能力差异已预留结构位

---

## 16. 当前结论

当前阶段 IM adapter contract 最重要的价值，不是支持多少平台，而是：

**先把“接入层只负责接和转”这件事固定下来。**

只有先把这一层契约收口，后面的 IM 最小闭环验证才不会再次把 runtime、memory 和产品层写脏。
