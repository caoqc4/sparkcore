# SparkCore Multi-IM Production Runbook Template

Date: 2026-04-03

## 1. Purpose

This runbook is the execution template for putting SparkCore's current multi-IM stack online.

It assumes the architecture decision in:

- [2026-04-03-multi-im-production-deployment-options.md](/Users/caoq/git/sparkcore/docs/engineering/2026-04-03-multi-im-production-deployment-options.md)

This template is intentionally operational. It is meant to be copied, adjusted, and checked off during real deployment.

## 2. Target Production Shape

### 2.1 Web

Host:

- `Vercel`

Responsibilities:

- website
- auth
- binding pages
- Telegram webhook routes
- WeChat login/status APIs
- normal product APIs

### 2.2 IM Worker

Host:

- `small VPS` or `Railway`

Responsibilities:

- Discord gateway worker
- Feishu websocket worker
- WeChat session manager

Start command:

```bash
npm run im:workers:dev
```

## 3. Preflight Checklist

Before touching production:

- [ ] production Supabase project exists
- [ ] Vercel production project is healthy
- [ ] worker host is created
- [ ] all IM platform credentials are ready
- [ ] all required database migrations are applied
- [ ] Telegram production webhook domain is known
- [ ] Discord bot is installed and production-ready
- [ ] Feishu app is published and available in the target workspace
- [ ] WeChat B-mode flow has been verified in staging or local production-like testing

## 4. Environment Variable Split

## 4.1 Web Variables

Required on `Vercel`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LITELLM_BASE_URL=
LITELLM_API_KEY=

NEXT_PUBLIC_APP_URL=
```

Telegram webhook side:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
```

If production still uses per-character Telegram bots:

```bash
TELEGRAM_BOT_TOKEN_CARIA=
TELEGRAM_WEBHOOK_SECRET_CARIA=
TELEGRAM_BOT_USERNAME_CARIA=

TELEGRAM_BOT_TOKEN_TEVEN=
TELEGRAM_WEBHOOK_SECRET_TEVEN=
TELEGRAM_BOT_USERNAME_TEVEN=

TELEGRAM_BOT_TOKEN_VELIA=
TELEGRAM_WEBHOOK_SECRET_VELIA=
TELEGRAM_BOT_USERNAME_VELIA=
```

## 4.2 Worker Variables

Required on the worker host:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LITELLM_BASE_URL=
LITELLM_API_KEY=

DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_BOT_TOKEN=

FEISHU_APP_ID=
FEISHU_APP_SECRET=
```

Notes:

- The worker needs Supabase service role access because it writes receipts, resolves bindings, and updates WeChat session state.
- The worker does not need Telegram webhook env to function unless future worker responsibilities expand.

## 5. Database Rollout

Apply all pending IM migrations before enabling traffic.

At minimum verify these groups are included:

- channel platform capability migrations
- Discord activation migration
- Feishu activation migration
- WeChat activation migration
- `wechat_openilink_sessions`
- WeChat session RLS policies

Checklist:

- [ ] migrations applied to production
- [ ] `channel_platform_capabilities` includes Telegram / Discord / Feishu / WeChat
- [ ] `wechat_openilink_sessions` exists
- [ ] WeChat session policies are active

## 6. Web Deployment Steps

### 6.1 Prepare Vercel

- [ ] update production env vars
- [ ] confirm `NEXT_PUBLIC_APP_URL`
- [ ] confirm Supabase production values
- [ ] redeploy web

### 6.2 Verify Web Health

- [ ] homepage loads
- [ ] login works
- [ ] `/app/channels` loads
- [ ] `/connect-im` loads for an authenticated user

## 7. Worker Deployment Steps

### 7.1 Build / Install

On the worker host:

```bash
git clone <repo>
cd sparkcore/apps/web
npm install
```

### 7.2 Configure Env

Set the worker env vars listed above.

### 7.3 Start Worker

Use one of these:

- `pm2`
- `systemd`
- `supervisor`
- `Railway service command`

Command:

```bash
npm run im:workers:dev
```

### 7.4 Worker Health Check

Expected startup signals:

- Discord: gateway connected and ready
- Feishu: ws client ready
- WeChat: session manager loop starts and reports active session count

Checklist:

- [ ] worker process stays alive
- [ ] Discord startup logs are healthy
- [ ] Feishu startup logs are healthy
- [ ] WeChat session manager does not crash on boot

## 8. Telegram Production Step

After the production Vercel domain is stable, set Telegram webhook.

Run in the production-configured environment:

```bash
npm run telegram:webhook:set
```

Checklist:

- [ ] webhook set successfully
- [ ] Telegram test message reaches web
- [ ] Telegram reply returns to user

## 9. WeChat Production Step

WeChat uses B-mode in production:

- platform operator does not hold a single global product session
- each user connects their own WeChat session
- worker host only runs the WeChat session manager

Checklist:

- [ ] user can click `Start WeChat Login`
- [ ] QR page opens
- [ ] user scans
- [ ] first WeChat message is captured
- [ ] IDs are filled
- [ ] binding completes
- [ ] session becomes `active`
- [ ] later WeChat messages are handled by the session manager

## 10. End-to-End Validation

After both web and worker are live, test all platforms with real messages.

### 10.1 Telegram

- [ ] send message
- [ ] receive reply
- [ ] website message thread syncs

### 10.2 Discord

- [ ] send DM
- [ ] receive reply
- [ ] website message thread syncs

### 10.3 Feishu

- [ ] send bot message
- [ ] receive reply
- [ ] website message thread syncs

### 10.4 WeChat

- [ ] connect user-owned session
- [ ] send message
- [ ] receive reply
- [ ] website message thread syncs

### 10.5 Receipts

- [ ] `im_inbound_receipts` receives rows for all active IM paths
- [ ] statuses progress correctly
- [ ] no uncontrolled duplicate processing

## 11. Observability Checks

Before opening to users, verify:

- [ ] worker logs are accessible
- [ ] Vercel logs are accessible
- [ ] Supabase tables can be inspected quickly
- [ ] receipts can be filtered by platform
- [ ] WeChat session rows can be inspected by user/status

Recommended quick-watch tables:

- `channel_bindings`
- `im_inbound_receipts`
- `messages`
- `wechat_openilink_sessions`

## 12. Failure Handling

### 12.1 Discord Failure

Symptoms:

- gateway disconnected
- DMs stop replying

Actions:

- restart worker
- check Discord credentials
- inspect gateway logs

### 12.2 Feishu Failure

Symptoms:

- no ws events
- no Feishu replies

Actions:

- restart worker
- verify Feishu app credentials
- verify app publication and event subscription

### 12.3 WeChat Failure

Symptoms:

- specific user stops receiving replies
- session row becomes `expired`

Actions:

- do not restart the entire product flow first
- ask the affected user to reconnect WeChat
- inspect `wechat_openilink_sessions`
- verify session manager is still healthy

### 12.4 Telegram Failure

Symptoms:

- webhook requests stop
- Telegram replies stop

Actions:

- verify webhook is still configured
- inspect Vercel logs
- re-run `npm run telegram:webhook:set` if necessary

## 13. Rollback Plan

If a production release is unstable:

### 13.1 Web Rollback

- roll Vercel back to previous deployment

### 13.2 Worker Rollback

- redeploy or restart worker from previous known-good revision

### 13.3 Platform Scope Reduction

If needed, temporarily reduce scope:

- keep Telegram live
- disable Discord / Feishu / WeChat connection entry points in product UI
- preserve existing data
- restore workers after the issue is understood

## 14. Post-Launch Review

Within the first 24 to 72 hours after launch:

- [ ] review worker stability
- [ ] review receipt volume by platform
- [ ] review WeChat reconnect frequency
- [ ] review Discord / Feishu connection errors
- [ ] review user confusion around channel discovery / binding

## 15. Recommended Fill-In Fields Before Real Launch

Before using this runbook for real, replace these placeholders:

- production Vercel project name
- worker host choice
- worker restart command
- worker log access path
- Telegram production domain
- on-call owner
- rollback owner
- Supabase production project reference

## 16. Suggested Ownership

Recommended owners for real launch:

- `web owner`
- `worker owner`
- `database / migration owner`
- `IM credential owner`
- `launch verifier`

That keeps launch execution from collapsing into one person doing all checks manually.
