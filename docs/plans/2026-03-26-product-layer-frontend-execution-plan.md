# SparkCore 产品层前端开发执行文档 v0.2

## 1. 文档定位

本文档用于在以下前提已经成立的情况下，定义 SparkCore 第一阶段产品层前端的实现范围、优先级与执行顺序：

- SparkCore 当前整体结构为 **底座层 / 接入层 / 产品层** 三层结构
- 底座层三层重构已完成，运行时、线程状态、记忆系统已具备可消费基础
- 第一阶段产品形态仍以 IM-native 的虚拟伴侣为主
- 网站不作为主聊天工作台，而作为关系控制台、公开转化站与补充对话入口
- 前端将优先借用 `sistine-starter-vibe-to-production` 的工程壳，而不是继承其默认产品定义

本文档目标不是替代 PRD，而是作为产品层前端落地时的执行基线。

### 1.2 当前实现状态（2026-03-26）

截至当前代码状态，产品层前端已经完成了 P0 主闭环的最小可用版，并已落地多块 P1 增强能力与增长承接页：

- Public Layer 基础页已落地：`/`、`/ai-companion`、`/ai-girlfriend`、`/alternatives/character-ai`、`/alternatives/replika`、`/features/memory-center`、`/features/im-chat`、`/how-it-works`、`/pricing`、`/safety`、`/faq`
- Product Layer 主闭环已落地：`/create`、`/connect-im`、`/dashboard`、`/dashboard/memory`、`/dashboard/profile`、`/dashboard/channels`
- P1 已落地：`/dashboard/chat`、`/dashboard/privacy`、`/features/privacy-controls`
- 产品事件已接入统一事件层，并已接入 `PostHog + Clarity`
- `create -> connect-im -> dashboard -> dashboard/privacy -> dashboard/chat` 已纳入 smoke 回归主路径

因此，当前阶段判断应更新为：

- P0 已从“待实现”进入“最小可用版已完成”
- 下一阶段重点不再是继续搭壳，而是继续深化增长承接、来源可见性和转化效率
- 后续实现必须继续守住“网站是关系控制台与补充入口，不是第二个网页聊天工作台”

### 1.1 三层结构约束

前端产品层开发必须明确服从 SparkCore 当前三层结构：

- **底座层 Core Layer**：负责 runtime、role core、memory、session/thread state、scheduler 等核心复用能力
- **接入层 Integration Layer**：负责 Web / IM / 未来 API SDK 等入口接入、消息归一化、绑定与路由
- **产品层 Product Layer**：负责公开站、创建流程、关系控制台、补充型对话体验

对前端实现的直接约束是：

- 产品层页面不能反向侵入底座层定义
- 产品层页面不能把接入层和产品层重新揉成一个“网页聊天大壳”
- 与 IM 绑定、消息同步、通道状态相关的能力，原则上通过接入层 contract 消费
- 与记忆、线程状态、角色核相关的能力，原则上通过底座层 contract 消费

一句话说：

> **产品层负责体验编排，不负责重新发明底座或接入逻辑。**

---

## 2. 当前判断

### 2.1 当前最重要的产品判断

第一阶段要验证的不是“网页 AI 聊天产品是否成立”，而是以下闭环是否成立：

```text
公开站获客/解释差异
→ 创建或领取角色
→ 绑定 IM
→ 在 IM 中持续互动
→ 网站中查看与管理长期记忆、关系设定、隐私与通道
→ 用户复访并回到同一角色继续关系
```

因此，前端产品层的主目标应收口为：

1. 让用户快速理解 SparkCore 的两条核心差异点
2. 让用户顺滑完成“创建角色 + 绑定 IM”的首个关键转化
3. 让网站成为可见、可控、可信的关系控制台
4. 让网站端补充对话能力服务于线程连续性，而不是取代 IM 主入口

### 2.2 当前不应优先做的事

- 不把网站做成完整网页聊天主站
- 不优先做大量角色模板或角色广场
- 不优先做复杂 credits、billing 编排或重 admin
- 不优先做 blog/docs 内容系统扩张
- 不优先做复杂多 Agent 编排 UI
- 不优先做“功能很多”的助理型工作台

---

## 3. 推荐实现路线

### 3.1 三种实现路线

#### 路线 A：延续现有 `apps/web`，在其上渐进产品化

优点：

- 能最快复用现有 chat、memory、auth、thread 基础
- 底层能力接线成本最低

缺点：

- 当前 `apps/web` 的信息架构是能力验证型 workspace，不是产品化网站结构
- 公开层、控制台层、实验型 chat workspace 容易缠在一起
- 后续 SEO、国际化、营销模板重构成本会更高

#### 路线 B：以 `sistine` 为前端产品壳，在 SparkCore 中落产品层

优点：

- 更适合同时承接 marketing shell 与 product shell
- i18n、导航、auth、protected route、static page、sitemap 等基础设施更接近目标形态
- 有利于从第一天就把“公开层”和“控制台层”拆清楚

缺点：

- 需要一轮壳层接入与信息架构改造
- 需要将 SparkCore 底座能力逐步挂接进新的页面结构

#### 路线 C：双轨并行，现有 `apps/web` 继续做能力工作台，同时新建产品站

优点：

- 最稳，研发验证与产品化前端互不阻塞
- 可以保留现有 chat workspace 作为内部运营/测试工具

缺点：

- 初期维护成本更高
- 路由、鉴权、组件复用边界需要尽早定义

### 3.2 推荐结论

建议采用 **路线 C，落地方式偏向路线 B**：

- **对外产品层**：按 `sistine` 的 marketing shell + product shell 思路实现
- **现有 `apps/web`**：短期保留为能力工作台和过渡接线层
- **产品化页面**：逐步把角色创建、绑定、记忆中心、关系控制台迁移到新的产品信息架构

这条路线的核心价值是：

- 不牺牲当前底座验证成果
- 不让旧 chat workspace 反向定义产品层
- 能更自然承接公开站、SEO、控制台、后续移动端迁移

### 3.3 路线 C 的硬边界

如果采用路线 C，必须在执行上写死以下边界：

- `apps/web` 只服务能力验证、内部运营、测试接线与底座/接入层能力观测
- 新产品壳只服务公开层与产品层正式体验
- 不允许同一类产品功能在两个壳中长期并行生长
- 一旦 `/create`、`/connect-im`、`/dashboard/*` 在新产品壳落地，旧壳中的等价产品化页面应停止扩张

否则双轨会退化成“双份产品”，最终同时拖慢产品层和底座层演进。

---

## 4. 产品层信息架构建议

### 4.1 前端应拆成两层

#### A. Public Layer

职责：

- 品牌表达
- SEO 获客
- 差异点解释
- 转化到创建角色/绑定 IM

核心页面：

- `/`
- `/ai-companion`
- `/ai-girlfriend`
- `/ai-roleplay-chat` 的信息架构预留位
- `/alternatives/character-ai`
- `/alternatives/replika`
- `/features/memory-center`
- `/features/im-chat`
- `/how-it-works`
- `/pricing`
- `/safety`
- `/faq`

#### B. Product Layer

职责：

- 创建角色
- 绑定 IM
- 关系管理
- 记忆管理
- 隐私管理
- 渠道管理
- 补充型长对话

核心页面：

- `/create`
- `/connect-im`
- `/dashboard`
- `/dashboard/memory`
- `/dashboard/profile`
- `/dashboard/privacy`
- `/dashboard/channels`
- `/dashboard/chat`

### 4.2 Product Layer 内部模块优先级

#### P0 核心闭环模块

- Auth 与用户会话
- 角色创建/领取
- IM 绑定流程
- Dashboard 总览
- 记忆中心
- 基础关系资料页
- 通道状态页

#### P1 增强信任与连续性模块

- 隐私与记忆控制页
- Web 补充对话页
- IM 历史对话可见性
- 关系轨迹/重要事件视图

#### P2 后续增强模块

- 更多角色模板
- 更细粒度主动性设置
- 多通道扩展
- SEO 扩张页
- 计费/订阅精细化

---

## 5. 页面优先级建议

### 5.1 P0 首批必须上线

#### Public Layer

- `/`
- `/ai-companion`
- `/ai-girlfriend`
- `/alternatives/character-ai`
- `/alternatives/replika`
- `/features/memory-center`
- `/features/im-chat`
- `/how-it-works`
- `/pricing`
- `/safety`
- `/faq`

#### P0 同步预留但不必立即上线

- `/ai-roleplay-chat` 的导航位、内链位、sitemap 结构位

#### Product Layer

- `/login` / `/signup` 或等价鉴权入口
- `/create`
- `/connect-im`
- `/dashboard`
- `/dashboard/memory`
- `/dashboard/profile`
- `/dashboard/channels`

### 5.2 P1 第二批

- `/features/privacy-controls`
- `/dashboard/privacy`
- `/dashboard/chat` 的体验深化与线程可见性增强
- `/ai-roleplay-chat`

### 5.3 P2 后续

- `/ai-boyfriend`
- `/best/ai-companion`
- `/best/ai-girlfriend`
- 更多 alternatives 与 programmatic SEO 页

---

## 6. 页面与能力映射

### 6.1 可以直接借 `sistine` 的部分

- marketing / protected / auth 路由分层思路
- auth 页面壳与会话保护
- navbar / footer / static page / pricing page / sitemap 基础设施
- i18n 路由结构
- 通用表单、容器、基础 UI 组件

### 6.2 可以半借半改的部分

- 首页与营销页骨架
- pricing 信息结构
- protected layout / dashboard layout
- metadata 与 sitemap 生成方式

### 6.3 必须由 SparkCore 自己定义的部分

- 首页叙事与产品定位
- `/create` 的角色创建流程
- `/connect-im` 的绑定体验与状态机
- `/dashboard/memory`
- `/dashboard/profile`
- `/dashboard/privacy`
- `/dashboard/channels`
- Web 补充对话与 IM 同线程但非双向消息镜像的产品表达

---

## 7. 前端功能规划

### 7.1 角色创建

目标：

- 让用户在最短路径内拥有一个“可持续关系”的角色

P0 字段建议：

- `name`
- `archetype`
- `tone`
- `relationship_mode`
- `proactivity_level`
- `boundaries`

P0 交互原则：

- 主模式与公开层叙事保持一致，优先收口为 `companion` / `girlfriend`
- `assistant` 不作为第一阶段公开主模式，可保留为内部能力或 P1 扩展模式
- 优先用单页或短向导完成，不做重型 builder
- 完成创建后直接导向绑定 IM

### 7.2 IM 绑定

目标：

- 把“主聊天在 IM”变成真实可用的第一阶段闭环

P0 内容建议：

- 已支持 IM 列表
- 当前绑定状态
- 绑定指令/二维码/引导步骤
- 失败态与重试态
- 绑定成功后的 next step

当前状态：

- Telegram 首个绑定流已可真实写入 `channel_bindings`
- 这一块当前最大短板已从“能否绑定”转向“绑定流程是否足够顺滑”

### 7.3 Dashboard 总览

目标：

- 让用户一进来就看到“这段关系正在持续”

P0 内容建议：

- relationship summary / relationship state
- 当前角色摘要
- 最近互动状态
- 记忆摘要
- IM 通道状态
- 待处理提醒或跟进摘要
- 快捷入口：记忆中心 / 资料 / 通道

当前状态：

- 已落地 relationship summary / next step / recent activity / follow-up
- 当前重点应从“是否有 dashboard”转向“关系控制台表达是否足够强”

### 7.4 记忆中心

目标：

- 成为网站端第一核心模块，承担信任建立与状态纠偏

P0 能力建议：

- 记忆列表
- 分类筛选
- 记忆可信度或状态标识
- 查看来源上下文
- 修改/隐藏/纠正/恢复
- 基础说明：记忆如何影响关系连续性

当前状态：

- 已接真实 memory list 与基础修正动作
- `/dashboard/privacy` 已补浅版 source drill-down 与可见性说明
- P1 后续再补更强的筛选、trace depth 与 continuity context

### 7.5 角色资料与关系设置

目标：

- 让用户理解“这是同一个角色”，并可控制关系边界

P0 能力建议：

- 角色基础资料
- 语气与关系模式
- 主动性级别
- 角色边界说明
- 基础偏好配置

### 7.6 渠道管理

目标：

- 让用户明确知道自己与角色在哪些通道连着，状态是否正常

P0 能力建议：

- 通道列表
- 绑定状态
- 最近同步状态
- 重绑/解绑入口
- 默认主通道说明

当前状态：

- 已接真实 channel 状态读取
- 已支持重绑入口与 `inactive` 动作

### 7.7 Web 补充对话

建议定位：

- 不是“网页主聊天”
- 而是“同线程补充对话入口”

P1 再做更合适。若在 P0 提前保留，只应以低权重入口存在，并清晰提示：

- 网站输入会影响关系线程与记忆
- 默认不会反向镜像推送成 IM 消息气泡

当前状态：

- `/dashboard/chat` 已落地单线程最小版
- 当前实现只作用于 canonical thread
- 未做 thread list / agent switch / workspace tooling，符合产品层定位

### 7.8 隐私控制页

建议定位：

- 不做伪功能型隐私控制台
- 只展示当前真实存在的控制项
- 以记忆来源可见、可修正、可追溯为第一核心

当前状态：

- `/dashboard/privacy` 已落地
- `/features/privacy-controls` 已落地
- 当前主表达已从“边界说明”推进到“memory source drill-down + 边界说明辅助”

---

## 8. 五层记忆结构的前端映射

当前执行文档虽然以产品层为主，但前端产品设计必须显式考虑 SparkCore 已经形成的五层记忆结构。第一阶段不一定把五层都重做成独立页面，但必须在信息架构上为它们留出正确位置。

### 8.1 Layer A：Role Core

前端对应：

- `/dashboard/profile` 中的角色身份、语气、关系模式、主动性、边界
- Dashboard 总览中的 relationship summary / relationship state
- 创建流程中的初始角色核配置

产品含义：

- 负责让用户持续感知“这是同一个角色”
- 负责承接伴侣关系的连续性，而不只是一次性聊天设定

### 8.2 Layer B：Structured Long-Term Memory

前端对应：

- `/dashboard/memory` 作为主承载页
- 记忆列表、分类筛选、状态标识、来源查看、纠正/隐藏/恢复
- 与关系长期状态相关的高价值沉淀展示

产品含义：

- 是网站端第一核心模块
- 是“记得住我 / 记得我们”的主要可见表达

### 8.3 Layer C：Knowledge Layer

前端对应：

- 第一阶段默认不作为显式一级页面
- 仅在差异页、解释页或部分来源说明中做轻量表达
- 若后续出现知识包、世界观或资料卡，再评估是否单独暴露

产品含义：

- 当前更偏隐性支撑层
- 不应在第一阶段把用户注意力从“关系连续性”拉向“知识库产品”

### 8.4 Layer D：Thread State / Thread Compaction

前端对应：

- Dashboard 总览中的当前进行态、最近互动状态、待跟进事项
- relationship summary / relationship state
- 后续 P1 的关系轨迹、follow-up、线程连续性可见表达

产品含义：

- 这是“当前我们进行到哪里了”的界面承载层
- 必须与长期记忆区分，不可混为同一类信息

### 8.5 Layer E：Recent Raw Turns

前端对应：

- Web 补充对话页
- 记忆来源上下文查看
- IM 历史对话的同步可见性

产品含义：

- 负责高保真原文承接
- 主要用于回看、溯源和补充，而不是重新定义网站为主聊天入口

### 8.6 前端映射原则

- 不把五层直接做成五个用户可见标签页
- 要把五层映射到用户能理解的产品语言
- 记忆中心重点承接 Layer B
- Dashboard 总览重点承接 Layer A + Layer D
- Web 补充对话与来源查看重点承接 Layer E
- Layer C 在第一阶段保持弱显式存在

---

## 9. 品牌名与域名占位策略

当前域名尚未最终确定，因此前端产品层应采用统一占位策略，避免后续在页面、SEO 配置、metadata 和 sitemap 中产生大面积替换成本。

### 9.1 当前建议

- 品牌主名占位：`SparkCore`
- 域名占位：`sparkcore.xxx` 或 `spark.xxx`
- 默认站点地址统一通过配置读取，不在页面代码中写死真实域名

### 9.2 技术约束

- `NEXT_PUBLIC_APP_URL` 作为站点基准地址来源
- metadata / canonical / open graph / sitemap 一律从统一配置生成
- 文案中出现域名时使用可替换常量，不散落在页面组件中

### 9.3 执行含义

- 当前可以直接用占位名推进设计与开发
- 等最终域名确定后，再统一替换配置与品牌文案
- 路由结构、页面信息架构、埋点命名不依赖最终域名决策

---

## 10. 建议执行阶段

### Phase 0：前端产品壳准备

目标：

- 确认产品层的路由、信息架构与技术承载方式

任务：

- 确认采用 `sistine shell + SparkCore capability` 的总体方案
- 确认产品层目录结构与路由分组
- 确认 i18n、metadata、sitemap、auth 的接入方式
- 盘点现有 `apps/web` 可复用的 chat/memory/auth 接口

交付物：

- 产品层路由骨架
- 页面清单
- 复用/重做映射表

状态：

- 已完成

### Phase 1：公开层上线

目标：

- 完成首批 SEO/转化页，建立品牌与差异点表达

任务：

- 首页
- `/ai-companion`
- `/ai-girlfriend`
- `/alternatives/character-ai`
- `/alternatives/replika`
- `/features/memory-center`
- `/features/im-chat`
- `/how-it-works`
- `/pricing`
- `/safety`
- `/faq`

验收标准：

- 页面结构完整
- 转化入口清晰导向 `/create`
- 基础 metadata / sitemap / internal linking 可用
- 首批关键事件具备埋点口径：
  - `landing_cta_click`
  - `create_started`

### Phase 2：产品闭环上线

目标：

- 打通“创建角色 → 绑定 IM → Dashboard 管理”的主闭环

任务：

- `/create`
- `/connect-im`
- `/dashboard`
- `/dashboard/memory`
- `/dashboard/profile`
- `/dashboard/channels`

验收标准：

- 用户可完成首个角色创建
- 用户可完成至少一个 IM 绑定流程
- 用户可在 Dashboard 中看到角色、记忆、通道状态
- 首批闭环事件具备埋点与验收口径：
  - `create_completed`
  - `im_bind_started`
  - `im_bind_success`
  - `first_dashboard_view`
  - `first_memory_view`

### Phase 3：信任与连续性增强

目标：

- 让关系型产品的“可控、连续、可信”体验站稳

任务：

- `/features/privacy-controls`
- `/dashboard/privacy`
- Web 补充对话入口
- 对话/关系轨迹可见性增强

验收标准：

- 用户能主动控制记忆与隐私边界
- 用户能理解网站与 IM 的职责关系
- 产品体验不被误解为普通网页 chatbot
- 关系控制台关键回访信号具备基础观察口径：
  - `dashboard_return_view`
  - `relationship_summary_view`
  - `privacy_controls_view`

---

## 11. 建议任务拆解

### 9.1 Track A：壳层与基础设施

- 路由结构重组
- auth / session 对接
- layout / navbar / footer / dashboard shell
- metadata / sitemap / i18n

### 9.2 Track B：公开层页面

- 首页信息架构
- companion/girlfriend/alternatives/feature 页面模板
- pricing / faq / safety 等静态页

### 9.3 Track C：产品层核心闭环

- create flow
- connect-im flow
- dashboard overview
- channels page

### 9.4 Track D：记忆与关系控制台

- memory center UI
- profile / relationship settings
- privacy controls
- thread visibility / supplementary web chat

### 9.5 Track E：接线与验证

- 前端与 SparkCore runtime / memory / channel 状态接口接线
- 首条转化路径验收
- Playwright 冒烟覆盖补齐

---

## 12. 关键依赖

前端产品层推进前，需要同步确认以下依赖：

- 当前可对外消费的 auth 方案
- 角色创建所需的后端 contract
- IM 绑定状态与操作 contract
- 记忆中心读取/修改 contract
- Dashboard 总览聚合接口
- 是否沿用当前 `apps/web` Supabase 体系，还是在新产品壳中统一接入

---

## 13. 主要风险

### 11.1 最大风险

把产品层继续做成“更漂亮的 chat workspace”。

这会导致：

- 公开层与控制台层不清
- IM-native 产品定位被稀释
- 记忆中心与关系控制台的重要性被聊天窗口抢走

### 11.2 次级风险

- 过早做太多模板和场景页，分散核心闭环资源
- 过早接入与 MVP 无关的 credits/billing/admin 复杂度
- 公开层先行但 `/create` 和 `/connect-im` 转化闭环没跟上

---

## 14. 当前推荐优先级

如果按“最小但正确的产品层”推进，建议当前优先级为：

1. 先定产品层技术承载与路由结构
2. 先做公开层首批页面，建立定位与转化入口
3. 紧接着做 `/create` 与 `/connect-im`
4. 然后做 `/dashboard/memory`、`/dashboard/profile`、`/dashboard/channels`
5. 最后补 `/dashboard/privacy` 与 Web 补充对话

---

## 15. 建议的下一个动作

进入实现前，建议先再确认 1 个关键决策：

> 产品层前端是直接在当前 `apps/web` 中重构，还是以 `sistine` 的结构为主建立新的产品壳，再逐步接 SparkCore 能力。

本文档当前推荐答案是：

> **以 `sistine` 结构为产品壳，保留现有 `apps/web` 作为过渡能力工作台，再逐步完成产品层迁移。**
