# SparkCore Long-Chain Acceptance Gate Continued Run — 2026-03-20

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-20-005`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `d3475b0:docs-public/real-chat-quality-regression-set.md`
- `profile_matrix`:
  - `Relationship Maintenance Pack` -> `Spark Default`
  - `Mixed-Language Pack` -> `Spark Default`
  - `Memory Confirmation Pack` -> `Spark Memory Sensitive`
  - `Correction Aftermath Pack` -> `Spark Memory Sensitive`
- `execution_env_fingerprint`:
  - app mode: `next start`
  - smoke mode: `PLAYWRIGHT_SMOKE_MODE=1`
  - smoke identity: `smoke@example.com`
  - `Spark Default`: `replicate / replicate-gpt-4o-mini`
  - `Spark Memory Sensitive`: `replicate / replicate-claude-4-sonnet`
  - base URL: `http://localhost:3001`

## Gate Result

- `severity`: `Must-open-issue`
- `conclusion`: `rule-layer issue`
- `next_action`: `open_small_fix_issue`

Why this continued run stopped here:

- `#130` fixed the relationship-style explanatory fidelity drift from `#129`
- the same frozen baseline now lets all three cases in `Relationship Maintenance Pack` pass
- the next earliest confirmed `P0` drift appears when the gate moves into `Memory Confirmation Pack`
- under the current gate discipline, the official note stops at the first newly confirmed `P0` breach instead of mixing later packs into the same record

## Commands Used

```bash
cd apps/web
npm run build
PLAYWRIGHT_SMOKE_MODE=1 \
PLAYWRIGHT_SMOKE_SECRET=sparkcore-smoke-local \
PLAYWRIGHT_SMOKE_EMAIL=smoke@example.com \
PLAYWRIGHT_SMOKE_PASSWORD='SparkcoreSmoke123!' \
npm run start -- --hostname localhost --port 3001
```

Manual continued-gate execution then used the smoke API and service-role reads on the same running app:

- `POST /api/test/smoke-reset`
- post-reset profile alignment for `Spark Default` and `Spark Memory Sensitive`
- manual turn execution through `smoke-create-thread` and `smoke-send-turn`
- direct metadata reads from `messages`

## Per-Case Observation

### Relationship Maintenance Pack

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `PASS`

Summary:

- nickname and preferred-name continuity stayed stable through turn 5
- turn 4 `好，继续。` remained `same-thread-continuation`
- turn 5 `最后再简单介绍一下你自己。` also stayed on same-thread carryover

#### `real-chat-relationship-style-continuity`

- `profile`: `Spark Default`
- `status`: `PASS`

Summary:

- `接下来你会怎么帮助我？` now answers the current help-next turn instead of drifting into the later rough-day scenario
- `如果我今天状态不太好，你会怎么和我说？` keeps the supportive scenario separate
- the final short encouragement turn stays on `same-thread-continuation`

#### `real-chat-explanation-layer-guardrail`

- `profile`: `Spark Default`
- `status`: `PASS`

Verification summary:

- focused smoke: `keeps the default explanation UI focused on one main reason`
- result: `1 passed (59.0s)`
- the default explanation surface stayed short and did not leak developer-only diagnostics into the first visible layer

### Memory Confirmation Pack

#### `real-chat-profession-recall`

- `profile`: `Spark Memory Sensitive`
- `status`: `FAIL`
- `failed_turn`: `2`
- `first_detected_drift_turn`: `2`
- `drift_dimension`: `fidelity`
- `main_developer_reason`: `the direct profession follow-up left the recall path after the first correct answer and fell back to default-grounded instead of continuing to state the remembered profession`
- `recent_raw_turn_count`: `3`
- `approx_context_pressure`: `low`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

seed. `I am a product designer.`
1. `What profession do you remember that I work in? If you do not know, say you do not know.`
   - reply: `I remember that you work as a product designer.`
   - metadata:
     - `question_type=direct-fact`
     - `answer_strategy=structured-recall-first`
     - `answer_strategy_reason_code=direct-memory-question`
2. `So what kind of work do I do?`
   - reply: `Sure, we can keep going.`
   - metadata:
     - `question_type=other`
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`
3. `Say it again in one short sentence.`
   - reply: `Sure, we can keep going.`
   - metadata:
     - `question_type=fuzzy-follow-up`
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=short-fuzzy-follow-up`
4. `What do you remember about my work?`
   - reply: `Sure, we can keep going.`
   - metadata:
     - `question_type=other`
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`

Interpretation:

- this still does not look like `state-pressure candidate`
- the earliest drift appears while `recent_raw_turn_count` is only `3`, the pressure signal is `low`, and `long_chain_pressure_candidate` stays `false`
- the first direct profession recall answer is correct, but the very next direct follow-up no longer stays inside the recall contract
- this makes the new earliest gate failure look like another narrow rule-layer direct-question coverage gap, not a long-chain state-pressure problem

## Not Run In This Continued-Run Record

The remaining cases were intentionally left out of this official continued-run record after the confirmed new `P0` breach:

- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

They should be continued only after the next small rule-layer fix is in place.
