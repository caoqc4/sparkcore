<p align="center">
  <img src="./logo.png" alt="SparkCore logo" width="160" />
</p>

<h1 align="center">SparkCore</h1>

<p align="center">
  A single-agent runtime for building long-memory, persona-driven AI companions across web and IM channels.
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://lagun.app">Live demo: lagun.app</a> &nbsp;·&nbsp;
  <a href="./docs-public/">Public docs</a> &nbsp;·&nbsp;
  <a href="./docs/architecture/">Architecture</a>
</p>

---

## What is SparkCore

SparkCore is an open-source foundation for building AI agents that maintain **long-term memory**, consistent **persona**, and continuity across conversations — both on the web and through IM channels (Telegram, Discord, WeChat, Feishu).

The core design challenge it addresses: how does an agent actually *remember* a user across sessions, threads, and platforms — not just in a single context window?

**[lagun.app](https://lagun.app)** is the reference product built on SparkCore: an IM-native AI companion that demonstrates the runtime in production.

---

## Core Architecture

SparkCore is organized around two interlocking design layers:

### Five-Layer Memory Structure

Memory is not a single store. SparkCore separates memory into five layers with different scopes, stabilities, and lifetimes:

```
┌─────────────────────────────────────────────────────┐
│  A  Role Core                                        │
│     Persona, identity, relational stance             │
│     Scope: agent-global · Stability: immutable       │
├─────────────────────────────────────────────────────┤
│  B  Structured Long-Term Memory                      │
│     Facts, preferences, relationship cues, goals     │
│     Scope: user-global / user-agent · Stability: high│
├─────────────────────────────────────────────────────┤
│  C  Knowledge Layer                                  │
│     Project docs, reference material, world knowledge│
│     Scope: project / world · Governance: gated       │
├─────────────────────────────────────────────────────┤
│  D  Thread State                                     │
│     Active session focus, short-horizon working mode │
│     Scope: thread-local · Stability: low             │
├─────────────────────────────────────────────────────┤
│  E  Recent Turns                                     │
│     Immediate conversation context window            │
│     Scope: in-flight · Stability: ephemeral          │
└─────────────────────────────────────────────────────┘
```

Each layer has its own read/write contract, scope boundaries, and lifecycle rules. See [`packages/core/memory/`](./packages/core/memory/) for the type contracts and [`docs/architecture/memory_layer_design_v1.0.md`](./docs/architecture/memory_layer_design_v1.0.md) for the design rationale.

### Four-Layer Scheduling Logic

At each turn, the runtime decides *what* to load, *how* to prioritize, and *how* to assemble the final generation context:

```
User message
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  1  Memory Assembly                                  │
│     Which layers to load, in what priority order     │
│     Driven by active Scenario Memory Pack            │
├─────────────────────────────────────────────────────┤
│  2  Knowledge Gating                                 │
│     Whether knowledge is available and should inject │
│     Governance classes: authoritative / contextual   │
├─────────────────────────────────────────────────────┤
│  3  Answer Strategy Routing                          │
│     Maps question type → answer strategy             │
│     e.g. direct-fact → structured-recall-first       │
├─────────────────────────────────────────────────────┤
│  4  Runtime Composition                              │
│     Assembles system prompt, memory, knowledge,      │
│     output governance, and humanized delivery rules  │
└─────────────────────────────────────────────────────┘
     │
     ▼
  LLM generation
```

Scheduling behavior is configured through **Scenario Memory Packs** — declarative profiles that define assembly order and priority routes per use case. Two built-in packs:

| Pack | Optimized for | Assembly order |
|---|---|---|
| `companion` | Long-running companion, continuity-first | thread_state → dynamic_profile → static_profile → memory_record |
| `project_ops` | Project execution, knowledge-first | thread_state → knowledge → dynamic_profile → memory_record |

See [`packages/core/memory/packs.ts`](./packages/core/memory/packs.ts) for the pack contracts.

### Full Runtime Pipeline

Putting both layers together, each turn flows through the complete pipeline:

```
  Web / IM channel
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Session Bootstrap                                   │
│  Load agent, thread state, recent turns              │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Five-Layer Memory       │  ← Recall what's known about the user
        │   A · B · C · D · E      │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Four-Layer Scheduling   │  ← Decide what to use and how to assemble
        │   Assembly · Gating       │
        │   Routing · Composition   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Output Governance       │  ← Define how to express the response
        │   RoleExpressionPacket    │    (identity, tone, expression principles)
        │   RelationshipPacket      │    (stage, style, volatile overrides)
        │   SceneDeliveryPacket     │    (modality, length, language)
        │   KnowledgeBriefPacket    │    (knowledge injection rules)
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   LLM Generation          │  ← Text / image / audio
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Humanized Delivery      │  ← Transform raw output into natural response
        │   posture · rhythm        │    20+ dimensions: opening style, tone tension,
        │   opening · follow-up     │    emotional recurrence, follow-up depth, etc.
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Post-generation         │  ← Memory write planning, artifact processing
        │   + Feedback / Follow-up  │    Proactive outreach scheduling
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Web UI / IM delivery    │
        └───────────────────────────┘
```

**Output Governance** controls *what* the agent expresses — it translates memory and scheduling decisions into four governance packets that constrain and guide generation. See [`apps/web/lib/chat/output-governance.ts`](./apps/web/lib/chat/output-governance.ts).

**Humanized Delivery** controls *how* it's expressed — a post-processing layer that transforms the raw LLM output into a response with calibrated naturalness across 20+ dimensions (posture, rhythm, opening style, tone tension, follow-up depth, emotional recurrence, and more). See [`apps/web/lib/chat/humanized-delivery-strategy.ts`](./apps/web/lib/chat/humanized-delivery-strategy.ts).

**Feedback / Follow-up** enables proactive agent behavior — scheduling gentle check-ins and follow-up messages based on conversation state. See [`apps/web/lib/chat/follow-up-executor.ts`](./apps/web/lib/chat/follow-up-executor.ts).

---

## Repository Structure

```
sparkcore/
├── packages/
│   ├── core/memory/          # Five-layer memory contracts and types
│   └── integrations/         # IM adapter contract and bridge
├── apps/
│   └── web/                  # lagun.app — full reference implementation
│       ├── lib/chat/         # Runtime: memory, scheduling, composition
│       ├── app/              # Next.js routes (web UI + API)
│       └── tests/            # Smoke and integration tests
├── supabase/
│   └── migrations/           # Database schema (58 migrations)
├── scripts/
│   └── litellm/              # Local model gateway setup
├── docs/
│   ├── architecture/         # System design documents
│   ├── engineering/          # Implementation runbooks
│   └── product/              # Product design documents
├── docs-public/              # Public evaluation and test records
└── .env.example              # Environment variable template
```

---

## Self-Hosting

### Requirements

- [Supabase](https://supabase.com) project (auth + database)
- LLM access — via [LiteLLM](https://github.com/BerriAI/litellm) proxy or direct API key (Google AI Studio, Replicate, etc.)
- Image generation — [FAL](https://fal.ai) (optional, for role portraits)
- File storage — Cloudflare R2 or S3-compatible (optional, for character assets)

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/sparkcore.git
cd sparkcore

# 2. Install dependencies
cd apps/web && pnpm install

# 3. Set up environment
cp ../../.env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, LITELLM_BASE_URL, etc.

# 4. Run database migrations
npx supabase db push

# 5. Start local model gateway (optional)
cd ../../scripts && bash start-litellm-proxy.sh

# 6. Start the web app
cd ../apps/web && pnpm dev
```

Full self-hosting guide: [`docs-public/self-hosting.md`](./docs-public/self-hosting.md)

Quick start for the web app: [`apps/web/README.md`](./apps/web/README.md)

Trial checklist: [`docs-public/v1-trial-checklist.md`](./docs-public/v1-trial-checklist.md)

### IM Channel Setup

SparkCore supports IM channels through a unified adapter contract. Enable any channel by setting the corresponding environment variables and running the channel worker:

- **Telegram** — `scripts/apps/web/scripts/telegram-set-webhook.ts`
- **Discord** — `apps/web/deploy/fly.discord.toml`
- **Feishu / Lark** — `apps/web/deploy/fly.feishu.toml`
- **WeChat OpenILink** — `apps/web/deploy/fly.wechat.toml`

See [`docs/engineering/im_adapter_contract_v1.0.md`](./docs/engineering/im_adapter_contract_v1.0.md) for the adapter contract and [`docs/engineering/2026-04-06-im-and-deployment-topology.md`](./docs/engineering/2026-04-06-im-and-deployment-topology.md) for deployment topology.

---

## Key Packages

### `packages/core/memory`

The memory type contracts — the shared language the entire runtime speaks:

- [`contract.ts`](./packages/core/memory/contract.ts) — `MemoryRecord`, `MemoryWriteRequest`, `MemoryRecallQuery`, category/scope/stability/status types
- [`records.ts`](./packages/core/memory/records.ts) — Canonical memory types and record helpers
- [`knowledge.ts`](./packages/core/memory/knowledge.ts) — Knowledge governance types
- [`namespace.ts`](./packages/core/memory/namespace.ts) — Memory namespace hierarchy (user → agent → thread → project → world)
- [`packs.ts`](./packages/core/memory/packs.ts) — Scenario Memory Pack definitions
- [`compaction.ts`](./packages/core/memory/compaction.ts) — Thread compaction and retention policy types

### `packages/integrations/im-adapter`

The IM adapter contract — a unified interface over all messaging platforms:

- [`contract.ts`](./packages/integrations/im-adapter/contract.ts) — Inbound/outbound message types
- [`bridge.ts`](./packages/integrations/im-adapter/bridge.ts) — Message routing and adapter orchestration

### `apps/web/lib/chat`

The runtime implementation — where scheduling and composition happen:

- `layer-prompt-builders.ts` — Memory layer assembly
- `memory-knowledge.ts` — Knowledge gating and governance routing
- `answer-decision.ts` — Question type → answer strategy routing
- `runtime-generation-context.ts` — Final context composition
- `memory-packs.ts` — Active scenario pack resolution

---

## Reference Implementation: lagun.app

[lagun.app](https://lagun.app) is the production deployment of this repository — an IM-native AI companion with long memory.

It demonstrates:

- Five-layer memory in production (role core → long-term memory → knowledge → thread state → recent turns)
- Multi-platform IM access (Telegram primary, WeChat/Discord/Feishu available)
- Web companion UI with memory visibility and correction flows
- Role creation, portrait generation, and knowledge base management
- Subscription and credit system (Creem-based, swappable)

---

## Architecture Docs

- [Single-agent runtime design](./docs/architecture/single_agent_runtime_design_v1.0.md)
- [Memory layer design](./docs/architecture/memory_layer_design_v1.0.md)
- [Role layer design](./docs/architecture/role_layer_design_v1.0.md)
- [Session layer design](./docs/architecture/session_layer_design_v1.0.md)
- [Runtime contract](./docs/architecture/runtime_contract_v1.0.md)
- [IM adapter contract](./docs/engineering/im_adapter_contract_v1.0.md)
- [Answer strategy / question matrix](./docs-public/answer-strategy-question-matrix.md)

---

## Contributing

Contribution guidelines are being finalized. The repository is open for issues, discussion, and PRs.

Key modules that welcome contributions:

- Memory layer implementations and recall strategies
- New IM adapter integrations
- Evaluation tooling and regression sets
- Self-hosting documentation

---

## License

[AGPL-3.0](./LICENSE) — you are free to use, modify, and self-host this software. If you run a modified version as a network service, you must make your source available under the same license.

For commercial licensing inquiries, contact the maintainers.
