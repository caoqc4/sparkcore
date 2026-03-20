# SparkCore 长链路 Gate 继续运行记录 — 2026-03-20

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

这轮继续跑为什么停在这里：

- `#130` 已经修掉了 `#129` 里 relationship-style explanatory fidelity 的掉点
- 在同一 frozen baseline 上，`关系维持包` 现在 3 条都通过了
- 新的最早 `P0` breach 出现在 `记忆确认包`
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
- reset 后把 `Spark Default` 和 `Spark Memory Sensitive` 再对齐回正式 baseline
- 通过 `smoke-create-thread` 和 `smoke-send-turn` 手动执行各 turn
- 直接从 `messages` 里读取 metadata

## Per-Case Observation

### Relationship Maintenance Pack

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `PASS`

摘要：

- nickname 和 preferred-name 连续性稳定保持到了 turn 5
- turn 4 `好，继续。` 仍然是 `same-thread-continuation`
- turn 5 `最后再简单介绍一下你自己。` 也仍然保持 same-thread carryover

#### `real-chat-relationship-style-continuity`

- `profile`: `Spark Default`
- `status`: `PASS`

摘要：

- `接下来你会怎么帮助我？` 现在已经回答当前这轮 help-next 问题，不再提前漂到下一轮 rough-day 场景
- `如果我今天状态不太好，你会怎么和我说？` 也继续保持单独的 supportive 场景
- 最后一轮短鼓励仍然保持 `same-thread-continuation`

#### `real-chat-explanation-layer-guardrail`

- `profile`: `Spark Default`
- `status`: `PASS`

验证摘要：

- focused smoke：`keeps the default explanation UI focused on one main reason`
- 结果：`1 passed (59.0s)`
- 默认 explanation surface 仍然保持简短，没有把 developer-only diagnostics 泄漏到第一层可见区域

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

观察到的 turn 序列：

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

判断：

- 这仍然不像 `state-pressure candidate`
- 最早漂移发生时，`recent_raw_turn_count` 只有 `3`，压力信号还是 `low`，而且 `long_chain_pressure_candidate=false`
- 第一轮 direct profession recall 是正确的，但紧接着的 direct follow-up 就没有继续留在 recall contract 里
- 所以这次新的最早 gate failure 更像另一个更窄的 rule-layer direct-question coverage gap，而不是长链路状态压力问题

## Not Run In This Continued-Run Record

由于这轮继续跑已经确认了新的 `P0` breach，以下 case 没有继续并入这份官方记录：

- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

它们应在下一条小型 rule-layer fix 落地后，再继续往下跑。
