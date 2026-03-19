# SparkCore Long-Chain Acceptance Gate Rerun — 2026-03-19

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-19-002`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `914b99c:docs-public/real-chat-quality-regression-set.md`
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

Why this rerun still stopped early:

- the original `#123` breach was fixed by `#124`
- the rerun confirmed that the first failing case now passes on the same frozen baseline
- the next `P0` case in the same scenario pack then exposed a new earliest rule-layer drift
- under the current gate discipline, the rerun was recorded immediately instead of mixing later packs into the same rerun note

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

Manual rerun execution then used the smoke API and service-role reads on the same running app:

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

Interpretation:

- this was the exact `#123` failing path
- after `#124`, the direct preferred-name follow-up no longer falls back to `default-grounded`
- the rerun confirms that the original breach is resolved on the frozen formal baseline

#### `real-chat-relationship-style-continuity`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `2`
- `first_detected_drift_turn`: `2`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `explanatory follow-up dropped to default-grounded instead of keeping the seeded relationship style`
- `recent_raw_turn_count`: `3`
- `approx_context_pressure`: `low`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

1. `请简单介绍一下你自己。`
   - reply: `嗨。 我是Smoke Memory Coach，很高兴继续为你提供帮助。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
2. `接下来你会怎么帮助我？`
   - reply: `好呀，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
3. `如果我今天状态不太好，你会怎么和我说？`
   - reply: `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是Smoke Memory Coach，会继续用更像朋友的方式陪着你。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
4. `最后你会怎么陪我把事情推进下去？`
   - reply: `我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`
   - metadata:
     - `answer_strategy=grounded-open-ended-summary`
5. `那你再简单鼓励我一句。`
   - reply: `别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是Smoke Memory Coach，会一直站你这边。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`

Interpretation:

- this still does not look like `state-pressure candidate`
- the drift appears early, with low context pressure and no long-chain pressure signal
- the failure looks like a rule-layer gap on explanatory same-thread follow-ups under a seeded relationship style

## Not Run In This Rerun Record

The remaining cases were intentionally left out of this rerun record after the new confirmed `P0` breach:

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

They should be re-run only after the next small rule-layer fix is in place, so the next gate note stays comparable.
