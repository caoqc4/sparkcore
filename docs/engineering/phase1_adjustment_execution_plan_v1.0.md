# SparkCore Phase 1 调整执行计划 v1.0

## 1. 文档定位

本文档用于在当前主线重定位基础上，整理 SparkCore 接下来的工程调整计划，明确：

- 接下来按什么顺序推进调整
- 每一步的目标是什么
- 每一步应产出哪些文档或代码结果
- 哪些调整当前应该先做，哪些应延后

本文档不追求一次性给出最终架构，而是作为当前 Phase 1 准备阶段的执行路线图。

> 状态：当前有效
> 对应阶段：Phase 1 准备阶段
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/engineering/project_split_plan_v1.0.md`
> - `docs/engineering/module_inventory_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/product/companion_mvp_flow_v1.0.md`

---

## 2. 一句话总结

**SparkCore 接下来的调整，不应以“大重构”方式推进，而应按“入口同步 -> 底座边界稳定 -> 接入契约定义 -> 最小接入验证 -> 目录增量重组 -> 第一阶段产品化承接”的顺序逐步完成。**

---

## 3. 当前阶段的总体目标

接下来的调整，不是为了把仓库整理得好看，而是为了让 SparkCore 具备以下能力：

1. 对内有清晰主线，不再被旧的多 Agent 叙事拉偏
2. 对代码有清晰边界，底座候选不继续深埋在 `apps/web`
3. 对后续 IM 接入有明确契约，不在接入时反向污染 runtime 和 memory
4. 对第一阶段产品化有稳定承接路径，能从当前工作台平滑过渡到“角色配置 + 领取 + IM 绑定”闭环
5. 对后续开源和自部署有更清楚的层级边界

---

## 4. 执行原则

## 4.1 先稳边界，再搬代码

当前最不该做的是在边界未清楚时大规模移动目录。

优先顺序应是：

- 先统一叙事
- 再稳定接口
- 再建立新落点
- 最后做增量迁移

---

## 4.2 新代码先进入新结构

相比一次性搬空旧代码，更推荐：

- 先建立 `packages/core`
- 先建立 `packages/integrations`
- 规定新写代码优先进入新目录
- 再逐步把稳定逻辑从 `apps/web/lib/chat` 迁出

---

## 4.3 调整要服务于 Phase 1，而不是打断 Phase 1

所有调整都应服务于以下主线：

- 单 Agent
- 长记忆角色层
- IM 接入
- 虚拟伴侣 / 助理产品闭环

任何会显著拉高复杂度、但对这一主线没有直接帮助的调整，都应延后。

---

## 5. 推荐执行顺序

## 5.1 Stage 0：同步入口与状态说明

### 目标

让仓库入口、主线文档和历史文档之间的关系变得一致，避免后续协作时反复误读。

### 要做的事

- 更新 `README.md`
- 更新 `README.zh-CN.md`
- 在 README 中显式指向当前主线文档
- 给历史多 Agent 文档补状态说明
- 明确 `docs/strategy/sparkcore_repositioning_v1.0.md` 是当前主线总纲

### 预期产出

- 仓库入口叙事和新主线一致
- 历史方案不再与当前主线并列出现

### 完成标志

- 新协作者第一次进入仓库时，不会把 SparkCore 理解成“当前以多 Agent 为主的项目”

### DoD

- `README.md` 与 `README.zh-CN.md` 中的项目定位已同步到单 Agent 主线
- 当前主线文档链接可直接打开且路径一致
- 历史多 Agent 文档开头已补“历史方案 / 当前主线入口”说明
- 仓库内不再出现把多 Agent 表述为“当前第一优先主线”的入口级文案

---

## 5.2 Stage 1：稳定底座核心契约

### 目标

把当前最关键的底座候选从“混合实现”提升为“可抽离、可复用、可被 runtime 调用的稳定契约”。

### 当前优先级最高的模块

- `role`
- `memory`
- `session`

其中当前最优先的是：

- `role schema`
- `memory schema`
- `session / thread schema`
- `role-memory-session` 三者的最小协作面

### 要做的事

- 明确 role 的输入输出对象与最小 schema
- 明确 memory 的输入输出对象
- 明确 memory 的存储层与策略层边界
- 明确 thread、message、session 的关系
- 明确 role、memory、session 三者在单轮运行中的协作边界
- 补 memory layer 设计文档

### 预期产出

- runtime 可以通过稳定接口使用 role 与 memory，而不是直接耦合散落逻辑
- `apps/web/lib/chat/memory.ts` 中可抽离部分被识别清楚

### 完成标志

- 不看页面代码，也能说明 role / memory / session 模块该如何被调用
- 后续抽 `packages/core/memory` 时不需要重新发明接口

### DoD

- `RoleProfile`、`MemoryRecord`、`MemoryWriteRequest`、`MemoryRecallQuery`、`SessionContext` 的最小类型已固定
- role、memory、session 的职责边界已在文档中明确，且与当前代码实现一致
- 至少有 1 个最小样例或测试覆盖 `role + recall + output` 的主流程
- memory layer 设计文档已补齐并与计划文档引用一致

---

## 5.3 Stage 2：收敛 single-agent runtime 边界

### 目标

把当前运行主流程从“chat workspace 的一段实现”收敛成“底座统一运行入口”。

### 要做的事

- 以 `runAgentTurn(input)` 为中心整理运行时调用面
- 明确 runtime 负责的输入、输出、依赖与不负责内容
- 把 runtime 中属于产品实验策略的部分单独标记
- 识别哪些逻辑应保留在 runtime，哪些应留在产品层

### 当前重点

- 运行时主流程编排
- role / memory / session / scheduler 协作
- 标准输出对象
- `memory_write_requests / follow_up_requests` 的统一结果格式
- runtime 输出协议收口

### 预期产出

- 当前 `apps/web/lib/chat/runtime.ts` 拆出“稳定核心”和“试验策略层”的分界
- runtime 更容易被未来 IM 接入层复用

### 完成标志

- runtime 不再被理解为“web chat 页面背后的逻辑文件”
- runtime 具备明确的统一调用面

### DoD

- 存在统一入口 `runAgentTurn(input)`
- runtime 输入类型与输出类型已固定
- runtime 输出至少统一为 `assistant_message`、`memory_write_requests`、`follow_up_requests`、`runtime_events`，并为 `debug_metadata` 预留可选位
- runtime 不再直接依赖页面 UI 状态或页面动作对象
- follow-up request / memory write request 结构已统一且有至少 1 个调用样例

---

## 5.4 Stage 3：补接入层契约

### 目标

先把 IM 接入层定义清楚，再做任何具体 IM 平台接入。

### 要做的事

- 编写 `im_adapter_contract_v1.0.md`
- 定义入站消息标准结构
- 定义出站消息标准结构
- 定义 binding 关系最小字段
- 定义 routing 调用关系
- 对齐 runtime 输入输出与接入层契约
- 明确身份模型
- 明确主动消息协议
- 明确幂等与重试规则
- 明确平台能力差异的预留方式

### 当前要避免的事

- 还没定义标准格式，就直接写 Telegram / Discord / 企业微信细节
- 让接入层自行承载记忆策略或角色一致性逻辑

### 预期产出

- SparkCore 第一次有清晰的“接入层和底座层之间的协议”

### 完成标志

- 可以在不讨论具体平台 SDK 的前提下，描述一次消息如何从 IM 流向 runtime，再从 runtime 返回 IM

### DoD

- IM contract 文档中已明确 `platform / channel_id / peer_id / user_id / agent_id` 的身份模型
- IM contract 文档中已明确主动消息场景，包括 scheduler / follow-up 回流如何触发出站
- IM contract 文档中已明确重复入站、重复回调、出站失败重试的最小规则
- IM contract 文档中已为纯文本、图片/附件引用以及平台元信息差异预留结构位
- runtime 输入输出与 IM contract 的字段映射已能对齐说明

---

## 5.5 Stage 4：建立新目录落点

### 目标

让分层结构从文档概念变成真实工程结构，但仍然保持增量推进。

### 推荐先建的目录

```text
packages/
  core/
    memory/
    session/
    single-agent-runtime/
  integrations/
    im-adapter/
    binding/
    routing/
  shared/
    types/
    utils/
```

### 要做的事

- 创建新目录骨架
- 新写底座代码优先进入 `packages/core`
- 新写接入层代码优先进入 `packages/integrations`
- 把最稳定的类型与 helper 先迁入 `packages/shared`
- 补最小 monorepo / package 边界支撑

### 当前不要求

- 一次性搬走 `apps/web/lib/chat` 全部内容
- 一次性把仓库拆成多个 repo

### 完成标志

- 从这一阶段开始，新的底座开发不再默认发生在 `apps/web/lib/chat`

### DoD

- `packages/core`、`packages/integrations`、`packages/shared` 目录骨架已创建
- `tsconfig` path alias 或等价导入方案已支持新目录引用
- 已明确包之间的依赖方向约束
- 最小 `lint / typecheck / test` 范围已能覆盖新目录
- 至少有 1 组稳定类型或 helper 已迁入新目录并被调用

---

## 5.6 Stage 5：做最小 IM 接入验证

### 目标

验证“标准化输入 -> runtime -> 标准化输出”的闭环是可行的。

### 要做的事

- 做一个最小 adapter stub 或最小真实接入
- 验证 binding 查询
- 验证 message normalization
- 验证 runtime 调用
- 验证回复回写流程
- 只选择一个接入通道进行验证

### 当前重点

- 验证消息闭环
- 验证模块边界

而不是：

- 做完整平台能力
- 做复杂运营后台
- 做完整产品化 UI

### 完成标志

- 能通过一个最小接入通道跑通单 Agent 长记忆对话闭环

### DoD

- 只使用一个接入通道完成验证，不并行展开多个平台
- 能完成一次 binding 查询
- 能跑通一轮 `incoming message -> runtime -> outgoing reply`
- 能触发至少一种 `follow-up / reminder` 的主动回流
- 本阶段不引入 UI、运营后台或平台完备能力要求

---

## 5.7 Stage 6：承接第一阶段产品化实现

### 目标

在底座与接入边界已经清楚后，再正式推进第一阶段产品壳。

### 要做的事

- 明确 `apps/web` 中 internal workspace 与 phase1 product web 的角色划分
- 明确当前 `apps/web` 中哪些页面保留为内部工作台
- 定义 Phase 1 官网 / 配置 / 领取 / 绑定引导页面
- 设计角色模板选择和基础配置流程
- 设计角色领取成功页与 IM 绑定引导
- 让产品层显式调用底座层与接入层

### 当前要避免的事

- 在现有 chat workspace 上无限叠加产品流程
- 在底座未稳时重做一遍完整前端

### 完成标志

- 网站侧“配置与领取中心”的定位清楚
- IM 侧“高频互动入口”的定位清楚
- 产品闭环开始真正贴近 `companion_mvp_flow_v1.0.md`

### DoD

- 已明确 `internal workspace` 与 `phase1 product web` 的职责边界
- 不再默认在现有 workspace 页面上继续堆叠用户产品主流程
- Phase 1 产品页面清单已固定
- 角色配置、领取、绑定引导三段流程已形成产品文档或线框级定义

---

## 6. 每一阶段建议产出的文档

为了让调整过程可追踪，建议补齐以下文档链路：

### 已有

- `docs/strategy/sparkcore_repositioning_v1.0.md`
- `docs/engineering/project_split_plan_v1.0.md`
- `docs/engineering/module_inventory_v1.0.md`
- `docs/architecture/single_agent_runtime_design_v1.0.md`
- `docs/product/companion_mvp_flow_v1.0.md`

### 建议下一批补齐

- `docs/architecture/memory_layer_design_v1.0.md`
- `docs/engineering/im_adapter_contract_v1.0.md`
- `docs/engineering/directory_reorg_plan_v1.0.md`
- `docs/product/role_claim_and_binding_flow_v1.0.md`

---

## 7. 当前最推荐的近期执行清单

如果只看最近一段时间，最推荐的顺序是：

1. 更新 `README.md` 与 `README.zh-CN.md`
2. 给历史多 Agent 文档补前置状态说明
3. 补 `memory layer design`
4. 补 `im_adapter_contract_v1.0.md`
5. 建 `packages/core` 和 `packages/integrations` 空骨架
6. 开始抽第一批稳定类型与 memory 契约
7. 做最小 IM 接入验证

这 7 步是当前最接近“低风险、可连续推进”的路径。

---

## 8. 当前不建议优先做的事

接下来的调整阶段，不建议优先投入：

- 正式做多 Agent forum runtime
- 设计过重的 plugin system
- 深写复杂 world / simulation 层
- 先做第二阶段事务推进对象系统
- 先把整个仓库拆成多个独立 repo
- 先重做完整产品前端
- 让用户自己创建 bot application 作为第一阶段主路径

---

## 9. 风险与控制点

## 9.1 最大风险：边界未稳就开始搬代码

如果太早搬代码，会导致：

- 迁移后还要再改接口
- `apps/web` 和 `packages/*` 两边同时混乱
- 调整成本显著上升

控制方式：

- 先补接口文档
- 先定义落点
- 再迁稳定部分

---

## 9.2 第二风险：产品壳继续吞掉底座逻辑

如果继续默认把新逻辑写进 `apps/web/lib/chat`：

- 后续拆分会越来越痛
- runtime 和产品层会进一步纠缠

控制方式：

- 先建立 `packages/core`
- 规定新写底座代码优先落新目录

---

## 9.3 第三风险：过早进入具体 IM 平台细节

如果在契约未定前直接写平台接入：

- 接入层会把平台细节带进 runtime
- 后续换平台或扩平台成本会上升

控制方式：

- 先写 `im_adapter_contract`
- 先跑 adapter stub
- 具体平台后置

---

## 10. 当前结论

SparkCore 接下来的调整，最重要的不是“马上把仓库整理成理想形态”，而是：

- 先让主线叙事一致
- 先让底座调用面稳定
- 先让接入层契约成型
- 再以增量方式建立真实分层

因此，当前最合理的工程节奏是：

**Stage 0 同步入口 -> Stage 1 稳 memory / role / session -> Stage 2 收敛 runtime -> Stage 3 定义 IM adapter 契约 -> Stage 4 建新目录落点 -> Stage 5 做最小接入验证 -> Stage 6 承接第一阶段产品化。**
