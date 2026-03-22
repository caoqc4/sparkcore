# SparkCore 当前阶段成果总结 v1.0

## 1. 文档定位

本文档用于收束本轮 Phase 1 准备阶段已经完成的规划与代码落点，明确：

- 当前已经做到了什么
- 当前代码与文档已经对齐到什么程度
- 还缺哪些关键收口
- 下一阶段最建议按什么顺序推进

本文档不是新的总纲，而是当前阶段的阶段性总结与下一步执行入口。

> 状态：当前有效
> 对应阶段：Phase 1 准备阶段
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`
> - `docs/architecture/memory_layer_design_v1.0.md`
> - `docs/architecture/runtime_contract_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前已经从“重定位后的规划阶段”进入“最小底座开始落代码”的阶段，memory、runtime、session、role 四条主线都已出现第一版工程落点，但仍处于收口和沉淀阶段，尚未进入 IM 最小接入验证。**

---

## 3. 当前已经完成的事情

### 3.1 主线与文档体系已收口

当前主线已经明确收敛到：

- 单 Agent
- 长记忆角色层
- IM 接入
- Phase 1 以虚拟伴侣 / 助理闭环为验证对象

相关文档已完成第一轮收口：

- `docs/strategy/sparkcore_repositioning_v1.0.md`
- `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`
- `docs/engineering/module_inventory_v1.0.md`
- `docs/engineering/legacy_04_05_reuse_plan_v1.0.md`

旧文档也已完成重新定位：

- `04`：过渡参考文档
- `05`：过渡任务库
- `06`：过渡设计资产

---

### 3.2 memory 已有第一版工程落点

当前 memory 相关代码已经从原来的单文件混合状态，收成了较清晰的几层：

- `packages/core/memory/contract.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory.ts`

当前已经完成的关键收口包括：

- 纯 contract 已开始进入 `packages/core/memory`
- recall / write / shared 已在 `apps/web/lib/chat` 内部分层
- `memory.ts` 已退成兼容入口
- `profile / preference` 已形成 planner -> executor 最小闭环
- relationship memory 仍保留独立路径，没有被过早混进通用 planner

这意味着：

- memory 已不再只是“页面内部 helper”
- 但仍未完全迁出 `apps/web`

---

### 3.3 runtime 已有统一输出对象

当前 `apps/web/lib/chat/runtime.ts` 已不再只是“生成一段 reply 文本”，而是开始返回统一 `RuntimeTurnResult`。

当前已具备的最小输出对象包括：

- `assistant_message`
- `memory_write_requests`
- `follow_up_requests`
- `runtime_events`
- `debug_metadata`

当前已落实的事实包括：

- `assistant_message` 已有最小统一字段
- `memory_write_requests` 已有最小 planner output
- `follow_up_requests` 已有最小 planner output
- `runtime_events` 已有第一版标准事件类型
- `actions.ts` 已开始消费统一 runtime 输出对象

这意味着：

- runtime 的对外 contract 已从文档概念变成代码事实
- 但事件 schema、follow-up executor、scheduler 接线仍未完成

---

### 3.4 session 已有最小代码落点

当前 session 相关逻辑不再完全散落在 `runtime.ts` 中，已经出现了第一版统一会话对象：

- `apps/web/lib/chat/session-context.ts`

当前已落实的 `SessionContext` 组织字段包括：

- `current_user_message`
- `current_message_id`
- `recent_raw_turns`
- `continuity_signals`
- `recent_raw_turn_count`
- `approx_context_pressure`

当前 runtime 已开始显式消费这层 session object，而不是继续直接拼 recent turns 和 thread continuity。

这意味着：

- `role-memory-session` 三者协作面中，session 已不是纸面概念
- 但正式 `thread_state` 与 compaction 层仍未开始

---

### 3.5 role 已有最小代码落点

当前 role 相关逻辑已经不再完全内嵌于 `runtime.ts`，已经出现了第一版独立角色层文件：

- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`

当前已落实的 role 侧事实包括：

- `RoleProfile` 已有第一版代码 contract
- `RoleCorePacket` 已有第一版独立定义
- `buildRoleCorePacket(...)` 已从 `runtime.ts` 中抽出
- `loadRoleProfile(...)` 已形成最小读取面
- runtime 已开始显式消费 role layer，而不是只维护本地匿名类型

这意味着：

- `role-memory-session` 三者协作面中，role 也已经有了第一版代码落点
- 但 role 的 repository / service、metadata 收口、默认模型配置边界仍未进一步抽层

---

## 4. 当前阶段代码结构判断

### 4.1 已经开始长出来的底座

当前最明确的底座候选有：

- `packages/core/memory`
- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`

其中：

- `packages/core/memory` 是最明确的 core 落点
- runtime 和 session 仍处于 Web 邻近层落点

---

### 4.2 当前仍然属于过渡态的部分

以下部分已经分层，但仍处于过渡态：

- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `apps/web/lib/chat/runtime.ts`

当前合理判断不是“这些设计还不成立”，而是：

- 这些边界已经成立
- 但仍未完全迁入更稳定的 package 落点

---

## 5. 当前还没有完成的关键点

当前最明显还没完成的，不是 memory 本身，而是下面几块：

### 5.1 role 已有落点，但仍是第一版

虽然 role 已经有了 `role-core.ts` 与 `role-loader.ts`，但当前仍缺：

- 独立的 role repository / service 边界
- role metadata 的结构化收口
- role 与 model profile 的更明确独立边界
- 更稳定的 `loadRoleProfile(...)` 底座化位置

---

### 5.2 session 仍未进入正式状态层

当前已有 `SessionContext`，但仍未具备：

- 正式 `thread_state`
- 正式 compaction
- thread-local agreement 的显式结构位

因此当前 session 仍处于：

- 最小 contract 已落地
- 但状态层尚未正式化

---

### 5.3 runtime 输出仍是第一版

虽然统一输出对象已经有了，但当前仍缺：

- `runtime_events` 的完整字典与 payload schema
- `follow_up_requests` 的真实执行器
- `RuntimeInput` 的正式代码 contract
- `runAgentTurn(input)` 这种更明确的统一运行入口

---

### 5.4 IM adapter 仍停在文档层

当前 `im_adapter_contract_v1.0.md` 已经完成，但代码层还没有最小 adapter 骨架。

这意味着：

- 接入契约已经有了
- 但仍未开始最小通道闭环验证

---

## 6. 当前工作树状态提醒

当前和本轮主线直接相关的代码状态包括：

已修改：

- `apps/web/app/chat/actions.ts`
- `apps/web/lib/chat/memory.ts`
- `apps/web/lib/chat/runtime.ts`
- `docs/architecture/memory_layer_design_v1.0.md`
- `docs/architecture/role_layer_design_v1.0.md`
- `docs/architecture/runtime_contract_v1.0.md`
- `docs/architecture/session_layer_design_v1.0.md`

未跟踪：

- `apps/web/lib/chat/runtime.ts`
- `apps/web/lib/chat/memory-recall.ts`
- `apps/web/lib/chat/memory-shared.ts`
- `apps/web/lib/chat/memory-write.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/session-context.ts`
- `docs/engineering/current_phase_progress_summary_v1.0.md`
- `packages/core/memory/`

这说明：

- 当前阶段成果已经落到代码和文档里
- 但这批新结构尚未正式纳入版本控制

---

## 7. 下一阶段建议顺序

当前最推荐的推进顺序如下：

### Step 1：先收住当前阶段成果

目标：

- 把当前这轮 memory / runtime / session 的代码与文档视作一个阶段成果
- 不继续无边界扩张新模块

建议动作：

- 检查命名、文件组织、最小注释
- 必要时补一份更简短的开发者入口说明

---

### Step 2：决定 role 是否继续往 repository / service 推进

原因：

- `role-memory-session` 三者当前都已有第一版代码落点
- role 是否继续深化，取决于下一阶段更偏底座沉淀还是更偏接入验证

建议动作：

- 如果继续沉淀底座：
  - 再抽一层 role repository / service
  - 收紧 role 与 model profile / metadata 的边界
- 如果优先推进接入验证：
  - 当前 role 落点已经足够支撑最小 IM adapter 骨架，不必继续深拆

---

### Step 3：再决定是否进入最小 IM adapter 骨架

原因：

- 当前 runtime 输出对象已经开始成形
- 当前 memory / session 消费面已比之前稳很多

建议动作：

- 先建立 adapter 侧最小目录与类型
- 只选一个通道验证最小闭环
- 仍然不要并行做多个平台

---

## 8. 当前结论

当前这一阶段最重要的成果，不是“已经接了 IM”或者“已经把 packages 全搬完”，而是：

**SparkCore 已经从“规划重定位”走到了“memory、runtime、session 三个核心边界开始在代码里成形”的阶段。**

这意味着下一阶段已经不需要再大面积补总纲，而更适合围绕：

- 收住当前成果
- 补齐 role 落点
- 再进入最小 adapter 骨架

按这个顺序继续推进，返工会最少。
