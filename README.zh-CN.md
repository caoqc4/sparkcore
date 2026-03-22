<p align="center">
  <img src="./logo.png" alt="SparkCore logo" width="160" />
</p>

<h1 align="center">SparkCore</h1>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

SparkCore 是一个面向单 Agent、长记忆、角色驱动 AI 系统的开源基础底座，目标是同时支撑 Web Chat 与 IM 渠道接入。

这个项目面向希望构建可复用 Agent Runtime 的团队，而不是只做一个单点聊天应用。当前主线聚焦于单 Agent runtime、长记忆角色连续性，以及以 IM 作为第一阶段产品入口。

## 项目愿景

SparkCore 计划提供一套共享核心能力，用于支持：

- 单 Agent 运行时
- 长期记忆与记忆召回
- 角色连续性与 persona 稳定性
- Web Chat 与 IM 渠道接入
- 模型网关与路由
- 可扩展的适配器与后续升级方向

## 当前状态

SparkCore 现在已经具备一个可本地试用的 v1 聊天工作台：

- 支持多线程聊天与稳定的 `/chat?thread=<id>` 恢复
- 支持 thread 绑定 agent，以及轻量创建、默认 agent、轻量编辑
- 支持长期记忆的可见、trace、纠错、恢复与轻量收敛
- 支持按回合展示的 runtime summary，说明 agent、model profile 和 memory 使用情况
- 已接好 Supabase 登录与持久化，并补了本地 smoke 回归保护

项目仍然处于早期，但已经不是只有脚手架的状态，而是可以交给别人本地试用的一版工作台。

当前主线文档：

- 总纲：[`docs/strategy/sparkcore_repositioning_v1.0.md`](./docs/strategy/sparkcore_repositioning_v1.0.md)
- 产品流程：[`docs/product/companion_mvp_flow_v1.0.md`](./docs/product/companion_mvp_flow_v1.0.md)
- Runtime 设计：[`docs/architecture/single_agent_runtime_design_v1.0.md`](./docs/architecture/single_agent_runtime_design_v1.0.md)
- 工程拆分方案：[`docs/engineering/project_split_plan_v1.0.md`](./docs/engineering/project_split_plan_v1.0.md)

## 设计原则

- 面向 open-core 友好的架构
- 兼顾自部署场景
- 清晰的模块边界
- 可扩展到多种业务场景的 Runtime
- 实用优先的开发者体验

## 路线图

近期重点：

1. 建立初始仓库结构
2. 明确 role、memory、session 与 runtime 的模块边界
3. 明确 IM adapter 与接入层边界
4. 以增量方式拆分 core、integrations 与 product 三层结构

## 仓库结构

当前仓库已经先搭好了最小骨架，后续功能可以直接落到对应目录，避免后面反复调整顶层结构。

- `apps/web`：主 Web 应用
- `packages`：共享代码与复用模块
- `supabase`：数据库与后端相关资源
- `scripts`：开发与自动化脚本
- `docs-public`：未来公开文档

## 快速试用

如果你想把当前 v1 在本地跑起来，建议按下面顺序开始：

1. 先看 Web 快速启动说明：[`apps/web/README.md`](./apps/web/README.md)
2. 把 [`.env.example`](./.env.example) 复制为本地环境文件
3. 准备一个 Supabase 项目，以及 LiteLLM 网关或本地 LiteLLM proxy
4. 启动 Web 应用，并按试用清单逐项验证

可直接查看的文档：

- 英文快速启动：[`apps/web/README.md`](./apps/web/README.md)
- 中文快速启动：[`apps/web/README.zh-CN.md`](./apps/web/README.zh-CN.md)
- 英文试用清单：[`docs-public/v1-trial-checklist.md`](./docs-public/v1-trial-checklist.md)
- 中文试用清单：[`docs-public/v1-trial-checklist.zh-CN.md`](./docs-public/v1-trial-checklist.zh-CN.md)

## 开源说明

部分内部规划文档目前有意不放入公开仓库，因为项目还在整理开源结构。后续会逐步把适合公开的文档沉淀到仓库中。

历史上的多 Agent 规划文档仅保留为归档参考，不代表当前实现主线。

## 环境变量

开始本地开发或试用前，可以把 `.env.example` 复制为本地环境文件使用。

当前 MVP 相关变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LITELLM_BASE_URL`
- `LITELLM_API_KEY`
- 如果你使用仓库内置的本地 LiteLLM proxy，还需要 `REPLICATE_API_KEY`
- `NEXT_PUBLIC_APP_URL`

后续预留变量：

- Telegram 相关变量
- 对象存储 / S3 兼容存储变量

## 参与贡献

当前还没有正式发布贡献指南，但仓库正在按公开协作的方向进行准备。

## License

许可证暂未确定。
