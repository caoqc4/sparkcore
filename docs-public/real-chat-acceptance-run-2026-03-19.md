# SparkCore Real-Chat Acceptance Run — 2026-03-19

## Outcome

`Acceptable minor drift`

Why this is not marked as `Pass`:

- the run had no confirmed `P0` product drift
- one `P1` explanation case was interrupted by smoke-harness setup instability before the case body ran
- under the current thresholds, that keeps the run out of `Must-open-issue`, but it is still not a clean all-green pass

This classification follows the `Pass / Acceptable minor drift / Must-open-issue` thresholds defined in the real-chat acceptance criteria.

## Commands Used

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat
npx playwright test tests/smoke/core-chat.spec.ts --grep "makes relationship recall visible in self-introduction style|recalls the user's preferred name for the same agent without leaking it to other agents|keeps same-thread relationship style and language continuity on short follow-ups|keeps the default explanation UI focused on one main reason|grounds direct memory recall questions in remembered facts|keeps Chinese on short mixed-language follow-ups after an English memory seed|uses thread continuity as the language source for ambiguous short follow-ups|keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

Batch smoke result:

- `6 passed`
- `2 failed`

Those two failures were not the same kind:

- `makes relationship recall visible in self-introduction style`
  - failed once in batch and once in isolated rerun at setup time because `smoke-reset` / `smoke-create-thread` returned non-OK before the case body reached product assertions
  - manually rechecked through smoke API and service-role read
  - result: `PASS`
- `keeps the default explanation UI focused on one main reason`
  - failed at smoke setup time before the case body ran
  - no fresh same-run product failure was observed
  - this is the single reason the overall run stays in `Acceptable minor drift`

Additional harness sanity check:

- `POST /api/test/smoke-reset` was manually rechecked against a local smoke server and returned `200 OK`
- this supports the conclusion that the observed setup failures were intermittent harness noise instead of a permanent reset-route break

## Pack Summary

### Relationship Maintenance Pack

- `real-chat-same-agent-relationship-continuity`
  - outcome: `PASS`
  - evidence:
    - `recalls the user's preferred name for the same agent without leaking it to other agents`
    - manual smoke recheck of `makes relationship recall visible in self-introduction style`
  - failing turn: `none`
  - drift dimension: `none`
  - main developer reason: `n/a`

- `real-chat-relationship-style-continuity`
  - outcome: `PASS`
  - evidence:
    - `keeps same-thread relationship style and language continuity on short follow-ups`
  - failing turn: `none`
  - drift dimension: `none`
  - main developer reason: `n/a`

- `real-chat-explanation-layer-guardrail`
  - outcome: `Acceptable minor drift`
  - evidence:
    - batch smoke setup failed before case body
    - latest dedicated focused smoke for this rule was previously green and no product code changed in this run
  - failing turn: `setup-before-case-body`
  - drift dimension: `none confirmed`
  - main developer reason: `smoke-reset setup instability`

### Memory Confirmation Pack

- `real-chat-profession-recall`
  - outcome: `PASS`
  - evidence:
    - `grounds direct memory recall questions in remembered facts`
  - failing turn: `none`
  - drift dimension: `none`
  - main developer reason: `n/a`

### Mixed-Language Pack

- `real-chat-latest-language-priority`
  - outcome: `PASS`
  - evidence:
    - `keeps Chinese on short mixed-language follow-ups after an English memory seed`
    - `uses thread continuity as the language source for ambiguous short follow-ups`
  - failing turn: `none`
  - drift dimension: `none`
  - main developer reason: `n/a`

### Correction Aftermath Pack

- `real-chat-incorrect-restore-cycle`
  - outcome: `PASS`
  - evidence:
    - `keeps correction-aftermath metadata stable for relationship nickname recall`
  - failing turn: `none`
  - drift dimension: `none`
  - main developer reason: `n/a`

## Manual Recheck Note

The self-introduction relationship case was rechecked outside the flaky batch harness.

Observed result:

- reply: `嗨，阿强。 我是小芳，很高兴继续和你聊。`
- metadata:
  - `answer_strategy=grounded-open-ended-summary`
  - `memory_used=true`
  - `memory_types_used=[relationship]`
  - recalled relationship memories included:
    - `agent_nickname=小芳`
    - `user_preferred_name=阿强`
    - `user_address_style=casual`

This supports the conclusion that the batch failure was harness-level noise, not a confirmed relationship-continuity regression.

## Acceptance Decision

This run is recorded as `Acceptable minor drift`, not `Pass`, because:

- all observed `P0` product checks passed after separating harness noise from product behavior
- no scenario pack showed a confirmed drift dimension
- one `P1` explanation case did not get a clean same-run confirmation because the smoke harness failed before the case body

No product-drift follow-up issue is opened from this run.
