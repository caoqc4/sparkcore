# SparkCore Long-Chain Acceptance Gate Continued Run — 2026-03-20

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-20-003`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `5bb8a5c:docs-public/real-chat-quality-regression-set.md`
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

Why this continued run still stopped early:

- `#126` fixed the previous explanatory follow-up breach from `#125`
- the continued gate confirmed that the direct preferred-name turn still passes
- the next earliest `P0` drift now appears later in the same case, on the short continuation turn right after that direct relationship answer
- under the current gate discipline, the continued run was recorded at the first confirmed new `P0` drift instead of mixing later packs into the same official note

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
- post-reset profile alignment for `Spark Default`
- manual turn execution through `smoke-create-thread` and `smoke-send-turn`
- direct metadata reads from `messages`

## Per-Case Observation

### Relationship Maintenance Pack

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `4`
- `first_detected_drift_turn`: `4`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `the short continuation immediately after the direct preferred-name answer dropped back to default-grounded instead of staying in same-thread continuation`
- `recent_raw_turn_count`: `7`
- `approx_context_pressure`: `medium`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

1. `请简单介绍一下你自己。`
   - reply: `你好，阿强。 我是小芳，很高兴继续和你聊。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
     - `answer_strategy_reason_code=relationship-answer-shape-prompt`
2. `那接下来呢？`
   - reply: `好的，阿强，我们继续。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=short-fuzzy-follow-up`
3. `那你接下来会怎么称呼我？`
   - reply: `我应该叫你阿强。`
   - metadata:
     - `question_type=direct-relationship-confirmation`
     - `answer_strategy=relationship-recall-first`
     - `answer_strategy_reason_code=direct-relationship-question`
4. `好，继续。`
   - reply: `好的，阿强，我们继续。`
   - metadata:
     - `question_type=other`
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
5. `最后再简单介绍一下你自己。`
   - reply: `你好，阿强。 我是小芳，很高兴继续和你聊。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-summary-carryover`

Interpretation:

- this still does not look like `state-pressure candidate`
- the chain is still short, the pressure signal is only `medium`, and `long_chain_pressure_candidate` stays `false`
- the drift still looks like a narrow rule-layer routing gap, now specifically on the short continuation turn that comes immediately after a direct preferred-name confirmation

## Supplemental Check

After the new earliest `P0` drift was already confirmed above, the same ad hoc session also checked `real-chat-relationship-style-continuity` again on the same frozen baseline.

That follow-up check looked stable, including:

- `接下来你会怎么帮助我？` -> `answer_strategy=grounded-open-ended-summary`
- `answer_strategy_reason_code=relationship-answer-shape-prompt`
- final short encouragement turn -> `same-thread-continuation`

This supplemental signal was useful for diagnosis, but it is not counted as a formal gate pass because the official continued run should already have stopped once the new earliest `P0` drift in case 1 was confirmed.

## Not Run In This Continued-Run Record

The remaining cases were intentionally left out of this official continued-run record after the confirmed new `P0` breach:

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

They should be continued only after the next small rule-layer fix is in place.
