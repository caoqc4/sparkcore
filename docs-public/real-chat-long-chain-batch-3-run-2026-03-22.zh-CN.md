# SparkCore 第三批长链路组合效应验证记录 — 2026-03-22

## Run Metadata

- `run_id`: `long-chain-composition-2026-03-22-005`
- `run_status`: `completed-with-targeted-chain-drift`
- `pack_version_or_ref`: `dbbff25:apps/web/lib/testing/quality-eval.ts`
- `scenario_scope`:
  - `real-chat-long-chain-anti-redirection-explanation-summary`
- `execution_principle`:
  - 先测组合效应
  - 不混入新 phrasing 探索
  - 先判断 `链路失真` 还是 `局部 phrase 漏洞`

## 结论摘要

- `overall_conclusion`: `the case fails with chain-level distortion across explanation-mode transition and short closing`
- `next_action`: `open_targeted_chain_guardrail_issue`

这轮最关键的结论不是“又缺一个 explanation phrase”，而是：

- anti-redirection 开场本身已经成立
- 真正失真点出现在 explanation-mode 过渡
- 第 2 轮滑进了 detached advice / planning shape
- 第 3 轮又继续塌回 generic continuation

因此更像：

- `chain interaction / answer-shape precedence`

而不是：

- 继续扩 phrase 包

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

- `status`: `FAIL`
- `scenario_pack`: `long-chain-continuity`
- `case_id`: `real-chat-long-chain-anti-redirection-explanation-summary`
- `scenario_verdict`: `soft drift toward neutral explanation`
- `first_failing_turn`: `2`
- `drift_dimension`: `relationship-continuity`
- `attribution_note`: `the chain honors anti-redirection first, then explanation-mode precedence slips into detached grounded advice and the final short closing collapses to generic continuation`
- `main_developer_reason`: `Turn 2 selected grounded-open-ended-advice and Turn 3 later fell back to default-grounded instead of preserving same-role explanation and short-summary carryover`
- `answer_strategy_reason_code`: `open-ended-advice-prompt`
- `continuation_reason_code`: `none on failing turns`
- `reply_language_source`: `latest-user-message`
- `memory_used_or_recalled_memories`: `relationship/casual + relationship/阿强`
- `approx_context_pressure / long_chain_pressure_candidate`: `medium / false`
- `failure_classification`: `chain distortion`

关键观测：

1. `你先别岔开话题。`
   - reply: `阿强，好，我先不岔开话题，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
2. `那你就简单陪我理一下。`
   - reply: `好呀，我来帮你一起理一理。 我会先帮你抓住本周重点，再整理出一份简洁可执行的周计划。`
   - metadata:
     - `answer_strategy=grounded-open-ended-advice`
     - `answer_strategy_reason_code=open-ended-advice-prompt`
3. `最后你帮我收一句就行。`
   - reply: `好呀，阿强，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`

判断：

- 第 1 轮 anti-redirection 本身已经成立
- 真正失真点从第 2 轮开始
- 第 2 轮没有进入 companion-style explanation
- 而是直接滑进 detached advice / planning shape
- 第 3 轮也没有接住 short summary
- 而是继续塌回 generic continuation

## 当前阶段判断

这轮说明场景 5 的价值是成立的：

1. 它暴露的是一个和前两批不同的 failure theme
2. 问题核心不是 anti-redirection phrase 本身
3. 而是 explanation-mode 与 short-closing 之间的 continuity precedence 没守住

## 建议后续动作

1. 为 `anti-redirection -> companion-style explanation -> short summary` 开一条 very small chain guardrail issue
2. 优先修第 2 轮 explanation-mode drift
3. 再一起收住第 3 轮 short summary，不要拆成 phrasing 扩张
