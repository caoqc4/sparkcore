# Product Console Backend Actions & Runtime Flows

Date: 2026-03-29
Status: Active implementation reference
Audience: backend, frontend, integration testing

## Purpose

This document explains the real backend actions behind the Product Console after the recent refactor. It is meant to answer:

- Which user-visible actions now have real backend support
- What each action writes or updates
- What runtime side effects exist
- Which actions have already been integration-tested
- Which items are still pending or considered high-risk

This is not a replacement for the broader implementation checklist in
[2026-03-28-product-console-backend-support-checklist.md](/Users/caoq/git/sparkcore/docs/plans/2026-03-28-product-console-backend-support-checklist.md).
That checklist tracks coverage. This document explains behavior.

## Overall State

The Product Console backend is now in a usable state for the main safe paths:

- `Create Role` metadata persistence: implemented
- `Chat` message-source and runtime knowledge support: implemented
- `Role / Memory` category support and timestamp repair: implemented
- `Knowledge` create/process/retry/archive/delete lifecycle: implemented
- `Channels` connect/disconnect and invalid-binding state flow: implemented
- `Settings` save/export/audit flows: implemented

The main remaining work is no longer missing schema. It is mostly:

- a small number of high-risk actions not yet exercised on a disposable account
- optional product decisions such as whether create-step `traits` become durable data
- future quality improvements such as stronger document parsing

## Runtime Model

There are now three important backend layers:

1. Product action layer
   This is what the console buttons trigger.

2. Persistence and lifecycle layer
   This writes rows, updates statuses, records audits, and manages cleanup.

3. Runtime consumption layer
   This is where persisted state affects actual chat generation.

The most important recent addition is the knowledge runtime bridge:

- `knowledge_sources`
- `knowledge_snapshots`
- `loadRelevantKnowledgeForRuntime(...)`
- existing runtime governance and prompt-assembly path

That means external knowledge is no longer only managed in the console. It can now influence the live answer path.

## By Surface

### Chat

#### Main backend behavior

- Loads thread, role, bindings, thread state, message list, and summaries
- Reads message source metadata and exposes:
  - `sourceSurface`
  - `sourcePlatform`
  - `sourceBindingId`
- Builds page-ready summaries:
  - message counts
  - source counts
  - thread status

#### Runtime behavior

- The real reply path is `runAgentTurn(...)`
- During runtime, the system now loads:
  - recalled memory
  - thread state
  - relevant knowledge snippets
- Relevant knowledge is filtered by active namespace and then injected into the prompt path

#### Important side effects

- Persisted assistant message metadata now includes knowledge summary
- Runtime debug metadata records selected knowledge and namespace state

#### Integration-tested

- Yes
- Real runtime test confirmed knowledge-aware answer generation using remote data and live model path

### Role

#### Main backend behavior

- Loads role collection and selected role page data
- Exposes:
  - appearance summary
  - latest thread summary
  - memory counts
- Saves role-core settings:
  - name
  - mode
  - tone
  - relationship mode
  - proactivity
  - boundaries

#### Appearance metadata

Role appearance metadata is now persisted as product-facing role appearance state.

Current durable fields include:

- `avatar_preset_id`
- `avatar_style`
- `avatar_gender`
- `avatar_origin`

#### Integration-tested

- Yes for main role read/update path
- No separate dedicated high-risk case exists here

### Memory

#### Main backend behavior

- Supports expanded product-facing categories
- Aligns write and recall behavior for the newer category set
- Standardizes timestamps at read time
- Repairs historical timestamps via migration

#### Important state guarantees

- UI-facing memory rows should no longer surface invalid timestamp strings from dirty historical data
- Newer categories are no longer only frontend labels; they have actual write/retrieval support

#### Integration-tested

- Yes at the page and runtime level
- Timestamp issue was specifically verified as repaired in the page flow

### Knowledge

#### Main backend behavior

Supported source creation flows:

- note
- url
- document upload

Supported source lifecycle actions:

- process
- retry
- archive
- delete

#### Core persistence objects

- `knowledge_sources`
- `knowledge_snapshots`
- `knowledge_source_processing_runs`

#### Processing behavior

- Notes are processed immediately
- URLs attempt fetch-and-extract
- Documents go through upload and extraction path
- Processing records:
  - attempts
  - started/completed timestamps
  - error codes
  - processing run logs

#### Runtime behavior

Processed source text is chunked into `knowledge_snapshots`.
Those snapshots are then loaded by:

- `loadRelevantKnowledgeForRuntime(...)`

The results are converted into runtime knowledge snippets and passed into the existing knowledge governance layer in chat runtime.

#### Important side effects

- Failed processing clears stale snapshots
- Archive preserves source history but removes it from active use
- Delete also cleans up storage-backed files when present

#### Integration-tested

- Yes
- Confirmed:
  - create note
  - create url
  - upload document
  - process
  - retry
  - archive
  - delete
- Confirmed runtime use:
  a real answer used uploaded knowledge content in the final reply

### Channels

#### Main backend behavior

- Loads platform capabilities and binding summaries
- Supports binding lifecycle states:
  - `active`
  - `inactive`
  - `invalid`
- Supports connect and disconnect flows

#### Important runtime behavior

Binding failures can now mark a channel as `invalid` from real runtime events:

- proactive send failure
- Telegram webhook outbound delivery failure

#### Important side effects

- Platform summary can now surface:
  - connected
  - needs attention
  - web only
- Invalidations store failure context for later diagnosis

#### Integration-tested

- Yes for:
  - Telegram connect
  - disconnect
  - state changes back to `web_only`
- Runtime invalidation path is implemented, but not treated as a user-safe test path

### Settings

#### Main backend behavior

Supported settings actions:

- save app preferences
- save model settings
- save data/privacy settings
- save subscription snapshot
- export data
- sign out all sessions
- delete account

#### Core persistence objects

- product console settings tables
- export records
- deletion audits
- operation logs

#### Important side effects

- Export writes a user data export record
- Delete account writes deletion audit state
- All major settings actions now emit operation logs with:
  - started
  - completed
  - failed

#### Integration-tested

- Yes for safe actions:
  - preferences
  - model settings
  - subscription
  - privacy
  - export
- Not yet executed in a real disposable-account run:
  - sign out all sessions
  - delete account

### Create Role

#### Main backend behavior

The create flow now persists core role setup plus appearance metadata.

Persisted now:

- gender
- mode
- name
- tone
- relationship mode
- boundaries
- appearance preset metadata

#### Not fully decided

The `traits` UI in step 2 still needs a product/data decision:

- if it stays as onboarding guidance only, no backend work is required
- if it becomes a durable role attribute, it should be formalized as stored metadata

## Integration Test Status

### Passed

- Chat runtime can use knowledge in real answer generation
- Knowledge safe lifecycle actions
- Channels connect/disconnect
- Settings safe actions
- Role and memory page reads/updates

### Passed With Defensive Fixes

- URL knowledge processing no longer crashes the page on fetch failure
- Channels page no longer hard-fails the whole page on transient Supabase fetch issues

### Not Yet Executed

- `sign out all`
- `delete account`

These are intentionally untested in the active real account because they are destructive or session-breaking.

## Remaining Items

These are not blockers for the main console rollout, but they remain open:

### Product decision items

- Whether create-step `traits` should become durable role data

### Capability enhancement items

- Stronger parsing quality for rich documents such as complex PDF/DOCX/XLSX
- Better retrieval ranking for knowledge snapshots beyond the current lightweight lexical scoring

### Operational follow-up

- Run high-risk actions on a disposable test account
- Keep storage bucket and processing environment variables aligned across environments

## High-Risk Actions

These actions are implemented but should only be exercised on a disposable account:

### `sign out all sessions`

Risk:

- immediately invalidates current and other active sessions
- interrupts ongoing manual testing

Expected backend behavior:

- session invalidation
- operation log record

### `delete account`

Risk:

- destructive
- removes access to active test data
- should only be exercised when export and audit verification are planned

Expected backend behavior:

- data export snapshot can be created beforehand
- deletion audit row written
- operation log written

Reference test plan:
[2026-03-29-product-console-high-risk-actions-test-plan.md](/Users/caoq/git/sparkcore/docs/plans/2026-03-29-product-console-high-risk-actions-test-plan.md)

## Recommendation

Use this document as the action-level backend reference for the Product Console.

Use the checklist document for rollout status:
[2026-03-28-product-console-backend-support-checklist.md](/Users/caoq/git/sparkcore/docs/plans/2026-03-28-product-console-backend-support-checklist.md)

Use the high-risk test plan only when preparing a disposable-account verification run.
