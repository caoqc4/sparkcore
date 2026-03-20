# SparkCore 长链路 Gate 继续运行记录 — 2026-03-20（第 4 次）

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

这轮继续跑为什么停在这里：

- `#132` 已经修掉了 `#131` 里 profession direct-follow-up 离开 recall path 的掉点
- 在同一 frozen baseline 上，这轮继续跑从剩余 packs 开始，只检查 `混合语言包` 和 `纠错后续包`
- 新的最早 `P0` breach 出现在 `混合语言包`
- 按当前 gate 纪律，一旦确认新的最早 `P0` breach，就直接记正式结果，不再把后面 pack 混进同一份官方记录

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
- reset 后把 `Spark Default` 和 `Spark Memory Sensitive` 再对齐回正式 baseline
- 通过 `smoke-create-thread` 和 `smoke-send-turn` 手动执行各 turn
- 直接从 `messages` 里读取 metadata

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

观察到的 turn 序列：

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

判断：

- 这次最早正式 breach 明确是 `language`，不是 `state-pressure candidate`
- 出现漂移时 `recent_raw_turn_count=9`、`approx_context_pressure=medium`，但 `long_chain_pressure_candidate=false`
- turn 2 到 turn 4 都已经稳定切到中文，说明 thread 内语言切换本身并没有完全失效
- 真正掉点发生在 turn 5 的显式语言指令：用户已经明确要求继续用中文，但回复重新回到英文
- 所以这更像是一个更窄的 rule-layer language-priority gap，而不是 Layer D / thread-state 压力

## Not Run In This Continued-Run Record

由于这轮继续跑已经确认了新的 `P0` breach，以下 case 没有继续并入这份官方记录：

- `real-chat-incorrect-restore-cycle`

它应在下一条小型 rule-layer fix 落地后，再继续往下跑。
