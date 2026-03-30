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
- a LiteLLM gateway

If you want to use the repository-provided local LiteLLM proxy, also prepare:

- `uv`
- `REPLICATE_API_KEY`

## Environment Setup

Use the repository root [`.env.example`](../../.env.example) as the source of truth.

Recommended local file:

- `apps/web/.env.local`

Common variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LITELLM_BASE_URL=
LITELLM_API_KEY=
REPLICATE_API_KEY=
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

## Recommended Local Startup

1. Install dependencies

```bash
cd apps/web
npm install
```

2. Apply the Supabase migrations

At the moment, the simplest path is to open Supabase SQL Editor and apply the SQL files in `supabase/migrations` in timestamp order.

3. Start LiteLLM

If you already have a LiteLLM gateway, point `LITELLM_BASE_URL` and `LITELLM_API_KEY` to it.

If you want to use the bundled local proxy:

```bash
cd /Users/caoq/git/sparkcore
./scripts/start-litellm-proxy.sh
```

The repository-provided local LiteLLM config currently includes these Replicate aliases:

- text: `replicate-gpt-4o-mini`, `replicate-claude-4-sonnet`, `replicate-gpt-4.1`, `replicate-llama-3-8b`
- image: `replicate-nano-banana`, `replicate-nano-banana-pro`, `replicate-flux-2-pro`

If your web app points to a separate deployed LiteLLM gateway instead of this local proxy, the deployed config must expose the same aliases before those models will work at runtime.

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
npm run litellm:test -- --model <your-model-name>
npm run telegram:webhook:set -- --webhook-base-url <public-https-url>
npm run telegram:webhook:delete -- --drop-pending-updates
npm run telegram:binding:upsert -- --thread-id <thread_id> --channel-id <channel_id> --peer-id <peer_id> --platform-user-id <platform_user_id>
npm run telegram:binding:delete -- --channel-id <channel_id> --peer-id <peer_id> --platform-user-id <platform_user_id>
npm run smoke:test
npm run quality:eval
```

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
- Chinese quickstart is available at [`README.zh-CN.md`](./README.zh-CN.md)
- Trial checklist: [`../../docs-public/v1-trial-checklist.md`](../../docs-public/v1-trial-checklist.md)
- Stage 1 quality baseline: [`../../docs-public/stage1-quality-eval-set.md`](../../docs-public/stage1-quality-eval-set.md)
- Real chat regression set: [`../../docs-public/real-chat-quality-regression-set.md`](../../docs-public/real-chat-quality-regression-set.md)
- LiteLLM development runbook: [`../../docs/engineering/litellm_dev_runbook_v1.0.md`](../../docs/engineering/litellm_dev_runbook_v1.0.md)
