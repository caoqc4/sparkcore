# SparkCore Long-Chain Acceptance Gate Continued Run — 2026-03-20

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-20-004`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `a9127a3:docs-public/real-chat-quality-regression-set.md`
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

- `#128` fixed the short same-thread continuation breach from `#127`
- the same frozen baseline now lets `real-chat-same-agent-relationship-continuity` pass through turn 5
- the next earliest confirmed `P0` drift appears in `real-chat-relationship-style-continuity`
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
- post-reset profile alignment for `Spark Default`
- manual turn execution through `smoke-create-thread` and `smoke-send-turn`
- direct metadata reads from `messages`

## Per-Case Observation

### Relationship Maintenance Pack

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `PASS`

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
     - `question_type=fuzzy-follow-up`
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=short-fuzzy-follow-up`
5. `最后再简单介绍一下你自己。`
   - reply: `你好，阿强。 我是小芳，很高兴继续和你聊。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-summary-carryover`

#### `real-chat-relationship-style-continuity`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `2`
- `first_detected_drift_turn`: `2`
- `drift_dimension`: `fidelity`
- `main_developer_reason`: `the explanatory follow-up kept the relationship-answer-shape route but drifted into the later supportive scenario instead of answering the current help-me prompt`
- `recent_raw_turn_count`: `5`
- `approx_context_pressure`: `low`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

seed. `以后和我说话轻松一点，可以吗？`
   - reply: `好的，我已经记下来了，接下来可以继续帮你。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`
1. `请简单介绍一下你自己。`
   - reply: `嗨。 我是Smoke Memory Coach，很高兴继续为你提供帮助。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
     - `answer_strategy_reason_code=relationship-answer-shape-prompt`
2. `接下来你会怎么帮助我？`
   - reply: `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是Smoke Memory Coach，会继续用更像朋友的方式陪着你。`
   - metadata:
     - `question_type=open-ended-summary`
     - `answer_strategy=grounded-open-ended-summary`
     - `answer_strategy_reason_code=relationship-answer-shape-prompt`
3. `如果我今天状态不太好，你会怎么和我说？`
   - reply: `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是Smoke Memory Coach，会继续用更像朋友的方式陪着你。`
   - metadata:
     - `question_type=open-ended-summary`
     - `answer_strategy=grounded-open-ended-summary`
     - `answer_strategy_reason_code=relationship-answer-shape-prompt`

Interpretation:

- this still does not look like `state-pressure candidate`
- the earliest drift now happens while `recent_raw_turn_count` is only `5`, the pressure signal is `low`, and `long_chain_pressure_candidate` stays `false`
- the routing signal itself remains relationship-shaped, but the answer content is no longer faithful to the current explanatory turn
- this makes the new earliest gate failure look like a narrower rule-layer fidelity gap, not a long-chain state-pressure problem

## Not Run In This Continued-Run Record

The remaining cases were intentionally left out of this official continued-run record after the confirmed new `P0` breach:

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

They should be continued only after the next small rule-layer fix is in place.
