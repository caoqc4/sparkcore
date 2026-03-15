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

This repository is currently in the early open-source setup stage.

What is available now:

- Repository bootstrap and ignore rules
- Public project positioning
- Bilingual repository landing documentation

What is planned next:

- Initial codebase structure
- Core runtime modules
- Memory and persona foundations
- Basic developer documentation

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

## Open Source Notes

Some internal planning documents are intentionally kept out of the public repository while the open-source structure is being prepared. Public-facing documentation will be added here incrementally as the project is formalized.

## Environment Variables

Copy `.env.example` to your local env file when development starts.

Current MVP variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LITELLM_BASE_URL`
- `LITELLM_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Reserved for later integrations:

- Telegram-related variables
- storage and S3-compatible variables

## Contributing

Contribution guidelines are not published yet, but the repository is being prepared for public collaboration.

## License

License is not defined yet.
