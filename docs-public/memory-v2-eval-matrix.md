# SparkCore Memory v2 Eval Matrix

Use this set when Memory v2 schema, scope, update, recall, or correction behavior changes and you need a repeatable baseline instead of relying on gut feel.

This remains intentionally lightweight. It is not a full evaluation platform. It is the minimum repeatable matrix for Memory v2 behavior in the current `/chat` workspace.

## How to Use It

1. Start from a known-good local or trial environment.
2. Re-run the same cases whenever Memory v2 schema, recall rules, update rules, or correction flows change.
3. Record:
   - the active agent
   - the model profile used
   - the final answer
   - the runtime summary outcome
   - the visible memory row state in the panel
4. Compare against previous runs before deciding whether a change improved or regressed behavior.

To print the latest matrix from source:

```bash
cd apps/web
npm run quality:eval -- --suite=memory-v2
```

For machine-readable output:

```bash
cd apps/web
npm run quality:eval -- --suite=memory-v2 --format=json
```

## Memory v2 Cases

### 1. Memory writes land in the expected category, key, and scope

- Priority: `P0`
- Category: `memory`
- Purpose: verify that new Memory v2 writes use the intended structured fields instead of ambiguous fallback behavior

Setup:

- use a workspace with at least one visible agent
- open the memory panel before and after the write

Steps:

1. Send: `I am a product designer.`
2. Send: `以后我叫你小芳可以吗？`
3. Inspect the resulting memory rows

Success criteria:

- the profession is written as a global `profile` memory
- the nickname is written as a `relationship.agent_nickname` memory scoped to `This agent`

### 2. Agent nickname stays available for the same agent and does not leak to other agents

- Priority: `P0`
- Category: `scope`
- Purpose: verify that `user_agent` scope is bound to the agent id and survives new threads correctly

Setup:

- use two active agents in the same workspace
- write a nickname only for one of them

Steps:

1. On agent A, send: `以后我叫你小芳可以吗？`
2. Open a new thread with agent A and ask: `你叫什么？`
3. Open a new thread with agent B and ask: `你叫什么？`

Success criteria:

- agent A recalls `小芳`
- agent B falls back to its canonical name

### 3. Single-slot nickname updates replace the active value without auto-merging

- Priority: `P0`
- Category: `update`
- Purpose: verify that single-slot rules keep one active value for `relationship.agent_nickname`

Setup:

- use one agent with a clean nickname slot

Steps:

1. Send: `以后我叫你小芳可以吗？`
2. Then send: `我改一下，以后叫你阿芳吧。`
3. Open a new thread with the same agent and ask: `你叫什么？`

Success criteria:

- only the newer nickname stays active for recall
- the system does not auto-merge both nickname values into a rewritten answer

### 4. Direct naming questions use structured nickname recall before fallback identity

- Priority: `P0`
- Category: `recall`
- Purpose: verify that name-related direct questions use deterministic recall before generic self-introduction

Setup:

- use an agent that already has a nickname memory

Steps:

1. Ask: `你叫什么？`
2. Ask: `我以后怎么叫你？`
3. Ask: `你不是叫小芳吗？`

Success criteria:

- the reply consistently prefers the nickname when it exists
- the runtime summary shows relationship memory usage

### 5. Structured memory hits stay faithful in the final answer

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that structured memory hits are reflected in the final answer instead of being contradicted or blurred

Setup:

- use a memory-sensitive comparison profile

Steps:

1. Send: `I am a product designer.`
2. In a new thread, ask: `What profession do you remember that I work in? If you do not know, say you do not know.`
3. Expand the runtime summary

Success criteria:

- the summary shows the memory hit
- the answer directly states the profession
- the answer does not confuse “no chat history” with “no long-term memory”

### 6. Incorrect and restore change nickname recall eligibility predictably

- Priority: `P0`
- Category: `correction`
- Purpose: verify that correction controls work for relationship memory as well as profile/preference memory

Setup:

- use an agent with a stored nickname

Steps:

1. Mark the nickname memory as `Incorrect`
2. Open a new thread with the same agent and ask: `你叫什么？`
3. Restore the same memory
4. Open another new thread with the same agent and ask: `你叫什么？`

Success criteria:

- `Incorrect` removes the nickname from recall for that agent
- `Restore` makes the nickname available again for the same agent
