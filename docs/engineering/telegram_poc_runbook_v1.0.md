# Telegram PoC 运行说明 v1.0

## 1. 文档定位

本文档用于记录 SparkCore 当前 Telegram 单通道 PoC 的最小运行方式、验证步骤和收尾步骤。

本文档重点回答：

- Telegram PoC 当前验证到了什么程度
- 什么时候 bot 可以正常回复
- 如何重新拉起一次最小闭环验证
- 这条链路依赖哪些环境和临时条件
- 验证结束后应如何收尾

> 状态：当前有效
> 对应阶段：Phase 1 / IM adapter 单通道 PoC
> 相关文档：
> - `docs/engineering/im_adapter_contract_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 当前结论

当前 Telegram PoC 已经验证通过以下最小闭环：

1. Telegram webhook 入站
2. 入站消息标准化
3. `channel_bindings` 真实查询
4. `handleInboundChannelMessage(...)`
5. `webImRuntimePort`
6. runtime 输出转 Telegram 文本出站

这意味着：

- Telegram 作为第一个最快验证闭环的通道是成立的
- 当前接入层、binding lookup、runtime port 和最小 webhook 路由已经能协作工作

---

## 3. 当前 bot 为什么可能“能发消息但不回复”

Telegram bot 是否会回复，不取决于 bot 本身是否存在，而取决于以下链路是否同时成立：

1. webhook 已注册到一个有效的公网 HTTPS 地址
2. webhook 对应的服务当前在线
3. 当前地址能访问到 `/api/integrations/telegram/webhook`
4. `channel_bindings` 中存在与当前 Telegram 身份匹配的 active binding
5. runtime 所依赖的 LiteLLM 网关可用

如果其中任意一环断开，就会出现：

- 你可以继续给 bot 发消息
- 但 bot 不会自动回复

本轮验证结束后已经主动做了两件收尾动作：

- 删除测试 binding
- 删除 Telegram webhook

所以当前状态下：

**bot 仍然存在，也可以收到你发的消息，但不会自动回复。**

---

## 4. 重新拉起一次 Telegram 闭环需要什么

### 4.1 必备环境变量

在 `apps/web/.env.local` 中至少需要：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
```

### 4.2 LiteLLM 可用

当前 runtime 需要 LiteLLM 网关可访问。

有两种方式：

1. 启动本地 LiteLLM proxy
2. 临时把本地运行环境指向可用的远端 LiteLLM 网关

如果 LiteLLM 不可用，Telegram webhook 会命中，但 runtime 会在生成阶段失败。

### 4.3 公网 HTTPS 地址

Telegram webhook 必须指向一个可公开访问的 HTTPS 地址，例如：

- Vercel 部署地址
- Cloudflare Tunnel 临时地址
- ngrok / cloudflared 暴露出的本地地址

---

## 5. 最小运行步骤

### Step 1：启动 Web 服务

在 `apps/web` 下启动：

```bash
npm run dev
```

### Step 2：准备公网地址

例如使用 cloudflared：

```bash
cloudflared tunnel --protocol http2 --url http://localhost:3000
```

得到类似：

```text
https://<random>.trycloudflare.com
```

### Step 3：注册 Telegram webhook

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run telegram:webhook:set -- --webhook-base-url https://<random>.trycloudflare.com
```

确认方式：

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

期望结果：

- `url` 非空
- 指向当前 webhook 地址

### Step 4：给当前 Telegram 身份创建 binding

需要先拿到 webhook 入站身份字段：

- `channel_id`
- `peer_id`
- `platform_user_id`

私聊场景下，这三者通常会是同一个 Telegram user/chat id。

推荐用脚本创建：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run telegram:binding:upsert -- \
  --thread-id <thread_id> \
  --channel-id <channel_id> \
  --peer-id <peer_id> \
  --platform-user-id <platform_user_id>
```

这条命令会自动从 `thread_id` 反查：

- `workspace_id`
- `owner_user_id`
- `agent_id`

如果你暂时没有 `thread_id`，也可以显式传：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run telegram:binding:upsert -- \
  --workspace-id <workspace_id> \
  --user-id <user_id> \
  --agent-id <agent_id> \
  --channel-id <channel_id> \
  --peer-id <peer_id> \
  --platform-user-id <platform_user_id>
```

### Step 5：发送一条文本消息验证闭环

验证目标是：

- webhook 命中
- binding found
- runtime processed
- Telegram 收到文本回复

---

## 5.1 推荐重跑顺序

如果要完整重跑一次 Telegram PoC，当前最推荐的顺序是：

1. `./scripts/start-litellm-proxy.sh` 或临时切远端 LiteLLM gateway
2. `cd apps/web && npm run dev`
3. `cloudflared tunnel --protocol http2 --url http://localhost:3000`
4. `npm run telegram:webhook:set -- --webhook-base-url https://<random>.trycloudflare.com`
5. 拿到 Telegram 入站身份
6. `npm run telegram:binding:upsert -- --thread-id ... --channel-id ... --peer-id ... --platform-user-id ...`
7. 给 bot 发送文本消息验证回复

---

## 6. 本轮验证中暴露出的关键工程点

### 6.1 webhook 路径不能依赖 request-scope Supabase client

在 Telegram webhook 场景里，不能依赖 `cookies()` 驱动的用户态 Supabase client。

因此当前接入路径改成了：

- binding lookup 走 service-role client
- runtime 路径支持注入已有 `supabase` client

### 6.2 memory planner 失败不能打爆整轮 turn

模型偶尔会返回不严格的 JSON。

当前已经做的收口是：

- `planMemoryWriteRequests(...)` 在解析失败时降级返回空数组
- 不让 memory planner 失败阻塞 assistant reply

### 6.3 LiteLLM 是否在线会直接决定 PoC 是否成功

如果 `LITELLM_BASE_URL` 指向一个当前不可用的地址，Telegram webhook 看起来像“接到了消息”，但最终不会回复。

---

## 7. 当前代码入口

本轮 Telegram PoC 直接相关的代码包括：

- `apps/web/app/api/integrations/telegram/webhook/route.ts`
- `apps/web/lib/integrations/telegram.ts`
- `apps/web/lib/integrations/im-adapter.ts`
- `apps/web/lib/chat/im-binding-lookup.ts`
- `apps/web/lib/chat/im-runtime-port.ts`
- `apps/web/lib/supabase/admin.ts`

---

## 8. 验证完成后的推荐收尾

每次验证完成后，建议做以下收尾：

1. 删除测试 binding
2. 删除 webhook
3. 停掉本地 dev 服务
4. 停掉临时隧道

删除 webhook：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run telegram:webhook:delete -- --drop-pending-updates
```

确认方式：

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

期望结果：

- `url` 为空字符串

删除测试 binding：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run telegram:binding:delete -- \
  --channel-id <channel_id> \
  --peer-id <peer_id> \
  --platform-user-id <platform_user_id>
```

---

## 9. 当前建议

当前 Telegram PoC 已经证明“单通道最快验证闭环”是可行的。

下一阶段更建议做的不是继续堆 Telegram 平台特性，而是：

1. 补一份更正式的接入运行说明
2. 明确 LiteLLM 的稳定运行方式
3. 再决定是否把 Telegram 从 PoC 推进到更稳定的开发入口

当前不建议立刻做：

- 图片 / 附件支持
- 多命令体系
- 多平台并行
- 产品化绑定 UI
