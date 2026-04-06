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
- 一个 Google AI Studio API Key
- 一个 fal.ai API Key

## 环境变量

以仓库根目录的 [`.env.example`](../../.env.example) 为基准。

常用变量如下：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_STUDIO_API_KEY=
FAL_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
CREEM_PRICE_PRO_MONTHLY=
CREEM_PRICE_PRO_QUARTERLY=
CREEM_PRICE_PRO_YEARLY=
CREEM_PRICE_CREDITS_100=
CREEM_PRICE_CREDITS_250=
CREEM_PRICE_CREDITS_700=
CREEM_SIMULATE=true
```

建议把这些值写到：

- `apps/web/.env.local`

支付相关补充说明：

- `CREEM_API_KEY` 和 `CREEM_WEBHOOK_SECRET` 用于真实 Creem checkout 与 webhook
- `CREEM_PRICE_PRO_MONTHLY`、`CREEM_PRICE_PRO_QUARTERLY`、`CREEM_PRICE_PRO_YEARLY` 对应 Pro 的三个计费周期 price id
- `CREEM_PRICE_CREDITS_100`、`CREEM_PRICE_CREDITS_250`、`CREEM_PRICE_CREDITS_700` 对应积分包 price id
- 本地调试时可设置 `CREEM_SIMULATE=true`，这样会走站内模拟跳转，不创建真实支付

## 推荐本地启动路径

1. 安装依赖

```bash
cd apps/web
npm install
```

2. 执行 Supabase migrations

当前最简单的方式，是在 Supabase SQL Editor 中按时间顺序执行 `supabase/migrations` 里的 SQL 文件。

3. 配置模型提供方

当前 SparkCore 直接调用官方/原生提供方：

- 文本：Google AI Studio `gemini-2.5-flash`
- 图片：fal.ai `fal-ai/flux-2/klein/4b`

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
npm run ai:test
npm run smoke:test
npm run quality:eval
```

## 说明

- `smoke:test` 依赖 `.env.local` 里的 smoke 相关变量以及 `SUPABASE_SERVICE_ROLE_KEY`
- smoke 回归会通过测试专用接口自动 seed 测试数据，不需要你手工准备一整套演示数据
- `.github/workflows/web-smoke.yml` 会在 `apps/web` 相关改动时跑 `typecheck` 和 `smoke:test`
- 如果要让这个 workflow 在 GitHub Actions 上可用，至少需要配置这些 secrets：
  `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、
  `GOOGLE_AI_STUDIO_API_KEY`、`FAL_KEY`、`NEXT_PUBLIC_APP_URL`、
  `PLAYWRIGHT_SMOKE_SECRET`、`PLAYWRIGHT_SMOKE_EMAIL`、`PLAYWRIGHT_SMOKE_PASSWORD`
- 如果 CI 里还要覆盖计费和分析链路，再补这些 secrets：
  `CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`、`CREEM_PRICE_PRO_MONTHLY`、
  `CREEM_PRICE_PRO_QUARTERLY`、`CREEM_PRICE_PRO_YEARLY`、`CREEM_PRICE_CREDITS_100`、
  `CREEM_PRICE_CREDITS_250`、`CREEM_PRICE_CREDITS_700`、`NEXT_PUBLIC_POSTHOG_KEY`、
  `NEXT_PUBLIC_POSTHOG_HOST`、`NEXT_PUBLIC_CLARITY_PROJECT_ID`
- 当前试用文档同时提供英文版：[`README.md`](./README.md)
- 更完整的试用检查项见：[`../../docs-public/v1-trial-checklist.zh-CN.md`](../../docs-public/v1-trial-checklist.zh-CN.md)
- Stage 1 质量评测样例集见：[`../../docs-public/stage1-quality-eval-set.zh-CN.md`](../../docs-public/stage1-quality-eval-set.zh-CN.md)
- 真实对话质量回归样例集见：[`../../docs-public/real-chat-quality-regression-set.zh-CN.md`](../../docs-public/real-chat-quality-regression-set.zh-CN.md)
