# Self-Hosting Guide

This guide walks you through running SparkCore on your own infrastructure — from a local dev setup to a production deployment with IM channels enabled.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase setup](#2-supabase-setup)
3. [Local development](#3-local-development)
4. [LiteLLM proxy (optional)](#4-litellm-proxy-optional)
5. [IM channels](#5-im-channels)
6. [Production deployment](#6-production-deployment)
7. [File storage (Cloudflare R2)](#7-file-storage-cloudflare-r2)
8. [Health checks](#8-health-checks)

---

## 1. Prerequisites

### Required

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | |
| pnpm | 9+ | `npm install -g pnpm` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Git | any | |

### Cloud accounts (for production)

| Service | Purpose | Free tier |
|---|---|---|
| [Supabase](https://supabase.com) | Auth + database | Yes |
| [Google AI Studio](https://aistudio.google.com) | LLM (Gemini) | Yes |
| [FAL](https://fal.ai) | Image generation | Yes |
| [Google Cloud](https://cloud.google.com) | Cloud Run (web app) | Free trial |
| [Fly.io](https://fly.io) | IM workers | Pay-as-you-go |

Storage (optional — needed for character assets and knowledge bases):

- [Cloudflare R2](https://cloudflare.com/products/r2/) — S3-compatible, no egress fees

---

## 2. Supabase setup

### 2.1 Create a project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a region close to your users
3. Save the database password somewhere safe

### 2.2 Get your API keys

From your project dashboard → **Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon / public key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only, keep private)

### 2.3 Apply migrations

From the repository root:

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Apply all migrations
supabase db push
```

Alternatively, open your Supabase project → **SQL Editor** and run the files in `supabase/migrations/` in timestamp order (oldest first).

> The project ref is the string after `https://` in your project URL, e.g. `xyzabc123.supabase.co` → ref is `xyzabc123`.

---

## 3. Local development

### 3.1 Clone and install

```bash
git clone https://github.com/your-org/sparkcore.git
cd sparkcore/apps/web
pnpm install
```

### 3.2 Configure environment

```bash
cp ../../.env.example .env.local
```

Fill in the minimum required values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-studio-key
FAL_KEY=your-fal-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Every variable is documented in [`.env.example`](../../.env.example).

### 3.3 Start the app

```bash
pnpm dev
```

Open `http://localhost:3000/login` and sign in.

### 3.4 Verify it works

1. Sign in with your email
2. Open `/chat`, create a thread, choose an agent
3. Send a message and confirm the assistant replies
4. Check the memory panel in the sidebar

---

## 4. LiteLLM proxy (optional)

SparkCore works directly with Google AI Studio for text and FAL for images. If you want to route through multiple model providers or use a local model, you can use the included [LiteLLM](https://github.com/BerriAI/litellm) proxy.

### 4.1 Install LiteLLM

```bash
pip install 'litellm[proxy]'
# or via uv (faster):
pip install uv
```

### 4.2 Configure models

Edit `scripts/litellm/config.yaml` to add your preferred models and API keys. The included config uses Replicate as a backend — set `REPLICATE_API_KEY` in your `.env.local` first.

### 4.3 Start the proxy

```bash
bash scripts/start-litellm-proxy.sh
```

The proxy starts on `http://localhost:4000` by default with key `sk-sparkcore-local-dev`.

Add to your `.env.local`:

```env
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=sk-sparkcore-local-dev
```

### 4.4 Verify

```bash
cd apps/web
pnpm litellm:test -- --model replicate-llama-3-8b
```

Expected output: `LiteLLM text generation succeeded.`

---

## 5. IM channels

All IM channels are optional. Enable whichever platforms you need.

### 5.1 Telegram

**Prerequisites:** your web app must be reachable from the internet (Cloud Run, Fly.io, ngrok, or any public URL).

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram → `/newbot`
2. Copy the bot token

Set in your environment:

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=any-random-string
TELEGRAM_BOT_USERNAME=YourBotName
```

Register the webhook:

```bash
cd apps/web
pnpm telegram:webhook:set -- --webhook-base-url https://your-domain.com
```

Verify:

```bash
pnpm telegram:webhook:delete -- --drop-pending-updates  # reset if needed
pnpm telegram:webhook:set -- --webhook-base-url https://your-domain.com
```

Telegram is handled directly by the web app — no separate worker needed.

### 5.2 Discord

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. Under **Bot**, create a bot and copy the token
3. Under **General Information**, copy the application ID and public key

Set in your environment:

```env
DISCORD_APPLICATION_ID=your-application-id
DISCORD_PUBLIC_KEY=your-public-key
DISCORD_BOT_TOKEN=your-bot-token
```

Deploy the Discord gateway worker (requires Fly.io — see [Production deployment](#6-production-deployment)):

```bash
flyctl deploy -c apps/web/deploy/fly.discord.toml --local-only
```

> Discord uses a persistent WebSocket gateway and cannot run on scale-to-zero infrastructure. Fly.io is the recommended host.

### 5.3 Feishu / Lark

1. Go to [open.feishu.cn/app](https://open.feishu.cn/app) → Create app
2. Under **Credentials & Basic Info**, copy App ID and App Secret
3. Set **Event Subscription** to use persistent WebSocket connection

Set in your environment:

```env
FEISHU_APP_ID=your-app-id
FEISHU_APP_SECRET=your-app-secret
```

Deploy the Feishu worker:

```bash
flyctl deploy -c apps/web/deploy/fly.feishu.toml --local-only
```

### 5.4 WeChat OpenILink

WeChat requires the OpenILink desktop client bridge. The web app handles login session coordination through Supabase; the actual long-lived session manager runs on Fly.io.

Set in your environment:

```env
WECHAT_OPENILINK_SESSION_FILE=.openilink-wechat-session.json
```

Deploy the WeChat session manager:

```bash
flyctl deploy -c apps/web/deploy/fly.wechat.toml --local-only
```

---

## 6. Production deployment

The recommended production topology:

| Component | Platform | Config |
|---|---|---|
| Web app + Telegram | Cloud Run | `deploy/cloud-run.web.env.example.yaml` |
| Discord gateway worker | Fly.io | `deploy/fly.discord.toml` |
| Feishu WebSocket worker | Fly.io | `deploy/fly.feishu.toml` |
| WeChat session manager | Fly.io | `deploy/fly.wechat.toml` |
| Database + Auth | Supabase | managed |

You can substitute Cloud Run with any container hosting platform that supports HTTP and environment variables (Railway, Render, Fly.io itself, etc.).

### 6.1 Cloud Run (web app)

**One-time setup:**

```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

**Prepare environment file:**

```bash
cp apps/web/deploy/cloud-run.web.env.example.yaml apps/web/deploy/cloud-run.web.env.yaml
# Fill in production values (this file is gitignored)
```

**Deploy:**

```bash
PROJECT_ID=your-gcp-project \
REGION=us-central1 \
SERVICE_NAME=sparkcore-web \
ENV_VARS_FILE=apps/web/deploy/cloud-run.web.env.yaml \
bash apps/web/scripts/cloud-run-deploy.sh
```

**After first deploy:** update `NEXT_PUBLIC_APP_URL` to your Cloud Run service URL and redeploy, then set the Telegram webhook.

**GitHub Actions auto-deploy (optional):**

Add these to your repository:
- Secret: `GCP_CREDENTIALS` — service account JSON with Cloud Build + Cloud Run permissions
- Variable: `GCP_PROJECT_ID`
- Variable: `GCP_REGION`
- Variable: `CLOUD_RUN_SERVICE_NAME`

### 6.2 Fly.io (IM workers)

**One-time setup:**

```bash
brew install flyctl
flyctl auth login
```

Docker Desktop must be running for local builds.

**Create apps:**

```bash
flyctl apps create your-app-discord
flyctl apps create your-app-feishu
flyctl apps create your-app-wechat
```

Update the `app = ` name in each `.toml` file to match.

**Set secrets:**

```bash
# Each worker needs the shared vars plus its own channel vars
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ... --app your-app-discord
flyctl secrets set DISCORD_APPLICATION_ID=... DISCORD_PUBLIC_KEY=... DISCORD_BOT_TOKEN=... --app your-app-discord
```

**Deploy:**

```bash
flyctl deploy -c apps/web/deploy/fly.discord.toml --local-only
flyctl deploy -c apps/web/deploy/fly.feishu.toml --local-only
flyctl deploy -c apps/web/deploy/fly.wechat.toml --local-only
```

**Deployment order:**

1. Apply Supabase migrations
2. Deploy web app to Cloud Run
3. Update `NEXT_PUBLIC_APP_URL` and redeploy
4. Set Telegram webhook
5. Deploy Fly.io workers

---

## 7. File storage (Cloudflare R2)

R2 is optional but recommended for character portrait assets and knowledge base documents.

### 7.1 Character assets

1. Create an R2 bucket in your Cloudflare dashboard
2. Attach a custom domain (e.g. `assets.yourdomain.com`) to the bucket
3. Create an API token with R2 read/write access

Set in your environment:

```env
CF_R2_ACCOUNT_ID=your-account-id
CF_R2_ACCESS_KEY_ID=your-access-key
CF_R2_SECRET_ACCESS_KEY=your-secret-key
CF_R2_CHARACTER_ASSETS_BUCKET=your-bucket-name
CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=https://assets.yourdomain.com
```

Upload existing assets:

```bash
cd apps/web
pnpm character-assets:import
```

### 7.2 Knowledge documents

Create a separate bucket (or reuse the same one with a scoped token):

```env
CF_R2_KNOWLEDGE_BUCKET=your-knowledge-bucket
CF_R2_KNOWLEDGE_ACCESS_KEY_ID=your-access-key
CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY=your-secret-key
```

---

## 8. Health checks

### Web app

```bash
curl -I https://your-domain.com/login
# Expected: HTTP 200
```

### Fly.io workers

```bash
flyctl status -a your-app-discord
flyctl logs -a your-app-discord --no-tail
# Expected: [discord-gateway-worker] connected / ready

flyctl status -a your-app-feishu
flyctl logs -a your-app-feishu --no-tail
# Expected: [feishu-ws-worker] starting / [ws] ws client ready

flyctl status -a your-app-wechat
flyctl logs -a your-app-wechat --no-tail
# Expected: [wechat-openilink-session-manager] active sessions
```

### End-to-end test per channel

- **Telegram:** send a message to your bot → confirm reply
- **Discord:** DM your bot → confirm reply
- **Feishu:** message your app → confirm reply
- **WeChat:** complete login flow → send message → confirm reply

---

## Troubleshooting

**Assistant doesn't reply**

1. Check LiteLLM is reachable (if using proxy): `pnpm litellm:test`
2. Check `GOOGLE_AI_STUDIO_API_KEY` is set and valid
3. Check Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` and keys

**`ECONNREFUSED 127.0.0.1:4000`**

LiteLLM proxy is not running. Start it: `bash scripts/start-litellm-proxy.sh`

**Fly remote builder stalls**

Install Docker Desktop and use `--local-only` flag.

**Feishu worker starts but receives no messages**

Check your Feishu app event subscription mode — it must use persistent WebSocket, not HTTP callback.

**WeChat QR expires before scan**

Restart the login flow and scan promptly. If it repeats, check the Fly worker logs for session state.
