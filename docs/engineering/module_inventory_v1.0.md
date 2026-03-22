# SparkCore 模块盘点 v1.0

## 1. 文档定位

本文档用于基于当前主线文档，对 SparkCore 现有仓库中的代码、文档与目录进行第一轮盘点，并给出按 `core / integrations / product / future / archive` 的推荐归类。

本文档的目标不是立即触发大规模移动，而是回答：

- 当前仓库里已经有什么
- 这些内容分别更像哪一层
- 当前最大的边界混杂点在哪里
- 后续目录重组应优先处理哪些部分

> 状态：当前有效
> 对应阶段：Phase 1 准备阶段
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/product/companion_mvp_flow_v1.0.md`
> - `docs/engineering/project_split_plan_v1.0.md`

---

## 2. 当前盘点结论

当前仓库已经有一个可运行的 `apps/web` 试验产品壳，但底座能力、产品流程、测试脚本和公开试验文档仍明显混在一起。

最核心的现状判断如下：

1. `apps/web` 当前同时承载了产品层和底座候选逻辑
2. `packages/` 目录已经存在，但仍基本为空，尚未真正承接 `core / integrations / shared`
3. `docs/` 中新的主线文档已经形成，但仓库入口文案和旧方案状态说明还未同步
4. `90_历史归档/` 中已存在旧版多 Agent 主文档归档，但仍缺少与当前主线的显式关系说明
5. `docs-public/` 更像公开试验材料与评测结果集合，不属于当前底座主线文档系统

换句话说，当前仓库并不是“结构错误”，而是正处在：

**产品壳先跑起来了，但模块边界还没来得及沉入分层结构。**

---

## 3. 现有目录总览

当前仓库中与主线相关的主要目录如下：

- `apps/web`
- `packages`
- `supabase`
- `scripts`
- `docs`
- `docs-public`
- `90_历史归档`

其中：

- `apps/web` 是当前唯一可运行入口
- `packages` 是未来三层拆分的主要承接位置，但当前尚未实装
- `supabase` 承担数据结构与持久化支撑
- `scripts` 承担开发辅助与本地代理脚本
- `docs` 已开始承接新的内部主线文档
- `docs-public` 更像公开说明、评测集与试用材料
- `90_历史归档` 已用于存放旧主线方案

---

## 4. 按层盘点

## 4.1 Core 候选

这些内容更接近底座层能力，后续应优先考虑沉到 `packages/core`。

### 代码

- `apps/web/lib/chat/memory-v2.ts`
- `apps/web/lib/chat/memory.ts`
- `apps/web/lib/chat/runtime.ts`

判断依据：

- `memory-v2.ts` 已经在定义较清晰的 memory category、scope、status、slot key 与字段归一逻辑，明显属于记忆层基础契约，而不是页面逻辑
- `memory.ts` 已经承载记忆提取、去重、召回、状态判定等基础能力，虽然当前仍依赖 Web 内的数据访问方式，但职责上更接近 `memory` 模块
- `runtime.ts` 已经在承担生成回复、组织记忆与角色表现的运行逻辑，属于 `single-agent runtime` 候选

当前问题：

- 这些底座候选仍放在 `apps/web/lib/chat` 下
- `runtime.ts` 当前和 Web 数据访问、产品语气策略写在一起，边界还偏厚
- `memory.ts` 与持久化读写、策略、调用面没有彻底分开

### 数据与 schema 候选

- `supabase/migrations/20260315235500_create_memory_items.sql`
- `supabase/migrations/20260317221500_add_memory_v2_record_shape.sql`
- `supabase/migrations/20260315213000_create_threads_and_messages.sql`
- `supabase/migrations/20260315223000_create_persona_packs_and_agents.sql`
- `supabase/migrations/20260315233000_add_agent_id_to_threads.sql`

判断依据：

- memory、thread、message、agent 这些表已经是底座能力的实际数据承载
- 它们虽然目前通过 Supabase 形态存在，但逻辑归属更接近 `role / memory / session`

需要注意：

- 数据库迁移是基础设施资产，不等于最终模块边界
- 后续需要把“逻辑归属”与“部署位置”分开理解

### 文档

- `docs/architecture/single_agent_runtime_design_v1.0.md`
- `docs/plans/2026-03-17-memory-v2-design.md`

其中：

- runtime 设计文档已经是当前底座主线文档
- memory v2 设计文档虽然位于 `docs/plans`，但内容实际上已经接近 `memory layer` 的设计依据

---

## 4.2 Integration 候选

当前仓库里接入层实现还很少，更多是“准备态”而不是“已成型模块”。

### 已有雏形

- `apps/web/lib/litellm/client.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/supabase/client.ts`
- `apps/web/lib/supabase/middleware.ts`

这些更接近：

- 外部服务接入客户端
- 基础基础设施适配
- 当前运行环境的服务边界

但它们还不是文档中定义的 IM integration layer。

### 当前缺失但已被主线明确要求的接入层模块

- `IM adapter`
- `message normalization`
- `binding`
- `routing`

当前结论：

- 接入层是新主线中最明确的“缺口”
- 当前仓库尚未看到独立的 IM 接入模块目录
- 这也说明你文档里提出“先定义 IM adapter 契约，再做最小接入验证”是合理的，因为代码层现在确实还没有这层

---

## 4.3 Product 候选

这些内容明显属于第一阶段产品壳，后续应保留在 `apps/web` 或对应产品目录中。

### 网站与页面

- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/chat/page.tsx`
- `apps/web/app/workspace/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`

### 产品动作与 UI

- `apps/web/app/chat/actions.ts`
- `apps/web/app/chat/chat-thread-view.tsx`
- `apps/web/app/chat/create-agent-sheet.tsx`
- `apps/web/app/chat/agent-edit-sheet.tsx`
- `apps/web/app/chat/language-switch.tsx`
- `apps/web/components/form-submit-button.tsx`

### 产品定位相关文档

- `docs/product/companion_mvp_flow_v1.0.md`

判断依据：

- 这些内容直接面向用户可见流程
- 它们处理的是试用工作台、登录、聊天 UI、角色创建与编辑等产品壳逻辑
- 这些模块理应调用底座层，而不应继续承载底座层的长期演进

当前问题：

- `apps/web/app/chat/actions.ts` 同时在做产品动作编排和底座调用
- 当前 chat workspace 是可运行产品壳，但它仍更像“工作台 / 验证环境”，还不是文档里定义的“角色配置 + 领取 + IM 绑定”产品闭环

---

## 4.4 Shared / Infra 候选

这些内容不完全属于三层之一，但明显属于后续应抽离的通用支撑。

- `apps/web/lib/env.ts`
- `apps/web/lib/i18n/chat-ui.ts`
- `apps/web/lib/testing/quality-eval.ts`
- `apps/web/lib/testing/smoke.ts`
- `apps/web/tests/smoke/*`
- `scripts/start-litellm-proxy.sh`
- `scripts/litellm/config.yaml`
- `.env.example`

更合适的后续方向可能是：

- `packages/shared/types`
- `packages/shared/utils`
- 根目录 `scripts/`
- 测试目录按产品层与底座层重新切分

---

## 4.5 Future / Research 候选

这些内容不一定错误，但不应被误认为当前 Phase 1 主线。

### 公开评测与实验材料

- `docs-public/*`

当前更像：

- 公开试验记录
- 质量评测集
- 阶段性说明材料

它们对当前项目有价值，但不应承担主线架构文档的角色。

### 仍可参考但非当前主线的设计方向

- `docs/plans/2026-03-17-memory-v2-design.md` 中超出 P0 的保留方向

说明：

- 此文档整体仍然有价值
- 但其中偏长期扩展、非当前 Phase 1 的部分，应在后续整理中显式标注为“保留方向”

---

## 4.6 Archive 候选

这些内容已经进入归档，但还需要补充状态说明，避免后来阅读时误判为当前主线。

- `90_历史归档/归档_04_多Agent长记忆IM底座_技术方案_v1.3_修订增强版.md`
- `90_历史归档/归档_05_多Agent长记忆IM底座_开发任务拆解_v1.4.md`

当前判断：

- 它们仍然有参考价值
- 但语义上属于“上一阶段的大方向讨论”
- 需要明确声明：当前主线已切换到单 Agent + 长记忆角色 + IM 接入

---

## 5. 当前最明显的边界混杂点

## 5.1 README 入口仍在讲多 Agent 主线

根入口 README 仍把项目描述为同时支持 `Single-agent and multi-agent runtimes`，这与新主线文档的“当前阶段不再以多 Agent 为优先主线”已经不一致。

涉及位置：

- `README.md`
- `README.zh-CN.md`

这不是内容错误，而是“项目入口叙事滞后于新战略”。

---

## 5.2 `apps/web/lib/chat` 同时放了 runtime、memory 和产品试验逻辑

当前 `apps/web/lib/chat` 是仓库里最明显的混合区。

其中既有：

- memory schema 与 helper
- memory recall / write 策略
- runtime 主流程候选

也混入了：

- 面向当前 chat trial 的具体策略
- 与 Web 持久化直接耦合的访问方式
- 偏产品实验性质的提示词与行为分支

这意味着：

- 当前最值得先拆的不是 UI，而是 `apps/web/lib/chat`
- 未来应优先把“契约、接口、纯逻辑”与“Web 试验实现”分离

---

## 5.3 `packages/` 已预留，但还没有成为真实边界

当前 `packages/README.md` 还只是占位说明。

这代表：

- 顶层方向已经被提前留出
- 但实际代码仍然没有通过目录结构体现边界

因此后续拆分最自然的方式不是大挪仓，而是：

- 先新增 `packages/core`
- 再把新写底座代码优先落到那里
- 逐步把 `apps/web/lib/chat` 中稳定部分迁出

---

## 5.4 当前产品壳与新产品闭环还不一致

现有 `apps/web` 更像：

- 登录
- 聊天工作台
- agent 创建与编辑
- 试用环境

而文档中定义的第一阶段产品闭环更像：

- 落地页
- 角色模板选择
- 角色配置
- 角色领取
- IM 绑定引导
- IM 中持续互动

这说明：

- 当前 Web 项目不是白做了
- 但它更像“底座验证工作台 + 过渡产品壳”
- 后续需要判断哪些页面保留为内部工作台，哪些能力转译为新的 Phase 1 产品流程

---

## 6. 当前推荐归类结果

为便于后续目录重组，当前建议先按下列方式理解现有内容：

### A 类：Core 候选

- `apps/web/lib/chat/memory-v2.ts`
- `apps/web/lib/chat/memory.ts`
- `apps/web/lib/chat/runtime.ts`
- memory / thread / agent 相关 Supabase migration
- `docs/architecture/single_agent_runtime_design_v1.0.md`
- `docs/plans/2026-03-17-memory-v2-design.md`

### B 类：Product 候选

- `apps/web/app/*`
- `apps/web/components/*`
- `apps/web/app/chat/actions.ts`
- `docs/product/companion_mvp_flow_v1.0.md`

### C 类：Integration 候选或待补缺口

- `apps/web/lib/litellm/client.ts`
- `apps/web/lib/supabase/*`
- 未来的 `IM adapter / binding / routing / normalization`

### D 类：Shared / Infra 候选

- `apps/web/lib/env.ts`
- `apps/web/lib/i18n/*`
- `apps/web/lib/testing/*`
- `apps/web/tests/*`
- `scripts/*`
- `.env.example`

### E 类：Future / Archive

- `docs-public/*`
- `90_历史归档/*`

---

## 7. 当前最推荐的后续动作

基于这轮盘点，当前最值得优先做的不是“立刻搬文件”，而是以下几步：

### 7.1 同步仓库入口叙事

优先更新：

- `README.md`
- `README.zh-CN.md`

目标：

- 让仓库入口与新的“单 Agent + 长记忆角色 + IM 接入”主线一致
- 明确当前第一阶段产品形态是虚拟伴侣 / 助理，而不是泛化多 Agent 平台

### 7.2 给历史文档补状态说明

优先给以下文档加前置说明：

- `90_历史归档/归档_04_多Agent长记忆IM底座_技术方案_v1.3_修订增强版.md`
- `90_历史归档/归档_05_多Agent长记忆IM底座_开发任务拆解_v1.4.md`

目标：

- 防止未来阅读时把历史方案误当当前主线

### 7.3 先定义 `packages/core` 的最小落点

当前不要求立刻大迁移，但建议尽快明确：

- `packages/core/memory`
- `packages/core/session`
- `packages/core/single-agent-runtime`
- `packages/shared/types`

目标：

- 让新写代码不再默认落到 `apps/web/lib/chat`

### 7.4 先补 IM adapter 契约文档

当前代码层最大的结构空位，就是接入层契约。

建议下一份工程文档优先写：

- `docs/engineering/im_adapter_contract_v1.0.md`

### 7.5 识别当前 Web 工作台的去向

需要尽快回答：

- 哪些页面属于内部工作台
- 哪些页面会演进成第一阶段官网 / 配置 / 领取流程

否则产品层后续会继续在旧试验壳上叠加，边界会越来越混。

---

## 8. 当前结论

当前仓库的真实状态并不是“缺东西”，而是：

- 主线战略已经完成收敛
- 文档层已经开始形成新的中心
- 代码层已有可运行试验壳与一部分底座雏形
- 但分层结构和入口叙事还没有跟上

因此，当前最合适的动作顺序仍然是：

**先同步入口与状态说明，再给底座代码建立真实落点，再补接入层契约，最后再做增量迁移。**

这会比直接大规模移动文件更稳，也更符合当前文档中已经明确的拆分节奏。
