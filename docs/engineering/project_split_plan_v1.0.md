# SparkCore 项目拆分方案 v1.0

## 1. 文档定位

本文档用于说明 SparkCore 当前项目从“混合单体项目”逐步演进为“底座层 + 接入层 + 产品层”结构的拆分方案。

本文档主要解决以下问题：

- 当前项目为什么需要拆分
- 当前阶段到底拆什么，不拆什么
- 拆分的目标结构是什么
- 现有内容如何归类
- 拆分按什么节奏执行
- 哪些模块应先抽离，哪些模块后处理

> 状态：当前有效  
> 对应阶段：Phase 1 准备阶段  
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/product/companion_mvp_flow_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前不应推倒重做，而应从一个混合项目，逐步拆分为“底座层、接入层、产品层”三层结构，使其既支持当前第一阶段虚拟伴侣 / 助理产品，也为后续开源、自部署与产品扩展保留清晰边界。**

---

## 3. 当前为什么要拆分

当前项目在历史演进过程中，已经混合了多种不同性质的内容：

- 角色与记忆相关能力
- IM 底座讨论
- 多 Agent 预研
- 产品方案文档
- 网站 / web 项目
- 部署与数据库部分
- 后续扩展能力预留

这种状态在早期是正常的，但随着项目重新定位为：

**单 Agent + 长记忆角色 + IM 接入**

并计划推进第一阶段虚拟伴侣 / 助理产品，当前项目继续以“混合单体”方式演进，会带来以下问题：

1. 底座能力与产品壳边界不清
2. IM 接入容易直接污染核心模块
3. 开源边界无法明确
4. 后续自部署版本难以抽离
5. 第二阶段事务推进产品无法平滑承接
6. 文档与代码结构会越来越混乱

因此，当前项目需要拆分。

---

## 4. 当前拆分原则

## 4.1 不推倒重做

当前拆分不是为了重写整个项目，而是为了：

- 理清边界
- 稳定底座
- 为 Phase 1 产品实现提供更清晰结构
- 为后续开源与自部署做准备

原则上：

- 方向不推翻
- 已有有效能力不轻易废弃
- 先抽边界，再做结构整理
- 拆分优先级服从当前主线目标

---

## 4.2 拆分优先于“完美架构”

当前拆分目标不是一次性做出最终完美架构，而是先得到一个：

- 能支撑当前开发
- 不明显互相污染
- 后面可继续演进

的分层结构。

---

## 4.3 先按模块边界拆，再考虑仓库边界

当前阶段可以先在同一仓库内完成逻辑分层，不要求一开始就拆成多个独立仓库。

也就是说，先做：

- 目录结构拆分
- 依赖方向收敛
- 模块职责明确

后续再视情况决定是否进一步拆仓。

---

## 5. 当前推荐三层结构

SparkCore 当前推荐逐步形成以下结构：

### 5.1 底座层（Core Layer）
负责通用、可复用、不依赖具体产品形态的能力。

包括：

- role
- memory
- session
- scheduler
- single-agent runtime

---

### 5.2 接入层（Integration Layer）
负责将外部通道与底座层连接起来。

包括：

- IM adapter
- message normalization
- binding
- routing

---

### 5.3 产品层（Product Layer）
负责具体用户可见的产品流程与产品逻辑。

第一阶段主要对应：

- 虚拟伴侣 / 助理的配置与领取流程
- 网站产品壳
- onboarding
- 付费与运营逻辑

---

## 6. 当前不建议先拆的内容

为了避免重构过重，当前阶段不建议优先拆以下内容：

- 多 Agent 复杂能力
- 第二阶段事务推进产品结构
- 第三阶段模拟 / 世界层结构
- 复杂插件系统
- 复杂外部通道矩阵
- 一次性多仓库拆分

这些内容在当前阶段要么不是必须，要么会显著拉高工程成本。

---

## 7. 当前项目内容的推荐归类方式

当前建议先对现有内容进行三类标记，而不是立刻全部移动：

### A 类：底座候选
这些内容未来应归入底座层：

- 角色定义相关
- 长记忆相关
- session / thread 相关
- scheduler / 定时任务基础能力
- agent runtime 核心逻辑

### B 类：第一阶段产品候选
这些内容未来应归入产品层：

- 网站配置逻辑
- 角色领取流程
- onboarding
- 付费流程
- 虚拟伴侣 / 助理相关产品逻辑

### C 类：未来层 / 预研层
这些内容先保留，不进入当前主线：

- 多 Agent 复杂设计
- 第二阶段事务推进相关草案
- 模拟 / 游戏相关预研
- 非当前主线实验能力

---

## 8. 当前阶段推荐的目录方向

当前不要求一步到位，但建议后续逐步向类似结构靠拢：

```text
apps/
  web/

docs/
  strategy/
  architecture/
  product/
  engineering/
  archive/

packages/
  core/
    role/
    memory/
    session/
    scheduler/
    single-agent-runtime/

  integrations/
    im-adapter/
    message-normalization/
    binding/
    routing/

  shared/
    types/
    utils/
说明：

apps/web：第一阶段网站产品壳
packages/core：底座层
packages/integrations：接入层
packages/shared：通用类型与工具
docs/*：文档系统化归档
9. 当前阶段推荐的拆分顺序
9.1 第一步：先完成角色记忆层核心模块

这是当前最高优先级。

目标：

稳定 role schema
稳定 memory schema
稳定写入 / 召回接口
明确与 session 的关系
为 single-agent runtime 提供清晰调用面

原因：

这是 Phase 1 与 Phase 2 都会复用的最核心能力
拆分时最应该先沉到底座层
若这一层不稳，后面的拆分只是表面整理
9.2 第二步：明确 single-agent runtime 边界

目标：

将 role、memory、session、scheduler 组织成统一运行核心
不引入多 Agent 复杂度
形成后续接入层可调用的主入口

此步骤完成后，底座层主线会显著更清晰。

9.3 第三步：定义 IM adapter 契约

当前阶段不要求先做完整 IM 产品能力，但建议尽早明确：

入站消息标准结构
出站消息标准结构
binding 关系格式
routing 调用方式
runtime 输入输出格式

目的：

防止后续 IM 接入反向污染底座
为最小接入验证做准备
避免“拆完后才第一次考虑 IM”的闭门设计
9.4 第四步：做最小接入验证

目标：

验证单 Agent runtime 能否被 IM 入口调用
验证 binding / routing / message flow 基本可行
不急于做完整产品流程

此处重点是验证消息闭环，而不是做完整虚拟伴侣产品。

9.5 第五步：按层整理目录结构

到这一步再开始正式做项目拆分，成本最合适。

当前建议的动作：

建立 packages/core
建立 packages/integrations
明确 apps/web
整理通用类型到 packages/shared
把当前主线文档迁入 docs/
9.6 第六步：开始第一阶段产品壳实现

在底座与接入边界基本清楚后，再进入：

网站角色配置
角色领取
首次绑定
IM 中持续互动

这样的产品化实现，后续返工会少很多。

10. 当前推荐的模块拆分优先级
P0：立即关注
role
memory
session
single-agent runtime
P1：紧随其后
scheduler
IM adapter 接口定义
binding
routing
P2：产品实现阶段介入
网站配置页
角色领取页
IM 首次绑定流程
用户后台
运营与付费逻辑
P3：延后处理
多 Agent
第二阶段事务推进对象系统
模拟 / 游戏层
更复杂开源版拆仓
11. 当前推荐的工程约束
11.1 底座层不要依赖产品层

这是最重要的依赖方向约束。

不允许出现：

memory 依赖网站页面逻辑
runtime 依赖 onboarding
role 模块依赖具体 IM 平台 SDK
11.2 接入层不要实现底座逻辑

接入层只负责“接和转”，不应自己实现：

长记忆策略
角色一致性逻辑
单 Agent 主流程
scheduler 规则
11.3 产品层可以调用底座层与接入层，但不反向被依赖

产品层是最上层，不应成为底层通用能力的前提。

12. 当前对现有仓库的操作建议

当前建议不要一开始大规模移动文件，而是先做以下动作：

12.1 补文档入口

在 README.md 或 docs/README.md 中声明当前主线文档。

12.2 给旧主文档加状态说明

例如在原有“多 Agent 长记忆 IM 底座”文档开头增加：

当前状态：历史方案 / 部分仍可参考
当前主线文档路径
12.3 用目录或模块标签标记代码归属

哪怕暂时不移动代码，也先标清：

core candidate
integration candidate
product candidate
future candidate
12.4 新增目录时优先承接新代码

不要急着重搬旧代码，可以先规定：

新写底座代码进 packages/core
新写接入代码进 packages/integrations
新写产品代码进 apps/web

让项目通过增量方式逐步过渡。

13. 当前阶段与开源策略的关系

项目拆分不仅是为了工程整洁，也是为后续“按层开放”做准备。

当前未来推荐方向：

可开放层
schema
starter runtime
connector SDK
安装方式
demo
保留层
生产级长记忆策略
产品层逻辑
运营后台
商业化逻辑

如果当前不先拆边界，后面很难做出清晰的开源 / 自部署策略。

14. 当前不建议做的拆分动作

当前阶段不建议：

一开始就拆成很多仓库
一开始就把所有旧代码全部重排
在底座未稳时先重做产品壳
在 IM 契约未定时先深写 IM 平台细节
以开源为目标反向重构当前项目
为未来多 Agent 提前设计过多复杂抽象
15. 当前建议输出的后续工程文档

在本拆分方案后，建议继续补以下工程文档：

docs/engineering/module_inventory_v1.0.md
当前代码 / 文档 /模块盘点
docs/engineering/directory_reorg_plan_v1.0.md
目录重组方案
docs/engineering/open_core_boundary_v1.0.md
开源边界方案
docs/engineering/im_adapter_contract_v1.0.md
IM adapter 契约文档
16. 当前结论

SparkCore 当前最正确的工程动作，不是“重写项目”，而是：

先稳角色记忆层
再稳 single-agent runtime
提前定义 IM 接入边界
然后以增量方式完成三层拆分

换句话说：

当前拆分的目标不是做出漂亮架构图，而是让 SparkCore 从一个混合项目，变成一个能够承接第一阶段产品、并支持后续开放与扩展的清晰结构。