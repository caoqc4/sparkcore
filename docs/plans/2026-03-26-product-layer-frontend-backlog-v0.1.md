# SparkCore 产品层前端开发 Backlog v0.2

## 1. 文档定位

本文档用于把 [2026-03-26-product-layer-frontend-execution-plan.md](/Users/caoq/git/sparkcore/docs/plans/2026-03-26-product-layer-frontend-execution-plan.md) 继续下钻为可执行 backlog，供产品层前端实现阶段直接使用。

本 backlog 服从以下原则：

- 服从 SparkCore 的 **底座层 / 接入层 / 产品层** 三层结构
- 对外产品层采用 `sistine` 壳思路
- 现有 `apps/web` 暂保留为能力工作台与过渡接线层
- 第一阶段优先验证 IM-native companion 闭环，而不是网页聊天主工作台

### 1.1 当前实现快照（2026-03-26）

截至当前版本，以下 backlog 项已从“待做”变为“已落地最小版”：

- Track A：A1 / A2 / A3 / A4 已完成
- Track B：B1、B2、B3、B4、B5、B6 已完成最小版，`/ai-roleplay-chat` 入口页已落地
- Track C：C1、C2 已完成最小真流
- Track D：D1、D2、D3、D4、D5 已完成最小版
- Track F：F1 已完成最小版，F2 已完成浅版 drill-down
- Track G：G1、G2、G3、G4 已具备真实验收基础

因此本文档的主要用途，已从“启动 backlog”转为“继续指导 P1 收尾与扩展优先级”。

---

## 2. 锁版约束

以下约束在进入 Batch 1 前先锁定，避免后续在页面、导航、埋点、SEO 与 contract 上反复改动。

### 2.1 路由命名约束

- 公开解释页固定为 `/features/memory-center`
- 产品控制台页固定为 `/dashboard/memory`
- 不再使用 `/dashboard/memory-center`
- 后续文档、埋点、组件命名、导航配置统一按以上命名执行

### 2.2 未登录访问规则

- Public Layer 页面全部允许匿名访问
- `/create` 允许匿名浏览
- `/create` 在提交前要求登录
- `/connect-im` 强保护，未登录不可进入
- `/dashboard/*` 强保护，未登录不可进入

这套规则用于平衡转化效率与实现复杂度，避免在进入产品闭环后再重新定义 guard 行为。

### 2.3 Canonical 与主站域名口径

- 公开层只允许一个 canonical host
- `NEXT_PUBLIC_APP_URL` 作为 canonical base URL 来源
- beta、预览域、旧壳域名不参与公开层 canonical
- metadata / sitemap / open graph / canonical 全部从统一 site config 生成

### 2.4 最小 contract 字段约束

以下字段为前端骨架与 mock 的最低依赖字段，后续 contract 可以扩展，但不应低于这组最小集合。

#### create contract

- `role_id`
- `thread_id`
- `next_action`
- `default_channel_state`

#### dashboard overview contract

- `relationship_state`
- `last_interaction_at`
- `memory_summary`
- `channel_summary`

#### channel status contract

- `channel`
- `bind_state`
- `last_sync_at`
- `next_step`

#### memory list contract

- `memory_id`
- `type`
- `status`
- `confidence`
- `source_trace_available`

---

## 3. Backlog 总目标

第一阶段前端 backlog 要支撑的核心闭环是：

```text
公开站理解产品
→ 点击 CTA
→ 创建角色
→ 绑定 IM
→ 回到 Dashboard
→ 查看 relationship state / memory / channels
→ 在 IM 中持续互动
→ 回访网站管理长期状态
```

因此 backlog 拆解优先围绕 4 个结果：

1. 公开层可以承接流量并清晰表达差异点
2. 创建与绑定闭环可真实跑通
3. Dashboard 能承担关系控制台角色
4. 前端和底座层/接入层的 contract 清晰稳定

---

## 4. 实施顺序总览

### Phase 0

- 产品壳搭建
- 路由分层
- 鉴权与配置接入
- 可复用能力盘点

状态：已完成

### Phase 1

- 公开层首批页面
- CTA 与基础埋点
- metadata / sitemap / internal linking

状态：已基本完成，剩余项主要在更深的 SEO 扩张与公开层新增主题页

### Phase 2

- `/create`
- `/connect-im`
- `/dashboard`
- `/dashboard/memory`
- `/dashboard/profile`
- `/dashboard/channels`

状态：已完成最小可用版

### Phase 3

- `/features/privacy-controls`
- `/dashboard/privacy`
- Web 补充对话
- 关系轨迹 / 来源上下文 / 线程可见性增强

状态：已部分完成，`/dashboard/privacy`、`/features/privacy-controls`、`Web 补充对话` 与浅版来源 drill-down 已落地

---

## 5. Track A：壳层与基础设施

### A1. 产品层目录与路由骨架

目标：

- 在新产品壳中明确 public routes 与 product routes 的边界

任务：

- 建立 public layer 路由分组
- 建立 auth / protected / dashboard 路由分组
- `/ai-roleplay-chat` 入口页
- 统一 404 / not-found / loading 基础行为

产出：

- 可运行的页面骨架
- 路由清单

依赖：

- 确认采用 `sistine shell + SparkCore capability`

状态：

- 已完成

### A2. 站点配置与品牌占位

目标：

- 统一品牌名、域名、metadata 与 canonical 的来源

任务：

- 引入统一 site config
- 统一 `NEXT_PUBLIC_APP_URL` 读取
- metadata / open graph / sitemap 从配置生成
- 域名文案改为可替换常量

产出：

- site config
- metadata / sitemap 基础实现

状态：

- 已完成

### A3. Auth 与 session 接入

目标：

- 让产品层壳可复用当前用户体系

任务：

- 确认登录、注册、session guard、登出路径
- 明确新壳是否直接复用当前 Supabase auth
- 在 product shell 上接好 protected routes
- 明确未登录访问 `/create`、`/connect-im`、`/dashboard/*` 的行为

产出：

- auth flow 定义
- protected route 行为定义

状态：

- 已完成

### A4. 埋点基础设施

目标：

- 为每个 Phase 的验收事件准备统一埋点口径

任务：

- 定义事件命名规范
- 建立 page view / CTA / form / success 事件封装
- 预留 dashboard return / memory view / bind success 等事件

产出：

- event taxonomy
- 前端埋点 helper

状态：

- 已完成，并已接入 `PostHog + Clarity`

---

## 6. Track B：公开层页面 Backlog

### B1. 首页 `/`

目标：

- 成为品牌主 landing 与全站总入口

模块任务：

- Hero：主张 long memory + IM-native relationship
- Why it matters：为什么不是普通 chatbot
- How it works：Create / Connect / Continue
- Memory & IM 差异点 section
- CTA 导向 `/create`
- FAQ teaser / trust teaser

验收：

- 用户 5 秒内能理解“记得住你 + 在 IM 里持续陪伴”
- CTA 清晰可达

### B2. 品类主线页 `/ai-companion`

目标：

- 承接 companion 总品类意图

模块任务：

- companion 定义
- 长记忆价值
- IM-native 价值
- 与 generic AI chat 的对比
- CTA

### B3. 关系型主线页 `/ai-girlfriend`

目标：

- 承接更强 relationship intent

模块任务：

- 持续关系表达
- remembers our story
- privacy / control / IM continuity
- CTA

注意：

- 表达 relationship，不主动走 explicit adult 方向

### B4. Alternatives 页

页面：

- `/alternatives/character-ai`
- `/alternatives/replika`

目标：

- 承接高商业意图搜索

模块任务：

- comparison hero
- why switch
- memory continuity 对比
- IM-native 对比
- control / privacy 对比
- CTA

状态：

- 已完成第一版 comparison-led alternatives 页面

### B5. 差异页

页面：

- `/features/memory-center`
- `/features/im-chat`
- `/features/privacy-controls`（P1）

目标：

- 分别把三条核心差异点讲清

模块任务：

- feature hero
- mechanism explanation
- screenshots / conceptual diagrams
- CTA to create

状态：

- `/features/memory-center`、`/features/im-chat`、`/features/privacy-controls` 已完成最小版

### B6. 支撑页

页面：

- `/how-it-works`
- `/pricing`
- `/safety`
- `/faq`

目标：

- 提供信任、转化与异议处理

模块任务：

- 按 SparkCore 产品叙事改写内容
- 复用 `sistine` 静态页壳

状态：

- 已完成最小版

---

## 7. Track C：创建与绑定闭环 Backlog

### C1. 创建流程 `/create`

目标：

- 让用户最快拥有一个属于自己的关系角色

页面任务：

- companion / girlfriend 主模式选择
- 角色基础字段表单
- role core 预览卡
- submit / success / error 状态
- 创建成功后自动导向 `/connect-im`

组件任务：

- mode selector
- role core form
- preview summary card
- success state

contract 任务：

- 创建角色输入 contract
- 创建结果返回：role / agent / thread / next action

事件：

- `create_started`
- `create_completed`
- `create_failed`

验收：

- 新用户可在最短路径内完成一次角色创建

状态：

- 已完成最小真流

### C2. IM 绑定 `/connect-im`

目标：

- 打通 IM 主入口

页面任务：

- IM 列表与支持状态
- 当前绑定状态
- 绑定引导区
- 成功/失败/重试态
- 绑定完成后导向 `/dashboard`

组件任务：

- channel selector
- bind instruction panel
- bind status card
- retry / fallback state

contract 任务：

- 获取可绑定 channel 列表
- 获取绑定 token / 指令 / deep link
- 查询绑定状态
- 重绑 / 解绑操作

事件：

- `im_bind_started`
- `im_bind_success`
- `im_bind_failed`

验收：

- 至少一个 IM 平台可跑通真实绑定流程

状态：

- 已完成 Telegram 首个真实绑定流

---

## 8. Track D：Dashboard 与关系控制台 Backlog

### D1. Dashboard 总览 `/dashboard`

目标：

- 让用户一进来就看到“这段关系正在持续”

页面模块：

- relationship summary / relationship state
- 当前角色卡
- 最近互动状态
- 记忆摘要
- channel 状态摘要
- follow-up / next step 摘要
- 快捷入口

组件任务：

- relationship summary card
- current role card
- memory summary widget
- channels widget
- recent activity widget

contract 任务：

- dashboard overview 聚合数据 contract

事件：

- `first_dashboard_view`
- `dashboard_return_view`
- `relationship_summary_view`

状态：

- 已完成最小版，并已加入 relationship summary / next step / recent activity

### D2. 记忆中心 `/dashboard/memory`

目标：

- 成为网站端第一核心模块

页面模块：

- memory list
- 分类/状态筛选
- memory detail drawer 或详情区
- source trace
- hide / incorrect / restore actions
- 记忆说明区

组件任务：

- memory filter bar
- memory card
- memory badge / trust indicator
- memory action bar
- source trace viewer

contract 任务：

- 拉取 memory list
- 拉取 memory source trace
- hide memory
- mark memory incorrect
- restore memory

事件：

- `first_memory_view`
- `memory_action_hide`
- `memory_action_incorrect`
- `memory_action_restore`

备注：

- 优先复用现有 `apps/web` 已有 memory 可见与修正能力

状态：

- 已完成最小版

### D3. 角色资料页 `/dashboard/profile`

目标：

- 承接 Layer A Role Core 的用户可见编辑面

页面模块：

- 基础身份资料
- tone / relationship mode
- proactivity level
- boundaries
- 角色预览摘要

组件任务：

- role identity form
- relationship mode selector
- proactivity slider / selector
- boundary settings card

contract 任务：

- 读取 role core
- 更新 role core

状态：

- 已完成最小版

### D4. 渠道页 `/dashboard/channels`

目标：

- 管理 IM 绑定与关系入口

页面模块：

- channel list
- bind state
- sync state
- actions: bind / rebind / unbind

组件任务：

- channel status list
- channel action menu
- sync health indicator

contract 任务：

- 获取 channel 状态
- bind / unbind / refresh state

状态：

- 已完成最小版

### D5. 隐私页 `/dashboard/privacy`（P1）

目标：

- 提供数据、记忆、关系边界的可控性

页面模块：

- memory control
- privacy explanation
- data boundary summary
- delete / export / disable options（按实际能力接）

contract 任务：

- 先明确系统真实支持的控制项，再设计 UI

状态：

- 已完成最小版

---

## 9. Track E：五层记忆结构对应实现任务

### E1. Layer A：Role Core

前端任务：

- 在 `/create` 与 `/dashboard/profile` 中完成字段映射
- 在 `/dashboard` 中生成 relationship summary

### E2. Layer B：Structured Long-Term Memory

前端任务：

- 以 `/dashboard/memory` 为主承载面
- 支持列表、来源、状态、纠偏操作

### E3. Layer C：Knowledge Layer

前端任务：

- 第一阶段仅在 explainers 或 source context 中弱显式承接
- 暂不独立建一级页面

### E4. Layer D：Thread State

前端任务：

- 在 `/dashboard` 中显式展示当前进行态与跟进状态
- 在 P1 做 relationship timeline / thread continuity 可见性

### E5. Layer E：Recent Raw Turns

前端任务：

- 在 memory source trace 中承接上下文
- 在 P1 的 supplementary chat 中承接原文连续性

---

## 10. Track F：补充对话与线程可见性 Backlog（P1）

### F1. Web 补充对话页

目标：

- 提供同线程补充输入，不改写 IM 主入口定位

页面任务：

- 读取 canonical thread
- 显示 IM → Web 同步消息
- 提供 Web 输入框
- 明示“网页输入不默认反向镜像推送到 IM”

contract 任务：

- thread messages 读取
- web message 写入
- thread state 同步

状态：

- 已完成最小版，页面为 `/dashboard/chat`

### F2. 来源与线程可见性

目标：

- 让用户理解“为什么这条记忆会存在”

页面任务：

- memory trace drill-down
- related turns preview
- thread continuity explanation

状态：

- 已完成浅版 drill-down

---

## 11. Track G：测试与验收 Backlog

### G1. 页面级验收

- Public Layer 页面可正常访问
- 关键 CTA 可达
- Auth / protected 路由行为正确

### G2. 闭环验收

- 可完成角色创建
- 可完成至少一个 IM 绑定
- 可进入 dashboard 并看到 relationship summary
- 可查看并操作 memory
- 可进入 `/dashboard/chat` 并继续同一 canonical thread

状态：

- 已纳入 Playwright smoke 主路径

### G3. 自动化验收

- 为 `create → connect-im → dashboard` 增加 Playwright 冒烟
- 为 memory 中心关键操作增加回归覆盖

### G4. 事件验收

- `landing_cta_click`
- `create_started`
- `create_completed`
- `im_bind_started`
- `im_bind_success`
- `first_dashboard_view`
- `first_privacy_view`
- `first_memory_view`
- `first_supplementary_chat_view`
- `supplementary_chat_send`

---

## 13. 下一批建议优先级

当前建议按以下顺序继续：

1. 深化 `/ai-roleplay-chat` 的定位与转化效率
2. `F2` 深化：继续增强来源 drill-down、continuity context 与 trace depth
3. `C2` 深化：继续降低 IM 绑定门槛，减少手工输入成本
4. 继续扩张 alternatives / category 页面矩阵

---

## 12. 建议的首批开发批次

### Batch 1：产品壳与公开层骨架

- A1
- A2
- A3
- B1
- B6

### Batch 2：公开层核心转化页

- B2
- B3
- B4
- B5（先做 memory / IM）

### Batch 3：创建与绑定闭环

- C1
- C2
- D1
- D4

### Batch 4：关系控制台核心页

- D2
- D3
- E1
- E2
- E4

### Batch 5：P1 增强

- D5
- F1
- F2
- E5

---

## 13. 当前需要先确认的接口清单

在正式实现前，建议优先确认这些 contract：

- 创建角色 contract
- dashboard overview contract
- channel bind/status contract
- memory list contract
- memory trace contract
- role core read/update contract
- thread messages read/write contract（P1）

---

## 14. 当前建议

如果下一步要正式开工，建议先做两件事：

1. 先把新产品壳的路由与基础设施搭起来
2. 再优先打通 `/create → /connect-im → /dashboard`，不要先陷入完整 dashboard 细节

这能最大程度保证第一阶段资源都服务于真实闭环，而不是过早分散到装饰性页面或次级功能上。
