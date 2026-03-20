# SparkCore Long-Chain Acceptance Gate Continued Run — 2026-03-20 (Attempt 4)

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-20-006`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `996568f:docs-public/real-chat-quality-regression-set.md`
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

- `#132` fixed the profession direct-follow-up drift that showed up in `#131`
- on the same frozen baseline, this continuation resumed from the remaining packs and only checked `Mixed-Language Pack` and `Correction Aftermath Pack`
- the next earliest confirmed `P0` breach appears in `Mixed-Language Pack`
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

### Mixed-Language Pack

#### `real-chat-latest-language-priority`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `5`
- `first_detected_drift_turn`: `5`
- `drift_dimension`: `language`
- `main_developer_reason`: `the explicit request to continue in Chinese was answered in English after the thread had already switched into Chinese, so the latest user-language signal lost priority on the current turn`
- `recent_raw_turn_count`: `9`
- `approx_context_pressure`: `medium`
- `long_chain_pressure_candidate`: `false`

Observed turn sequence:

seed. `I am a product designer and I prefer concise weekly planning.`
1. `Please introduce yourself briefly.`
   - reply: `Hello. I am Smoke Guide, and I am glad to keep helping you.`
   - metadata:
     - `question_type=open-ended-summary`
     - `answer_strategy=grounded-open-ended-summary`
     - `answer_strategy_reason_code=relationship-answer-shape-prompt`
     - `reply_language_detected=en`
2. `你记得我做什么工作吗？`
   - reply: `我记得你是一名产品设计师。`
   - metadata:
     - `question_type=direct-fact`
     - `answer_strategy=structured-recall-first`
     - `answer_strategy_reason_code=direct-memory-question`
     - `reply_language_detected=zh-Hans`
3. `那接下来呢？`
   - reply: `好的，我们继续。`
   - metadata:
     - `question_type=fuzzy-follow-up`
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=short-fuzzy-follow-up`
     - `reply_language_detected=zh-Hans`
4. `再用一句话说一遍。`
   - reply: `好的，我们继续。`
   - metadata:
     - `question_type=other`
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`
     - `reply_language_detected=zh-Hans`
5. `ok, now continue in Chinese.`
   - reply: `Thanks, I noted that and I am ready to help with the next step.`
   - metadata:
     - `question_type=other`
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`
     - `reply_language_detected=en`
     - `reply_language_source=latest-user-message`

Interpretation:

- the earliest confirmed breach here is clearly `language`, not `state-pressure candidate`
- the drift appears at `recent_raw_turn_count=9` with `approx_context_pressure=medium`, but `long_chain_pressure_candidate=false`
- turns 2 through 4 had already switched stably into Chinese, so thread-level language carryover itself was not fully broken
- the real miss happens on turn 5, where the user explicitly asks to continue in Chinese but the reply jumps back to English
- that makes this look like another narrow rule-layer language-priority gap, not a Layer D / thread-state pressure problem

## Not Run In This Continued-Run Record

The remaining case was intentionally left out of this official continued-run record after the confirmed new `P0` breach:

- `real-chat-incorrect-restore-cycle`

It should be continued only after the next small rule-layer fix is in place.
