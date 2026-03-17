# SparkCore v1 试用检查清单

这份清单面向第一次拿到仓库、希望验证当前 v1 聊天工作台是否可用的试用者。

## 开始前

- [ ] 已安装 Node.js 20+
- [ ] 已安装 `npm`
- [ ] 已准备好 Supabase 项目
- [ ] 已根据 [`.env.example`](../.env.example) 填好 `apps/web/.env.local`
- [ ] 已准备好 LiteLLM 网关，或可以启动本地 LiteLLM proxy

如果你使用仓库内置的本地 proxy：

- [ ] 已安装 `uv`
- [ ] 已设置 `REPLICATE_API_KEY`

## 本地启动

- [ ] 执行 `cd apps/web && npm install`
- [ ] 已在 Supabase 中按顺序执行 `supabase/migrations` 下的 SQL 文件
- [ ] 如有需要，启动 LiteLLM：`./scripts/start-litellm-proxy.sh`
- [ ] 启动应用：`cd apps/web && npm run dev`
- [ ] 打开 `http://localhost:3000/login`

## 试用主链

- [ ] Magic Link 登录正常
- [ ] 登录后可看到 workspace
- [ ] `/chat?thread=<id>` 能正确打开并恢复当前 thread
- [ ] 可以新建 thread
- [ ] 新建 thread 时可以选择 agent
- [ ] 首条用户消息能收到 assistant 回复
- [ ] assistant 回复下方能看到 runtime summary

## Agent 检查

- [ ] 可以从 persona pack 创建新 agent
- [ ] 可以设置 workspace default agent
- [ ] 可以重命名 agent
- [ ] 可以查看当前 model profile
- [ ] 可以切换 model profile，并影响后续回复

## Memory 检查

- [ ] sidebar 中可以看到 memory
- [ ] 支持的 memory 可以看到 source trace
- [ ] 可以 hide 一条 memory
- [ ] 可以把一条 memory 标记为 incorrect
- [ ] hidden / incorrect 的 memory 可以 restore
- [ ] restore 后会重新可见，并重新参与 recall

## 可选回归检查

- [ ] 执行 `cd apps/web && npm run smoke:test`

## 给试用者的说明

- smoke 回归会通过测试专用接口自动 seed 测试数据，不需要额外准备完整 demo 数据
- hidden 或 incorrect 的 memory 不应继续参与后续 recall
- agent 相关修改只影响后续回复
- 已有 thread 绑定和历史回合不会被追改
