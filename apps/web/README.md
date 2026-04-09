# apps/web

The main web application and reference implementation of SparkCore — deployed as [lagun.app](https://lagun.app).

Current capabilities:

- Next.js App Router application shell
- Supabase auth and persistence
- Multi-thread chat with `/chat?thread=<id>` restoration
- Agent creation, default agent selection, and model-profile switching
- Memory visibility, trace, correction, restore, and convergence flows
- Runtime summary per turn (agent, model profile, memory usage)
- Playwright smoke and integration test coverage

---

## Requirements

- Node.js 20+
- pnpm
- A Supabase project
- At least one LLM provider (Google AI Studio recommended for quick start)

---

## Environment Setup

Copy the repository root [`.env.example`](../../.env.example) to `apps/web/.env.local` and fill in the required values.

```bash
cp ../../.env.example .env.local
```

The `.env.example` file documents every variable with inline comments explaining where to obtain each key. The minimum required set to start locally:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_STUDIO_API_KEY=
FAL_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Local Startup

```bash
# 1. Install dependencies
pnpm install

# 2. Apply database migrations
#    Open your Supabase project → SQL Editor and run the files in
#    supabase/migrations/ in timestamp order.
#    Or use the Supabase CLI: supabase db push

# 3. (Optional) Start a local LiteLLM model gateway
cd ../../scripts && bash start-litellm-proxy.sh

# 4. Start the web app
pnpm dev
```

Open `http://localhost:3000/login`.

---

## Trial Flow

1. Sign in
2. Open `/chat`, create a thread and choose an agent
3. Send a message and verify the reply
4. Check the sidebar agent and memory panels
5. Try hide / incorrect / restore in the memory panel
6. Bind a Telegram bot and verify IM delivery (optional)

Full checklist: [`../../docs-public/v1-trial-checklist.md`](../../docs-public/v1-trial-checklist.md)

---

## Commands

```bash
# Development
pnpm dev
pnpm typecheck
pnpm build

# Testing
pnpm smoke:test         # Playwright smoke suite (requires smoke env vars)
pnpm quality:eval       # Manual quality evaluation harness

# AI / model
pnpm ai:test

# Character assets
pnpm character-assets:import

# IM workers (run each in a separate terminal or deploy to Fly.io)
pnpm discord:gateway:worker
pnpm feishu:ws:worker
pnpm wechat:openilink:manager

# Telegram
pnpm telegram:webhook:set -- --webhook-base-url <public-https-url>
pnpm telegram:webhook:delete -- --drop-pending-updates
pnpm telegram:binding:upsert -- --thread-id <id> --channel-id <id> --peer-id <id> --platform-user-id <id>
pnpm telegram:binding:delete -- --channel-id <id> --peer-id <id> --platform-user-id <id>
```

---

## Deployment

Recommended topology:

| Component | Platform |
|---|---|
| Web app + Telegram webhook | Cloud Run |
| Discord gateway worker | Fly.io (`deploy/fly.discord.toml`) |
| Feishu WebSocket worker | Fly.io (`deploy/fly.feishu.toml`) |
| WeChat OpenILink manager | Fly.io (`deploy/fly.wechat.toml`) |

Deployment runbook: [`../../docs/engineering/2026-04-06-cloud-run-fly-production-runbook.md`](../../docs/engineering/2026-04-06-cloud-run-fly-production-runbook.md)

Deployment topology design: [`../../docs/engineering/2026-04-06-im-and-deployment-topology.md`](../../docs/engineering/2026-04-06-im-and-deployment-topology.md)

---

## Product Analytics

Analytics events are emitted via `lib/product/events.ts`. All providers initialize lazily — if the environment variable is absent, the provider is silently skipped.

Current event names:

| Event | Trigger |
|---|---|
| `landing_cta_click` | Landing page CTA |
| `create_started` | Role creation flow started |
| `create_completed` | Role creation completed |
| `im_bind_started` | IM binding flow started |
| `im_bind_success` | IM channel successfully bound |
| `first_dashboard_view` | First visit to dashboard |
| `relationship_summary_view` | Relationship summary panel opened |
| `first_memory_view` | First visit to memory panel |
| `memory_action_hide` | Memory item hidden |
| `memory_action_incorrect` | Memory item marked incorrect |
| `memory_action_restore` | Memory item restored |

Privacy guardrails:

- Event payloads strip keys containing `thread`, `agent`, `content`, or `message`
- Only `pathname` is sent — query strings are excluded
- No raw chat content is forwarded to analytics
- PostHog runs in manual mode with autocapture, pageview, and session recording disabled

---

## CI / GitHub Actions

The smoke workflow (`.github/workflows/web-smoke.yml`) runs `typecheck` and `smoke:test`.

Required GitHub Actions secrets:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_AI_STUDIO_API_KEY
FAL_KEY
NEXT_PUBLIC_APP_URL
PLAYWRIGHT_SMOKE_SECRET
PLAYWRIGHT_SMOKE_EMAIL
PLAYWRIGHT_SMOKE_PASSWORD
```

Optional (add if billing / analytics paths are exercised in CI):

```
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_PRICE_PRO_MONTHLY
CREEM_PRICE_PRO_QUARTERLY
CREEM_PRICE_PRO_YEARLY
CREEM_PRICE_CREDITS_100
CREEM_PRICE_CREDITS_250
CREEM_PRICE_CREDITS_700
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_CLARITY_PROJECT_ID
```

---

## Related docs

- Chinese version: [`README.zh-CN.md`](./README.zh-CN.md)
- Trial checklist: [`../../docs-public/v1-trial-checklist.md`](../../docs-public/v1-trial-checklist.md)
- Quality baseline: [`../../docs-public/stage1-quality-eval-set.md`](../../docs-public/stage1-quality-eval-set.md)
- Real chat regression set: [`../../docs-public/real-chat-quality-regression-set.md`](../../docs-public/real-chat-quality-regression-set.md)
