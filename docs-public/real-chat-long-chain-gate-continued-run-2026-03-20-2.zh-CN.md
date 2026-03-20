# SparkCore 长链路 Gate 继续运行记录 — 2026-03-20

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

这轮继续跑为什么停在这里：

- `#128` 已经修掉了 `#127` 里 short same-thread continuation 的 breach
- 在同一 frozen baseline 上，`real-chat-same-agent-relationship-continuity` 现在已经能稳定跑到 turn 5
- 但新的最早 `P0` breach 出现在 `real-chat-relationship-style-continuity`
- 按当前 gate 纪律，一旦确认新的最早 `P0` breach，就直接记正式结果，不再把后面 packs 混进同一份官方记录

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
- `status`: `PASS`

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

观察到的 turn 序列：

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

判断：

- 这仍然不像 `state-pressure candidate`
- 最早漂移发生时，`recent_raw_turn_count` 只有 `5`，压力信号还是 `low`，而且 `long_chain_pressure_candidate=false`
- 路由信号本身仍然是 relationship-shaped，但回答内容已经不再忠实于当前这轮 explanatory prompt
- 所以这次新的最早 gate failure 更像一个更窄的 rule-layer fidelity gap，而不是长链路状态压力问题

## Not Run In This Continued-Run Record

由于这轮继续跑已经确认了新的 `P0` breach，以下 case 没有继续并入这份官方记录：

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

它们应在下一条小型 rule-layer fix 落地后，再继续往下跑。
