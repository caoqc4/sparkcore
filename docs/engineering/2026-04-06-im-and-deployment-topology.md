# SparkCore Cloud Run + Fly.io Deployment Topology

## Decision

Current deployment split:

- `apps/web` Next.js service goes to Cloud Run
- Telegram webhook stays inside `apps/web`
- Discord gateway worker goes to Fly.io
- Feishu websocket worker goes to Fly.io
- WeChat OpenILink session manager goes to Fly.io
- Supabase remains the system of record for auth, data, sessions, and worker coordination

## Why This Split

This repository currently has two very different runtime shapes:

- request-driven HTTP handlers
- long-lived worker processes with websocket or session state

Cloud Run is the better fit for the request-driven side:

- Next.js web app
- Telegram webhook routes
- webhook management scripts

Fly.io is the better fit for the long-lived side:

- Discord gateway heartbeat and reconnect loop
- Feishu websocket client
- WeChat OpenILink login/session manager

WeChat used to depend on local files and a locally spawned login child process. That path is now coordinated through Supabase rows so the web app and the Fly worker can live on different platforms.

## Runtime Layout

### Cloud Run

One Cloud Run service hosts:

- website
- chat actions
- Telegram webhook endpoints
- WeChat login start/status APIs

Recommended default:

- service: `sparkcore-web`
- port: `3000`
- CPU/memory: start with `1 vCPU / 1 GiB`

### Fly.io

Deploy three separate worker apps from the same image:

- `sparkcore-discord`
- `sparkcore-feishu`
- `sparkcore-wechat`

Recommended initial sizing:

- Discord: `shared-cpu-1x`, `512mb`
- Feishu: `shared-cpu-1x`, `512mb`
- WeChat: `shared-cpu-1x`, `1gb`

## Shared Environment Variables

All services need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_STUDIO_API_KEY`
- `FAL_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional but commonly needed in production:

- `AZURE_SPEECH_API_KEY`
- `AZURE_SPEECH_REGION`
- `ELEVENLABS_API_KEY`
- `CREEM_*`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`

Service-specific variables:

- Cloud Run + Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`
- Fly Discord: `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`
- Fly Feishu: `FEISHU_APP_ID`, `FEISHU_APP_SECRET`
- Fly WeChat: OpenILink-related credentials already consumed by the current WeChat integration code path

## Deployment Order

1. Apply Supabase migrations, including `20260406193000_create_wechat_openilink_login_attempts.sql`
2. Deploy `apps/web` to Cloud Run
3. Update `NEXT_PUBLIC_APP_URL` to the Cloud Run service URL or mapped production domain
4. Set the Telegram webhook to the Cloud Run URL
5. Deploy Fly workers for Discord, Feishu, and WeChat
6. Run one real message flow on each platform to confirm end-to-end delivery

## Cloud Run Commands

Build and deploy from repo root:

1. Copy `apps/web/deploy/cloud-run.web.env.example.yaml` to your own non-committed env file.

2. Deploy:

```bash
PROJECT_ID=your-gcp-project \
REGION=asia-east1 \
SERVICE_NAME=sparkcore-web \
ENV_VARS_FILE=apps/web/deploy/cloud-run.web.env.yaml \
bash apps/web/scripts/cloud-run-deploy.sh
```

If you prefer to run the commands manually:

```bash
gcloud builds submit \
  --project your-gcp-project \
  --tag gcr.io/your-gcp-project/sparkcore-web \
  --file apps/web/Dockerfile \
  .

gcloud run deploy sparkcore-web \
  --project your-gcp-project \
  --region asia-east1 \
  --image gcr.io/your-gcp-project/sparkcore-web \
  --port 3000 \
  --allow-unauthenticated \
  --env-vars-file apps/web/deploy/cloud-run.web.env.yaml
```

## Fly.io Commands

Deploy from repo root so the Docker build context includes `packages/`:

```bash
fly deploy -c apps/web/deploy/fly.discord.toml
fly deploy -c apps/web/deploy/fly.feishu.toml
fly deploy -c apps/web/deploy/fly.wechat.toml
```

Before the first deploy:

- replace each `app = "replace-me-..."` value with the real Fly app name
- set secrets with `fly secrets set ... --app <app-name>`

## Operational Notes

- Telegram remains request-driven and does not require a separate worker service right now
- Discord and Feishu will keep running as long-lived websocket workers; do not put them on scale-to-zero infrastructure without protocol changes
- WeChat login attempts are now stored in Supabase, so the Cloud Run web process no longer needs to spawn a local worker
- R2 migration can be done later without changing this worker split
