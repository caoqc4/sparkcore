# Web 应用

`apps/web` 是当前 SparkCore v1 聊天工作台的主应用。

当前已具备：

- Next.js App Router 应用壳
- Supabase Magic Link 登录
- 多 thread 聊天与 `/chat?thread=<id>` 恢复
- agent 创建、默认 agent、轻量编辑与 model profile 切换
- memory 可见、trace、纠错、恢复与轻量收敛
- Playwright smoke 回归保护

## 运行前准备

本地试用前，建议先准备：

- Node.js 20+
- npm
- 一个 Supabase 项目
- 一个 LiteLLM 网关

如果你想直接用仓库自带的本地 LiteLLM proxy，还需要：

- `uv`
- `REPLICATE_API_KEY`

## 环境变量

以仓库根目录的 [`.env.example`](../../.env.example) 为基准。

常用变量如下：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LITELLM_BASE_URL=
LITELLM_API_KEY=
REPLICATE_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

建议把这些值写到：

- `apps/web/.env.local`

## 推荐本地启动路径

1. 安装依赖

```bash
cd apps/web
npm install
```

2. 执行 Supabase migrations

当前最简单的方式，是在 Supabase SQL Editor 中按时间顺序执行 `supabase/migrations` 里的 SQL 文件。

3. 启动 LiteLLM

如果你已经有自己的 LiteLLM 网关，直接把 `LITELLM_BASE_URL` 和 `LITELLM_API_KEY` 指向它即可。

如果你想使用仓库提供的本地 proxy：

```bash
cd /Users/caoq/git/sparkcore
./scripts/start-litellm-proxy.sh
```

4. 启动 Web 应用

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run dev
```

5. 打开：

- `http://localhost:3000/login`

## 推荐试用路径

按下面顺序最容易确认主链正常：

1. 发送 Magic Link 并完成登录
2. 进入 `/chat`
3. 新建 thread 并选择 agent
4. 发送第一条消息，确认 assistant 正常回复
5. 在 sidebar 里查看 memory、agent、runtime summary
6. 试一下 hide / incorrect / restore

## 常用命令

```bash
npm run dev
npm run typecheck
npm run build
npm run litellm:test -- --model <your-model-name>
npm run smoke:test
npm run quality:eval
```

## 说明

- `smoke:test` 依赖 `.env.local` 里的 smoke 相关变量以及 `SUPABASE_SERVICE_ROLE_KEY`
- smoke 回归会通过测试专用接口自动 seed 测试数据，不需要你手工准备一整套演示数据
- 当前试用文档同时提供英文版：[`README.md`](./README.md)
- 更完整的试用检查项见：[`../../docs-public/v1-trial-checklist.zh-CN.md`](../../docs-public/v1-trial-checklist.zh-CN.md)
- Stage 1 质量评测样例集见：[`../../docs-public/stage1-quality-eval-set.zh-CN.md`](../../docs-public/stage1-quality-eval-set.zh-CN.md)
- 真实对话质量回归样例集见：[`../../docs-public/real-chat-quality-regression-set.zh-CN.md`](../../docs-public/real-chat-quality-regression-set.zh-CN.md)
