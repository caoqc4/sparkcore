# Contributing to SparkCore

Thank you for your interest in contributing. This document covers how to get started, what kinds of contributions are most useful, and how to submit changes.

## Where to start

The most useful contributions right now:

- **Memory layer** — recall strategies, write/merge logic, scope boundary handling (`packages/core/memory/`, `apps/web/lib/chat/memory-*`)
- **IM adapter integrations** — new platform adapters or improvements to existing ones (`packages/integrations/im-adapter/`)
- **Evaluation tooling** — regression sets, quality harnesses, automated recall validation (`apps/web/scripts/`, `docs-public/`)
- **Self-hosting documentation** — setup guides, deployment walkthroughs, troubleshooting
- **Bug reports** — reproducible issues with memory recall, thread state, IM delivery

If you are unsure where to start, open an issue first and describe what you want to work on.

## Development setup

```bash
git clone https://github.com/your-org/sparkcore.git
cd sparkcore/apps/web
pnpm install
cp ../../.env.example .env.local   # fill in required values
pnpm dev
```

See [`apps/web/README.md`](./apps/web/README.md) for the full local startup guide.

## Before submitting a PR

- Run `pnpm typecheck` — no new type errors
- Run `pnpm smoke:test` if your change touches runtime, memory, or API routes
- Keep changes focused — one concern per PR
- Add or update tests for new behavior where a harness already exists

## Code style

- TypeScript throughout — no `any` without a comment explaining why
- No new external dependencies without prior discussion
- Follow the existing module boundary conventions (runtime, memory, IM adapter layers should not import from each other's internals)

## Reporting issues

Open a GitHub issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce (minimal is best)
- Relevant environment (platform, model provider, IM channel if applicable)

## License

By contributing, you agree that your contributions will be licensed under the same [AGPL-3.0](./LICENSE) license as this project.
