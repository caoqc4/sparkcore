> 当前状态：过渡任务库。本文档保留旧功能架构下的任务拆解，部分任务仍可复用，但不作为当前 Phase 1 主线的直接开发排期。
# 多 Agent 长记忆 IM 接入底座
## 开发任务拆解 v1.4.1（模型路由增强整合版）

> 文档定位：  
> 本文档用于把整合 PRD v1.2 与技术方案 v1.3.1（模型路由增强版）进一步拆成可执行任务。  
> 输出形式参考：Epic → Feature → Story → 优先级 → 依赖 → 验收条件。  
> 默认以 **MVP 首发：虚拟伴侣 + 长记忆 + Web Chat + Telegram + 单/多 Agent 基础能力 + 基础模型路由** 为核心目标。

---

# 1. 文档目标

## 1.1 拆解目标
把项目拆成：
- 可以独立推进的模块
- 可以明确验收的任务
- 可以按优先级排序的工作包
- 可以兼容“你自己先做 + 后续找开发协作”的执行方式

## 1.2 优先级定义
- **P0**：MVP 必做，不做就无法上线或无法验证核心价值
- **P1**：上线前强烈建议做，明显影响体验、可维护性和扩展性
- **P2**：可延后，属于增强项或为第二阶段铺路

## 1.3 当前默认技术路线
- 前端：Next.js
- 部署：Vercel
- 主库：Supabase Postgres
- 向量：pgvector
- 鉴权：Supabase Auth
- 文件存储：Supabase Storage 或 R2
- 模型网关：LiteLLM
- Runtime：LangGraph
- 长期记忆：Mem0
- 模型路由：default model + routing policy + runtime decision logs
- 后续兼容：Docker Compose / 自建 Postgres / S3-compatible

---

# 2. 里程碑总览

# Milestone 0：工程骨架打通
目标：
- 跑通前后端基础链路
- 跑通数据库
- 跑通模型调用
- 跑通最小单 Agent 聊天链路

结果：
- 有内部 demo
- 可以本地/预览环境完成一轮文本聊天

# Milestone 1：MVP 核心闭环
目标：
- 跑通虚拟伴侣首发场景
- 跑通 profile / session / relationship 三层记忆
- 跑通 Web Chat
- 跑通 Telegram 绑定
- 跑通平台模型与 BYOK
- 跑通基础多模态：文本 + 语音 + 图片理解
- 跑通基础模型路由：不同 agent 不同模型；同一 agent 按模态/复杂度切换模型

结果：
- 有首个可外部测试版本

# Milestone 2：平台增强
目标：
- 跑通 forum / 多 Agent 最小模式
- 跑通知识包系统
- 跑通记忆中心
- 跑通基础管理后台
- 跑通基础风控与审计
- 跑通模型路由配置与决策日志查看

结果：
- 有可持续迭代的公开测试版

# Milestone 3：开源与自部署兼容
目标：
- 输出 `.env.example`
- 输出 migration / seed
- 输出 adapter 抽象
- 输出最小自部署说明
- 补 Docker Compose 方案

结果：
- 可作为开源底座发布首版

---

# 3. MVP 范围收口

## 3.1 本版必须做到
- 单 Agent 运行模式
- Web Chat
- Telegram 接入
- 长期记忆热写入 + 冷整理 + 召回闭环
- 角色系统（persona）
- 模型配置（平台模型 / BYOK）
- 基础模型路由
- 语音输入输出
- 图片理解
- 记忆中心基础版
- 轻部署上线能力

## 3.2 本版建议尽量做到（但不作为 MVP 首发阻塞项）
- 多 Agent forum 最小运行模式
- 基础后台
- 知识包与资产系统
- 模型路由配置与决策日志查看

## 3.3 Runtime 范围说明
当前任务拆解默认覆盖的是 **Collaboration Runtime**，即：

- 单 Agent 对话
- 多 Agent forum
- moderator / 结构化讨论
- 任务型流程与关系型场景

**Simulation Runtime**（生态演化型 runtime）当前仅做架构预留，不纳入首版 MVP 与近期执行批次。  
待后续进入 world state、event loop、persistent agents 等场景时，再单独进入正式开发排期。

## 3.4 本版明确不做满
- 微信首发主路径
- 图谱记忆默认开启
- 世界模拟 / 游戏世界状态机
- 复杂企业权限体系
- 大规模渠道矩阵
- 复杂角色社区 / 商店
- 完整金融 / 医疗行业模板
- 高级成本优化路由
- 自动学习型模型调度

---

# 4. Epic 总表
> 说明：  
> 当前 Epic 主体均围绕 **Collaboration Runtime** 展开。  
> 生态演化型 **Simulation Runtime** 目前不单独立为首版正式 Epic，仅作为后续 runtime 演进方向预留。

- **EPIC-00** 工程骨架与环境配置
- **EPIC-01** 账户、鉴权与工作空间
- **EPIC-02** 角色系统（Persona）
- **EPIC-03** 场景系统（Scenes）
- **EPIC-04** 聊天与线程系统（Threads / Messages）
- **EPIC-05** 单 Agent Runtime
- **EPIC-06** 多 Agent Forum Runtime
- **EPIC-07** 长期记忆系统（Memory OS）
- **EPIC-08** 模型网关、模型配置与模型路由
- **EPIC-09** 多模态能力
- **EPIC-10** 知识包与资产系统
- **EPIC-11** 渠道接入（Web / Telegram）
- **EPIC-12** 记忆中心与用户设置
- **EPIC-13** 管理后台与安全治理
- **EPIC-14** 计费与用量
- **EPIC-15** 开源与自部署兼容
## Runtime 演进预留说明

当前项目首版聚焦 **Collaboration Runtime**。  
以下 Reserved Epic 中，有一部分不仅服务于当前主线的能力预留，也服务于未来 **Simulation Runtime** 的扩展基础。

其中尤其相关的预留模块包括：
- Event / Trigger Layer
- Evaluation / Observability Layer
- Shared State / World State Layer

这些模块当前不进入首版强制开发排期，但会作为后续 Simulation Runtime 的重要基础设施。
- **EPIC-16（Reserved）** Skills Layer  
- **EPIC-17（Reserved）** Event / Trigger Layer
- **EPIC-18（Reserved）** Evaluation / Observability Layer
- **EPIC-19（Reserved）** Shared State / World State Layer

---

# 5. 详细任务拆解

# EPIC-00 工程骨架与环境配置

## 目标
建立可持续开发的最小工程骨架。

## Feature 00-1：Monorepo / Repo 结构初始化
### Stories
- [P0] 初始化代码仓库结构
- [P0] 约定 `app / packages / docs / scripts` 基础目录
- [P1] 配置 lint / format / typecheck / pre-commit hooks
- [P1] 配置环境变量管理方式

### 依赖
无

### 验收条件
- 本地可一键启动开发环境
- 提交代码前可自动进行基础校验
- README 有最小启动说明

## Feature 00-2：基础配置
### Stories
- [P0] 建立 `.env.example`
- [P0] 配置 Vercel 项目环境变量
- [P0] 建立 Supabase 项目连接配置
- [P1] 配置日志与错误追踪框架
- [P2] 配置基础 feature flag 机制

### 验收条件
- 新环境可按文档完成配置
- 本地 / 预览 / 线上三套环境变量边界清晰

---

# EPIC-01 账户、鉴权与工作空间

## 目标
支持用户登录与基础隔离，为后续角色、记忆、渠道绑定提供归属关系。

## Feature 01-1：用户鉴权
### Stories
- [P0] 接入 Supabase Auth
- [P0] 支持邮箱登录 / 第三方登录（二选一先做一种）
- [P0] 登录态在 Web 端可持久化
- [P1] 支持游客试用模式
- [P2] 支持账号合并逻辑

### 验收条件
- 用户可成功注册 / 登录 / 退出
- 登录后可进入 `/app`
- 未登录用户访问核心页会被正确拦截

## Feature 01-2：工作空间
### Stories
- [P0] 创建默认个人 workspace
- [P0] 所有 agent / memory / scene / asset / model profile / routing policy 都归属到 workspace
- [P1] 预留 team workspace 表结构
- [P2] 支持多人协作 workspace

### 验收条件
- 新用户注册后自动拥有默认 workspace
- 业务数据具备明确 workspace 归属

---

# EPIC-02 角色系统（Persona）

## 目标
建立角色初始化能力，并与长期记忆严格分离。

## Feature 02-1：预设角色模板
### Stories
- [P0] 建立 persona_packs 表
- [P0] 提供至少 2 个预设角色模板
- [P0] 支持从模板创建角色实例
- [P1] 支持模板分类（伴侣 / 研讨 / 分析）
- [P2] 支持角色模板导入导出

### 验收条件
- 用户可以从模板一键创建角色
- 角色创建后可进入聊天

## Feature 02-2：自定义角色
### Stories
- [P0] 支持编辑名称、身份、风格、边界
- [P0] 支持保存 system prompt / style prompt
- [P1] 支持角色头像上传
- [P1] 支持声音配置
- [P1] 支持默认开场白
- [P1] 支持角色绑定默认模型
- [P2] 支持角色版本记录

### 验收条件
- 用户可创建并保存自定义角色
- 修改角色后新线程生效
- 旧线程不被强制污染
- 角色默认模型配置可被保存和读取

---

# EPIC-03 场景系统（Scenes）

## 目标
把“虚拟伴侣”“多视角研讨”等场景抽象成可配置模板，而不是散在页面里的临时逻辑。

## Feature 03-1：场景模板
### Stories
- [P0] 建立 scene_templates 表
- [P0] 建立 virtual_companion 模板
- [P1] 建立 multi_view_discussion 模板
- [P1] 模板支持默认角色、默认配置、默认运行模式
- [P1] 模板支持默认模型配置
- [P2] 支持模板复制与二次编辑

### 验收条件
- 用户可从场景模板进入对应聊天流程
- 模板能正确绑定默认角色 / 模式 / 默认模型配置

## Feature 03-2：场景实例
### Stories
- [P0] 建立 scene_instances 表
- [P0] 建立 scene_agents 关系表
- [P0] 每次进入场景可创建实例
- [P1] 支持继续上次实例
- [P1] 支持继承默认模型配置
- [P2] 支持场景归档

### 验收条件
- 用户进入场景后有明确实例记录
- 场景与角色关系可追踪
- 场景实例可正确读取默认模型配置

---

# EPIC-04 聊天与线程系统（Threads / Messages）

## 目标
提供统一的会话抽象，承载 Web 与 IM 渠道消息。

## Feature 04-1：线程系统
### Stories
- [P0] 建立 threads 表
- [P0] 支持创建新线程
- [P0] 支持历史线程列表
- [P0] 支持恢复旧线程
- [P1] 支持线程标题自动生成
- [P2] 支持线程归档 / 删除

### 验收条件
- 用户能创建和切换线程
- 线程不会串数据

## Feature 04-2：消息系统
### Stories
- [P0] 建立 messages 表
- [P0] 支持文本消息写入
- [P0] 支持流式回复展示
- [P1] 支持消息状态（生成中 / 成功 / 失败）
- [P1] 支持消息附件引用
- [P2] 支持消息编辑与重试

### 验收条件
- 消息可稳定入库并展示
- 流式输出可用
- 失败请求不会污染线程状态

---

# EPIC-05 单 Agent Runtime

## 目标
跑通伴侣场景最核心的单 Agent 对话闭环。

## Feature 05-1：单 Agent 执行流
### Stories
- [P0] 接入 LangGraph 基础 runtime
- [P0] 定义 single-agent runtime graph
- [P0] 接入角色设定
- [P0] 接入当前线程上下文
- [P0] 接入基础 memory recall
- [P1] 接入基础 safety hooks
- [P1] single-agent runtime 支持根据 routing policy 选择模型
- [P2] single-agent runtime 支持按不同执行节点切换模型
- [P2] 接入工具调用 hooks

### 依赖
EPIC-02, EPIC-04, EPIC-07, EPIC-08

### 验收条件
- 用户能与单个角色稳定对话
- 角色风格明显可感知
- 线程上下文连续
- 单 Agent 在不同任务类型下可按策略切换模型

## Feature 05-2：运行状态管理
### Stories
- [P0] 支持生成中状态
- [P0] 支持中断回复
- [P1] 支持失败重试
- [P1] 支持运行日志记录
- [P2] 支持回放调试

### 验收条件
- 生成过程可控制
- 异常时用户能看到清晰状态

---

# EPIC-06 多 Agent Forum Runtime

## 目标
建立最小可用的多 Agent 讨论模式，为后续金融/研讨打基础。

## Feature 06-1：Forum 基础编排
### Stories
- [P0] 定义 forum runtime graph
- [P0] 支持至少 3 个 agent + 1 moderator
- [P0] 支持按顺序轮流发言
- [P1] 支持限制轮数
- [P1] 支持总结输出
- [P1] forum runtime 支持不同 agent 使用不同 model profile
- [P1] moderator 支持独立模型配置
- [P2] forum runtime 支持按 agent role 走不同 routing policy
- [P2] 支持“简要 / 深度”模式

### 依赖
EPIC-02, EPIC-03, EPIC-04, EPIC-08

### 验收条件
- 3 个 agent 能围绕同一议题发言
- moderator 能输出总结
- 每个 agent 保持自己角色立场
- 不同 agent 可按各自模型配置稳定运行
- moderator 可独立使用不同模型完成总结

## Feature 06-2：Forum UI
### Stories
- [P1] 论坛式消息展示
- [P1] 显示 agent 身份标签
- [P1] 支持继续下一轮讨论
- [P2] 支持切换展示视图

### 验收条件
- 用户能清晰区分是谁在发言
- 多轮讨论不混乱

---

# EPIC-07 长期记忆系统（Memory OS）

## 目标
建立“记住用户”的核心差异化能力。

## Feature 07-1：记忆数据结构
### Stories
- [P0] 建立 memory_items 表
- [P0] 建立 memory_embeddings 表
- [P0] 建立 memory_access_logs 表
- [P1] 建立 memory_policies 表
- [P2] 建立 memory_edges 表（仅预留图谱接口）

### 验收条件
- 记忆表结构可支持 profile / episodic / relationship
- 数据可按 namespace 隔离

## Feature 07-2：热路径写入
### Stories
- [P0] 对用户事实进行抽取
- [P0] 对偏好与禁忌进行抽取
- [P0] 对关系边界进行抽取
- [P1] 对图片中重要事实进行抽取
- [P1] 写入时打上 memory_type / importance / source
- [P2] 支持人工标注为“永不忘记”

### 依赖
EPIC-04, EPIC-08, EPIC-09

### 验收条件
- 首次聊天后可写入至少 3 种记忆类型
- 写入结果可追溯到 source message

## Feature 07-3：冷路径整理
### Stories
- [P0] 会话摘要任务
- [P0] episodic 事件抽取
- [P0] relationship 状态更新
- [P1] emotional event 抽取
- [P1] unresolved thread 检测
- [P2] 定期 embedding refresh

### 验收条件
- 一轮对话后可生成 session summary
- 重要关系事件能沉淀到记忆层

## Feature 07-4：记忆召回
### Stories
- [P0] 实现 recall pipeline
- [P0] 先做意图判断
- [P0] 再做 memory bucket 路由
- [P0] 按 relevance / importance / recency 排序
- [P1] 加入 emotional weight
- [P1] 记录 access logs
- [P2] 做召回解释性展示

### 验收条件
- 第二次对话能正确提到用户已写入偏好
- 删除后的记忆不再被召回

## Feature 07-5：记忆策略
### Stories
- [P1] 支持按角色绑定 memory policy
- [P1] 支持禁止某类内容进入长期记忆
- [P1] 支持 TTL / retention 策略
- [P2] 支持不同场景加载不同 policy

### 验收条件
- 至少能配置“哪些内容不记”
- 角色切换时策略可生效

---

# EPIC-08 模型网关、模型配置与模型路由

## 目标
支持平台模型与用户自带 Key 共存，并支持不同 agent 不同模型、同一 agent 动态切模型。

## Feature 08-1：LiteLLM 接入
### Stories
- [P0] 跑通 LiteLLM 基础调用
- [P0] 接入至少 2 个 provider
- [P0] 接入文本模型
- [P1] 接入图片理解模型
- [P1] 接入语音相关模型
- [P2] 接入 fallback / routing 规则

### 验收条件
- 不同 provider 可在统一接口下调用
- 失败时有清晰错误信息

## Feature 08-2：模型配置页
### Stories
- [P0] 建立 model_profiles 表
- [P0] 支持平台模型选择
- [P0] 支持 BYOK 配置
- [P1] 支持标记模态能力
- [P1] 支持默认模型切换
- [P1] 支持为 agent 绑定默认模型
- [P1] 支持为 scene / runtime 绑定模型策略
- [P2] 支持模型路由优先级

### 验收条件
- 用户可成功保存模型配置
- 新线程使用新配置
- 每个 agent 可绑定默认模型
- 不同 agent 可使用不同模型

## Feature 08-3：Agent 默认模型绑定
### Stories
- [P0] 每个 agent 可绑定 default model profile
- [P0] 多 Agent 场景下不同 agent 可绑定不同模型
- [P1] 场景模板可带默认模型配置
- [P1] moderator 可单独指定模型
- [P2] 支持复制角色时继承默认模型配置

### 验收条件
- 单 Agent 场景下，角色能使用自己绑定的默认模型
- forum 模式下，不同 agent 可稳定调用不同模型
- moderator 可独立于其他 agent 使用单独模型
- 场景模板创建实例后，默认模型配置可正确落地

## Feature 08-4：动态模型路由
### Stories
- [P1] 建立 model_routing_policies 表
- [P1] 支持按模态切换模型
- [P1] 支持按任务复杂度切换模型
- [P1] 支持 fallback chain
- [P1] 支持 single-agent runtime 按 routing policy 选模型
- [P1] 支持 forum runtime 为不同 agent 选模型
- [P2] 支持按 runtime node 切模型
- [P2] 支持按成本 / 额度做 cost-aware routing
- [P2] 建立 runtime_model_decisions 日志表
- [P2] 记录每次运行实际选用模型及原因

### 依赖
EPIC-05, EPIC-06, EPIC-08

### 验收条件
- 不同 agent 可稳定调用不同模型
- 同一个 agent 在文本 / 看图 / 总结等场景能切到不同模型
- 主模型失败后可走 fallback
- 模型切换过程有日志可追踪
- 平台模型与 BYOK 模型均可进入路由规则

---

# EPIC-09 多模态能力

## 目标
支持文本、语音、图片三类最关键输入输出。

## Feature 09-1：语音输入输出
### Stories
- [P0] 支持语音输入上传
- [P0] 支持 STT 转写
- [P0] 支持 TTS 输出
- [P1] 支持选择声音
- [P2] 支持语速 / 风格配置

### 验收条件
- 用户能发语音并被正确转写
- 系统能生成可播放语音回复

## Feature 09-2：图片理解
### Stories
- [P0] 支持图片上传
- [P0] 支持图片消息入库
- [P0] 支持图像内容理解
- [P1] 从图片提取可写入记忆的 salient facts
- [P2] 支持多图输入

### 验收条件
- 用户上传图片后系统可理解并回复
- 图片事实可进入记忆系统

---

# EPIC-10 知识包与资产系统

## 目标
把知识、角色资产、长期记忆三者严格分离。

## Feature 10-1：知识包
### Stories
- [P1] 建立 knowledge_packs 表
- [P1] 支持创建知识包
- [P1] 支持上传文档
- [P1] 支持绑定到角色或场景
- [P2] 支持 URL 导入
- [P2] 支持知识包分类

### 验收条件
- 某角色可调用绑定知识包回答问题
- 删除知识包后不再引用内容

## Feature 10-2：资产系统
### Stories
- [P0] 建立 assets 表
- [P0] 支持头像 / 图片 / 音频上传
- [P1] 支持消息附件引用
- [P1] 支持角色头像与声音资产绑定
- [P2] 支持对象存储适配切换（Supabase Storage / R2）

### 验收条件
- 上传文件后可被正确引用
- 角色与消息都能绑定资产

---

# EPIC-11 渠道接入（Web / Telegram）

## 目标
实现从 Web 到 IM 的连续体验。

## Feature 11-1：Web Chat
### Stories
- [P0] Web 聊天页
- [P0] 历史线程侧栏
- [P0] 支持文本输入
- [P0] 支持语音与图片入口
- [P1] 支持角色信息侧栏
- [P2] 支持快捷命令

### 验收条件
- Web 是稳定主入口
- 用户可以完成完整聊天闭环

## Feature 11-2：Telegram 接入
### Stories
- [P0] 建立 Telegram bot 基础接入
- [P0] 建立 webhook / polling 方案（二选一先跑通）
- [P0] 建立 channel_connections 表
- [P0] 支持 Web 发起绑定
- [P0] 支持 Telegram 消息路由到平台用户
- [P1] 支持绑定指定角色 / 场景
- [P1] 支持解绑
- [P2] 支持多 bot / 多 workspace

### 依赖
EPIC-04, EPIC-05, EPIC-08

### 验收条件
- 用户能在 Web 端发起绑定
- Telegram 中能继续和同一角色对话
- 同一用户消息不串到别人空间

## Feature 11-3：第二渠道预留
### Stories
- [P1] 预留 LINE ChannelAdapter
- [P2] 预留 Discord / Feishu / WeCom 接口定义

### 验收条件
- 渠道适配器边界清晰
- Telegram 实现不把渠道逻辑写死

---

# EPIC-12 记忆中心与用户设置

## 目标
让长期记忆成为用户可见、可删、可信的系统资产。

## Feature 12-1：记忆中心
### Stories
- [P0] 记忆列表页
- [P0] 按分类筛选
- [P0] 删除单条记忆
- [P0] 清空某类记忆
- [P1] 搜索记忆
- [P1] 显示最近召回记录
- [P2] 编辑记忆内容

### 验收条件
- 用户可查看 profile / relationship / episodic
- 删除后下次不再召回

## Feature 12-2：用户设置
### Stories
- [P1] 默认模型设置
- [P1] 默认角色设置
- [P1] 渠道绑定管理
- [P1] 隐私设置
- [P2] 数据导出

### 验收条件
- 用户能找到主要配置入口
- 设置更新后可生效

---

# EPIC-13 管理后台与安全治理

## 目标
为平台持续运营、风险控制、问题排查提供最低管理能力。

## Feature 13-1：管理后台
### Stories
- [P1] 用户列表
- [P1] 角色模板管理
- [P1] 场景模板管理
- [P1] 模型配置管理
- [P1] 查看 model profiles 列表
- [P1] 查看 model routing policies
- [P1] 记忆审计页
- [P2] 查看 runtime model decisions 日志
- [P2] 渠道连接管理
- [P2] 后台数据统计

### 验收条件
- 管理员能看到用户、角色、模板基础数据
- 管理员可查看主要模型配置与路由规则
- 管理员可追踪一次运行最终用了哪个模型
- 出问题时能追查主要链路

## Feature 13-2：安全治理
### Stories
- [P1] 基础 policy engine
- [P1] memory guard
- [P1] tool guard（即便首版工具少，也要预留）
- [P1] 删除 / 重置接口
- [P2] 风险标签
- [P2] 审计告警

### 验收条件
- 某类敏感内容可被阻止进入长期记忆
- 用户重置后关系记忆不再生效

---

# EPIC-14 计费与用量

## 目标
支持后续商业化，不要求首版非常复杂，但要先埋好结构。

## Feature 14-1：用量记录
### Stories
- [P1] 记录模型 token 使用量
- [P1] 记录语音 / 图片相关调用量
- [P1] 记录活跃线程 / 用户数
- [P1] 按 selected model profile 统计调用量
- [P1] 记录路由后实际使用的模型成本
- [P2] 区分默认模型与 fallback 模型的调用量
- [P2] 记录 memory storage / retrieval 次数

### 验收条件
- 至少能统计每个用户的大类调用量
- 平台可统计每个用户 / agent / 模型的主要调用量
- 模型路由后的真实成本可被追踪

## Feature 14-2：基础订阅
### Stories
- [P1] 免费版 / 付费版开关
- [P1] 平台模型与 BYOK 分流
- [P1] 基础额度限制
- [P2] 高级记忆 / 高级渠道作为付费点预留
- [P2] 高级模型路由策略作为付费点预留

### 验收条件
- 免费与付费用户能走不同能力路径
- 平台可限制超量使用

---

# EPIC-15 开源与自部署兼容

## 目标
虽然不是首版默认部署方式，但必须从架构上兼容。

## Feature 15-1：适配器与迁移
### Stories
- [P0] DatabaseAdapter
- [P0] StorageAdapter
- [P0] ChannelAdapter
- [P0] ModelGatewayAdapter
- [P1] QueueAdapter
- [P1] AuthAdapter
- [P1] 预留 ModelRoutingAdapter / ModelRoutingPolicyAdapter 边界
- [P1] migration 脚本
- [P1] migration 包含 model_routing_policies / runtime_model_decisions
- [P1] seed 脚本

### 验收条件
- 业务层不直接写死 Supabase / Vercel 细节
- DB schema 可通过迁移脚本复现
- 模型路由相关表可一并迁移

## Feature 15-2：自部署文档
### Stories
- [P1] 输出 `.env.example`
- [P1] 输出基础部署说明
- [P2] Docker Compose
- [P2] MinIO / S3-compatible 示例
- [P2] 自建 Postgres 示例
- [P2] 私有模型 endpoint 示例
- [P2] 自部署文档说明 fallback chain / routing policy 配置方式

### 验收条件
- 专业用户阅读文档后知道项目依赖与部署思路
- Docker 方案虽未首发默认，但路径明确

## 预留 Epic（当前不进入首版开发）

# EPIC-16（Reserved） Skills Layer
## 当前状态
不纳入首版 MVP 强制交付范围，仅做能力预留。
## 预留内容
- skill schema
- skill binding
- runtime skill execution hooks
- runtime skill decisions logs
## 后续目标
用于承载 SOP、经验沉淀、结构化流程与专业方法。

# EPIC-17（Reserved） Event / Trigger Layer

## 当前状态
不纳入首版 MVP 强制交付范围，仅做能力预留。

## 预留内容
- schedule triggers
- event triggers
- trigger binding（agent / scene / skill）
- proactive delivery hooks
- trigger run logs

## 后续目标
用于支持主动运行、定时任务、事件触发、主动提醒与主动分析。

# EPIC-18（Reserved） Evaluation / Observability Layer

## 当前状态
不纳入首版 MVP 强制交付范围，仅做能力预留。

## 预留内容
- runtime traces
- memory recall logs
- model routing decision logs
- tool call logs
- replay hooks
- output feedback hooks

## 后续目标
用于支持运行可观测性、质量评估、回放调试、成本分析与系统优化。

# EPIC-19（Reserved） Shared State / World State Layer

## 当前状态
不纳入首版 MVP 强制交付范围，仅做能力预留。

## 预留内容
- shared namespace
- scene-level facts
- shared state snapshots
- consensus / conflicts hooks
- world state binding hooks

## 后续目标
用于支持场景级共享状态、多 Agent 公共事实、研讨共识与世界状态管理。

---

# 6. 推荐执行顺序（按你个人当前阶段）

## 当前阶段追加判断（基于第一轮 formal long-chain gate）

在当前 frozen baseline、当前 scenario-pack 集合、当前 profile-by-pack matrix 下，第一轮 formal `8~12 turn` long-chain gate 已经通过。

这意味着当前阶段的策略应继续保持为：

- 继续 `keep_role_layer`
- 继续把角色层的 fidelity / language / relationship continuity / recall contract 做稳
- 暂不转向 Layer D / compaction 方向的正式实现

为什么当前不该切向 Layer D / compaction：

- 最近一轮正式 gate 已通过
- 后续 lightweight confirmation rerun 也已复现 `Pass / no obvious drift / keep_role_layer`
- 当前还没有满足 Layer D 设计评审的触发条件

关于环境噪音的执行口径，也应一并遵守：

- 类似 Supabase connect timeout 这类 infra 异常
- 如果 same-baseline rerun 通过
- 应记为 `environment noise`
- 不直接记为 `product drift`

## 当前阶段同步（2026-03-22）

在上面这轮 relationship continuity / reply-quality 验证继续推进之后，当前执行状态需要再补一层校准：

### 已阶段性收口的部分

- `relationship continuity / reply-quality` 底座层测试已阶段性收口
- phrase-by-phrase 扩张不再默认继续
- 长链路验证已经完成两批：
  - failure theme 暴露
  - chain-level 修口
  - rerun verdict 回到 `holds as one continuing role`

这意味着当前不应再把主执行节奏放在：

- very-nearby phrasing 扩张
- 风格细磨
- explanation / helper / 表层文案微调

### 已完成的 Layer A / B / D 阶段成果

- Layer A：已完成最小 `role_core_packet` contract 定形
  - 参见 [layer-a-role-core-packet-contract-2026-03-22.zh-CN.md](docs-public/layer-a-role-core-packet-contract-2026-03-22.zh-CN.md)
- Layer B：已完成第一批关键 contract
  - single-slot override / restore semantics
  - memory status semantics
  - `user_agent` recall scope consistency
- Layer D：已完成 observation record 统一模板
  - 仍停在 observation 层，不进入 thread compaction 实现

### 当前为什么不继续硬挖 Layer B

当前 Layer B 继续往下最自然的点，会落到 `thread_local`。

但现阶段 `thread_local` 还没有真实回答路径在用，所以如果此时继续往下做，最容易发生的不是“继续 hardening contract”，而是：

- 为了继续推进，去发明新的 `thread_local` 使用面
- 把 contract hardening 变成新功能设计

因此，Layer B 这一小批当前最合理的是：

- 先阶段性收口
- 不为了继续做而硬开下一刀

### 当前推荐执行顺序（校准后）

如果继续往下推进，建议优先顺序调整为：

1. 先同步主设计文档与阶段结论
2. 优先挑选“真实使用面已经存在”的 contract hardening
3. 不继续默认深挖 phrasing 线
4. 不为了推进而发明 `thread_local` 新 surface

## 第一批必须先做（最小骨架）
1. EPIC-00 工程骨架
2. EPIC-01 鉴权与 workspace
3. EPIC-04 线程与消息
4. EPIC-08 模型网关与基础模型调用
5. EPIC-02 角色系统
6. EPIC-05 单 Agent runtime

## 第二批必须接上（核心差异化）
7. EPIC-07 长期记忆系统
8. EPIC-09 多模态
9. EPIC-11 Web Chat + Telegram
10. EPIC-12 记忆中心
11. EPIC-08 模型路由最小能力（同一 Epic 的第二阶段）

## 第三批增强（平台化）
12. EPIC-03 场景系统
13. EPIC-06 多 Agent forum
14. EPIC-10 知识包与资产
15. EPIC-13 管理后台与安全
16. EPIC-14 计费与用量

## 第四批开放能力
17. EPIC-15 开源与自部署兼容
## 架构预留模块（当前不进入执行顺序）
以下 Epic 已在架构与文档中预留，但**不纳入当前 MVP 与近期执行批次**：

- EPIC-16 Skills Layer
- EPIC-17 Event / Trigger Layer
- EPIC-18 Evaluation / Observability Layer
- EPIC-19 Shared State / World State Layer

其中，EPIC-17 ~ EPIC-19 对应未来 Simulation Runtime 的基础能力预留，当前仅占位，不作为首版执行项。

这些模块当前的定位是：
- 先占位
- 先预留边界
- 暂不作为首版强制开发项

当前不纳入上述执行顺序，待 MVP 验证完成后，再按具体场景需求择机进入正式开发排期。

---

# 7. 建议的 MVP 切片

## MVP Slice A：最小聊天闭环
包含：
- 登录
- 创建角色
- 文本聊天
- 单 Agent
- 模型调用
- 历史线程

上线目标：
- 先有“能聊”的内部 demo

## MVP Slice B：记忆闭环
包含：
- profile / preference / relationship 热写入
- 基础召回
- 记忆中心查看 / 删除

上线目标：
- 让用户真正感知“记住了我”

## MVP Slice C：多模态闭环
包含：
- 语音输入 / 输出
- 图片理解
- 图片事实写入记忆

上线目标：
- 提升陪伴场景真实感

## MVP Slice D：IM 闭环
包含：
- Telegram 绑定
- Telegram 中延续同一角色
- 渠道连接状态管理

上线目标：
- 验证 Web + IM 连续体验

## MVP Slice E：模型路由闭环
包含：
- 每个 agent 一个默认模型
- forum 中不同 agent 不同模型
- 同一 agent 按模态切模型
- fallback chain
- runtime model decision 日志

上线目标：
- 验证这不是单模型聊天应用，而是可路由的 Agent 底座

## MVP Slice F：多 Agent 最小闭环
包含：
- forum runtime
- 3 agent + 1 moderator
- 简单讨论 UI

上线目标：
- 验证这不是纯陪伴产品，而是 Agent 底座

---

# 8. Definition of Done（统一完成标准）

一个任务被视为完成，至少满足：

- 功能在本地可跑通
- 有基本错误处理
- 有最小验收说明
- 关键数据有存储落点
- 不破坏现有主链路
- 有必要的环境变量说明
- 关键接口有最小注释或文档

---

# 9. 风险任务标记

以下任务建议额外标记“高风险”：

- Telegram 渠道路由与绑定
- Memory recall 质量
- Relationship memory 的误召回
- 语音链路稳定性
- 多 Agent forum 的成本和响应速度
- BYOK 与平台模型的权限边界
- 记忆删除后仍被隐式引用的问题
- 模型路由策略过早复杂化
- fallback 后状态与日志不一致
- runtime model decision 追踪不完整

---

# 10. 建议的 GitHub Project / Linear 分组方式

建议按以下列来建看板：

- Backlog
- Ready
- In Progress
- In Review
- Testing
- Blocked
- Done

建议标签：
- `P0`
- `P1`
- `P2`
- `frontend`
- `backend`
- `runtime`
- `memory`
- `model-routing`
- `channel`
- `infra`
- `security`
- `billing`

---

# 11. 当前最小任务清单（你现在就能开工的版本）

## 本周最小任务
- [ ] 初始化仓库与目录
- [ ] 接入 Supabase Auth
- [ ] 建 users / workspaces / threads / messages 基础表
- [ ] 跑通 LiteLLM 文本调用
- [ ] 建 persona_packs / agents 表
- [ ] 建 model_profiles 表
- [ ] 做最小聊天页
- [ ] 跑通单 Agent 文本聊天
- [ ] 建 memory_items 表
- [ ] 做 profile/preference 基础写入
- [ ] 做第二次聊天的基础召回
- [ ] 为 agent 绑定 default model profile

## 下周最小任务
- [ ] 做 relationship memory
- [ ] 做记忆中心页
- [ ] 做语音输入输出
- [ ] 做图片上传与理解
- [ ] 做 Telegram bot 接入
- [ ] 做 Web 发起绑定
- [ ] 建 model_routing_policies 表
- [ ] 跑通按模态切模型
- [ ] 跑通 fallback chain
- [ ] 建 runtime_model_decisions 日志表

---

# 12. 一句话收口

这份 v1.4.1 的核心目标不是把任务拆得“很全”，而是确保你始终围绕真正的 MVP：

**先把“单/多 Agent 运行模式 + 长记忆 + 角色系统 + 多模态 + IM 接入 + 基础模型路由”的最小闭环做出来；  
先验证产品价值，再逐步平台化、边缘化、自部署化。**
