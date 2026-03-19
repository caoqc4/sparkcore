# SparkCore 长链路验收 Gate Run — 2026-03-19

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-19-001`
- `run_status`: `interrupted-after-confirmed-p0-drift`
- `pack_version_or_ref`: `b5aeac5:docs-public/real-chat-quality-regression-set.md`
- `profile_matrix`:
  - `关系维持包` -> `Spark Default`
  - `混合语言包` -> `Spark Default`
  - `记忆确认包` -> `Spark Memory Sensitive`
  - `纠错后续包` -> `Spark Memory Sensitive`
- `execution_env_fingerprint`:
  - app mode: `next start`
  - smoke mode: `PLAYWRIGHT_SMOKE_MODE=1`
  - smoke identity: `smoke@example.com`
  - `Spark Default`: `replicate / replicate-gpt-4o-mini`
  - `Spark Memory Sensitive`: `replicate / replicate-claude-4-sonnet`
  - base URL: `http://localhost:3001`

## Gate 结果

- `severity`: `Must-open-issue`
- `conclusion`: `rule-layer issue`
- `next_action`: `open_small_fix_issue`

为什么这轮没有继续把剩余 pack 一起跑完：

- 第一轮正式 gate 的目的，是做边界判断
- 这轮在冻结基线上已经确认出现 `P0` 漂移
- 这个漂移已经足够说明：当前角色层规则还没有到可以稳定通过正式 long-chain gate 的程度
- 按当前的 scope discipline，这里优先把首个明确 breach 记录下来，而不是把后续观察继续混进同一条第一轮 gate 基线记录

## 执行命令

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

正式 gate 的手工执行路径随后使用了同一套 app 实例上的 smoke API 和 service-role read：

- `POST /api/test/smoke-reset`
- reset 后把 `Spark Default` 对齐回冻结基线
- 通过 `smoke-create-thread` / `smoke-send-turn` 手动执行 turn
- 直接读取 `messages` metadata

## Per-Case Observation

### 关系维持包

#### `real-chat-same-agent-relationship-continuity`

- `profile`: `Spark Default`
- `status`: `FAIL`
- `failed_turn`: `3`
- `first_detected_drift_turn`: `3`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `same-agent direct follow-up 上的 answer_strategy 掉成了 default-grounded`
- `recent_raw_turn_count`: `5`
- `approx_context_pressure`: `low`
- `long_chain_pressure_candidate`: `false`

观测到的 turn 序列：

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

判断：

- 这轮不像 `state-pressure candidate`
- 链路还不长，压力信号也仍然低
- 更像是在正式 `Spark Default` 基线上，same-agent direct follow-up 的 routing / carryover 规则还没完全固化

## 本条第一轮 Gate 记录里未继续执行的 Case

在首个明确 `P0` breach 之后，下面这些 case 没有继续并入这条第一轮 gate 记录：

- `real-chat-relationship-style-continuity`
- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

它们更适合放在 follow-up rule-layer fix 之后，重新开下一轮 gate 记录，以保持可比性。
