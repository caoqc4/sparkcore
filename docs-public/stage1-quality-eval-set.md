# SparkCore Stage 1 Quality Eval Set

Use this set when prompts, model profiles, or runtime instructions change and you want to compare quality against fixed examples instead of gut feel.

This is intentionally lightweight. It is not a full evaluation platform. It is a small, repeatable baseline for the current `/chat` workspace.

## How to Use It

1. Start from a known-good local or trial environment.
2. Run the same cases after any meaningful prompt, model, or profile change.
3. Record:
   - the active agent
   - the model profile used
   - the final answer
   - the runtime summary outcome
4. Compare against previous runs before deciding whether a change improved quality.

To print the latest version of the eval set from source:

```bash
cd apps/web
npm run quality:eval
```

For machine-readable output:

```bash
cd apps/web
npm run quality:eval -- --format=json
```

## Suggested Stage 1 Profile Tiers

Use the same eval cases across a small, named set of model profiles so you can compare behavior without changing the scenario:

- `Spark Default`
  Stable conversation baseline for everyday chat quality.
- `Spark Memory Sensitive`
  Lower-temperature profile for direct memory-recall checks and factual follow-up turns.
- `Spark Low-Cost Testing`
  Cheaper comparison profile for rough prompt and language checks before trying a stronger profile.

## Stage 1 Cases

### 1. Memory-hit follow-up stays grounded in recalled facts

- Priority: `P0`
- Category: `memory`
- Purpose: check whether a recalled `profile` or `preference` memory is reflected in the final answer instead of being ignored or contradicted

Setup:

- use an agent with a stable conversation-oriented model profile
- start from a clean thread so the test is not biased by previous turns

Steps:

1. Send: `I am a product designer and I prefer concise weekly planning.`
2. Then ask: `What profession do you remember that I work in? If you do not know, say you do not know.`
3. Expand the runtime summary under the assistant reply

Success criteria:

- the runtime summary shows a relevant memory hit
- the final answer reflects the recalled profession
- the reply does not confuse “no chat history” with “no long-term memory”

### 2. Chinese input receives a Chinese reply

- Priority: `P0`
- Category: `language`
- Purpose: verify that the assistant follows the user language for a Chinese turn without a separate settings page

Steps:

1. Send: `请用两句话介绍你自己，并说明你能如何帮助我。`

Success criteria:

- the reply is primarily in Chinese
- the response does not drift into English without an explicit reason

### 3. English input receives an English reply

- Priority: `P0`
- Category: `language`
- Purpose: verify that the assistant follows the user language for an English turn without a separate settings page

Steps:

1. Send: `Please introduce yourself in two short sentences and explain how you can help me.`

Success criteria:

- the reply is primarily in English
- the response does not drift into Chinese without an explicit reason

### 4. Thread switching preserves URL-scoped continuity

- Priority: `P0`
- Category: `thread`
- Purpose: verify that each thread keeps its own context and that switching between threads does not mix their histories

Setup:

- create two different threads bound to visible agents
- send one distinctive message in each thread

Steps:

1. Open thread A and confirm its latest message preview
2. Switch to thread B and confirm a different preview or context
3. Refresh the page while thread B is active
4. Return to thread A using the sidebar

Success criteria:

- refreshing keeps the current thread selected
- messages and summaries do not bleed across threads

### 5. Incorrect and restore change recall eligibility predictably

- Priority: `P0`
- Category: `correction`
- Purpose: verify that correction controls affect future recall and that restore reliably re-enables the memory

Setup:

- pick a visible memory that is easy to test, such as a clear profession or preference

Steps:

1. Mark the memory as `Incorrect`
2. Start a fresh thread and ask a question that should use that memory
3. Restore the same memory
4. Start another fresh thread and ask the same question again

Success criteria:

- `Incorrect` prevents the memory from participating in later recall
- `Restore` makes the memory visible and recall-eligible again

### 6. Model profile changes can be compared against the same prompt set

- Priority: `P0`
- Category: `model-profile`
- Purpose: create a stable comparison path for answer quality when swapping model profiles

Setup:

- use the same agent and switch only the model profile between runs
- reuse the same prompts from the memory and language cases

Steps:

1. Run the memory-hit follow-up case on profile A
2. Switch to profile B
3. Run the same case again in a fresh thread
4. Compare the final answer and runtime summary

Success criteria:

- the runtime summary reflects the selected profile
- quality differences can be judged against the same baseline instead of intuition
