# 2026-03-28 产品控制台任务文档

## 1. 文档目标

本文档用于锁定 SparkCore 产品控制台的新信息架构、页面职责、字段边界与实施任务，作为后续前端重构与产品层收口的执行依据。

当前版本不再死守“先有底层层级，再映射到页面”，而是以用户任务为先，再把底层能力放到合适的位置。

本次锁定基于以下前提：

- 控制台一级分页调整为 `Chat` / `Role` / `Knowledge` / `Channels` / `Settings`
- `New Role` 暂不进入一级导航，继续保留在 `/create` 中，并在控制台内以弱入口存在
- 交互组织可参考 `doc_private/product/ai_studio_code.html` 与 nomi.ai 的产品布局
- 视觉样式必须沿用 SparkCore 当前改版后的设计语言，不回退到 html 原型或 nomi 的配色与品牌表现
- 页面表达优先使用用户能理解的语言，不把底层字段名、状态枚举或系统术语直接暴露给用户
- 字段与交互逻辑优先服从用户使用体验，而不是后台能力暴露完整性

---

## 2. 核心原则

### 2.1 用户任务优先

一级分页首先回答用户正在做什么，而不是系统内部有哪些模块：

- `Chat`：我现在怎么继续和 TA 互动？
- `Role`：TA 是谁，这段关系已经积累了什么？
- `Knowledge`：TA 可以参考哪些资料和设定？
- `Channels`：这段关系接到了哪些现实通道？
- `Settings`：我的账户和系统偏好如何配置？

### 2.2 视觉语言不重做

允许借鉴 html 原型与 nomi 的交互组织方式，但以下部分保持现有 SparkCore 改版后的设计语言：

- 左侧导航结构
- 顶部页头与按钮体系
- 卡片样式、字体系统、圆角、边框、状态色
- 整体页面节奏与留白

不做以下方向：

- 不复用 nomi 的紫白品牌色方案
- 不回退到 html 原型中的传统 Tailwind demo 风格
- 不将控制台做成另一套视觉系统

### 2.3 保持简洁明了

页面设计必须优先服务“看得懂、用得顺手”，而不是“字段最全”。

默认展示内容应尽量只回答四个问题：

- 当前是谁
- 当前状态怎样
- 接下来该做什么
- 改这个会影响什么

默认不展示：

- 内部状态码
- 过深的枚举词
- 没有行动意义的底层字段
- 需要理解系统设计才能看懂的术语

### 2.4 低频能力不抢主线

- `Chat` 必须是默认落点
- `Role` 承载角色与长期关系资产
- `Knowledge` 承载资料与设定库
- `Channels` 承载 IM 绑定与通道状态
- `Settings` 只承载账户级与系统级偏好

低频动作处理原则：

- `New Role` 为弱入口
- 大模型选择、订阅、账号与偏好都进入 `Settings`
- 不把低频配置动作挤进 `Chat` 主场

---

## 3. 底层能力到页面的映射原则

## 3.1 五类核心能力

从 SparkCore 当前底层结构看，面向控制台的核心能力可归纳为五类：

- 角色层
- 长记忆结构层
- 知识库层
- 线程状态层
- 聊天原文层

但这五类能力不应该机械地对应五个平级管理页。

## 3.2 映射结论

### Chat

承载：

- 聊天原文层
- 当前线程的即时状态

### Role

承载：

- 角色层
- 长记忆结构层
- 与最近关系连续性相关的线程状态

### Knowledge

承载：

- 知识库层

### Channels

承载：

- IM 绑定与通道运行状态

### Settings

承载：

- 账户、订阅、模型、偏好

### Global status

不作为一级分页，作为跨页轻提醒存在：

- 当前角色是谁
- 是否 IM live
- 是否有记忆待修正
- 是否有通道异常

## 3.3 线程状态层拆分规则

线程状态层不单独做一个一级分页，而是拆分后放入不同位置：

### 放入 Role 的部分

这些信息本质上属于“关系连续性状态”：

- 当前 canonical thread
- continuity 状态
- lifecycle 状态
- 最近互动时间
- 当前关系是否稳定
- follow-up 是否开始影响关系节奏

### 放入 Channels 的部分

这些信息本质上属于“通道运行状态”：

- IM live / web only
- 当前 active binding
- 平台
- last sync
- 是否需要 rebind

### 放入 Chat 的部分

这些信息本质上属于“当前线程即时状态”：

- 当前 thread 是否稳定
- follow-up pressure
- focus mode
- 当前语言提示
- 最近消息来源分布

### 不放入 Settings 的部分

线程状态默认不进入 `Settings`，避免 `Settings` 再次变成大杂烩。

---

## 4. 一级信息架构

### 4.1 一级分页

- `Chat`
- `Role`
- `Knowledge`
- `Channels`
- `Settings`

### 4.2 导航定义

建议左侧导航文案如下：

- `Chat`
  Continue the current relationship thread
- `Role`
  Define the companion and review relationship memory
- `Knowledge`
  Manage the sources the companion can draw from
- `Channels`
  Connect and maintain IM paths
- `Settings`
  Account, subscription, model, and preferences

### 4.3 页面边界

#### Chat

- 负责继续当前 canonical thread
- 负责展示聊天原文
- 负责展示即时 thread 状态
- 不负责角色核心配置
- 不负责完整 memory repair
- 不负责完整 IM 绑定流程

#### Role

- 负责角色定义与关系资产查看
- 负责长记忆的查看、修正、恢复
- 负责展示关系连续性相关状态
- 不负责知识库资料管理
- 不负责渠道绑定流程主操作
- 不负责账户级偏好

#### Knowledge

- 负责上传、管理、启停知识资料
- 负责展示资料来源与更新时间
- 负责知识库与角色的关联关系
- 不负责聊天原文
- 不负责关系记忆修复
- 不负责账号与订阅

#### Channels

- 负责绑定、重绑、停用 IM 通道
- 负责呈现通道运行状态
- 不负责角色设定
- 不负责账户级设置

#### Settings

- 负责账户、订阅、模型、偏好
- 不负责角色定义
- 不负责关系记忆修复
- 不负责渠道绑定主流程

---

## 5. 页面定义与用户可见内容

## 5.1 Chat

### 5.1.1 页面定义

`Chat` 是用户进入控制台后的默认首页，也是关系发生的主场。

页面目标：

- 让用户立刻知道当前在和谁互动
- 让用户知道当前线程是否稳定、是否已接 IM
- 让用户能最低阻力地继续一轮对话
- 在需要时自然跳转到 `Role`、`Knowledge` 或 `Channels`

### 5.1.2 页面结构

建议结构从上到下为：

1. 顶部页头
2. 当前关系轻状态条
3. 消息列表
4. 输入区

顶部页头建议包含：

- 当前角色名
- 当前线程标题
- 当前 IM 状态
- 跳转到 `Role`
- 跳转到 `Channels`

轻状态条建议只保留用户看得懂的状态词：

- `Thread stable`
- `Needs attention`
- `IM live`
- `Web only`

### 5.1.3 推荐展示字段

首屏优先展示：

- 当前角色名
- 当前线程标题
- 是否 IM live
- 是否存在待跟进压力
- 消息内容
- 消息来源标记

可以在二级展开区展示：

- focus mode
- 当前语言提示
- 更细的 thread runtime 信息

### 5.1.4 对应底层字段

底层依赖可包括：

- `active_role_name`
- `current_thread_title`
- `channel_summary.active`
- `channel_summary.platforms`
- `follow_up_summary.pending_count`
- `thread_state.focus_mode`
- `thread_state.current_language_hint`
- `messages[]`

但这些字段不需要直接以底层名称对外呈现。

### 5.1.5 关键交互

- 在输入框发送消息到当前 canonical thread
- 在消息流中识别 Web / IM 来源
- 从页头跳转到 `Role`
- 从页头跳转到 `Channels`

### 5.1.6 页面文案建议

- 标题：`Chat`
- 副标题：`Continue in the current relationship thread.`
- 空状态：`No relationship thread yet. Create a role and start the first conversation.`

---

## 5.2 Role

### 5.2.1 页面定义

`Role` 是角色与长期关系资产总页。

页面目标：

- 让用户知道当前角色是谁
- 让用户知道长期关系正在被什么定义
- 让用户看到系统记住了什么
- 让用户理解当前关系是否稳定
- 让用户在同一页内完成角色修正与记忆修正

### 5.2.2 页面结构

建议分成四个区块：

1. `Profile`
2. `Relationship memory`
3. `Relationship state`
4. `Role switch / new role`

#### Profile

用于编辑当前角色的稳定特征与长期行为定义。

#### Relationship memory

用于查看和修正当前角色相关的长期记忆与关系结构信息。

#### Relationship state

用于展示当前关系连续性，而不是展示所有 thread runtime 细节。

#### Role switch / new role

用于切换角色，弱化呈现 `New Role` 入口。

### 5.2.3 推荐展示字段

首屏优先展示：

- 当前角色名
- 角色摘要
- tone / mode / relationship mode
- 当前 thread
- 当前关系是否稳定
- 是否有记忆待修正项

次级展示：

- system prompt preview
- confidence
- source trace
- 其他角色

### 5.2.4 对应底层字段

#### 角色层

- `role.name`
- `role.config.mode`
- `role.config.tone`
- `role.config.relationship_mode`
- `role.config.proactivity_level`
- `role.config.boundaries`
- `role.persona_summary`
- `role.system_prompt_preview`

#### 长记忆结构层

- `memory_summary.active`
- `memory_summary.hidden`
- `memory_summary.incorrect`
- `memory_items[]`
- `memory_item.content`
- `memory_item.category_label`
- `memory_item.status_label`
- `memory_item.source_thread_title`

#### 关系连续性层

- `current_thread_title`
- `relationship_state`
- `thread_state.lifecycle_status`
- `follow_up_summary.pending_count`
- `last_interaction_at`

### 5.2.5 关键交互

- 编辑角色名称
- 编辑 mode / tone / relationship mode / proactivity
- 编辑 boundary note
- 保存角色设置
- 查看记忆内容
- 查看来源 thread
- 隐藏记忆
- 标记 incorrect
- 恢复 hidden / incorrect memory
- 切换 active role
- 弱跳转到 `/create`

### 5.2.6 页面文案建议

- 标题：`Role`
- 副标题：`Define who this companion is and review what the relationship remembers.`

---

## 5.3 Knowledge

### 5.3.1 页面定义

`Knowledge` 用于承载知识库层。

页面目标：

- 让用户知道这个 companion 可以参考哪些资料
- 让用户上传、启停和整理资料
- 让用户理解这些资料属于“知识输入”，不是“关系记忆”

### 5.3.2 页面结构

建议分为三个区块：

1. `Knowledge overview`
2. `Sources`
3. `Role scope`

### 5.3.3 推荐展示字段

首屏优先展示：

- 已启用资料数量
- 最近更新资料
- 当前角色可使用哪些资料
- 是否有未完成索引或失效资料

默认不强调：

- 检索技术参数
- embedding / 分段等实现细节

### 5.3.4 对应底层字段

后续建议抽象如下字段：

- `knowledge_sources[]`
- `source.id`
- `source.title`
- `source.type`
- `source.status`
- `source.updated_at`
- `source.segment_count`
- `source.enabled`
- `source.role_scope`

### 5.3.5 关键交互

- 上传资料
- 新增知识源
- 启用 / 停用知识源
- 删除知识源
- 查看某资料绑定到哪些角色

### 5.3.6 页面文案建议

- 标题：`Knowledge`
- 副标题：`Manage the sources this companion can draw from.`

---

## 5.4 Channels

### 5.4.1 页面定义

`Channels` 用于承载当前关系的现实通道管理。

页面目标：

- 让用户知道当前是否已有 live IM path
- 让用户知道当前关系连接到了哪个通道
- 让用户可以继续绑定、重绑或停用错误通道

### 5.4.2 页面结构

建议分为三个区块：

1. `Connection overview`
2. `Active binding`
3. `Binding catalog`

### 5.4.3 推荐展示字段

首屏优先展示：

- 是否 IM live
- 当前 live platform
- 当前绑定角色
- 当前绑定 thread
- 是否需要重新绑定

默认折叠或弱化展示：

- 非当前关系的旧 binding
- 过多 peer/channel 技术细节

### 5.4.4 对应底层字段

- `channel_summary.active`
- `channel_summary.total`
- `channel_summary.platforms`
- `bindings[]`
- `binding.platform`
- `binding.status`
- `binding.channel_id`
- `binding.peer_id`
- `binding.agent_name`
- `binding.thread_title`
- `binding.last_sync_at`

### 5.4.5 关键交互

- 打开 connect flow
- 重绑当前 role / thread
- 将旧 binding 设为 inactive
- 查看其他平台与旧 binding

### 5.4.6 页面文案建议

- 标题：`Channels`
- 副标题：`Connect this relationship to the right IM path and keep channel state clear.`

---

## 5.5 Settings

### 5.5.1 页面定义

`Settings` 是账户级与系统级偏好页。

页面目标：

- 让用户管理自己的账户
- 让用户管理订阅与额度
- 让用户配置模型偏好
- 让用户配置应用偏好

这里不再承载角色级与关系级能力。

### 5.5.2 页面结构

建议分成五个设置区块：

1. `Account`
2. `Subscription`
3. `Model preferences`
4. `App preferences`
5. `Danger zone`

### 5.5.3 推荐展示字段

优先展示：

- 当前账号
- 当前套餐
- 当前模型策略
- 最常改的界面偏好

弱化展示：

- 低频危险操作
- 不常改的技术设置

### 5.5.4 对应底层字段

- `email`
- `login_method`
- `session_length`
- `plan_name`
- `plan_status`
- `quota_messages`
- `model_provider`
- `model_name`
- `theme`
- `notification_enabled`

### 5.5.5 关键交互

- 修改账户信息
- 管理订阅
- 切换模型偏好
- 修改界面与消息偏好
- 登出全设备
- 删除账号

### 5.5.6 页面文案建议

- 标题：`Settings`
- 副标题：`Manage your account, subscription, model preferences, and app behavior.`

---

## 6. 页面间跳转关系

### 6.1 主跳转

- 默认进入 `Chat`
- 从 `Chat` 跳到 `Role`
- 从 `Chat` 跳到 `Knowledge`
- 从 `Chat` 跳到 `Channels`
- 从 `Role` 跳回 `Chat`
- 从 `Channels` 打开 `connect-im`
- 从 `Role` 弱跳转到 `/create`

### 6.2 次跳转

- `Role` 内 memory source trace 可跳原 thread
- `Knowledge` 可跳到某角色的知识范围
- `Settings` 不作为主场跳转起点，只做外围配置

### 6.3 不推荐跳转

- 不在 `Settings` 里放角色编辑入口
- 不在 `Chat` 首屏塞大段设置表单
- 不在 `Channels` 中塞订阅或模型配置
- 不把 thread 状态做成独立一级页

---

## 7. 与现有 SparkCore 能力映射

### 7.1 Chat

可复用现有能力：

- `loadProductSupplementaryChatPageData`
- `loadDashboardOverview`
- `SupplementaryChatThread`

### 7.2 Role

可复用现有能力：

- `loadProductProfilePageData`
- `loadProductMemoryPageData`
- `updateProductRoleProfile`
- `hideProductMemory`
- `markProductMemoryIncorrect`
- `restoreProductMemory`
- `loadDashboardOverview` 中与关系连续性相关的部分

### 7.3 Knowledge

现阶段能力待补，但产品层边界应先锁定：

- 知识源列表加载
- 资料上传与状态
- 角色知识范围映射

### 7.4 Channels

可复用现有能力：

- `loadOwnedChannelBindings`
- `unbindProductChannel`
- `/connect-im`

### 7.5 Settings

现有能力部分具备、部分待补：

- 账户与 session 信息已有基础
- 订阅能力待产品层明确
- 模型偏好能力可从原型与现有底层抽象先锁字段
- 偏好页可先做占位与轻实现

---

## 8. 实施任务拆解

## 8.1 Track A：导航与路由收口

目标：

- 将当前控制台收口为五个一级分页

任务：

- 左侧导航改为 `Chat` / `Role` / `Knowledge` / `Channels` / `Settings`
- 弱化 `New Role`，不进入一级导航
- 重新梳理 `/app` 默认跳转逻辑
- 明确 `/app/[roleId]` 在新结构中的归属

产出：

- 新导航配置
- 新路由映射表

## 8.2 Track B：Chat 页收口

目标：

- 把 `Chat` 明确为默认主场

任务：

- 保留当前消息流与输入区主能力
- 收敛顶部信息，仅保留必要关系状态
- 将即时 thread 状态做成轻量 inspector，而不是一整页
- 增强 `Role` / `Knowledge` / `Channels` 快捷跳转

产出：

- 新版 `Chat` 首屏

## 8.3 Track C：Role 页收口

目标：

- 将角色层、长记忆结构层与关系连续性信息合并成单页

任务：

- 将 role profile 区块与 relationship memory 区块合并到 `Role`
- 增加 relationship state 区块
- 加入弱 `New Role` 入口
- 保留 memory repair 主动作

产出：

- 新版 `Role` 页

## 8.4 Track D：Knowledge 页建立

目标：

- 给知识库层一个清晰、可理解的独立入口

任务：

- 新建 `Knowledge` 路由与导航入口
- 定义 knowledge overview / sources / role scope 三段结构
- 先做空状态与占位，再逐步接真实资料能力

产出：

- 新版 `Knowledge` 页

## 8.5 Track E：Channels 页独立

目标：

- 让 IM 绑定与通道状态变成单独一级能力页

任务：

- 输出连接总览、active binding、binding catalog 三段
- 打通 connect / rebind / inactive 操作
- 把与通道状态相关的提醒放在这里，而不是塞进 `Settings`

产出：

- 新版 `Channels` 页

## 8.6 Track F：Settings 页外围化

目标：

- 将 `Settings` 严格收口为账户与系统偏好

任务：

- 从现有 settings 中移除 role / memory / channels 内容
- 保留 account / subscription / model / preferences / danger zone
- 对未落地能力先做清晰占位，不伪装成已完成

产出：

- 新版 `Settings` 页

## 8.7 Track G：文案与空状态统一

目标：

- 让五分页一眼可懂

任务：

- 统一标题与副标题句式
- 统一空状态文案
- 统一按钮命名，使用任务导向文案
- 把底层状态翻译成用户能理解的文案
- 统一状态 pill 逻辑与语义

产出：

- 页面文案表
- 状态命名表

---

## 9. 暂不处理项

以下内容本轮不进入主任务范围：

- 多角色完整资产管理页大改
- `New Role` 提升为一级入口
- 重新定义公开站与控制台之间的视觉品牌体系
- 大模型配置的深层高级参数面板
- 多平台渠道复杂策略编排
- 将 thread state 做成独立一级分页

---

## 10. 验收标准

本轮重构完成后，应满足以下标准：

- 用户进入控制台后，能在 3 秒内理解五个分页各自做什么
- `Chat` 明确成为默认主场
- `Role` 明确承载角色定义、长期记忆与关系连续性
- `Knowledge` 明确承载资料与设定库
- `Channels` 明确承载 IM 绑定与通道状态
- `Settings` 明确只承载账户与系统偏好
- 页面间不存在明显职责重叠
- 线程状态不再以一个生硬的独立管理页出现
- 文案表达对非技术用户足够简洁明了
- 视觉仍然连续属于当前 SparkCore 改版后的设计语言

