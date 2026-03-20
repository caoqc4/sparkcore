# SparkCore 长链路 Gate 继续运行记录 — 2026-03-20

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

这轮继续跑为什么仍然提前停止：

- `#126` 的确修掉了 `#125` 暴露的 explanatory follow-up breach
- 但继续跑到同一 `case 1` 时，又在更后面的短 continuation turn 上暴露了新的最早 `P0` drift
- 按当前 gate 纪律，一旦新的最早 `P0` breach 被确认，就应直接记正式结果，不再把后面 packs 混进同一份官方记录

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

后续人工继续跑使用了同一个运行中的 app，并结合 smoke API 与 service-role 读取：

- `POST /api/test/smoke-reset`
- reset 后把 `Spark Default` 再对齐回正式 baseline
- 通过 `smoke-create-thread` 和 `smoke-send-turn` 手动执行各 turn
- 直接从 `messages` 里读取 metadata

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

观察到的 turn 序列：

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

判断：

- 这仍然不像 `state-pressure candidate`
- 链路还不长，压力只到 `medium`，而且 `long_chain_pressure_candidate=false`
- 更像是一个更窄的 rule-layer gap：direct preferred-name 确认之后，下一句短 continuation 没有继续走 same-thread continuation

## Supplemental Check

在上面这个新的最早 `P0` breach 已经确认之后，同一轮 ad hoc session 也顺手把 `real-chat-relationship-style-continuity` 再看了一次。

这条补充观察看起来是稳定的，包括：

- `接下来你会怎么帮助我？` -> `answer_strategy=grounded-open-ended-summary`
- `answer_strategy_reason_code=relationship-answer-shape-prompt`
- 最后一轮短鼓励 -> `same-thread-continuation`

但这只是补充诊断信号，不计入这次正式 gate pass，因为按 gate 纪律，在 `case 1` 出现新的最早 `P0` breach 后，这轮官方记录本来就该停下来了。

## Not Run In This Continued-Run Record

由于这轮继续跑已经确认了新的 `P0` breach，以下 case 没有继续并入这份官方记录：

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

它们应在下一条小型 rule-layer fix 落地后，再继续往下跑。
