# Role Layer 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `role layer` 的模块边界、最小 contract、与 memory / session / runtime 的协作关系。

本文档重点回答：

- 当前阶段的 role layer 到底负责什么
- `RoleProfile` 与 `role_core_packet` 的关系是什么
- role layer 与 relationship memory 的边界在哪里
- 当前阶段哪些字段应该先稳定，哪些能力后置

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/role_repository_service_design_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`

---

## 2. 一句话定义

**role layer 是 SparkCore 当前阶段用于定义“这个角色是谁、怎么说话、默认关系姿态是什么”的核心能力层，负责提供稳定的 `RoleProfile` 与最小 `role_core_packet`，为 single-agent runtime 的角色一致性提供底座。**

---

## 3. 当前阶段设计目标

当前阶段 role layer 的目标不是做一个复杂角色编辑系统，而是先做稳：

1. 角色身份稳定
2. 角色风格稳定
3. 默认关系姿态稳定
4. 与 memory、session 的协作边界稳定
5. 角色信息可被 runtime 稳定加载

---

## 4. 当前阶段非目标

当前阶段 role layer **不负责**：

- 重型角色创作后台
- 复杂角色版本管理系统
- 多角色协同编排
- 世界层 entity system
- 技能系统与角色技能编排
- 产品侧完整角色配置流程

这些能力可后续扩展，但当前不应污染 role 的最小核心。

---

## 5. role layer 的核心职责

当前阶段 role layer 应承担：

### 5.1 角色定义

- 角色名称
- 角色摘要
- 角色风格
- 角色基础行为边界
- 角色默认语言行为

### 5.2 角色核输出

- 输出可被 runtime 每轮稳定注入的 `role_core_packet`
- 保证 packet 足够短、稳定、可解释

### 5.3 与 memory 的边界控制

- 维护角色 canonical identity
- 不把关系型记忆错误塞进 role profile
- 不让 relationship memory 反向篡改 agent canonical identity

### 5.4 与 runtime 的协作

- 提供稳定的 role 读取与解析调用面
- 提供 `role_core_packet` 的组装依据

### 5.5 与 repository / service 的分层

当前阶段 role layer 还应开始明确：

- `RoleRepository`
  负责读取 `RoleProfile`
- `RoleResolver` / `RoleService`
  负责决定“本轮到底使用哪个 role”
- runtime preparation
  负责把已解析的 `RoleProfile` 转成 `role_core_packet`

当前不再建议长期把：

- 读表
- fallback 选择
- role packet 组装

继续混在同一个 `loadRoleProfile(...)` 风格函数里。

---

## 6. RoleProfile 与 role_core_packet

## 6.1 `RoleProfile`

`RoleProfile` 是角色在存储层与配置层的最小持久化结构。

当前建议至少包括：

- `agent_id`
- `name`
- `persona_summary`
- `style_prompt`
- `system_prompt`
- `default_model_profile_id`
- `metadata`

它更接近：

- 数据存储对象
- 可配置对象
- runtime 读取源

---

## 6.2 `role_core_packet`

`role_core_packet` 是 runtime 每轮都应稳定消费的“短角色包”。

当前建议至少包括：

- `identity`
- `persona_summary`
- `style_guidance`
- `relationship_stance`
- `language_behavior`
- `model_profile`

它更接近：

- 运行时对象
- prompt 组装对象
- 角色一致性约束对象

---

## 6.3 两者关系

建议关系是：

- `RoleProfile` 是源
- `role_core_packet` 是 runtime 消费的压缩表达

因此：

- `RoleProfile` 可以较完整
- `role_core_packet` 必须更短、更稳
- 不应直接把整份 `RoleProfile` 生硬塞进 prompt

---

## 7. 当前建议字段

## 7.1 RoleProfile 最小字段

当前建议优先稳定：

- `agent_id`
- `name`
- `persona_summary`
- `style_prompt`
- `system_prompt`
- `default_model_profile_id`
- `metadata.language_behavior?`
- `metadata.relationship_stance?`

---

## 7.2 role_core_packet 最小字段

当前建议优先稳定：

- `identity`
- `persona_summary`
- `style_guidance`
- `relationship_stance`
- `language_behavior`
- `model_profile`

这些字段足以支撑：

- 自我介绍
- 风格稳定
- 关系型回答
- 语言行为约束

---

## 8. 与 memory 的边界

## 8.1 role 负责什么

role 负责的是：

- 角色 canonical identity
- 默认说话方式
- 默认关系姿态
- 默认模型配置

例如：

- 角色叫什么
- 它整体上是温柔、直接还是专业
- 它对用户的默认态度是陪伴型、助理型还是引导型

---

## 8.2 memory 负责什么

memory 负责的是：

- 用户事实
- 用户偏好
- 用户与当前 agent 的关系约定
- 阶段性目标

例如：

- 用户职业是什么
- 用户希望怎么被称呼
- 用户给当前 agent 起了什么昵称

---

## 8.3 关键边界判断

### 属于 role

- agent canonical name
- persona summary
- style guidance
- default relationship stance

### 属于 memory

- `relationship.agent_nickname`
- `relationship.user_preferred_name`
- `relationship.user_address_style`

---

## 8.4 当前最重要的优先级原则

当前建议：

1. 关系型记忆优先影响“如何称呼、如何表达”
2. 但不应覆盖 agent 的 canonical identity
3. 用户给 agent 的昵称属于 memory，不是把 agent 改名

这条规则非常关键，因为它决定了：

- 为什么 `relationship.agent_nickname` 应绑定 `target_agent_id`
- 为什么 role 与 relationship memory 不能混成一个字段

---

## 9. 与 session 的边界

role 回答的是：

> 它默认是谁

session 回答的是：

> 当前这条 thread 正发生什么

---

## 10. 与 repository / service 的边界

## 10.1 `RoleRepository`

`RoleRepository` 负责：

- 读取 `RoleProfile`
- 知道存储字段与 active 过滤
- 不负责 runtime packet 组装
- 不负责业务 fallback 语义

## 10.2 `RoleResolver` / `RoleService`

`RoleResolver` / `RoleService` 负责：

- 解释本轮 role 选择规则
- 处理 `requestedAgentId` 与 fallback
- 对 runtime 暴露更稳定的解析结果

## 10.3 runtime preparation

runtime preparation 负责：

- 消费已解析 `RoleProfile`
- 结合 language / relationship recall / session continuity
- 产出 `RoleCorePacket`

也就是说，当前建议逐步收敛成：

`repository -> resolver/service -> prepareRuntimeRole(...)`

而不是继续让 runtime 或 adapter 直接混合承担三层职责。

因此：

- role 不应承载 thread-local 临时风格
- session 不应取代 role 的默认人格定义
- 当前 thread 的局部语气，只能在 session / thread state 层体现

---

## 10. 与 runtime 的边界

runtime 应：

- 加载 `RoleProfile`
- 生成 `role_core_packet`
- 和 memory recall、session context 一起组装 prompt

role layer 不应：

- 直接负责 prompt 全量拼装
- 直接做模型调用
- 直接做产品页面逻辑

---

## 11. 当前实现映射

当前实现里，role layer 的现实承载主要是：

- `agents` 表
- `persona_packs` 表
- `default_model_profile_id`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`
- `apps/web/lib/chat/runtime.ts`

当前已经具备：

- `name`
- `persona_summary`
- `style_prompt`
- `system_prompt`
- `default_model_profile_id`
- `RoleProfile` 的第一版代码 contract
- `buildRoleCorePacket(...)` 的独立组装入口
- `loadRoleProfile(...)` 的第一版最小加载入口
- `prepareRuntimeRole(...)` 的第一版装配入口
- runtime 显式消费 `role_core_packet`

当前仍缺：

- `RoleProfile` 的包级落点
- `loadRoleProfile(...)` 的独立调用面
- role 与 model profile 的更清晰独立边界
- role metadata 的结构化收口

### 11.1 当前代码文件映射

- `apps/web/lib/chat/role-core.ts`
  当前是 role layer 的最小代码落点，承载：
  - `RoleProfile`
  - `RoleCorePacket`
  - `buildRoleCorePacket(...)`
  - `getRoleCoreRelationshipStance(...)`
- `apps/web/lib/chat/role-loader.ts`
  当前承载 role profile 的最小读取面，负责：
  - `ROLE_PROFILE_SELECT`
  - `loadRoleProfile(...)`
- `apps/web/lib/chat/runtime-prepared-turn.ts`
  当前开始承载 role 装配进入 runtime preparation 模块的入口，负责：
  - `prepareRuntimeRole(...)`
- `apps/web/lib/chat/runtime.ts`
  当前仍负责：
  - 从 `agents` 表读取 `RoleProfile` 现实字段
  - 调用 `prepareRuntimeRole(...)`
  - 将 `role_core_packet` 注入 runtime prompt 组装

### 11.2 当前对齐结论

当前代码已经开始满足本文档定义的最小 role layer 目标：

- `RoleProfile` 不再只作为 runtime 内部匿名类型存在
- `role_core_packet` 不再只在 `runtime.ts` 内局部定义
- role 与 relationship memory 的边界已经体现在 `getRoleCoreRelationshipStance(...)` 中
- role 装配也已经开始从 `runtime.ts` 内联逻辑，往 preparation 模块收口

但当前仍处于第一阶段：

- role 的存储读取还没有独立 service / repository
- role 的默认模型配置仍散落在 runtime 查询路径中
- role layer 还没有迁到 `packages/core` 或等价底座目录

---

## 12. 当前推荐实现顺序

1. 固化 `RoleProfile` 最小字段
2. 固化 `role_core_packet` 最小字段
3. 固化 role 与 relationship memory 的边界
4. 让 runtime 明确消费 `role_core_packet`

---

## 13. 当前阶段 DoD

- `RoleProfile` 最小字段已固定
- `role_core_packet` 最小字段已固定
- role 与 relationship memory 的边界已明确
- role 与 session 的边界已明确
- runtime 已能稳定说明如何消费 role layer
- 存在独立的 role 代码落点，而不是只在 `runtime.ts` 内部匿名维护

---

## 14. 当前结论

当前阶段的 role layer，不是产品里的“角色编辑功能”，而是：

**single-agent runtime 中维持角色身份、风格与默认关系姿态的最小稳定层。**

只有把这一层先定形，memory 才有稳定附着点，session 才有清晰边界，runtime 才能真正维持“像同一个人”。
