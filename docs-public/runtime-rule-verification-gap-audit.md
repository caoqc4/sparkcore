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

### 4. Correction aftermath metadata

Previous gap:
- We already had correction behavior coverage.
- We did not yet have a metadata-focused regression that explained later-turn correction behavior with the same precision now used for answer-shape routing.

Focused regression added:
- mark a relationship nickname memory as `Incorrect`, verify the next fresh-thread direct naming turn falls back with correction metadata, then `Restore` and verify the following fresh-thread naming turn recalls the nickname again
- expected diagnostics:
  - after `Incorrect`:
    - `question_type=direct-relationship-confirmation`
    - `answer_strategy=relationship-recall-first`
    - `answer_strategy_reason_code=direct-relationship-question`
    - `memory_hit_count=0`
    - `incorrect_memory_exclusion_count=1`
  - after `Restore`:
    - `question_type=direct-relationship-confirmation`
  - `answer_strategy=relationship-recall-first`
  - `answer_strategy_reason_code=direct-relationship-question`
  - `memory_hit_count=1`
  - `incorrect_memory_exclusion_count=0`

### 5. Model-profile comparison metadata

Previous gap:
- Model-profile comparison already existed in eval docs and broader smoke coverage.
- We did not yet have a narrow regression whose only job was to validate profile-switch metadata on a stable prompt pair.

Focused regression added:
- run the same stable prompt once on `Spark Default`, switch the same agent to `Smoke Alt`, then run the same prompt again in a fresh thread
- expected diagnostics:
  - both runs keep the same routing:
    - `question_type=other`
    - `answer_strategy=default-grounded`
    - `answer_strategy_reason_code=default-grounded-fallback`
  - the profile metadata changes:
    - `model_profile_name=Spark Default` then `Smoke Alt`
    - `model_profile_id` changes across the two runs

## Remaining Lower-Priority Gaps

- No material runtime-rule verification gaps remain from the current audit pass.
