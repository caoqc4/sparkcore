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
> - `docs/engineering/telegram_poc_runbook_v1.0.md`
> - `docs/engineering/litellm_dev_runbook_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前已经从“重定位后的规划阶段”进入“最小底座开始落代码”的阶段，memory、runtime、session、role、im-adapter 五条主线都已出现第一版工程落点；Telegram 单通道 PoC 也已完成一次真实闭环验证，但整体仍处于收口和沉淀阶段。**

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
- `relationship memory` 已收进 `memory_write_requests` 的显式 subtype
- relationship 写入已不再走额外旁路，而是回到统一 write pipeline

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
- `RuntimeTurnInput` 已有第一版代码壳：
  - `apps/web/lib/chat/runtime-input.ts`
- `im-runtime-port.ts` 已开始显式构造 `RuntimeTurnInput`
- `actions.ts` 的正常发送与重试路径也已开始显式构造 `RuntimeTurnInput`
- `runAgentTurn(input)` 已有第一版薄壳，并已接入：
  - IM 入口
  - Web chat 主入口
- `PreparedRuntimeTurn` 已有第一版代码壳：
  - `apps/web/lib/chat/runtime-prepared-turn.ts`
- `runtime.ts` 已开始在主流程中显式构造 `PreparedRuntimeTurn`
- `prepareRuntimeTurn(...)` 已有第一版装配函数壳，并已开始被 `runtime.ts` 调用
- `prepareRuntimeSession(...)` 已有第一版 session 装配函数壳，并已开始被主流程使用
- `prepareRuntimeRole(...)` 已有第一版 role 装配函数壳，并已开始被主流程使用
- `prepareRuntimeMemory(...)` 已有第一版 memory recall 装配函数壳，并已开始被主流程使用
- `runPreparedRuntimeTurn(...)` 已有第一版执行薄壳，并已开始被主流程使用
- `memory_write_requests` 已有最小 planner output
- `follow_up_requests` 已有最小 planner output
- `runtime_events` 已有第一版标准事件类型
- `actions.ts` 已开始消费统一 runtime 输出对象
- `relationship memory` 已通过 `memory_write_requests` subtype 显式产出
- `follow_up_requests` 已有第一版 executor stub 与显式执行结果对象
- `accepted follow_up` 已默认进入真实 `pending_follow_ups` 持久化路径
- `follow_up` 已具备最小 claim / result marking repository seam
- `follow_up` 已具备平台无关 proactive sender contract、mapper 与 sender shell
- `follow_up` 已具备统一 sender policy helper，用于收口 sender 选择 / 降级逻辑
- `follow_up` 已能通过一次性 harness 跑通 `claim -> map -> send -> mark`
- `follow_up` 已具备默认 `claim -> resolve binding -> map -> send -> mark` worker shell
- `follow_up` 的 harness 与 default worker 默认 sender 初始化都已开始复用统一 sender helper
- `follow_up` 的 route、harness、worker 默认值三层现在都已开始向统一 sender helper 收口
- `follow_up` 已具备受 `x-smoke-secret` 保护的手动调试 route：
  - `app/api/test/followup-run/route.ts`
- `follow_up` 已具备受 `x-followup-cron-secret` 保护的 internal route：
  - `app/api/internal/followup/run/route.ts`
- `follow_up` 的 internal route 已完成两类受控真实验证：
  - 默认 `stub sender` 路径已验证 `pending -> claimed -> resolve binding -> send(stub) -> mark executed`
  - 显式开启 `FOLLOW_UP_ENABLE_TELEGRAM_SEND=true` 且指定 `sender=telegram` 后，已完成一次真实 Telegram proactive send 验证
- `api/test` 与 `api/internal` 两条 route 已开始共用统一 sender policy helper，而不是各自维护 sender 选择逻辑

这意味着：

- runtime 的对外 contract 已从文档概念变成代码事实
- runtime input 也已经不只是设计稿，而是开始出现：
  - IM
  - Web chat
  这两条真实标准输入路径
- runtime 装配层也已经不只是文档概念，而是开始出现第一版显式对象
- runtime 装配函数入口也已经出现第一版代码事实
- 但事件 schema、默认 worker 的真实自动调度语义、scheduler 常驻执行仍未完成

---

### 3.4 session 已有最小代码落点

当前 session 相关逻辑不再完全散落在 `runtime.ts` 中，已经出现了第一版统一会话对象：

- `apps/web/lib/chat/session-context.ts`
- `apps/web/lib/chat/runtime-prepared-turn.ts`

当前已落实的 `SessionContext` 组织字段包括：

- `current_user_message`
- `current_message_id`
- `recent_raw_turns`
- `continuity_signals`
- `recent_raw_turn_count`
- `approx_context_pressure`

另外，session 装配本身也开始出现第一版 preparation 落点：

- `prepareRuntimeSession(...)`

当前 runtime 已开始显式消费这层 session object，而不是继续直接拼 recent turns 和 thread continuity。

另外，session 正式状态层也已经有了第一版设计起点：

- [session_state_contract_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/session_state_contract_v1.0.md)
- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

其中已经开始明确：

- `thread`
- `thread state`
- `SessionContext`

三者的分层关系。

这意味着：

- `role-memory-session` 三者协作面中，session 已不是纸面概念
- 正式 `thread_state` contract 已开始
- `ThreadStateRecord` 第一版代码壳已开始
- `prepareRuntimeSession(...)` 已开始最小消费 `thread_state`
- 但 `thread_state` 仍未接入持久化，也还没有 compaction

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
- `RoleRepository` 第一版代码壳已开始：
  - `apps/web/lib/chat/role-repository.ts`
- `RoleResolver` 第一版代码壳已开始：
  - `apps/web/lib/chat/role-service.ts`
- runtime 已开始显式消费 role layer，而不是只维护本地匿名类型
- runtime / IM 主路径已开始直接消费 repository + resolver 分层
- `role repository / service` 的最小边界设计已开始：
  - `docs/architecture/role_repository_service_design_v1.0.md`

这意味着：

- `role-memory-session` 三者协作面中，role 也已经有了第一版代码落点
- role 的下一层边界已经前移成：
  - `repository`
  - `resolver / service`
  - `runtime preparation`
- `repository` 第一版代码壳已开始
- `resolver / service` 第一版代码壳也已开始
- runtime / IM 主调用面也已开始迁到新分层
- 但 metadata 收口、默认模型配置边界仍未进一步抽层

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
- Telegram 单通道 PoC 已完成一次真实闭环验证：
  - webhook 已成功注册并命中过真实入站
  - 真实 Telegram 身份已完成 binding 查询验证
  - `binding lookup -> runtime -> outbound reply` 已跑通
  - 验证结束后测试 binding 与 webhook 已完成清理
- Telegram PoC 已补齐重跑脚本与 runbook：
  - webhook set / delete script
  - binding upsert / delete script
  - `telegram_poc_runbook_v1.0.md`
  - `litellm_dev_runbook_v1.0.md`

这意味着：

- 接入层已经开始有独立代码落点
- 已经证明“最快验证闭环”的单通道接入路径是成立的
- Telegram 当前已进入“可重复重跑的 PoC 入口”阶段，但仍不是稳定常驻接入入口
- scheduler 接线、富媒体支持、真实绑定流程仍未开始

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
- `follow_up_requests` 的真实调度执行器
- `RuntimeInput` 的正式代码 contract
- `runAgentTurn(input)` 这种更明确的统一运行入口

---

### 5.4 IM adapter 已有骨架，并已完成 Telegram 单通道 PoC 验证

当前 `im_adapter_contract_v1.0.md` 已经有对应代码骨架，但当前仍缺：

- Telegram webhook 的稳定常驻运行入口
- binding 的正式创建流程
- `follow_up_requests` 到 scheduler / adapter 的真实闭环
- 更稳定的平台级重试 / 幂等执行

当前近期已经完成的关键补强包括：

- LiteLLM 开发运行说明已补齐
- Telegram PoC 重跑脚本已补齐
- `relationship memory` 已完成显式 contract 收口
- `follow_up executor stub` 已落地，可返回显式执行结果
- `follow_up pending queue` 设计稿、repository seam、migration 草案已完成
- `pending_follow_ups` 已在远端库落表
- `accepted -> enqueue -> pending` 已完成真实持久化验证
- 默认 enqueue 路径已切到 `SupabaseFollowUpRepository`
- `pending -> claimed` 已有 repository seam 与真实 claim harness
- `claimed -> executed / failed` 已有 repository seam
- proactive sender contract / mapper / stub / Telegram sample sender shell 已形成
- `claim -> map -> send -> mark` 已可通过一次性 harness 跑通（当前默认走 stub sender）
- `runDefaultFollowUpWorker(...)` 已落成最小代码壳，默认仍走 `StubProactiveSender`
- `app/api/test/followup-run/route.ts` 已可作为最小手动调试入口
- `app/api/internal/followup/run/route.ts` 已可作为最小受控自动触发入口壳
- `app/api/internal/followup/run/route.ts` 已完成一次 `stub` 路径真实验证与一次 Telegram proactive send 受控真实验证
- `follow-up-sender-policy.ts` 已形成统一 sender 选择 / 降级层

当前已经明确暴露出的关键依赖是：

- webhook 运行路径不能依赖 request-scope Supabase client
- memory planner 不能因 JSON 解析失败打爆整轮 turn
- LiteLLM 是否可用，会直接决定 Telegram PoC 是否能真正回复

---

## 6. 下一阶段建议顺序

当前最推荐的推进顺序如下：

### Step 1：先同步阶段总结与当前代码现实

目标：

- 让总结文档准确反映当前真实状态
- 明确 Telegram、relationship memory、follow-up executor 三条线都已前进一步

建议动作：

- 持续把阶段总结作为当前进度入口
- 避免后续再靠 commit 历史反推当前状态

---

### Step 2：决定是继续接入层稳定化，还是进入 follow-up 的下一阶段 worker 接线

原因：

- Telegram 已经从“一次性验证”进入“可重复重跑的 PoC 入口”
- `follow_up` 已经从 planner 输出推进到默认 worker shell、手动入口、internal route 都已落代码的阶段
- 下一步重点不再是证明方向，而是选择先稳哪一条执行链

建议动作：

- 如果继续平台化：
  - 保持单通道
  - 继续补 Telegram 稳定运行入口
  - 不扩附件与复杂命令
- 如果继续 follow-up：
  - 先决定 Telegram proactive send 何时从“受控验证”进入“更稳定的默认运行策略”
  - 暂不直接落 loop / retry / requeue

---

### Step 3：再决定是继续平台化、follow-up 调度，还是回到底座深化

原因：

- 当前最小平台接入已跑通且可重跑
- relationship memory 与 follow-up 持久化链也已各自收口一轮
- 这时再决定继续哪条线，返工会更少

建议动作：

- 如果继续平台化：
  - 只补 Telegram 单通道必需能力
  - 不并行开第二个平台
- 如果继续调度：
  - 先决定 internal route 的 sender 开关、环境隔离与运行约束
  - 再决定是否接真实扫描执行、主动发送与 retry
- 如果回到底座深化：
  - 回到 `role / session / runtime input` 这几块仍未底座化的边界

---

## 7. 当前结论

当前这一阶段最重要的成果，不是“已经接了多个 IM 平台”或者“已经把 packages 全搬完”，而是：

**SparkCore 已经从“规划重定位”走到了“memory、runtime、session、role、adapter 五个核心边界开始在代码里成形，并且 Telegram PoC、relationship memory contract、follow-up pending / claim / proactive send / default worker / manual route / internal route 都已有真实工程落点，其中 internal route 的 stub 路径与真实 Telegram proactive send 也都已受控验证”的阶段。**

这意味着下一阶段已经不需要再大面积补总纲，而更适合围绕：

- 继续稳定 Telegram 单通道接入
- 或进入 follow-up 的默认 worker cron/admin 分化
- 或回到底座进一步抽纯 runtime / role / session 边界

按这个顺序继续推进，返工会最少。
