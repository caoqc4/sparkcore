# SparkCore Cloud Run + Fly.io Production Runbook

Date: 2026-04-06

## 1. Purpose

This runbook captures the production path that was actually used and verified for SparkCore.

It is the operational companion to:

- [2026-04-06-im-and-deployment-topology.md](/Users/caoq/git/sparkcore/docs/engineering/2026-04-06-im-and-deployment-topology.md)

This document is intentionally practical. It reflects the current working deployment:

- `apps/web` on Google Cloud Run
- Telegram handled inside the Cloud Run web service
- Discord worker on Fly.io
- Feishu worker on Fly.io
- WeChat OpenILink session manager on Fly.io
- Supabase as the shared system of record
- Cloudflare R2 serving `character-assets` through `assets.lagun.app`

## 2. Current Production Shape

### 2.1 Cloud Run

- GCP project: `sparkcore-492512`
- region: `asia-east1`
- service: `sparkcore-web`
- default service URL: `https://sparkcore-web-392438199545.asia-east1.run.app`
- mapped domains:
  - `lagun.app`
  - `www.lagun.app`

Cloud Run is responsible for:

- website
- auth
- chat actions
- `/connect-im`
- Telegram webhook endpoints
- WeChat login start/status APIs
- runtime reads of role portrait assets through `CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL`

Character assets are currently served from:

- R2 bucket: `sparkcore-character-assets`
- public base URL: `https://assets.lagun.app`

### 2.2 Fly.io

Three separate Fly apps are live:

- `sparkcore-wechat`
- `sparkcore-discord`
- `sparkcore-feishu`

Fly is responsible for:

- WeChat OpenILink session manager
- Discord gateway worker
- Feishu websocket worker

## 3. Verified Outcome

This stack has already been validated with real traffic:

- `lagun.app` was switched from the old host to Cloud Run
- WeChat binding was completed successfully on `lagun.app`
- Discord received and replied to real messages
- Feishu received and replied to real messages
- Telegram remained available from the web service path
- role portrait assets were uploaded to R2 and became reachable on `assets.lagun.app`

## 4. Preflight Checklist

Before repeating this rollout in another environment:

- [ ] Supabase project is ready
- [ ] all pending migrations are applied
- [ ] Google Cloud billing is active
- [ ] Fly.io billing is active
- [ ] `gcloud` is installed and logged in
- [ ] `flyctl` is installed and logged in
- [ ] Docker Desktop is installed and running
- [ ] Cloud Run Admin API is enabled
- [ ] Cloud Build API is enabled
- [ ] Artifact Registry API is enabled
- [ ] Cloudflare controls the target DNS zone
- [ ] Telegram / Discord / Feishu / WeChat credentials are ready
- [ ] Cloudflare R2 bucket for `character-assets` is ready
- [ ] `assets.<domain>` custom domain is attached to that bucket

## 5. Required Environment Variables

### 5.1 Shared Variables

These are needed by Cloud Run and by Fly workers unless noted otherwise:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=

GOOGLE_AI_STUDIO_API_KEY=
FAL_KEY=

CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=
```

### 5.2 Cloud Run Web Variables

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
```

Optional production integrations can still be added through:

- Azure Speech
- ElevenLabs
- Creem
- PostHog
- Clarity

Reference template:

- [cloud-run.web.env.example.yaml](/Users/caoq/git/sparkcore/apps/web/deploy/cloud-run.web.env.example.yaml)

### 5.3 Discord Worker Variables

```bash
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_BOT_TOKEN=
```

### 5.4 Feishu Worker Variables

```bash
FEISHU_APP_ID=
FEISHU_APP_SECRET=
```

### 5.5 WeChat Worker Variables

Use the current WeChat OpenILink credentials already required by the integration code path, in addition to the shared variables above.

### 5.6 Character Assets R2 Variables

This migration currently applies only to `character-assets`.

Read path only:

```bash
CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.lagun.app
```

Read + write migration / import:

```bash
CF_R2_ACCOUNT_ID=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_CHARACTER_ASSETS_BUCKET=sparkcore-character-assets
CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.lagun.app
```

Notes:

- web/runtime reads can switch to R2 once `CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL` is present
- the importer writes to R2 only when all four credential variables and the bucket name are set
- `knowledge-sources` and fal-generated chat images are not part of this migration

### 5.7 Knowledge Document R2 Variables

This applies only to uploaded knowledge documents with `source_type=document`.

```bash
CF_R2_ACCOUNT_ID=
CF_R2_KNOWLEDGE_BUCKET=
CF_R2_KNOWLEDGE_ACCESS_KEY_ID=
CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY=
```

Notes:

- no public base URL is needed for knowledge documents
- this path is intended for private object storage only
- `note` and `url` knowledge sources are unaffected
- if you intentionally reuse the shared R2 key pair, the knowledge-specific key vars can be omitted

## 6. Database Rollout

Apply all required Supabase migrations before enabling traffic.

The WeChat split deployment depends on:

- [20260406193000_create_wechat_openilink_login_attempts.sql](/Users/caoq/git/sparkcore/supabase/migrations/20260406193000_create_wechat_openilink_login_attempts.sql)

Reason:

- the web service writes login attempts into Supabase
- the Fly WeChat worker polls and advances those attempts
- the web service no longer needs to spawn a local login worker

## 7. Cloud Run Deployment

### 7.1 One-Time GCP Setup

Set project:

```bash
gcloud config set project sparkcore-492512
```

Login:

```bash
gcloud auth login
gcloud auth application-default login
```

### 7.2 Prepare Env File

Create a real env file from the example and keep it uncommitted:

```bash
cp apps/web/deploy/cloud-run.web.env.example.yaml apps/web/deploy/cloud-run.web.env.yaml
```

Fill it with production values.

### 7.3 Deploy

From repo root:

```bash
PROJECT_ID=sparkcore-492512 \
REGION=asia-east1 \
SERVICE_NAME=sparkcore-web \
ENV_VARS_FILE=apps/web/deploy/cloud-run.web.env.yaml \
bash apps/web/scripts/cloud-run-deploy.sh
```

Deployment assets:

- [cloud-run-deploy.sh](/Users/caoq/git/sparkcore/apps/web/scripts/cloud-run-deploy.sh)
- [cloudbuild.web.yaml](/Users/caoq/git/sparkcore/apps/web/deploy/cloudbuild.web.yaml)

### 7.4 Post-Deploy Updates

After the first deploy:

- update `NEXT_PUBLIC_APP_URL` to the real Cloud Run URL or production domain
- redeploy if `NEXT_PUBLIC_APP_URL` changed
- set Telegram webhook against the Cloud Run service

## 8. Fly.io Deployment

### 8.1 One-Time Local Setup

Install and log in:

```bash
brew install flyctl
flyctl auth login
```

Docker Desktop must be running before local builds:

```bash
docker version
```

Expected:

- both `Client` and `Server` sections appear

### 8.2 Fly App Names

The current app names are already set in:

- [fly.wechat.toml](/Users/caoq/git/sparkcore/apps/web/deploy/fly.wechat.toml)
- [fly.discord.toml](/Users/caoq/git/sparkcore/apps/web/deploy/fly.discord.toml)
- [fly.feishu.toml](/Users/caoq/git/sparkcore/apps/web/deploy/fly.feishu.toml)

Current names:

- `sparkcore-wechat`
- `sparkcore-discord`
- `sparkcore-feishu`

## 9. Character Assets to Cloudflare R2

### 9.1 Scope

This rollout currently migrates only role portrait / `character-assets`.

It does not migrate:

- `knowledge-sources`
- fal-hosted generated chat images

Knowledge documents can be moved later as a separate private-bucket rollout.

### 9.2 Prepare R2

Create an R2 bucket dedicated to character assets and collect:

- `CF_R2_ACCOUNT_ID`
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_CHARACTER_ASSETS_BUCKET=sparkcore-character-assets`
- `CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.lagun.app`

Current production choice:

- bucket: `sparkcore-character-assets`
- custom domain: `assets.lagun.app`

### 9.3 App Read Cutover

Set at least:

```bash
CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.lagun.app
```

on the web app environment so portrait URLs resolve to R2.

### 9.4 Backfill / Upload

From `apps/web`, run:

```bash
npm run character-assets:import
```

This importer now:

- uploads portrait/audio sample files to R2 when R2 credentials are configured
- writes `public_url` into portrait asset records
- keeps the existing Supabase path as fallback when R2 is not configured

### 9.5 Verification

After cutover, verify:

```bash
curl -I https://assets.lagun.app/portrait-pool/realistic/female/caria-main.webp
```

Expected:

- `HTTP 200`
- `server: cloudflare`
- image content type such as `image/webp`

Also confirm Cloud Run carries the read-path env:

```bash
gcloud run services describe sparkcore-web --region asia-east1 --format='get(spec.template.spec.containers[0].env)'
```

Look for:

- `CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.lagun.app`

### 8.3 Create Apps

If the apps do not already exist:

```bash
flyctl apps create sparkcore-wechat
flyctl apps create sparkcore-discord
flyctl apps create sparkcore-feishu
```

### 8.4 Set Secrets

Set secrets per app with `flyctl secrets set ... --app <app-name>`.

Minimum split:

- `sparkcore-wechat`
  - shared vars
  - WeChat OpenILink vars
- `sparkcore-discord`
  - shared vars
  - Discord vars
- `sparkcore-feishu`
  - shared vars
  - Feishu vars

### 8.5 Deploy

From repo root:

```bash
flyctl deploy -c apps/web/deploy/fly.wechat.toml --local-only
flyctl deploy -c apps/web/deploy/fly.discord.toml --local-only
flyctl deploy -c apps/web/deploy/fly.feishu.toml --local-only
```

Notes:

- `--local-only` was the reliable path in this rollout
- Docker local build avoided Fly remote builder instability during first setup

## 9. Domain Cutover

### 9.1 Domain Mapping

Map both domains to Cloud Run:

- `lagun.app`
- `www.lagun.app`

### 9.2 DNS Provider

For this rollout, the authoritative DNS was on Cloudflare, not Vercel.

Check with:

```bash
dig NS lagun.app
```

### 9.3 Cloudflare Records

Set root domain as `DNS only` and point it to Google:

`lagun.app`

- `A 216.239.32.21`
- `A 216.239.34.21`
- `A 216.239.36.21`
- `A 216.239.38.21`

`www.lagun.app`

- `CNAME ghs.googlehosted.com`

Do not enable Cloudflare proxy during certificate issuance.

### 9.4 Verify Mapping

```bash
gcloud beta run domain-mappings describe \
  --domain lagun.app \
  --region asia-east1

gcloud beta run domain-mappings describe \
  --domain www.lagun.app \
  --region asia-east1
```

Expected:

- `Ready=True`
- `CertificateProvisioned=True`

## 10. Health Checks

### 10.1 Cloud Run

```bash
curl -I https://sparkcore-web-392438199545.asia-east1.run.app/login
```

Expected:

- `HTTP 200`

### 10.2 WeChat Worker

```bash
flyctl status -a sparkcore-wechat
flyctl logs -a sparkcore-wechat --no-tail
```

Expected log shape:

- `[wechat-openilink-session-manager] active sessions`
- `[wechat-openilink-worker] starting`

### 10.3 Discord Worker

```bash
flyctl status -a sparkcore-discord
flyctl logs -a sparkcore-discord --no-tail
```

Expected log shape:

- `[discord-gateway-worker] connected`
- `[discord-gateway-worker] ready`

### 10.4 Feishu Worker

```bash
flyctl status -a sparkcore-feishu
flyctl logs -a sparkcore-feishu --no-tail
```

Expected log shape:

- `[feishu-ws-worker] starting`
- `[ws] ws client ready`

## 11. End-to-End Verification

### 11.1 Telegram

- send a real message
- confirm reply
- confirm web-side thread state is normal

### 11.2 WeChat

- open `lagun.app`
- start WeChat login
- scan QR code
- send a message
- confirm binding completes
- confirm later messages continue to work

### 11.3 Discord

- open `lagun.app/connect-im?...&platform=discord`
- send Lagun a DM in Discord
- copy `DM Channel ID` and `User ID` from the first unbound reply
- save binding
- send another DM
- confirm reply

### 11.4 Feishu

- open `lagun.app/connect-im?...&platform=feishu`
- message Lagun in Feishu
- copy `Chat ID` and `Open ID` from the first unbound reply
- save binding
- send another message
- confirm reply

## 12. Troubleshooting Notes From This Rollout

### 12.1 `lagun.app` Works on Public Internet but Fails Locally

Symptom:

- browser shows `ERR_CONNECTION_CLOSED`
- local `dig` returns `198.18.x.x`

Cause:

- local VPN or proxy hijacks DNS and traffic

Fix:

- temporarily disable the VPN/proxy
- re-test `https://lagun.app`
- verify again on a phone or a clean network if needed

### 12.2 Fly Remote Builder Is Unstable

Symptom:

- remote builder stalls or fails during first deployment

Fix:

- install Docker Desktop
- run local deploys with `--local-only`

### 12.3 Feishu Worker Starts but Receives No Messages

Check Feishu developer console:

- event subscription mode must use persistent websocket connection

Expected worker logs:

- `[feishu-ws-worker] starting`
- `[ws] ws client ready`

### 12.4 WeChat Login Starts but User Never Finishes Binding

Check:

- login attempt row exists in Supabase
- worker picks it up
- status moves to `qr_ready`

If QR repeatedly expires:

- restart the user flow and scan promptly

## 13. Current Operational Commands

```bash
flyctl status -a sparkcore-wechat
flyctl status -a sparkcore-discord
flyctl status -a sparkcore-feishu

flyctl logs -a sparkcore-wechat
flyctl logs -a sparkcore-discord
flyctl logs -a sparkcore-feishu
```

```bash
cd apps/web
npm run typecheck
npm run ai:healthcheck
npm run integration:image:test
```

## 14. Final State Summary

Production now uses this split:

- Cloud Run:
  - `sparkcore-web`
  - `lagun.app`
  - `www.lagun.app`
- Fly.io:
  - `sparkcore-wechat`
  - `sparkcore-discord`
  - `sparkcore-feishu`
- Supabase:
  - auth
  - data
  - bindings
  - receipts
  - WeChat login/session coordination

This setup has already been tested with real user-visible message flows across Telegram, WeChat, Discord, and Feishu.
