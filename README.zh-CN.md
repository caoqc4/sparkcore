<p align="center">
  <img src="./logo.png" alt="SparkCore logo" width="160" />
</p>

<h1 align="center">SparkCore</h1>

<p align="center">
  面向 Web 和 IM 渠道的单 Agent 长记忆 AI 伴侣运行时框架
</p>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

<p align="center">
  <a href="https://lagun.app">在线示例：lagun.app</a> &nbsp;·&nbsp;
  <a href="./docs-public/">公开文档</a> &nbsp;·&nbsp;
  <a href="./docs/architecture/">架构文档</a>
</p>

---

## SparkCore 是什么

SparkCore 是一个开源的 AI Agent 框架底座，专注于解决一个核心问题：**如何让 AI Agent 跨会话、跨线程、跨平台真正记住用户**——而不只是在单次上下文窗口里假装记住。

它提供了一套完整的单 Agent 运行时，包含长期记忆、角色一致性维护，以及 Web 端和 IM 渠道（Telegram、Discord、微信、飞书）的接入能力。

**[lagun.app](https://lagun.app)** 是基于 SparkCore 构建的参考产品，是一个 IM 原生的长记忆 AI 伴侣，展示了该运行时的生产级实现。

---

## 核心架构

SparkCore 的设计围绕两个互锁的核心层展开：

### 五层记忆结构

记忆不是单一的存储。SparkCore 将记忆拆分为五层，每层有不同的作用域、稳定性和生命周期：

```
┌─────────────────────────────────────────────────────┐
│  A  角色核心（Role Core）                             │
│     人格、身份、关系立场                               │
│     作用域：Agent 全局 · 稳定性：不可变               │
├─────────────────────────────────────────────────────┤
│  B  结构化长期记忆（Structured LTM）                  │
│     事实、偏好、关系线索、目标                         │
│     作用域：用户全局 / 用户-Agent · 稳定性：高         │
├─────────────────────────────────────────────────────┤
│  C  知识层（Knowledge Layer）                         │
│     项目文档、参考资料、世界知识                       │
│     作用域：项目 / 世界 · 治理：门控注入               │
├─────────────────────────────────────────────────────┤
│  D  线程状态（Thread State）                          │
│     当前会话焦点、短期工作模式                         │
│     作用域：线程本地 · 稳定性：低                      │
├─────────────────────────────────────────────────────┤
│  E  近期对话（Recent Turns）                          │
│     即时对话上下文窗口                                 │
│     作用域：运行中 · 稳定性：临时                      │
└─────────────────────────────────────────────────────┘
```

每一层都有独立的读写合约、作用域边界和生命周期规则。类型合约见 [`packages/core/memory/`](./packages/core/memory/)，设计说明见 [`docs/architecture/memory_layer_design_v1.0.md`](./docs/architecture/memory_layer_design_v1.0.md)。

### 四层调度逻辑

每轮对话时，运行时决定*加载什么*、*如何排优先级*、*如何组装最终的生成上下文*：

```
用户消息
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  1  记忆组装（Memory Assembly）                       │
│     决定加载哪些层、按什么顺序优先                     │
│     由当前场景记忆包（Scenario Pack）驱动              │
├─────────────────────────────────────────────────────┤
│  2  知识门控（Knowledge Gating）                      │
│     判断知识层是否可用、是否应注入                     │
│     治理分类：权威性 / 上下文性                        │
├─────────────────────────────────────────────────────┤
│  3  答策路由（Answer Strategy Routing）               │
│     问题类型 → 答复策略的映射                          │
│     例如：直接事实型 → 结构化召回优先                   │
├─────────────────────────────────────────────────────┤
│  4  运行时合成（Runtime Composition）                 │
│     组装系统提示、记忆上下文、知识片段、                │
│     输出治理规则和人性化表达规范                       │
└─────────────────────────────────────────────────────┘
     │
     ▼
  LLM 生成
```

调度行为通过**场景记忆包（Scenario Memory Pack）**配置——这是一种声明式的配置文件，按使用场景定义组装顺序和优先路由。内置两个 Pack：

| Pack | 优化目标 | 组装顺序 |
|---|---|---|
| `companion` | 长期伴侣，连续性优先 | thread_state → dynamic_profile → static_profile → memory_record |
| `project_ops` | 项目执行，知识优先 | thread_state → knowledge → dynamic_profile → memory_record |

Pack 合约见 [`packages/core/memory/packs.ts`](./packages/core/memory/packs.ts)。

---

## 仓库结构

```
sparkcore/
├── packages/
│   ├── core/memory/          # 五层记忆合约与类型定义
│   └── integrations/         # IM 适配器合约与桥接层
├── apps/
│   └── web/                  # lagun.app — 完整参考实现
│       ├── lib/chat/         # 运行时：记忆、调度、合成
│       ├── app/              # Next.js 路由（Web UI + API）
│       └── tests/            # 冒烟测试和集成测试
├── supabase/
│   └── migrations/           # 数据库 Schema（58 个迁移文件）
├── scripts/
│   └── litellm/              # 本地模型网关配置
├── docs/
│   ├── architecture/         # 系统设计文档
│   ├── engineering/          # 工程实施手册
│   └── product/              # 产品设计文档
├── docs-public/              # 公开评估与测试记录
└── .env.example              # 环境变量模板
```

---

## 自托管

### 依赖要求

- [Supabase](https://supabase.com) 项目（认证 + 数据库）
- LLM 接入 —— 通过 [LiteLLM](https://github.com/BerriAI/litellm) 代理或直接 API Key（Google AI Studio、Replicate 等）
- 图片生成 —— [FAL](https://fal.ai)（可选，用于角色头像生成）
- 文件存储 —— Cloudflare R2 或兼容 S3 的存储（可选，用于角色素材）

### 快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/sparkcore.git
cd sparkcore

# 2. 安装依赖
cd apps/web && pnpm install

# 3. 配置环境变量
cp ../../.env.example .env.local
# 填写 SUPABASE_URL、SUPABASE_ANON_KEY、LITELLM_BASE_URL 等

# 4. 执行数据库迁移
npx supabase db push

# 5. 启动本地模型网关（可选）
cd ../../scripts && bash start-litellm-proxy.sh

# 6. 启动 Web 应用
cd ../apps/web && pnpm dev
```

完整自托管指南：[`docs-public/self-hosting.md`](./docs-public/self-hosting.md)

Web 应用快速启动：[`apps/web/README.md`](./apps/web/README.md)

试用清单：[`docs-public/v1-trial-checklist.zh-CN.md`](./docs-public/v1-trial-checklist.zh-CN.md)

### IM 渠道接入

SparkCore 通过统一的适配器合约支持多个 IM 渠道，设置对应的环境变量并运行渠道 Worker 即可接入：

- **Telegram** —— `apps/web/scripts/telegram-set-webhook.ts`
- **Discord** —— `apps/web/deploy/fly.discord.toml`
- **飞书 / Lark** —— `apps/web/deploy/fly.feishu.toml`
- **微信 OpenILink** —— `apps/web/deploy/fly.wechat.toml`

适配器合约见 [`docs/engineering/im_adapter_contract_v1.0.md`](./docs/engineering/im_adapter_contract_v1.0.md)，部署拓扑见 [`docs/engineering/2026-04-06-im-and-deployment-topology.md`](./docs/engineering/2026-04-06-im-and-deployment-topology.md)。

---

## 核心包说明

### `packages/core/memory`

记忆类型合约——整个运行时共享的设计语言：

- [`contract.ts`](./packages/core/memory/contract.ts) — `MemoryRecord`、`MemoryWriteRequest`、`MemoryRecallQuery`，以及分类/作用域/稳定性/状态类型
- [`records.ts`](./packages/core/memory/records.ts) — 标准记忆类型和记录辅助函数
- [`knowledge.ts`](./packages/core/memory/knowledge.ts) — 知识治理类型
- [`namespace.ts`](./packages/core/memory/namespace.ts) — 记忆命名空间层级（用户 → Agent → 线程 → 项目 → 世界）
- [`packs.ts`](./packages/core/memory/packs.ts) — 场景记忆包定义
- [`compaction.ts`](./packages/core/memory/compaction.ts) — 线程压缩和保留策略类型

### `packages/integrations/im-adapter`

IM 适配器合约——跨消息平台的统一接口：

- [`contract.ts`](./packages/integrations/im-adapter/contract.ts) — 入站/出站消息类型
- [`bridge.ts`](./packages/integrations/im-adapter/bridge.ts) — 消息路由与适配器编排

### `apps/web/lib/chat`

运行时实现——调度与合成逻辑所在：

- `layer-prompt-builders.ts` — 记忆层组装
- `memory-knowledge.ts` — 知识门控与治理路由
- `answer-decision.ts` — 问题类型 → 答策路由
- `runtime-generation-context.ts` — 最终上下文合成
- `memory-packs.ts` — 当前场景包解析

---

## 参考实现：lagun.app

[lagun.app](https://lagun.app) 是本仓库的生产部署——一个 IM 原生的长记忆 AI 伴侣。

它在生产中展示了：

- 五层记忆结构的完整运行（角色核心 → 长期记忆 → 知识层 → 线程状态 → 近期对话）
- 多平台 IM 接入（Telegram 主线，微信/Discord/飞书可用）
- Web 端伴侣界面，含记忆可见性、追踪、纠错和恢复流程
- 角色创建、头像生成和知识库管理
- 订阅与积分体系（基于 Creem，可替换）

---

## 架构文档索引

- [单 Agent 运行时设计](./docs/architecture/single_agent_runtime_design_v1.0.md)
- [记忆层设计](./docs/architecture/memory_layer_design_v1.0.md)
- [角色层设计](./docs/architecture/role_layer_design_v1.0.md)
- [会话层设计](./docs/architecture/session_layer_design_v1.0.md)
- [运行时合约](./docs/architecture/runtime_contract_v1.0.md)
- [IM 适配器合约](./docs/engineering/im_adapter_contract_v1.0.md)
- [答策 / 问题类型矩阵](./docs-public/answer-strategy-question-matrix.zh-CN.md)

---

## 参与贡献

贡献指南正在完善中。欢迎提交 Issue、参与讨论和提交 PR。

欢迎贡献的模块：

- 记忆层实现与召回策略
- 新的 IM 适配器集成
- 评估工具链和回归测试集
- 自托管文档

---

## 开源协议

[AGPL-3.0](./LICENSE) —— 你可以自由使用、修改和自托管本软件。如果你将修改版本作为网络服务运行，必须在相同协议下开放源代码。

商业授权咨询请联系维护者。
