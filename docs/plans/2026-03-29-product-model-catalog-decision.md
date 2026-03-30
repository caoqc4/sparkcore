# Product Model Catalog Decision

Date: 2026-03-29
Status: Draft decision reference
Audience: product, backend, frontend

## Purpose

This document turns the current model-pool discussion into a concrete decision artifact for:

- subscription model pool design
- settings page model labels and tags
- backend capability planning for text, image, and audio
- phased provider integration

The goal is to decide the model catalog before we keep evolving billing rules and UI behavior.

## Product Framing

SparkCore is not a generic model playground.
The default catalog should optimize for:

- human-feeling companion chat quality
- clear model differentiation that users can understand
- enough variety to support different tastes and budgets
- provider diversity without making the first integration wave too wide

This means we should not rank models only by benchmark quality.
We should prefer models that are visibly different in companion, portrait, and voice experiences.

## Decision Principles

### What matters most

1. Companion realism
   Text and audio should feel natural, emotionally steady, and less robotic.

2. User-facing differentiation
   Users should understand why they would switch models.
   The settings page should not only show names. It should show one or two short tags.

3. Cost layering
   Free models should be genuinely usable, not throwaway placeholders.
   Pro models should unlock meaningfully better quality or specialty behavior.

4. Implementation realism
   First-wave choices should respect current architecture:
   - text already has a LiteLLM path
   - image and audio still need dedicated runtime support

## Current Technical Reality

### Already connected

The current LiteLLM proxy already exposes these text models:

- `OpenAI GPT-4o mini`
- `Anthropic Claude Sonnet 4`
- `Meta Llama 3 8B`

These are the only models already available through the current text runtime path.

### Not yet connected

Image and audio models are still catalog-level placeholders.
To make them real, we still need:

- image generation service and job handling
- audio generation service and output handling
- storage and metadata for generated assets
- quota and credits enforcement in runtime

### Important product distinction

Text model choice should stay account-level by default.
Image and audio should support account-level defaults, but they may later gain role-level overlays:

- image: role portrait reference and style consistency
- audio: role voice identity and voice preset binding

## Recommended User-Facing Tags

These tags should appear next to model names in settings, paywall, and future generation surfaces.

- `Natural companion`
- `Reasoning`
- `Low cost`
- `Fast`
- `Chinese-friendly`
- `Design-focused`
- `Poster text`
- `Portrait quality`
- `Human-like voice`
- `Expressive voice`

## Text Model Longlist

### Recommended candidates

| Model | Recommended tags | Best fit | Layer recommendation | Notes |
| --- | --- | --- | --- | --- |
| Anthropic Claude Sonnet 4 | `Natural companion`, `Reasoning` | premium relationship chat | Pro | Strong candidate for the main premium default |
| OpenAI GPT-4.1 | `Balanced quality`, `Reliable` | broad premium fallback | Pro | Strong all-round premium option |
| OpenAI GPT-4o mini | `Fast`, `Low cost` | everyday default chat | Free | Strong free-tier default |
| Google Gemini 2.5 Pro | `Reasoning`, `Multimodal-ready` | future premium multimodal tier | Pro | Worth keeping in the premium pool |
| Google Gemini 2.5 Flash | `Fast`, `Low cost` | free-tier alternative | Free | Good for users who value speed |
| DeepSeek Chat | `Chinese-friendly`, `Low cost` | Chinese-first everyday chat | Free or Pro | Strong value option, especially for Chinese usage |
| DeepSeek Reasoner | `Reasoning`, `Chinese-friendly` | task-heavy reasoning turns | Pro | Better as a specialty option than the default companion model |
| Meta Llama 3 8B | `Open-weight`, `Low cost` | low-cost fallback | Free | Useful for cost control and experimentation |

### Text shortlist for first decision round

These are the strongest first-pass text candidates:

- `OpenAI GPT-4o mini`
- `Meta Llama 3 8B`
- `Anthropic Claude Sonnet 4`
- `OpenAI GPT-4.1`
- `Google Gemini 2.5 Pro`
- `DeepSeek Chat`

### Text tiering recommendation

#### Free

- `OpenAI GPT-4o mini`
- `Meta Llama 3 8B`
- `Google Gemini 2.5 Flash`
- `DeepSeek Chat`

#### Pro

- `Anthropic Claude Sonnet 4`
- `OpenAI GPT-4.1`
- `Google Gemini 2.5 Pro`
- `DeepSeek Reasoner`

### Text recommendation

The first shipping text pool should prioritize:

- `GPT-4o mini`
- `Llama 3 8B`
- `Claude Sonnet 4`
- `GPT-4.1`

The second wave should consider:

- `Gemini 2.5 Pro`
- `DeepSeek Chat`

That keeps the first implementation small while preserving room for Chinese-first and multimodal-oriented upgrades.

## Image Model Longlist

### Recommended candidates

| Model | Recommended tags | Best fit | Layer recommendation | Notes |
| --- | --- | --- | --- | --- |
| Google Nano Banana | `Fast`, `Mainstream` | quick companion portraits and casual image turns | Free | Strong first-wave candidate |
| Google Nano Banana Pro | `Portrait quality`, `Premium` | higher-end image generation and editing | Pro | Natural premium partner to Nano Banana |
| FLUX.2 Pro | `High quality`, `Design-friendly` | strong general-purpose premium generation | Free or Pro | Strong image pool anchor |
| FLUX.2 Flex | `Flexible`, `Controlled` | more advanced premium generation | Pro | Good future specialty option |
| Ideogram 3.0 | `Poster text`, `Design-focused` | covers, posters, typography-heavy images | Pro | Best when text rendering matters |
| Recraft V4 Pro | `Design-focused`, `Brand visual` | brand, illustration, polished visual identity | Pro | Strong for stylized or design-first use |

### Image shortlist for first decision round

These are the strongest first-pass image candidates:

- `Nano Banana`
- `Nano Banana Pro`
- `FLUX.2 Pro`
- `Ideogram 3.0`
- `Recraft V4 Pro`

### Image tiering recommendation

#### Free

- `Nano Banana`
- `FLUX.2 Pro`

#### Pro

- `Nano Banana Pro`
- `Ideogram 3.0`
- `Recraft V4 Pro`
- `FLUX.2 Flex`

### Image recommendation

The first shipping image pool should prioritize:

- `Nano Banana`
- `FLUX.2 Pro`
- `Nano Banana Pro`

These three already cover:

- fast mainstream generation
- higher-quality general generation
- a clear paid upgrade path

`Ideogram` and `Recraft` should stay in the near-term premium expansion set because their strengths are valuable but more specialized.

## Audio Model Longlist

### Recommended candidates

| Model | Recommended tags | Best fit | Layer recommendation | Notes |
| --- | --- | --- | --- | --- |
| ElevenLabs Eleven v3 | `Human-like voice`, `Expressive voice` | premium companion voice replies | Pro | Best premium candidate for role realism |
| ElevenLabs Multilingual v2 | `Natural voice`, `Multilingual` | stable multilingual premium voice | Pro | Strong backup or secondary premium option |
| Google Gemini 2.5 Flash TTS | `Fast`, `Expressive voice` | fast, controlled account-level audio default | Free | Good free-tier candidate |
| Google Gemini 2.5 Pro TTS | `Expressive voice`, `Premium` | richer premium voice control | Pro | Strong premium alternative to ElevenLabs |
| MiniMax Speech | `Chinese-friendly`, `Fast` | lightweight voice replies and Chinese support | Free or Pro | Strong candidate, especially for Chinese usage |
| AWS Polly Neural | `Reliable`, `Low cost` | stable baseline audio generation | Free | More infrastructure-like than product-defining |
| AWS Polly Generative | `Reliable`, `Premium` | premium fallback voice generation | Pro | Good fallback, weaker emotional differentiation |

### Audio shortlist for first decision round

These are the strongest first-pass audio candidates:

- `ElevenLabs Eleven v3`
- `Google Gemini 2.5 Pro TTS`
- `MiniMax Speech`
- `Google Gemini 2.5 Flash TTS`

### Audio tiering recommendation

#### Free

- `MiniMax Speech`
- `Google Gemini 2.5 Flash TTS`
- `AWS Polly Neural`

#### Pro

- `ElevenLabs Eleven v3`
- `Google Gemini 2.5 Pro TTS`
- `ElevenLabs Multilingual v2`
- `AWS Polly Generative`

### Audio recommendation

`MiniMax` should remain in the recommended pool.
It is not displaced by ElevenLabs.
Instead:

- `ElevenLabs` is the stronger premium realism choice
- `MiniMax` is the stronger speed and Chinese-friendly candidate
- `AWS Polly` is the safer infrastructure fallback

For a companion product, this makes `MiniMax` more relevant than a pure fallback provider.

## Role Media Data Design

### Decision summary

Text and image model choice should stay account-level by default.
Audio should not be split between account-level model choice and role-level voice choice.
For product clarity and voice consistency, both the audio engine and the concrete voice option should belong to the role-level media configuration.
Role-memory remains a semantic mirror rather than the execution source of truth.

That means the backend should separate three layers:

1. Account-level defaults
   These define which text and image engines the account prefers by default.

2. Role-level media configuration
   These define how a specific role looks and sounds, including its bound portrait asset and bound audio asset.

3. Role-memory facts
   These describe the role in a way the model can recall, but they should not be the only place that runtime reads execution parameters from.

### Why image and audio should not be mixed into account settings

Account settings answer:

- which default text model to use
- which default image model to use

Role media configuration answers:

- which portrait reference asset belongs to this role
- whether image generation should use the role portrait by default
- which audio asset is currently bound to the role

Those are different responsibilities.
The account chooses the default text and image engine family.
The role chooses the character-specific presentation, including the whole voice stack.

### Why role-memory should not be the only source of truth

The role-memory layer is still useful.
It can store facts such as:

- the role has silver hair and a sharp profile
- the role sounds warm and composed
- the role speaks slowly and clearly

Those facts help the model stay consistent in narration and self-description.
But runtime execution still needs structured fields for:

- portrait asset ids
- voice option ids
- provider-specific voice keys
- generation defaults such as whether portrait reference is enabled

So the design should be:

- structured role media fields drive runtime behavior
- role-memory stores the semantic reflection of those choices

## Backend Data Structure Recommendation

### Account-level defaults

Keep these in `user_app_settings.metadata` for now:

- `default_text_model_slug`
- `default_image_model_slug`

This keeps the current settings implementation stable and matches the product rule that text and image model choice is account-level by default.

### Role media profile

Add a dedicated role media profile object rather than pushing these fields into free-form role metadata.

Recommended tables:

`product_portrait_assets`
`role_media_profiles`

Recommended fields:

- `id`
- `agent_id`
- `portrait_asset_id`
- `portrait_reference_enabled_by_default`
- `portrait_style_notes`
- `audio_asset_id`
- `audio_voice_option_id`
- `audio_provider`
- `created_at`
- `updated_at`

Purpose of the important fields:

- `portrait_asset_id`
  The canonical reusable portrait asset currently bound to the role.
- `portrait_reference_enabled_by_default`
  Whether future image generation should default to using the role portrait as a reference.
- `portrait_style_notes`
  Optional structured or semi-structured notes for portrait consistency.
- `audio_asset_id`
  The canonical reusable audio asset currently bound to the role.
- `audio_voice_option_id`
  Compatibility field during the transition to the unified audio-asset binding model.
- `audio_provider`
  A denormalized helper so runtime can quickly detect which provider family the selected voice belongs to.

This keeps role identity binding attached to the role itself, while the reusable portrait asset lives in its own catalog table.

### Portrait asset catalog

Portraits should use the same pattern as audio voices:

- a reusable asset library
- a role-level binding table

That means the same portrait should be reusable across:

- multiple roles for the same user
- system-seeded defaults
- future generated portrait variants

Recommended table:

`product_portrait_assets`

Recommended fields:

- `id`
- `owner_user_id`
- `workspace_id`
- `provider`
- `source_type`
- `storage_path`
- `public_url`
- `display_name`
- `gender_presentation`
- `style_tags`
- `is_shared`
- `is_active`
- `metadata`
- `created_at`
- `updated_at`

Recommended `source_type` values:

- `preset`
- `upload`
- `generated`

Recommended ownership behavior:

- system-seeded portraits can set `owner_user_id = null` and `is_shared = true`
- user-uploaded portraits should keep `owner_user_id` and remain reusable across that user's roles
- the binding from role to portrait should happen through `role_media_profiles.portrait_asset_id`

Why this shape is better than storing portrait URLs directly on the role:

- the same portrait can be bound to many roles
- uploaded portraits do not need to be duplicated per role
- future generated portraits can be promoted into reusable library assets
- role binding remains simple and replaceable

### Audio asset catalog

For audio, the reusable source of truth should be an audio asset library.
Each audio asset represents one concrete selectable voice instance.
That asset can carry both the audio model source and the voice-specific provider key.

Recommended table:

`product_audio_voice_options`

Recommended fields:

- `id`
- `model_slug`
- `provider`
- `voice_key`
- `display_name`
- `gender_presentation`
- `style_tags`
- `sort_order`
- `is_default`
- `is_active`
- `metadata`
- `created_at`
- `updated_at`

Field intent:

- `model_slug`
  Connects the reusable audio asset to a specific audio model family.
- `voice_key`
  Stores the provider-specific identifier such as an ElevenLabs voice id or MiniMax preset key.
- `display_name`
  User-facing voice asset label in the console.
- `style_tags`
  Small set of tags like `Warm`, `Soft`, `Bright`, `Mature`, `Calm`.
- `is_default`
  Marks the recommended audio asset for that model.

This matches the current product decision:

- the system provides a list of reusable audio assets per audio model
- the user does not have to pick one during role creation
- role creation can auto-bind a recommended audio asset based on role setup inputs
- the user can later switch the role to another audio asset from the console

### Role audio binding behavior

On role creation:

1. The user chooses role traits such as gender, tone, or personality.
2. The backend selects a recommended audio asset for the role.
3. The selected audio asset is stored on `role_media_profiles`.

This keeps creation short while still giving each role a concrete starting voice.

### Image support behavior

For image generation, the role-level binding is simpler.
The key role-specific object is the portrait reference asset.

The recommended shape is:

- account default image model controls which engine to use
- role media profile controls which portrait reference image belongs to the role
- image generation requests can decide whether to use that reference image for the current generation

That means the backend can later support:

- no reference
- use role portrait reference
- stronger portrait-consistency mode

without changing the account-level model rule.

## Runtime Implications

### Image runtime

Image runtime should read:

1. `default_image_model_slug` from account settings
2. `role_media_profiles.portrait_asset_id`
3. generation-time toggle for whether reference mode is enabled

This allows portrait consistency without confusing account-level model choice and role-level identity.

### Audio runtime

Audio runtime should read:

1. `role_media_profiles.audio_asset_id` or the compatible role-level audio binding
2. the bound audio asset's `model_slug`
3. the bound audio asset's `voice_key`

Important limitation:

Voice consistency can be strong inside the same provider family when a stable provider voice key is used.
It is not guaranteed across different audio providers or model families.

So the system should treat role voice consistency as:

- stable within the same provider-specific voice option
- best-effort only across provider changes

That is exactly why role voice selection should be stored as a concrete reusable audio asset id instead of only abstract trait text.

## Recommended First Implementation

The first implementation should stay narrow:

1. Keep account-level default text and image model slugs where they are today.
2. Keep audio configuration role-level.
3. Add `role_media_profiles` for portrait and role audio binding.
4. Add `product_audio_voice_options` as the first reusable audio asset library.
5. Mirror high-level appearance and voice facts into the role-memory layer as descriptive data, but do not use role-memory as the canonical execution source.

This gives us:

- a clear runtime source of truth
- short role creation flow
- role-specific portrait and voice consistency
- room to evolve role-memory prompting later without breaking execution logic

## Schema Draft

### Fit with current tables

Today we already have:

- `agents`
- `agents.default_model_profile_id`
- `agents.metadata`
- `user_app_settings.metadata`

That means we do **not** need to redesign the existing account-level model choice path.
The current recommendation is:

- keep account-level text and image model slugs in `user_app_settings.metadata`
- keep `agents.default_model_profile_id` as a compatibility field for current text runtime
- introduce dedicated role-media tables instead of pushing more image/audio behavior into `agents.metadata`

This keeps the current runtime stable while creating a clean path for image and audio support.

### Table: `role_media_profiles`

Purpose:

- canonical execution source for role portrait and role voice binding
- one row per role

Suggested shape:

```sql
create table if not exists public.role_media_profiles (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agents (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  portrait_asset_id uuid references public.assets (id) on delete set null,
  portrait_reference_enabled_by_default boolean not null default true,
  portrait_style_notes text not null default '',
  audio_asset_id uuid references public.product_audio_voice_options (id) on delete set null,
  audio_voice_option_id uuid references public.product_audio_voice_options (id) on delete set null,
  audio_provider text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

Recommended indexes:

```sql
create index if not exists role_media_profiles_workspace_id_idx
  on public.role_media_profiles (workspace_id);

create index if not exists role_media_profiles_owner_user_id_idx
  on public.role_media_profiles (owner_user_id);

create index if not exists role_media_profiles_audio_voice_option_id_idx
  on public.role_media_profiles (audio_voice_option_id);
```

Why this shape:

- `agent_id unique`
  makes the profile truly role-scoped
- `workspace_id` and `owner_user_id`
  keep policy checks and joins consistent with the rest of the product tables
- `portrait_asset_id`
  cleanly binds a role portrait without overloading memory or settings
- `audio_voice_option_id`
  keeps compatibility during the transition from voice-option naming to audio-asset naming
- `audio_asset_id`
  stores the concrete reusable role audio binding
- `audio_provider`
  is a lightweight denormalized helper for runtime and debugging

### Table: `product_audio_voice_options`

Purpose:

- per-model catalog of reusable selectable role audio assets
- system-managed audio assets rather than user-created voice definitions in v1

Suggested shape:

```sql
create table if not exists public.product_audio_voice_options (
  id uuid primary key default gen_random_uuid(),
  model_slug text not null,
  provider text not null,
  voice_key text not null,
  display_name text not null,
  gender_presentation text,
  style_tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_audio_voice_options_model_voice_unique
    unique (model_slug, voice_key)
);
```

Recommended indexes:

```sql
create index if not exists product_audio_voice_options_model_slug_idx
  on public.product_audio_voice_options (model_slug);

create index if not exists product_audio_voice_options_provider_idx
  on public.product_audio_voice_options (provider);

create index if not exists product_audio_voice_options_is_active_idx
  on public.product_audio_voice_options (is_active);
```

Why this shape:

- `model_slug`
  ties every voice to a specific account-level audio model
- `voice_key`
  stores the provider-specific concrete identifier
- `display_name`
  gives the console a stable user-facing label
- `style_tags`
  supports small descriptive tags like `Warm`, `Bright`, `Calm`
- `is_default`
  lets the backend auto-bind a recommended starting audio asset at role creation

### Optional table: `role_media_profile_history`

This is optional for the first pass, but useful if we want auditability for portrait and voice changes later.

```sql
create table if not exists public.role_media_profile_history (
  id uuid primary key default gen_random_uuid(),
  role_media_profile_id uuid not null references public.role_media_profiles (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
```

Suggested uses:

- track portrait changes
- track voice option rebinding
- support future “switch back” or audit UX

This table is not required before runtime integration starts.

## Create Flow Data Contract

### Role creation input

The role creation flow should stay lightweight.
It does **not** need to ask the user to choose a voice option.

Creation should continue to collect:

- role name
- role mode
- tone
- relationship mode
- avatar preset and related appearance cues

### Role creation side effects

On successful role creation:

1. Create the `agents` row as today.
2. Create the `threads` row as today.
3. Create a `role_media_profiles` row.
4. Derive a recommended reusable audio asset from role setup traits such as tone or gender cues.
5. Store any high-level appearance summary in role-memory as a mirror, not the execution source.

This preserves the short creation flow while still making portrait and audio support concrete from day one.

## Runtime Read Contract

### Text runtime

Keep the current behavior:

- account-level text model default first
- legacy role-level text binding only as compatibility fallback

### Image runtime

Read from:

1. `user_app_settings.metadata.default_image_model_slug`
2. `role_media_profiles.portrait_asset_id`
3. `role_media_profiles.portrait_reference_enabled_by_default`
4. request-level override if the generation UI exposes one

### Audio runtime

Read from:

1. `role_media_profiles.audio_asset_id`
2. `product_audio_voice_options.model_slug`
3. `product_audio_voice_options.voice_key`

This is the key design rule:

- role-level audio asset chooses both the engine family and the concrete role sound

## Role-Memory Mirror Contract

The five-layer memory system can still carry role-facing facts.
For image and audio, it should store **descriptive mirrors**, not canonical runtime ids.

Good role-memory examples:

- “She usually appears with a sharp editorial portrait look.”
- “His voice is calm, slightly low, and warm.”
- “She sounds bright and expressive when sending voice replies.”

Bad role-memory examples:

- raw provider voice ids
- asset ids
- execution toggles like `portrait_reference_enabled_by_default`

So the recommended contract is:

- structured media tables drive runtime
- role-memory reflects the role’s self-consistent identity in natural language

## Implementation Plan

### Final ownership model

- `Settings`
  - text model
  - image model
- `Role`
  - portrait asset binding
  - portrait reference toggle
  - audio asset binding

Audio should no longer be split between settings and role surfaces.
If the role’s sound needs to stay coherent, both the audio model source and the concrete voice choice must live in the same role-level asset binding.

### Execution order

1. Freeze the data model:
   - `product_portrait_assets` is the reusable portrait library
   - `product_audio_voice_options` is the reusable audio asset library
   - `role_media_profiles` becomes the binding table
2. Add `role_media_profiles.audio_asset_id` and use it as the future primary read path.
3. Keep `audio_voice_option_id` as a compatibility bridge until reads and writes have fully switched.
4. Update role creation to auto-bind a recommended audio asset instead of relying on account-level audio selection.
5. Remove audio model selection from settings once the role page owns the whole audio configuration.
6. Wire runtime to read:
   - account text/image defaults
   - role portrait asset binding
   - role audio asset binding

### Short-term compatibility rule

Until the full switch is complete:

- new writes should prefer the role-level audio asset path
- old reads may still fall back to `audio_voice_option_id`
- account-level `default_audio_model_slug` should be treated as temporary legacy/defaulting input, not the final product contract

Current implementation note:

- `audio_asset_id` is the preferred role-level binding field
- `audio_voice_option_id` remains as a temporary compatibility mirror
- the Settings surface should no longer expose audio model selection once role-level audio binding is active

## Asset Import Contract

To avoid rethinking schema when real media arrives, both reusable asset libraries should expose a stable import contract now.

This contract should work for:

- SQL seed imports
- CSV or spreadsheet-assisted imports
- future internal admin tooling
- future user-upload flows

### Portrait asset import contract

Target table:

`product_portrait_assets`

Required fields:

- `source_type`
- `display_name`

Recommended fields:

- `owner_user_id`
- `workspace_id`
- `provider`
- `storage_path`
- `public_url`
- `gender_presentation`
- `style_tags`
- `is_shared`
- `is_active`
- `metadata`

Import notes:

- system presets should normally set:
  - `source_type = 'preset'`
  - `is_shared = true`
  - `owner_user_id = null`
- user uploads should normally set:
  - `source_type = 'upload'`
  - `owner_user_id = <user id>`
  - `is_shared = false`
- generated portraits should normally set:
  - `source_type = 'generated'`
  - `provider = <generation provider>`

Recommended metadata examples:

- `preset_key`
- `origin_model_slug`
- `seed_prompt`
- `safety_flags`
- `notes`

### Audio asset import contract

Target table:

`product_audio_voice_options`

Required fields:

- `model_slug`
- `provider`
- `voice_key`
- `display_name`

Recommended fields:

- `gender_presentation`
- `style_tags`
- `sort_order`
- `is_default`
- `is_active`
- `metadata`

Import notes:

- one row should represent one concrete reusable audio asset
- `model_slug` is the engine family source for that asset
- `voice_key` is the provider-specific stable identifier
- `display_name` is the role-console label the user sees

Recommended metadata examples:

- `locale`
- `sample_audio_url`
- `age_presentation`
- `tone_family`
- `provider_voice_name`
- `provider_voice_version`

### Binding contract

After import, roles should only bind by asset id:

- `role_media_profiles.portrait_asset_id`
- `role_media_profiles.audio_asset_id`

That keeps runtime simple:

- look up the bound portrait asset
- look up the bound audio asset
- resolve provider/runtime fields from the asset row

It also keeps future editing simple:

- changing a role portrait means changing one bound portrait asset id
- changing a role voice means changing one bound audio asset id

## First-Batch Shipping Recommendation

### Text

- `OpenAI GPT-4o mini`
- `Meta Llama 3 8B`
- `Anthropic Claude Sonnet 4`
- `OpenAI GPT-4.1`

### Image

- `Google Nano Banana`
- `FLUX.2 Pro`
- `Google Nano Banana Pro`

### Audio

- `MiniMax Speech`
- `Google Gemini 2.5 Flash TTS`
- `ElevenLabs Eleven v3`

## Provider Integration Recommendation

### First wave

- Text: continue with `LiteLLM + Replicate`
- Image: prefer `Replicate` first
- Audio: do not force `Replicate`

### Why

Text already has the best architectural fit through the existing LiteLLM path.
Image can reasonably share the same “fast provider aggregation first” strategy.
Audio is different because the best candidates are not naturally centered on the same proxy path:

- `ElevenLabs`
- `Google Gemini TTS`
- `MiniMax`
- `AWS Polly`

This makes audio better suited to a dedicated service layer instead of being artificially normalized too early.

## Single Source Of Truth

Before we change more migrations or settings-page rendering, the product model catalog should be centralized in one code-owned source.

The source should live in:

- `apps/web/lib/product/model-catalog.ts`

That file should define every product-facing candidate model we want to show in settings, even when the model is not yet wired into runtime.

### Required fields

Each catalog entry should define:

- `slug`
- `capability`
- `displayName`
- `provider`
- `tier`
- `tags`
- `integrationMode`
- `uiStatus`

Optional fields can then support runtime wiring:

- `litellmModelName`
- `replicateModelRef`
- `runtimeProfileSlug`
- `statusLabel`
- `isDefault`

### Why this is necessary

Right now the project is at risk of drifting because model definitions are spread across:

- migration seed data
- settings-page option assembly
- runtime profile records
- LiteLLM config

That makes it too easy for one layer to reflect an older shortlist while another layer reflects a newer longlist.

### Working rule

The catalog file should become the product-level truth for:

- which models are visible
- whether a model is `active` or `planned`
- whether the model is intended to use `replicate` or `official`
- which tags explain the model to users
- whether the model belongs to `free` or `pro`

After that:

1. migrations should be updated from the catalog
2. settings-page rendering should read catalog-backed data
3. LiteLLM config should only include models whose `integrationMode` is `replicate` and whose `uiStatus` is `active`

## Current Candidate Counts

The currently agreed candidate pools are:

### Text

These 8 models should be represented in the catalog:

- `OpenAI GPT-4o mini`
- `Anthropic Claude Sonnet 4`
- `OpenAI GPT-4.1`
- `Google Gemini 2.5 Pro`
- `Google Gemini 2.5 Flash`
- `DeepSeek Chat`
- `DeepSeek Reasoner`
- `Meta Llama 3 8B`

### Image

These 6 models should be represented in the catalog:

- `Google Nano Banana`
- `Google Nano Banana Pro`
- `FLUX.2 Pro`
- `FLUX.2 Flex`
- `Ideogram 3.0`
- `Recraft V4 Pro`

### Audio

These 7 models should be represented in the catalog:

- `ElevenLabs Eleven v3`
- `ElevenLabs Multilingual v2`
- `Google Gemini 2.5 Flash TTS`
- `Google Gemini 2.5 Pro TTS`
- `MiniMax Speech`
- `AWS Polly Neural`
- `AWS Polly Generative`

## Local vs Railway LiteLLM

The repo currently has two different LiteLLM config files in practice:

- `sparkcore/scripts/litellm/config.yaml`
- the Railway LiteLLM service config in the separate `sparkcore-litellm` deployment repo

Their intended roles should be:

- local repo config: local development and local testing
- Railway config: deployed environment behavior

This means:

- adding a `replicate` model to the local config only changes local behavior
- the Railway config must also be updated later if the production LiteLLM service should expose the same model

## Follow-Up Decisions

### Defaults

The unified model catalog should also carry product defaults by tier.

Current working defaults:

- text free: `OpenAI GPT-4o mini`
- text pro: `Anthropic Claude Sonnet 4`
- image free: `Google Nano Banana`
- image pro: `Google Nano Banana Pro`
- audio free: `MiniMax Speech`
- audio pro: `ElevenLabs Eleven v3`

### Google Image Family

Current working decision:

- `Google Nano Banana` and `Google Nano Banana Pro` should both stay in the same first-wave integration family
- both should be treated as `replicate` in the unified catalog for now
- if we later move the Google image family to official direct integration, both should be changed together

## Backend Capability Planning

### Text

No major product architecture change is needed beyond expanding the catalog and runtime mapping.

### Image

To support the image pool well, backend work should include:

- generation jobs
- generated asset persistence
- provider-specific request mapping
- moderation and failure state handling
- credits and quota accounting

### Audio

To support the audio pool well, backend work should include:

- text-to-speech job execution
- audio file persistence
- provider-specific voice configuration
- quota and credits accounting
- future role-level voice binding

## Role-Aware Follow-Up Work

These should be tracked as related but separate features.

### Role image support

- role portrait reference image
- role portrait generation profile
- style consistency controls

### Role audio support

- role voice preset or provider voice ID
- tone / pace / expressiveness settings
- optional account default with role override

These do not need to block the first account-level model settings rollout, but they should inform the schema and service design.

## Immediate Next Step

Use this catalog decision to update:

1. `product_model_capabilities`
2. `product_plan_model_access`
3. settings-page labels and tags
4. the first-batch runtime roadmap:
   - text first
   - image second
   - audio after service-layer work
