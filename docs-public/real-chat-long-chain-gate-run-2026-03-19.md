# SparkCore Long-Chain Acceptance Gate Run — 2026-03-19

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-19-001`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `b5aeac5:docs-public/real-chat-quality-regression-set.md`
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

Why the run was not continued across the remaining packs:

- the first formal gate is a boundary-checking pass
- the run hit a confirmed `P0` drift on the frozen baseline
- the drift was already strong enough to decide that the current role-layer rules are not yet ready for a clean long-chain gate pass
- under the current scope discipline, this was recorded immediately instead of mixing later observations into the same first-gate baseline note

## Commands Used

```bash
cd apps/web
npm run build
PLAYWRIGHT_SMOKE_MODE=1 \
PLAYWRIGHT_SMOKE_SECRET=sparkcore-smoke-local \
PLAYWRIGHT_SMOKE_EMAIL=smoke@example.com \
PLAYWRIGHT_SMOKE_PASSWORD='SparkcoreSmoke123!' \
npm run start -- --hostname localhost --port 3001
npm run quality:eval -- --suite=real-chat
```

Manual gate execution then used the smoke API and service-role reads on the same running app:

- `POST /api/test/smoke-reset`
- post-reset profile alignment for `Spark Default`
- manual turn execution through `smoke-create-thread` and `smoke-send-turn`
- direct metadata reads from `messages`

## Per-Case Observation

### Relationship Maintenance Pack

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `3`
- `first_detected_drift_turn`: `3`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `answer_strategy dropped to default-grounded on a same-agent direct follow-up`
- `recent_raw_turn_count`: `5`
- `approx_context_pressure`: `low`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

1. `请简单介绍一下你自己。`
   - reply: `你好，阿强。 我是小芳，很高兴继续和你聊。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
     - `reply_language_detected=zh-Hans`
2. `那接下来呢？`
   - reply: `好的，阿强，我们继续。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=short-fuzzy-follow-up`
3. `那你接下来会怎么称呼我？`
   - reply: `好的，阿强，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
4. `好，继续。`
   - reply: `好的，阿强，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
5. `最后再简单介绍一下你自己。`
   - reply: `你好，阿强。 我是小芳，很高兴继续和你聊。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-summary-carryover`

Interpretation:

- this does not look like `state-pressure candidate`
- the chain was still short and the pressure signals were low
- the drift looks more like a routing / carryover rule gap on direct same-agent follow-ups under the formal `Spark Default` baseline

## Not Run In This First Gate Record

The remaining packs were intentionally left out of this first recorded gate result after the confirmed `P0` breach:

- `real-chat-relationship-style-continuity`
- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

They should be re-run only after the follow-up rule-layer fix is in place, so the next gate record stays comparable.
