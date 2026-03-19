# SparkCore Answer Strategy Question Matrix

Use this matrix when adjusting answer fidelity so direct recall and open-ended generation are driven by a small explicit set of question types instead of ad-hoc prompt tweaks.

This is intentionally lightweight. It is not a planner, router, or heavy rules engine. It is a runtime-level guide for when structured recall should dominate and when generation should stay more open while still grounded.

## Question Types

### 1. Direct fact questions

Examples:

- `What profession do you remember that I work in?`
- `你记得我做什么工作吗？`
- `我喜欢什么样的回复方式？`

Preferred strategy:

- `structured-recall-first`

Guidance:

- Prefer deterministic structured recall.
- Answer the asked fact directly.
- Do not blur the answer into generic advice.

### 2. Direct relationship-confirmation questions

Examples:

- `你叫什么？`
- `我以后怎么叫你？`
- `你应该怎么称呼我？`

Preferred strategy:

- `relationship-recall-first`

Guidance:

- Prefer relationship recall before canonical fallback identity.
- Use nickname / preferred-name memory when present.
- Only fall back to canonical naming when the relationship slot is empty.

### 3. Open-ended advice questions

Examples:

- `你会怎么帮我规划这周？`
- `What should I do next given what you know about me?`

Preferred strategy:

- `grounded-open-ended-advice`

Guidance:

- Keep the answer natural and action-oriented.
- Use recalled memory as grounding context.
- Do not turn the reply into a rigid fact dump.

### 4. Open-ended summary questions

Examples:

- `请简单介绍一下你自己。`
- `简单总结一下你对我的了解。`

Preferred strategy:

- `grounded-open-ended-summary`

Guidance:

- Keep the answer summary-shaped and natural.
- Let relevant facts and relationship cues show up in the wording.
- Do not ignore recalled memory, but do not enumerate slots mechanically.

### 5. Fuzzy follow-up questions

Examples:

- `那接下来呢？`
- `然后呢？`
- `再确认一次？`

Preferred strategy:

- `same-thread-continuation`

Guidance:

- Prioritize the language, relationship style, and continuity already established in the current thread.
- Avoid resetting to a neutral default tone.
- Let same-thread continuity beat distant defaults when the follow-up is short and ambiguous.

## Default Rule

If a prompt does not clearly fit the categories above:

- use `default-grounded`
- keep the answer naturally grounded in relevant memory
- avoid drifting into unsupported facts
- avoid overfitting to structured recall when the user did not ask a direct fact question
