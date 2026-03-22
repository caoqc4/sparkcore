# SparkCore 第三批长链路组合效应复验记录 — 2026-03-22

## Rerun Metadata

- `rerun_id`: `long-chain-composition-2026-03-22-006`
- `rerun_status`: `completed`
- `fix_ref`:
  - `test: add anti-redirection explanation summary eval case`
  - `pending runtime/smoke guardrail fix in current worktree`
- `scenario_scope`:
  - `real-chat-long-chain-anti-redirection-explanation-summary`

## 结论摘要

- `overall_conclusion`: `the case now holds as one continuing role after the chain-level carryover fix`
- `next_action`: `record rerun and close targeted guardrail issue`

这轮最重要的变化是：

- 第 2 轮不再滑进 detached advice / planning
- 第 3 轮也不再塌回 generic continuation
- explanation-mode 和 short-summary 现在都留在同一条 relationship line 上

## Commands Used

```bash
cd apps/web
PLAYWRIGHT_SMOKE_MODE=1 \
PLAYWRIGHT_SMOKE_SECRET=sparkcore-smoke-local \
PLAYWRIGHT_SMOKE_EMAIL=smoke@example.com \
PLAYWRIGHT_SMOKE_PASSWORD='SparkcoreSmoke123!' \
npm run start -- --hostname localhost --port 3001
```

执行路径：

- `POST /api/test/smoke-reset`
- `POST /api/test/smoke-create-thread`
- `POST /api/test/smoke-send-turn`
- 直接从 `messages` 读取 assistant reply metadata

## Scenario Verdict

### `real-chat-long-chain-anti-redirection-explanation-summary`

- `status`: `PASS`
- `scenario_pack`: `long-chain-continuity`
- `case_id`: `real-chat-long-chain-anti-redirection-explanation-summary`
- `scenario_verdict`: `holds as one continuing role`
- `first_failing_turn`: `none`
- `drift_dimension`: `none`
- `attribution_note`: `anti-redirection, companion-style explanation, and short summary now all stay on the same same-thread continuation path`

关键观测：

1. `你先别岔开话题。`
   - reply: `阿强，好，我先不岔开话题，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
2. `那你就简单陪我理一下。`
   - reply: `阿强，好，我先顺着你刚刚那点陪你理一下，不岔开。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
3. `最后你帮我收一句就行。`
   - reply: `阿强，我先替你收一句：我们就顺着刚刚那点，慢慢来。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-summary-carryover`

判断：

- 第 1 轮 anti-redirection 继续成立
- 第 2 轮已经回到 companion-style explanation
- 第 3 轮已经回到 short same-role summary
- 这条链当前可以判为：
  - `holds as one continuing role`
