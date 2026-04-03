# SparkCore Multi-IM Production Deployment Options

Date: 2026-04-03

## 1. Purpose

This document defines the current production deployment options for SparkCore's multi-IM stack after Telegram, Discord, Feishu, and WeChat have all been connected in development.

It focuses on:

- what can stay on Vercel
- what must run as a long-lived worker
- the two practical deployment options for the current phase
- which option is recommended before PMF

## 2. Current Runtime Shape

SparkCore now has two different runtime categories:

1. `web`
   - Next.js app
   - product UI
   - connect / bind flows
   - Telegram webhook routes
   - WeChat login/status routes
   - regular API routes

2. `im-worker`
   - long-lived Discord gateway connection
   - long-lived Feishu websocket connection
   - long-lived WeChat session manager

This means the current system is no longer "web only".

## 3. Why Vercel Alone Is Not Enough

Vercel can continue to host the web app well, but it is not the right place for the full IM runtime because:

- Discord uses a persistent gateway connection
- Feishu uses a persistent websocket client
- WeChat B-mode uses a long-lived session manager that monitors many user-owned sessions

These are long-running Node processes, not normal request/response routes.

So the correct production shape is:

- `Vercel` for `web`
- a separate always-on worker host for `im-worker`

## 4. Runtime Split

### 4.1 Web

Keep `web` on Vercel.

Responsibilities:

- website and product UI
- auth
- connect / reconnect pages
- Telegram webhook
- WeChat login attempt APIs
- Supabase-backed app logic

### 4.2 IM Worker

Run a separate always-on Node service for:

```bash
npm run im:workers:dev
```

This currently starts:

- Discord gateway worker
- Feishu websocket worker
- WeChat OpeniLink session manager

Telegram does not need to live in this worker, because it currently comes in through webhook routes on `web`.

## 5. Option A: Vercel + Small VPS

### 5.1 Shape

- `Vercel` hosts the web app
- one small VPS hosts the IM worker process

### 5.2 Recommended Runtime On The VPS

Use one always-on process manager such as:

- `pm2`
- `systemd`
- `supervisor`
- or a small Docker container

Run:

```bash
cd /path/to/apps/web
npm run im:workers:dev
```

### 5.3 Pros

- lowest recurring cost with predictable resources
- stable for long-running websocket / gateway workloads
- easiest to reason about operationally
- avoids mixing product traffic with VPN traffic
- good fit before PMF

### 5.4 Cons

- you own more ops
- you need basic process supervision and restart handling
- TLS / machine security / logs are your responsibility

### 5.5 Recommendation

This is the best default if:

- you want to keep costs low
- you are okay managing one small machine
- you want fewer platform surprises

## 6. Option B: Vercel + Railway Worker

### 6.1 Shape

- `Vercel` hosts the web app
- `Railway` hosts the IM worker

### 6.2 Runtime

Deploy the repo or `apps/web` service to Railway and set the start command to:

```bash
npm run im:workers:dev
```

### 6.3 Pros

- easiest operationally
- fast to deploy
- built-in environment variable management
- good developer experience for long-running Node workers

### 6.4 Cons

- ongoing platform cost
- less cost-efficient than a tiny VPS at small scale
- still another service to manage beside Vercel

### 6.5 Recommendation

This is the best default if:

- you want the lowest ops burden
- you are okay paying slightly more
- you want the simplest team workflow before PMF

## 7. What Not To Do

### 7.1 Do Not Use Vercel Alone

Do not try to put Discord / Feishu / WeChat worker logic only on Vercel.

That would leave the system unable to reliably maintain:

- Discord gateway
- Feishu long connection
- WeChat session manager

### 7.2 Do Not Use The Existing VPN VPS As The Final Worker Host

It may be okay for temporary internal testing, but it is not recommended for real production because:

- VPN traffic can destabilize long-lived IM connections
- network behavior becomes harder to reason about
- security boundaries are mixed together
- WeChat / OpeniLink is already sensitive to network conditions

Use a dedicated small VPS instead if you choose the VPS route.

## 8. Recommended Decision For Current Phase

Before PMF:

- keep `web` on Vercel
- add exactly one dedicated IM worker host

Recommended order:

1. if you want lowest cost: `Vercel + small VPS`
2. if you want lowest ops burden: `Vercel + Railway`

Do not over-optimize beyond this before PMF.

## 9. Environment Variables

### 9.1 Shared Core

These are needed in both `web` and `im-worker` unless otherwise noted:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LITELLM_BASE_URL=
LITELLM_API_KEY=
```

### 9.2 Telegram

Needed on `web`:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
```

If the deployment still uses per-character Telegram bots, also include:

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

### 9.3 Discord

Needed on `im-worker`:

```bash
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_BOT_TOKEN=
```

### 9.4 Feishu

Needed on `im-worker`:

```bash
FEISHU_APP_ID=
FEISHU_APP_SECRET=
```

### 9.5 WeChat

Needed on both sides of the B-mode flow:

- `web` must be able to create login attempts
- `im-worker` must be able to monitor active user-owned WeChat sessions in the database

There is no longer a production requirement for a single global WeChat session file in the target B-mode architecture.

## 10. Database Requirements

Before production, all current IM migrations must be applied, especially:

- channel platform capability migrations
- Discord activation migration
- Feishu activation migration
- WeChat activation migration
- `wechat_openilink_sessions`
- WeChat session RLS policies

## 11. Telegram Production Step

After the final Vercel domain is ready, set the Telegram webhook against the production URL.

Use the existing script in the correct environment:

```bash
npm run telegram:webhook:set
```

## 12. WeChat Production Model

WeChat should be treated differently from Telegram / Discord / Feishu.

### 12.1 Target Model

Use WeChat `B-mode`:

- platform operator does **not** scan a global product QR
- each user scans their **own** WeChat OpeniLink / ClawBot login
- each user gets their own stored WeChat session
- if one session expires, only that user reconnects

### 12.2 Operational Meaning

This means:

- no platform-wide WeChat bot session should be required to keep the system working
- the worker host only runs the session manager
- the actual WeChat sessions come from users' own connect flows

## 13. Production Validation Checklist

Before public rollout, validate:

1. `web` is live on Vercel
2. `im-worker` is running continuously
3. Discord can receive and reply
4. Feishu can receive and reply
5. WeChat B-mode can:
   - start login
   - open QR page
   - capture first message
   - bind
   - continue receiving later messages through the session manager
6. Telegram webhook is set against production
7. `im_inbound_receipts` is recording delivery states
8. reconnect / disconnect behavior works cleanly for all platforms

## 14. Suggested Next Ops Step

When deployment work begins for real, create a follow-up runbook with:

- exact host choice
- exact environment variable ownership per service
- process manager commands
- restart policy
- log access
- health checks
- rollback steps

At the current phase, this decision note is enough to avoid architecture drift.
