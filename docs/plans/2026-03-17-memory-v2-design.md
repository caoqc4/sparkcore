# SparkCore Memory v2 Design

## Purpose

Memory v2 upgrades SparkCore long-term memory from a lightweight feature set into a stable contract with:

- clear ontology
- explicit scope rules
- controlled update behavior
- deterministic recall where needed
- explainable generation behavior
- closed-loop correction

This design is intended to guide issue breakdown and implementation. It is not a full platform design and does not include knowledge base or heavy multi-agent orchestration.

## Design Principles

- Prefer structured memory before narrative memory.
- Prefer deterministic slot recall before semantic recall.
- Keep long-term memory and thread-local context logically aligned but physically separated.
- Separate correction states from replacement states.
- Avoid automatic content rewriting or merge generation in P0.
- Bind agent-scoped memory to `agent_id`, never to an agent display name.

## Memory Ontology

### `profile`

Use for stable user facts.

Good fit:

- profession
- location
- role/background

Not a fit:

- temporary emotions
- one-off plans
- speculative guesses

Examples:

- `profile.profession = product designer`
- `profile.location = shanghai`

Memory class:

- structured

### `preference`

Use for stable or recurring user preferences.

Good fit:

- planning style
- reply style preference
- workflow preference

Not a fit:

- temporary requests for the current thread only
- unstable interests with no repetition

Examples:

- `preference.planning_style = concise weekly planning`
- `preference.reply_style = concise`

Memory class:

- structured

### `relationship`

Use for user-agent relationship agreements.

Good fit:

- how the user addresses the current agent
- how the agent should address the user in this relationship

Not a fit:

- generic user facts
- non-relational preferences

Examples:

- `relationship.agent_nickname = 小芳`
- `relationship.user_preferred_name = 阿强` (reserved for later)

Memory class:

- structured

### `goal`

Use for medium-term user goals that may persist across turns.

Good fit:

- a multi-turn product goal
- a recurring planning target

Not a fit:

- a temporary request inside one thread
- a same-day one-off idea

Examples:

- `goal.current_focus = improve answer quality`

Memory class:

- reserved in P0
- may later span structured and note-like memory

## Scope System

### `user_global`

Applies across the user workspace.

Best for:

- profession
- city
- stable preferences

Examples:

- `profile.profession`
- `preference.planning_style`

### `user_agent`

Applies to one user and one agent.

Best for:

- `relationship.agent_nickname`
- later `relationship.user_preferred_name`

Rules:

- survives new threads with the same agent
- does not carry over to a different agent
- must bind to `target_agent_id`

### `thread_local`

Applies only to the current thread.

Best for:

- temporary agreements
- thread-only working context

Examples:

- “in this thread, reply with bullet points”
- “for this thread, focus only on roadmap planning”

Rules:

- should not be treated as long-term memory by default
- should not share the same primary storage flow or UI section as long-term memory

## Relationship Priority Case

### `relationship.agent_nickname`

P0 priority case:

- user says: `我以后叫你小芳可以吗`

Semantic meaning:

- this is the current user's preferred way to address the current agent
- it does **not** rename the agent globally
- it does **not** affect what other users see

Recommended shape:

- `category = relationship`
- `key = agent_nickname`
- `value = 小芳`
- `scope = user_agent`
- `subject_user_id = <user>`
- `target_agent_id = <current agent>`

Why not store under `profile` or `preference`:

- it is not “who the user is”
- it is not “what the user likes”
- it is a user-agent relationship contract

Expected behavior:

- same agent + new thread: recall should still work
- different agent: no recall
- `incorrect` should disable recall
- `restore` should re-enable recall

### Important distinction

Memory v2 should distinguish:

1. how the user addresses the current agent
2. the agent's canonical identity

P0 stores only the first one as memory. Canonical identity stays in the agent object.

## Data Contract

Suggested record fields for long-term structured memory:

- `id`
- `category`
- `key`
- `value`
- `scope`
- `subject_user_id`
- `target_agent_id`
- `target_thread_id`
- `confidence`
- `stability`
- `status`
- `source_refs`
- `created_at`
- `updated_at`
- `last_used_at`
- `last_confirmed_at`

### Field purpose

- `category`: ontology bucket, such as `profile` or `relationship`
- `key`: structured slot name, such as `profession` or `agent_nickname`
- `value`: slot value
- `scope`: where the memory is valid
- `subject_user_id`: owner user
- `target_agent_id`: required for `user_agent`
- `target_thread_id`: required for `thread_local`
- `confidence`: extraction or confirmation confidence
- `stability`: expected persistence, initially `low | medium | high`
- `status`: lifecycle state
- `source_refs`: traceability to message/thread/time
- `last_used_at`: supports later ranking/aging
- `last_confirmed_at`: supports later trust upgrades

## Status Model

Recommended statuses:

- `active`
- `hidden`
- `incorrect`
- `superseded`

### Meaning

- `active`: participates in recall
- `hidden`: temporarily not visible or recallable by user choice
- `incorrect`: explicitly marked wrong by the user
- `superseded`: replaced by a newer value in the same slot

### Transition rules

- `active -> hidden`
- `active -> incorrect`
- `active -> superseded`
- `hidden -> active` via restore
- `incorrect -> active` via restore
- `superseded` is normally not restored manually; it belongs to the replacement chain

## Update Contract

### Single-slot memory

P0 should focus on single-slot memory.

Definition:

- for one `subject_user_id + scope + category + key + target scope binding`, only one `active` value should exist

Examples:

- `profile.profession @ user_global`
- `relationship.agent_nickname @ user_agent`

### Multi-valued memory

Reserved for later.

Examples:

- multiple long-term interests
- multiple long-term goals

### Replacement rule

When a new value targets the same slot:

- replace the old `active` value only if the new one is more explicit, higher-confidence, or newer
- mark the old one `superseded`
- do not delete historical rows

### Normalization rule

P0 should apply light normalization before slot comparison:

- trim whitespace
- lowercase English
- basic full-width / half-width normalization
- strip obvious punctuation noise

This is enough to prevent easy duplicates without adding heavy NLP.

### Why not automatic merge

Do not auto-merge content into a new rewritten memory sentence in P0.

Reason:

- it increases factual risk
- it makes memory less trustworthy
- it complicates correction semantics

P0 should only:

- skip duplicate writes
- keep one active value
- replace lightly when needed

## Recall Contract

Memory v2 should distinguish two retrieval paths.

### Structured slot recall

Use for deterministic questions and direct factual lookups.

Examples:

- `你叫什么`
- `我做什么工作`
- `我喜欢什么样的规划方式`

Rules:

- category/key/scope-first lookup
- highest priority path

### Semantic note recall

Use for fuzzier references or later note-style memory.

Rules:

- only after structured recall cannot answer directly
- should never override a valid structured slot hit

### Recall priority examples

Question: `你叫什么`

1. `relationship.agent_nickname @ user_agent`
2. agent canonical name
3. fallback self-introduction

Question: `我做什么工作`

1. `profile.profession @ user_global`
2. semantic notes
3. explicit “I don't know”

## Answer Fidelity

Recall hit does not guarantee a correct answer.

Why:

- memory only enters context
- the model may ignore it
- the model may confuse long-term memory with thread history
- semantic context may distort a direct fact answer

### Required generation constraints

When structured recall hits for a direct question:

- answer from the slot first
- do not say you have no memory when relevant structured memory was recalled
- do not confuse “no previous conversation” with “no long-term memory”

For `relationship.agent_nickname`:

- if the user asks how to address the agent, prefer the nickname
- do not default to canonical agent name when a valid nickname slot is available

For language:

- if the current turn target language is Chinese, the whole answer should stay Chinese even if the recalled slot content or internal prompt snippets are English

## UI / Product Visibility

P0 should keep visibility lightweight.

### Long-term memory panel

Show:

- `category`
- `key`
- `value`
- `scope`
- `confidence`
- `status`

### Relationship memory rendering

Example:

- `relationship`
- `Agent nickname`
- `小芳`
- `This agent`

### Scope labels

- `Global`
- `This agent`
- `This thread`

### Product explanation

Users should understand:

- `Global` applies across agents in the workspace
- `This agent` applies only when talking to the same agent
- `This thread` is temporary and local to one thread

### Separation rule

Thread-local agreements should not share the same main panel and lifecycle presentation as long-term memory. Reuse the field model if useful, but keep the UI section separate.

## Eval Matrix

Memory v2 evaluation should cover:

- write correctness
- scope correctness
- update correctness
- recall correctness
- answer fidelity
- correction correctness

### Core cases

#### Profile

- write `profile.profession = product designer`
- verify recall in a new thread
- verify recall across different agents
- verify `incorrect` disables recall
- verify `restore` re-enables recall

#### Preference

- write `preference.planning_style = concise weekly planning`
- verify planning questions use it
- verify unrelated questions do not force it

#### Relationship nickname

- write `relationship.agent_nickname = 小芳` for `Memory Coach`
- verify same agent + new thread still recalls it
- verify different agent does not recall it
- verify `incorrect` disables recall
- verify `restore` re-enables recall

#### Thread-local agreement

- verify it stays inside the same thread
- verify it does not cross into a new thread
- verify it does not appear in long-term memory UI

#### Fidelity

- when structured recall hits, answer should follow slot value
- do not answer “I don't know” when valid structured memory is available
- do not say “we have never talked before” as a substitute for “I have no long-term memory”

## Phased Rollout

### P0

- Memory v2 record shape
- `relationship` category
- `user_agent` scope
- `single-slot` update
- `relationship.agent_nickname`
- name-related structured recall
- memory panel shows `category + scope + status`
- eval for:
  - same agent remembers in new thread
  - different agent does not inherit
  - incorrect / restore behave correctly

### P1

- `relationship.user_preferred_name`
- more relationship keys
- clearer UI copy
- fuller fidelity constraints
- lightweight `goal` onboarding into ontology

### Deferred

- automatic merge / rewriting
- large-scale narrative memory
- heavy memory center
- knowledge base mixed into memory
- multi-agent orchestration memory

## Recommended Minimum Implementation Path

1. introduce Memory v2 record shape
2. add `relationship.agent_nickname`
3. add `user_agent` scope
4. add single-slot replacement logic
5. implement name-related structured recall
6. expose `category + scope + status` in the memory panel
7. run evals for:
   - same agent remembers
   - different agent does not leak
   - incorrect / restore work correctly

