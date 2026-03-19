# SparkCore Runtime Rule Verification Gap Audit

Use this note when deciding whether the next QA task should add a new focused regression or whether the rule is already covered well enough.

This is intentionally lightweight. It is not a full testing strategy. It is a short audit of the current runtime-rule surface so we can keep converting implicit behavior into repeatable checks instead of relying on memory.

## Current Strong Coverage

- Direct fact recall:
  - profession recall
  - planning-preference recall
  - reply-style recall
- Relationship recall:
  - agent nickname scope
  - preferred-name scope
  - same-agent continuity
- Open-ended answer shapes:
  - grounded advice
  - grounded summary
- Same-thread continuation:
  - fuzzy follow-up before distant memory fallback
  - relationship continuity on short carryover turns
  - mixed-language short follow-ups
- User explanation guardrails:
  - one main reason on the default explanation surface
  - developer diagnostics kept out of the default explanation surface
- Correction controls:
  - `Incorrect` / `Restore` for relationship memory
- Thread/runtime basics:
  - thread restore from URL
  - thread agent continuity

## High-Value Gaps Converted In This Round

### 1. Ambiguous follow-up language source

Previous gap:
- We checked that mixed-language follow-ups stayed in the right language when the user message was explicitly Chinese.
- We did not have a focused regression for when the user message is language-ambiguous and the runtime should fall back to same-thread continuity.

Focused regression added:
- ambiguous short follow-up after an English assistant turn
- expected diagnostics:
  - `answer_strategy=same-thread-continuation`
  - `answer_strategy_reason_code=same-thread-edge-carryover`
  - `continuation_reason_code=short-fuzzy-follow-up`
  - `reply_language_source=thread-continuity-fallback`

### 2. Relationship answer-shape prompt routing without prior thread carryover

Previous gap:
- We had continuity coverage once the thread style was already active.
- We did not have a focused regression showing that a relationship-shaped explanatory prompt in a fresh thread still routes through the intended answer-shape branch instead of being explained only by later same-thread carryover.

Focused regression added:
- explanatory relationship prompt in a fresh thread after relationship-style memory exists
- expected diagnostics:
  - `question_type=open-ended-summary`
  - `answer_strategy=grounded-open-ended-summary`
  - `answer_strategy_reason_code=relationship-answer-shape-prompt`
  - `same_thread_continuation_preferred=false`

### 3. `default-grounded` fallback branch

Previous gap:
- This branch existed in runtime diagnostics.
- We did not yet have a small focused smoke that isolated it on purpose.

Focused regression added:
- uncategorized grounded prompt after a seeded memory turn
- expected diagnostics:
  - `question_type=other`
  - `answer_strategy=default-grounded`
  - `answer_strategy_reason_code=default-grounded-fallback`
  - `same_thread_continuation_preferred=false`

## Remaining Lower-Priority Gaps

### 1. Correction aftermath diagnostics

Current state:
- We have correction behavior coverage.
- We do not yet have a metadata-focused regression that explains later-turn correction behavior with the same precision now used for answer-shape routing.

Why it is lower priority:
- Behavior coverage already exists.
- The missing piece is mainly debugging precision, not product blindness.

### 2. Model-profile comparison as cheap smoke

Current state:
- Model-profile comparison exists in eval docs and broader smoke coverage.
- We still do not have a narrow regression whose only job is to validate model-profile comparison metadata on a stable prompt pair.

Why it is lower priority:
- It is useful for QA discipline, but it is less urgent than runtime-rule routing and continuity regressions.

## Suggested Next Conversion Order

1. Add a metadata-focused correction-aftermath regression if debugging those turns becomes costly again.
2. Add a cheap model-profile comparison smoke only if profile-switch regressions start recurring.
