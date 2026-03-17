<p align="center">
  <img src="./logo.png" alt="SparkCore logo" width="160" />
</p>

<h1 align="center">SparkCore</h1>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

SparkCore is an open foundation for building long-memory, persona-driven AI agents that can run across web chat and IM channels.

The project is aimed at teams who want a reusable agent runtime instead of a single-purpose chat app. It is being designed around memory continuity, role consistency, multimodal interaction, model routing, and channel integrations.

## Vision

SparkCore is intended to provide a shared core for:

- Single-agent and multi-agent runtimes
- Long-term memory and memory recall
- Persona and knowledge separation
- Web chat and IM channel access
- Model gateway and routing
- Extensible tools and adapters

## Current Status

SparkCore now includes a working v1 chat workspace for local trial:

- multi-thread chat with stable `/chat?thread=<id>` restoration
- thread-bound agents with lightweight creation, default selection, and editing
- long-memory visibility, trace, correction, and restore flows
- per-turn runtime summary for agent, model profile, and memory usage
- Supabase auth, persistence, and local smoke regression coverage

The project is still early, but it is already usable as a local trial build rather than just a repository scaffold.

## Principles

- Open-core friendly architecture
- Self-hosting aware design
- Clear module boundaries
- Scenario-extensible runtime
- Practical developer experience

## Roadmap

Near-term focus:

1. Establish the initial repository structure
2. Define the runtime and memory module boundaries
3. Add the first executable project scaffold
4. Document setup, architecture, and contribution workflow

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
