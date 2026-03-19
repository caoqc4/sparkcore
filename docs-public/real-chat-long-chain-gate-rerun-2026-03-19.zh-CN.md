# SparkCore 长链路 Gate 重跑记录 — 2026-03-19

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

这轮重跑为什么仍然提前停止：

- `#123` 里原来的首个 breach 已被 `#124` 修掉
- 这轮重跑确认了第一个失败 case 已经在同一 frozen baseline 上恢复通过
- 但同一 scenario pack 的下一个 `P0` case 又暴露了新的最早 rule-layer drift
- 按当前 gate 纪律，这里直接记正式结果，不把后面 packs 混进同一份 rerun 记录

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

后续人工重跑使用了同一个运行中的 app，并结合 smoke API 与 service-role 读取：

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

判断：

- 这就是 `#123` 里原来掉下来的那条路径
- `#124` 之后，这个 direct preferred-name follow-up 不再掉回 `default-grounded`
- 这轮重跑确认：原始 breach 已经在 frozen formal baseline 上消失

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

观察到的 turn 序列：

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

判断：

- 这仍然不像 `state-pressure candidate`
- 漂移出现得很早，当时上下文压力还是低，而且没有 long-chain pressure 信号
- 更像是 seeded relationship style 在 explanatory follow-up 上还存在 rule-layer gap

## Not Run In This Rerun Record

由于这轮重跑已经确认了新的 `P0` breach，以下 case 没有继续混进同一份 rerun 记录：

- `real-chat-explanation-layer-guardrail`
- `real-chat-profession-recall`
- `real-chat-latest-language-priority`
- `real-chat-incorrect-restore-cycle`

它们应当在下一条小型 rule-layer fix 落地后，再作为下一轮 gate 继续重跑，这样记录才保持可比性。
