# LiteLLM 开发运行说明 v1.0

## 1. 文档定位

本文档用于收束 SparkCore 当前阶段在本地开发、Web Workspace 验证和 Telegram PoC 中对 LiteLLM 的使用方式。

本文档重点回答：

- 本地开发时 LiteLLM 应该怎么配
- 什么情况下使用本地 proxy
- 什么情况下临时改用远端 gateway
- `.env.local` 建议保持什么样的默认值
- 如何快速判断当前失败是不是 LiteLLM 引起的

> 状态：当前有效
> 对应阶段：Phase 1 / Web + Telegram PoC
> 相关文档：
> - `apps/web/README.md`
> - `docs/engineering/telegram_poc_runbook_v1.0.md`

---

## 2. 一句话建议

**默认本地开发优先使用本地 LiteLLM proxy；只有在需要快速验证接入闭环、而本地 proxy 没启动或暂时不可用时，才临时切换到远端 gateway。**

---

## 3. 当前存在的两种 LiteLLM 路径

### 3.1 本地 LiteLLM proxy

仓库内已提供：

- `scripts/start-litellm-proxy.sh`
- `scripts/litellm/config.yaml`

它的特点是：

- 面向本地开发
- 默认监听本地地址
- 当前配置依赖 `REPLICATE_API_KEY`
- 默认 master key 是 `sk-sparkcore-local-dev`

适合：

- 日常本地开发
- Web Workspace 本地验证
- 本地调试 memory / runtime / role / session

---

### 3.2 远端 LiteLLM gateway

当前仓库里已经存在一套远端示例配置，体现在：

- `apps/web/.env.production.local`

它的特点是：

- 适合快速验证真实闭环
- 不依赖本机本地 proxy 已经启动
- 更适合 Telegram PoC 这种“先跑通整条链路”的场景

适合：

- PoC 验证
- 临时调试 Telegram / IM adapter
- 本地代理暂时不可用时的临时 fallback

不适合默认长期作为本地开发入口，因为：

- 容易和本地配置混淆
- 容易把“开发环境”和“验证环境”混在一起

---

## 4. 推荐 env 策略

### 4.1 `.env.local` 的建议角色

`apps/web/.env.local` 建议作为**本地开发默认配置**，优先保持：

```bash
LITELLM_BASE_URL=http://127.0.0.1:4000
LITELLM_API_KEY=sk-sparkcore-local-dev
```

这表示：

- 本地 Web 和本地脚本默认假设你会自己启动 local LiteLLM proxy
- 这和 `scripts/start-litellm-proxy.sh` 的默认行为是一致的

---

### 4.2 `.env.production.local` 的建议角色

`apps/web/.env.production.local` 更适合保存：

- 远端 gateway 地址
- 对应 API key

不建议把它当成日常开发默认值直接覆盖 `.env.local`。

更合理的使用方式是：

- 只在“接入闭环验证”或“本地 proxy 暂时不可用”时临时读取

---

### 4.3 Telegram PoC 时的推荐做法

如果你只是想快速验证 Telegram 闭环，建议：

1. 优先先把本地 proxy 启起来
2. 如果本地 proxy 不可用，再临时切远端 gateway

这次 PoC 暴露出的真实情况是：

- Telegram 接入链路已经打通
- 最后真正拦住闭环的不是 adapter，而是 `127.0.0.1:4000` 上没有 LiteLLM 服务

所以：

**Telegram PoC 失败时，第一优先检查 LiteLLM 是否在线，而不是先怀疑 webhook 或 binding。**

---

## 5. 推荐本地启动方式

### 5.1 日常本地开发

先启动 LiteLLM：

```bash
cd /Users/caoq/git/sparkcore
./scripts/start-litellm-proxy.sh
```

再启动 Web：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run dev
```

这时使用：

- `apps/web/.env.local`
- 本地 `LITELLM_BASE_URL=http://127.0.0.1:4000`

---

### 5.2 快速验证 LiteLLM 是否正常

可直接跑：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run litellm:test -- --model replicate-llama-3-8b
```

如果成功，会输出：

- `LiteLLM text generation succeeded.`

如果失败，通常能快速区分：

- 配置缺失
- 本地 proxy 未启动
- provider 调用异常

---

### 5.3 Telegram PoC 临时切远端 gateway

如果本地 proxy 没起，但你想快速验证 Telegram PoC，可以临时在当前 shell 中覆盖：

```bash
cd /Users/caoq/git/sparkcore/apps/web
export $(grep -E '^(LITELLM_BASE_URL|LITELLM_API_KEY)=' .env.production.local | xargs)
npm run dev
```

这条命令的含义是：

- 只在当前 shell 会话内临时用远端 gateway
- 不直接改写 `.env.local`

这是当前更推荐的临时验证方式。

---

## 6. 常见失败信号

### 6.1 `ECONNREFUSED 127.0.0.1:4000`

这通常表示：

- `.env.local` 正在指向本地 LiteLLM
- 但本地 proxy 没启动

优先动作：

1. 启动 `./scripts/start-litellm-proxy.sh`
2. 或临时切到远端 gateway

---

### 6.2 Web / Telegram webhook 命中，但 assistant 不回复

这通常不一定是接入层本身的问题。

优先检查：

1. LiteLLM 是否可用
2. `npm run litellm:test -- --model ...` 是否通过
3. 当前 shell 是否真的加载了你期望的 `LITELLM_BASE_URL`

---

### 6.3 本地脚本能跑，Telegram webhook 却失败

这通常说明：

- Web 进程读取到的环境变量和你当前 shell 不一致

因为：

- 你 shell 里 export 的变量，不会自动回写到已经运行中的 `next dev`

优先动作：

1. 停掉当前 `npm run dev`
2. 在正确的环境变量下重新启动

---

## 7. 当前推荐工作习惯

推荐这样区分：

### 7.1 Web / 底座开发

- 默认使用本地 proxy
- `.env.local` 保持本地地址

### 7.2 Telegram / IM adapter 闭环验证

- 默认也优先尝试本地 proxy
- 如果当下只是想快速验证整条链路，可以临时切远端 gateway

### 7.3 不建议的做法

- 不建议长期把 `.env.local` 改成远端 gateway 后忘记切回
- 不建议把“PoC 验证环境”混成“默认开发环境”

---

## 8. 当前结论

这次 Telegram PoC 说明：

- adapter / binding / webhook 链路已经可用
- 真正影响接入验证稳定性的关键外部依赖，是 LiteLLM 的可用性

因此下一阶段更合理的工程动作是：

1. 把 LiteLLM 启动方式固定下来
2. 让本地开发和 Telegram PoC 都有稳定、可重复的入口
3. 再继续推进 Telegram 或其他 IM 通道
