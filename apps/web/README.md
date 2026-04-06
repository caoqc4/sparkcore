# Web App

`apps/web` is the current SparkCore v1 chat workspace.

Current capabilities:

- Next.js App Router application shell
- Supabase magic-link auth
- multi-thread chat with `/chat?thread=<id>` restoration
- agent creation, default agent, lightweight editing, and model-profile switching
- memory visibility, trace, correction, restore, and lightweight convergence
- runtime summary and Playwright smoke coverage

## Requirements

Before local trial, prepare:

- Node.js 20+
- npm
- a Supabase project
- a Google AI Studio API key
- a fal.ai API key

## Environment Setup

Use the repository root [`.env.example`](../../.env.example) as the source of truth.

Recommended local file:

- `apps/web/.env.local`

Common variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_STUDIO_API_KEY=
FAL_KEY=
CF_R2_ACCOUNT_ID=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_CHARACTER_ASSETS_BUCKET=
CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL=
CF_R2_KNOWLEDGE_BUCKET=
CF_R2_KNOWLEDGE_ACCESS_KEY_ID=
CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_CLARITY_PROJECT_ID=
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

Analytics variables are optional:

- `NEXT_PUBLIC_POSTHOG_KEY` enables product-event delivery to PostHog
- `NEXT_PUBLIC_POSTHOG_HOST` overrides the PostHog ingest host
- `NEXT_PUBLIC_CLARITY_PROJECT_ID` enables Microsoft Clarity

If you do not set them, the app will skip analytics bootstrap silently.

Billing variables:

- `CREEM_API_KEY` and `CREEM_WEBHOOK_SECRET` are required for live Creem checkout and webhook handling
- `CREEM_PRICE_PRO_MONTHLY`, `CREEM_PRICE_PRO_QUARTERLY`, `CREEM_PRICE_PRO_YEARLY` map SparkCore Pro billing cadences to Creem price ids
- `CREEM_PRICE_CREDITS_100`, `CREEM_PRICE_CREDITS_250`, `CREEM_PRICE_CREDITS_700` map credits packs to Creem price ids
- `CREEM_SIMULATE=true` can be used locally to emulate checkout redirects without creating real charges

Character asset storage variables:

- `CF_R2_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, and `CF_R2_CHARACTER_ASSETS_BUCKET` enable Cloudflare R2 uploads for `character-assets`
- `CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL` should point at the public URL base that serves those uploaded assets
- `CF_R2_KNOWLEDGE_BUCKET` enables private R2 storage for uploaded knowledge documents while keeping parsing/indexing behavior unchanged
- `CF_R2_KNOWLEDGE_ACCESS_KEY_ID` and `CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY` can be used when the knowledge bucket has its own scoped R2 token
- if these variables are omitted, SparkCore keeps reading `character-assets` from Supabase Storage

## Recommended Local Startup

1. Install dependencies

```bash
cd apps/web
npm install
```

2. Apply the Supabase migrations

At the moment, the simplest path is to open Supabase SQL Editor and apply the SQL files in `supabase/migrations` in timestamp order.

3. Configure model providers

SparkCore currently calls providers directly:

- text: Google AI Studio `gemini-2.5-flash`
- image: fal.ai `fal-ai/flux-2/klein/4b`

4. Start the web app

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run dev
```

5. Open:

- `http://localhost:3000/login`

## Suggested Trial Flow

1. Sign in with magic link
2. Open `/chat`
3. Create a thread and choose an agent
4. Send the first message and verify the assistant reply
5. Check the sidebar agent and memory panels
6. Try hide / incorrect / restore in memory

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run ai:test
npm run character-assets:import
npm run discord:gateway:worker
npm run feishu:ws:worker
npm run wechat:openilink:manager
npm run telegram:webhook:set -- --webhook-base-url <public-https-url>
npm run telegram:webhook:delete -- --drop-pending-updates
npm run telegram:binding:upsert -- --thread-id <thread_id> --channel-id <channel_id> --peer-id <peer_id> --platform-user-id <platform_user_id>
npm run telegram:binding:delete -- --channel-id <channel_id> --peer-id <peer_id> --platform-user-id <platform_user_id>
npm run smoke:test
npm run quality:eval
```

## Deployment

Current recommended topology:

- Cloud Run: `apps/web` and Telegram webhook routes
- Fly.io: Discord gateway worker, Feishu websocket worker, WeChat OpenILink manager

Deployment notes and commands:

- [`../../docs/engineering/2026-04-06-im-and-deployment-topology.md`](../../docs/engineering/2026-04-06-im-and-deployment-topology.md)

## Product Analytics

The product-layer frontend currently emits a small manual event set through
`apps/web/lib/product/events.ts`.

Current event names:

- `landing_cta_click`
- `create_started`
- `create_completed`
- `im_bind_started`
- `im_bind_success`
- `first_dashboard_view`
- `relationship_summary_view`
- `first_memory_view`
- `memory_action_hide`
- `memory_action_incorrect`
- `memory_action_restore`

Delivery behavior:

- PostHog is initialized only when `NEXT_PUBLIC_POSTHOG_KEY` is present
- Clarity is initialized only when `NEXT_PUBLIC_CLARITY_PROJECT_ID` is present
- PostHog runs in manual mode with `autocapture`, `pageview`, `pageleave`, and session recording disabled
- Clarity receives lightweight session tags derived from product events

Current privacy guardrails:

- event payloads strip keys containing `thread`, `agent`, `content`, or `message`
- analytics payloads only send `pathname`, not query-string values
- no raw chat content is intentionally forwarded to analytics

## Notes

- `smoke:test` depends on smoke-related env vars and `SUPABASE_SERVICE_ROLE_KEY`
- smoke coverage uses deterministic test helpers and seeds its own test data through test-only routes
- `.github/workflows/web-smoke.yml` runs `typecheck` and `smoke:test` for `apps/web`
- the workflow expects these GitHub Actions secrets when smoke is enabled:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `GOOGLE_AI_STUDIO_API_KEY`, `FAL_KEY`, `NEXT_PUBLIC_APP_URL`,
  `PLAYWRIGHT_SMOKE_SECRET`, `PLAYWRIGHT_SMOKE_EMAIL`, `PLAYWRIGHT_SMOKE_PASSWORD`
- if billing and analytics paths are exercised in CI, also set:
  `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRICE_PRO_MONTHLY`,
  `CREEM_PRICE_PRO_QUARTERLY`, `CREEM_PRICE_PRO_YEARLY`, `CREEM_PRICE_CREDITS_100`,
  `CREEM_PRICE_CREDITS_250`, `CREEM_PRICE_CREDITS_700`, `NEXT_PUBLIC_POSTHOG_KEY`,
  `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- Chinese quickstart is available at [`README.zh-CN.md`](./README.zh-CN.md)
- Trial checklist: [`../../docs-public/v1-trial-checklist.md`](../../docs-public/v1-trial-checklist.md)
- Stage 1 quality baseline: [`../../docs-public/stage1-quality-eval-set.md`](../../docs-public/stage1-quality-eval-set.md)
- Real chat regression set: [`../../docs-public/real-chat-quality-regression-set.md`](../../docs-public/real-chat-quality-regression-set.md)
