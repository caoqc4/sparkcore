# Web App

`apps/web` will contain the main SparkCore web application.

Planned scope:

- authentication
- chat experience
- workspace-aware product flows

Current status:

- Next.js App Router shell
- Supabase magic-link auth flow
- protected `workspace` route
- first-login user and workspace bootstrap via Supabase migration
- reusable LiteLLM client and local text-generation test script

LiteLLM test command:

- `npm run litellm:test -- --model <your-model-name>`
