<p align="center">
  <img src="./logo.png" alt="SparkCore logo" width="160" />
</p>

<h1 align="center">SparkCore</h1>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

SparkCore is an open foundation for building single-agent, long-memory, persona-driven AI systems that can run across web chat and IM channels.

The project is aimed at teams who want a reusable agent runtime instead of a single-purpose chat app. The current mainline focuses on single-agent runtime, long-memory role continuity, and IM access as the Phase 1 product entry.

## Vision

SparkCore is intended to provide a shared core for:

- Single-agent runtime
- Long-term memory and memory recall
- Role continuity and persona consistency
- Web chat and IM channel access
- Model gateway and routing
- Extensible adapters and future upgrade paths

## Current Status

SparkCore now includes a working v1 chat workspace for local trial:

- multi-thread chat with stable `/chat?thread=<id>` restoration
- thread-bound agents with lightweight creation, default selection, and editing
- long-memory visibility, trace, correction, and restore flows
- per-turn runtime summary for agent, model profile, and memory usage
- Supabase auth, persistence, and local smoke regression coverage

The project is still early, but it is already usable as a local trial build rather than just a repository scaffold.

Current mainline docs:

- Strategy: [`docs/strategy/sparkcore_repositioning_v1.0.md`](./docs/strategy/sparkcore_repositioning_v1.0.md)
- Product flow: [`docs/product/companion_mvp_flow_v1.0.md`](./docs/product/companion_mvp_flow_v1.0.md)
- Runtime design: [`docs/architecture/single_agent_runtime_design_v1.0.md`](./docs/architecture/single_agent_runtime_design_v1.0.md)
- Engineering split plan: [`docs/engineering/project_split_plan_v1.0.md`](./docs/engineering/project_split_plan_v1.0.md)

## Principles

- Open-core friendly architecture
- Self-hosting aware design
- Clear module boundaries
- Scenario-extensible runtime
- Practical developer experience

## Roadmap

Near-term focus:

1. Establish the initial repository structure
2. Define the role, memory, session, and runtime boundaries
3. Define the IM adapter contract and integration boundary
4. Incrementally split the repo into core, integrations, and product layers

## Repository Structure

The project is organized with a minimal scaffold so future work can land without reworking the top-level layout.

- `apps/web`: main web application
- `packages`: shared code and reusable modules
- `supabase`: database and backend-related assets
- `scripts`: development and automation scripts
- `docs-public`: public-facing project documentation

## Quick Trial

If you want to run the current v1 locally, start here:

1. Read the web quickstart: [`apps/web/README.md`](./apps/web/README.md)
2. Copy [`.env.example`](./.env.example) into your local env file
3. Prepare a Supabase project and a LiteLLM gateway or local proxy
4. Run the web app and verify the trial checklist

Useful docs:

- English quickstart: [`apps/web/README.md`](./apps/web/README.md)
- Chinese quickstart: [`apps/web/README.zh-CN.md`](./apps/web/README.zh-CN.md)
- Trial checklist: [`docs-public/v1-trial-checklist.md`](./docs-public/v1-trial-checklist.md)
- 中文试用清单: [`docs-public/v1-trial-checklist.zh-CN.md`](./docs-public/v1-trial-checklist.zh-CN.md)

## Open Source Notes

Some internal planning documents are intentionally kept out of the public repository while the open-source structure is being prepared. Public-facing documentation will be added here incrementally as the project is formalized.

Historical multi-agent planning documents are kept only as archive references and are not the current implementation mainline.

## Environment Variables

Copy `.env.example` to your local env file before local development or trial.

Current MVP variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LITELLM_BASE_URL`
- `LITELLM_API_KEY`
- `REPLICATE_API_KEY` if you use the provided local LiteLLM proxy
- `NEXT_PUBLIC_APP_URL`

Reserved for later integrations:

- Telegram-related variables
- storage and S3-compatible variables

## Contributing

Contribution guidelines are not published yet, but the repository is being prepared for public collaboration.

## License

License is not defined yet.
