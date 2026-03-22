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

**SparkCore 当前已经从“重定位后的规划阶段”进入“最小底座开始落代码”的阶段，memory、runtime、session、role、im-adapter 五条主线都已出现第一版工程落点，并已进入单通道 Telegram PoC 骨架阶段，但仍处于收口和沉淀阶段。**

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

### 3.6 IM adapter 已有最小代码骨架

当前 IM adapter 已不再只停留在文档层，已经出现了第一版接入层 package：

- `packages/integrations/im-adapter/contract.ts`
- `packages/integrations/im-adapter/bridge.ts`
- `packages/integrations/im-adapter/example.ts`
- `apps/web/lib/chat/im-runtime-port.ts`

当前已落实的 adapter 侧事实包括：

- `InboundChannelMessage` 已有第一版代码 contract
- `OutboundChannelMessage` 已有第一版代码 contract
- binding 最小结构已落代码
- `BindingLookup` 已形成最小查询接口
- `InMemoryBindingLookup` 已形成最小 stub
- `BindingRepository` 已形成最小预留壳
- `InMemoryBindingRepository` 已形成最小 repository stub
- `SupabaseBindingRepository` 已形成数据库映射壳
- Web 侧真实 binding lookup 工厂已形成
- `channel_bindings` 已有第一版 migration 草案
- `AdapterRuntimePort` 已形成 runtime 边界接口
- `handleInboundChannelMessage(...)` 已能表达最小 `incoming -> runtime -> outgoing` 骨架
- Web 侧 runtime 已有第一版 adapter port 适配器
- `binding_not_found` 已有最小统一出站处理
- Telegram 单通道 PoC 骨架已形成：
  - `apps/web/lib/integrations/telegram.ts`
  - `apps/web/app/api/integrations/telegram/webhook/route.ts`
  - `apps/web/lib/supabase/admin.ts`

这意味着：

- 接入层已经开始有独立代码落点
- 已开始进入最快验证闭环的单通道接入阶段
- 但真实 Telegram token / webhook 配置、scheduler 接线、富媒体支持仍未开始

---

## 4. 当前阶段代码结构判断

### 4.1 已经开始长出来的底座

当前最明确的底座候选有：

- `packages/core/memory`
- `apps/web/lib/chat/runtime-contract.ts`
- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/role-core.ts`
- `apps/web/lib/chat/role-loader.ts`
- `packages/integrations/im-adapter`

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

### 5.4 IM adapter 已有骨架，并已进入 Telegram 单通道 PoC 骨架阶段

当前 `im_adapter_contract_v1.0.md` 已经有对应代码骨架，但当前仍缺：

- Telegram webhook 的真实环境变量配置与线上回调验证
- `follow_up_requests` 到 scheduler / adapter 的真实闭环
- `relationship memory` 的显式 contract 收口
- 更稳定的平台级重试 / 幂等执行
- 真实绑定创建与 onboarding 流程

---

## 6. 下一阶段建议顺序

当前最推荐的推进顺序如下：

### Step 1：先收住 Telegram PoC 骨架

目标：

- 把当前这轮 Telegram webhook / binding lookup / runtime port 接线视作一个阶段成果
- 不继续无边界扩张平台专属功能

建议动作：

- 检查 Telegram env、route、send path 的最小命名与说明
- 补最小 webhook 配置说明
- 维持只支持文本消息

---

### Step 2：做真实 Telegram 回调验证

原因：

- 当前代码已经有 webhook 路由、binding lookup、runtime port、出站发送
- 剩下最关键的是验证真实 Bot Token + Webhook 能否打通

建议动作：

- 配置 `TELEGRAM_BOT_TOKEN`
- 可选配置 `TELEGRAM_WEBHOOK_SECRET`
- 配置 Telegram webhook 指向当前 route
- 用一个真实 binding 做一次最小消息闭环

---

### Step 3：再决定是继续平台化还是回到底座深化

原因：

- 当前最小平台接入一旦跑通，下一阶段路线会更清楚
- 那时再判断是否继续 Telegram 能力，还是回到 role / session / scheduler 深化，会更稳

建议动作：

- 如果继续平台化：
  - 只补 Telegram 单通道必需能力
  - 不并行开第二个平台
- 如果回到底座深化：
  - 先补 `relationship memory` 的显式 contract
  - 再收 `follow_up_requests` 的执行器边界

---

## 7. 当前结论

当前这一阶段最重要的成果，不是“已经接了多个 IM 平台”或者“已经把 packages 全搬完”，而是：

**SparkCore 已经从“规划重定位”走到了“memory、runtime、session、role、adapter 五个核心边界开始在代码里成形，并且 Telegram 单通道 PoC 骨架已经立起来”的阶段。**

这意味着下一阶段已经不需要再大面积补总纲，而更适合围绕：

- 收住 Telegram PoC 骨架
- 跑一次真实 Telegram 回调闭环
- 再决定是继续平台能力，还是回到底座深化

按这个顺序继续推进，返工会最少。
