# SparkCore v1 Trial Checklist

Use this checklist when someone runs the repository for the first time and wants to verify the current v1 chat workspace.

## Before You Start

- [ ] Node.js 20+ is available
- [ ] `npm` is available
- [ ] A Supabase project is ready
- [ ] `apps/web/.env.local` is filled from [`.env.example`](../.env.example)
- [ ] A LiteLLM gateway is available, or the local proxy can be started

If you use the local proxy in this repository:

- [ ] `uv` is installed
- [ ] `REPLICATE_API_KEY` is set

## Local Startup

- [ ] `cd apps/web && npm install`
- [ ] SQL files in `supabase/migrations` have been applied in Supabase
- [ ] Start LiteLLM if needed: `./scripts/start-litellm-proxy.sh`
- [ ] Start the app: `cd apps/web && npm run dev`
- [ ] Open `http://localhost:3000/login`

## Trial Flow

- [ ] Magic-link sign-in works
- [ ] A workspace is available after sign-in
- [ ] `/chat?thread=<id>` opens and restores the active thread correctly
- [ ] A new thread can be created
- [ ] An agent can be selected when creating a thread
- [ ] The first user message receives an assistant reply
- [ ] Runtime summary appears under assistant replies

## Agent Checks

- [ ] A new agent can be created from a persona pack
- [ ] A workspace default agent can be set
- [ ] An agent can be renamed
- [ ] The current model profile can be viewed
- [ ] The model profile can be changed for future replies

## Memory Checks

- [ ] Memory entries are visible in the sidebar
- [ ] Source trace is visible for supported entries
- [ ] A memory can be hidden
- [ ] A memory can be marked incorrect
- [ ] A hidden or incorrect memory can be restored
- [ ] Restored memory becomes visible and recall-eligible again

## Optional Regression Check

- [ ] `cd apps/web && npm run smoke:test`

## Notes for Trialers

- Smoke tests seed their own test data and do not require a separate demo-data bootstrap
- Hidden or incorrect memory should not be used in later recall
- Agent changes only affect future replies
- Thread bindings and historical turns are not rewritten retroactively
