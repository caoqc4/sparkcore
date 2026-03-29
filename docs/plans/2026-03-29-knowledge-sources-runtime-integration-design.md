# 2026-03-29 Knowledge Sources Runtime Integration Design

## 1. Goal

Connect user-managed `knowledge_sources` into SparkCore's existing runtime knowledge layer so uploaded notes, URLs, and documents can actually influence chat generation.

This design intentionally does **not** create a second knowledge system.

It treats the current product-console knowledge source pipeline as the authoring and processing surface for the deeper memory-layer knowledge framework that already exists in runtime.

Target outcome:

- users can add and manage external knowledge in `Knowledge`
- processed content becomes retrievable runtime knowledge
- runtime still uses the existing:
  - `KnowledgeSnapshot`
  - `RuntimeKnowledgeSnippet`
  - namespace filtering
  - governance weighting
  - prompt selection

---

## 2. Current State

What already exists today:

- `knowledge_sources`
  - product-facing source record
  - status / processing / retry / archive / delete
- `knowledge_source_processing_runs`
  - processing observability
- `knowledge-processing.ts`
  - extracts a usable text excerpt for notes, URLs, and documents
- `Knowledge` page
  - source management UI

What does **not** exist yet:

- no persisted retrieval units derived from those sources
- no query-time lookup from `knowledge_sources`
- no conversion from processed source content into `RuntimeKnowledgeSnippet[]`
- runtime still builds with `relevantKnowledge: []`

So the product currently has:

- authoring
- processing
- lifecycle management

But it does **not** yet have:

- retrieval
- runtime injection

---

## 3. Existing Bottom-Layer Contract

The memory-layer design already defines the right conceptual model:

- `KnowledgeResource`
- `KnowledgeSnapshot`
- `KnowledgeLink`

The runtime layer already knows how to operate on:

- `RuntimeKnowledgeSnippet`
- scope filtering
- governance classes
- prompt selection

Important existing behavior:

- `project_document` is treated as `authoritative`
- `workspace_note` is treated as `contextual`
- `external_reference` is treated as `reference`

This means the missing link is not “how to rank knowledge.”  
The missing link is “how to feed real user-uploaded content into the knowledge layer that already exists.”

---

## 4. Approach Options

### Option A: Use `content_excerpt` directly at runtime

Treat each `knowledge_source` row as one runtime snippet and inject `content_excerpt` directly.

Pros:

- fastest path
- almost no new schema

Cons:

- `content_excerpt` is too thin to serve as a real retrieval unit
- no chunking
- weak recall quality
- over-couples product UI storage with runtime retrieval

Verdict:

- not recommended

### Option B: Add `knowledge_snapshots`, derive links from current source scope

Create normalized retrieval rows from processed source content, then convert those rows into runtime snippets at query time.

Pros:

- aligns with bottom-layer `KnowledgeSnapshot`
- keeps `knowledge_sources` as authoring surface
- gives runtime proper retrieval units
- does not force full `KnowledgeLink` complexity on day one

Cons:

- requires one new table and one retrieval path
- scope semantics are still partially derived rather than fully modeled

Verdict:

- recommended now

### Option C: Fully implement `KnowledgeResource + KnowledgeSnapshot + KnowledgeLink`

Build the entire conceptual model in one pass, including explicit link records for scope ownership and sharing rules.

Pros:

- cleanest long-term architecture
- closest to the memory-layer vision

Cons:

- more schema and migration work
- more product decisions are required up front
- slower to unlock runtime usage

Verdict:

- ideal future state, but too heavy as the first integration step

---

## 5. Recommended Direction

Use **Option B** now:

- keep `knowledge_sources` as the product-console authoring object
- add `knowledge_snapshots` as runtime retrieval units
- derive current scope from existing source ownership and role binding
- convert selected snapshots into `RuntimeKnowledgeSnippet[]`
- inject those snippets into the existing runtime knowledge flow

This preserves the existing product UI while hooking into the real runtime framework.

---

## 6. Data Model Mapping

### 6.1 Product Layer

`knowledge_sources`

This remains the user-facing resource record:

- title
- source type
- processing state
- storage path
- content excerpt
- error state

Conceptually, this already behaves like a product-facing `KnowledgeResource`.

### 6.2 Runtime Retrieval Layer

Add a new table:

- `knowledge_snapshots`

Recommended fields:

- `id`
- `knowledge_source_id`
- `workspace_id`
- `owner_user_id`
- `target_role_id` nullable
- `snapshot_index`
- `title`
- `summary`
- `body_text`
- `source_kind`
- `captured_at`
- `scope_user_id` nullable
- `scope_agent_id` nullable
- `scope_thread_id` nullable
- `scope_project_id` nullable
- `scope_world_id` nullable
- `metadata`
- `created_at`
- `updated_at`

This table is the bridge between product knowledge management and runtime retrieval.

### 6.3 Future Layer

Later, if scope and sharing become richer, add:

- `knowledge_links`

But this should not block the first runtime integration.

---

## 7. Scope Strategy

The current product UI does **not** expose explicit project/world knowledge management.

It only exposes:

- current role sources
- shared workspace sources

So the first integration should respect current product semantics instead of inventing new product layers.

### Phase-1 Scope Mapping

For role-bound knowledge sources:

- `scope_user_id = owner_user_id`
- `scope_agent_id = target_role_id`
- no `project_id`
- no `world_id`

For workspace-shared knowledge sources:

- `scope_user_id = owner_user_id`
- no `agent_id`
- no `project_id`
- no `world_id`

This means they will behave like `general` layer knowledge in scope ordering, but still be filtered correctly by namespace and weighted by `source_kind`.

This is acceptable for phase 1 because:

- it matches today’s product affordance
- it avoids inventing fake project/world bindings
- it still lets role-specific sources stay isolated to the active companion

### Later Scope Expansion

When the product adds explicit project or world knowledge controls, introduce:

- `scope_project_id`
- `scope_world_id`
- optional `knowledge_links`

That will allow the runtime’s project/world prioritization to become fully meaningful for uploaded sources.

---

## 8. Source Kind Mapping

Current uploaded sources should map into existing runtime governance classes rather than creating a new governance scheme.

Recommended phase-1 mapping:

- role- or workspace-scoped documents
  - `source_kind = project_document`
- role- or workspace-scoped notes
  - `source_kind = workspace_note`
- URLs / external web references
  - `source_kind = external_reference`

Why this mapping works:

- documents are usually the strongest authored material and should be treated as more authoritative
- notes are operator-curated, but usually more contextual than formal docs
- URLs are reference inputs unless later promoted

This allows existing runtime governance behavior to work immediately:

- `authoritative`
- `contextual`
- `reference`

No new governance class is needed for phase 1.

---

## 9. Processing Changes

Current processing ends by writing `content_excerpt`.

That is not enough for runtime use.

The processing pipeline should now do one extra step after successful extraction:

1. extract normalized source text
2. split into one or more chunks
3. create `knowledge_snapshots`
4. store:
   - short `summary`
   - chunk `body_text`
   - mapped `source_kind`
   - derived scope fields

### Chunking Rule for Phase 1

Keep it simple:

- if extracted text is short, create 1 snapshot
- if long, split by paragraph blocks or fixed-length chunks
- aim for readable snippets rather than embeddings-first optimization

This phase is about wiring the chain, not final retrieval quality.

### Minimum Snapshot Content

Each snapshot should contain:

- `title`
- `summary`
  - short clipped version of the chunk
- `body_text`
  - fuller chunk text

This gives runtime both:

- compact prompt-friendly summary
- fuller source text for future retrieval improvements

---

## 10. Retrieval Path

Add a new runtime-facing loader:

- `loadRelevantKnowledgeForRuntime(...)`

Recommended inputs:

- `userId`
- `agentId`
- `threadId`
- `workspaceId`
- `latestUserMessage`
- optional `limit`

Recommended output:

- `RuntimeKnowledgeSnippet[]`

### Retrieval Logic for Phase 1

1. load snapshots visible to:
   - current user
   - current role
   - workspace-shared sources
2. rank them using simple lexical relevance against the latest user message
3. keep a small top set
4. convert each row into:
   - `KnowledgeSnapshot`
   - then `RuntimeKnowledgeSnippet`

The ranking can be intentionally simple at first:

- title match bonus
- summary/body keyword overlap
- role-bound sources over workspace-shared sources
- active sources only

This is enough to make the knowledge layer real.

---

## 11. Runtime Integration Point

The runtime already expects `relevantKnowledge`.

Today it still starts with:

- `relevantKnowledge: []`

The phase-1 integration should change the flow to:

1. load relevant knowledge snippets before namespace resolution
2. pass those snippets into:
   - `resolveActiveMemoryNamespace(...)`
   - `filterKnowledgeByActiveNamespace(...)`
   - `resolveActiveScenarioMemoryPack(...)`
   - `buildKnowledgePromptSection(...)`

This is important because the knowledge layer is not just “extra prompt text.”

It already participates in:

- namespace filtering
- governance weighting
- scenario pack selection
- prompt budgeting

So the integration must happen **before** final prompt assembly, not after.

---

## 12. Guardrails

These rules should stay hard:

- uploaded knowledge must not be rewritten into user memory automatically
- uploaded knowledge must not overwrite thread state
- role-bound knowledge should stay isolated to the bound role unless explicitly shared
- archived or failed sources should not enter runtime retrieval

This keeps `Knowledge` separate from `Memory`, which matches the bottom-layer architecture.

---

## 13. Suggested Implementation Order

### Step 1

Add `knowledge_snapshots` schema and loader.

### Step 2

Extend `knowledge-processing.ts` so successful processing writes snapshots, not only excerpts.

### Step 3

Add `loadRelevantKnowledgeForRuntime(...)`.

### Step 4

Wire that loader into `runtime.ts` so `relevantKnowledge` is no longer empty.

### Step 5

Validate:

- role-bound note influences answers only for that role
- workspace-shared source influences multiple roles
- archived source no longer influences answers
- failed source does not enter retrieval

---

## 14. Non-Goals For This Task

This task does **not** need to solve:

- advanced vector search
- semantic reranking
- rich project/world knowledge UI
- full `knowledge_links` modeling
- final parsing quality improvements for every document type

Those can come after the runtime chain is connected.

---

## 15. Short Decision

The correct next move is:

- do not treat `knowledge_sources` as a display-only product layer
- do not invent a second parallel knowledge runtime
- convert processed product knowledge into `KnowledgeSnapshot`-like retrieval rows
- feed those rows into the existing `RuntimeKnowledgeSnippet` pipeline

That is the smallest change that makes the knowledge chain architecturally complete.
