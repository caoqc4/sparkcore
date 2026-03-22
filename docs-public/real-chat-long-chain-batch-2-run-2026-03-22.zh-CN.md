# SparkCore 第二批长链路组合效应验证记录 — 2026-03-22

## Run Metadata

- `run_id`: `long-chain-composition-2026-03-22-003`
- `run_status`: `completed-with-targeted-chain-drift`
- `pack_version_or_ref`: `049b77d:apps/web/lib/testing/quality-eval.ts`
- `scenario_scope`:
  - `real-chat-long-chain-same-side-shared-push-closing`
  - `real-chat-long-chain-anti-advice-step-guidance`
- `execution_principle`:
  - 第二批仍然先测组合效应
  - 不混入新 phrasing 探索
  - 先判断 `链路失真` 还是 `局部 phrase 漏洞`

## 结论摘要

- `overall_conclusion`: `both cases fail with chain-level distortion, but on different later-turn shapes`
- `next_action`: `open_targeted_chain_guardrail_issues`

这轮最重要的结论不是“又有两个 phrase 没补”，而是：

- 两条链路都不是在开场就失真
- 真正的问题都出现在后半段 answer-shape 过渡时
- 因此更像：
  - `chain interaction / answer-shape precedence`
- 而不是：
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

## Per-Scenario Verdict

### `real-chat-long-chain-same-side-shared-push-closing`

- `status`: `FAIL`
- `failed_turn`: `3`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `closing turn fell back to default-grounded / generic continuation after same-side and shared-push had already stayed on the continuity path`
- `scenario_verdict`: `soft drift toward detached recap`
- `failure_classification`: `chain distortion`

关键观测：

1. `你先站我这边。`
   - reply: `阿强，好，我先站你这边陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
2. `那我们先一起把这一点弄过去。`
   - reply: `阿强，好，我们先一起把这一点弄过去。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
3. `你最后帮我把这段收一下。`
   - reply: `好呀，阿强，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`

判断：

- same-side 和 shared-push 两步本身已经成立
- 真正失真点在 closing turn
- closing 没有接住“同一个人在帮我收一下”
- 而是直接塌回 generic continuation

### `real-chat-long-chain-anti-advice-step-guidance`

- `status`: `FAIL`
- `failed_turn`: `2`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `the steadying turn collapsed to default-grounded generic continuation, and the later guidance turn expanded into detached grounded advice instead of preserving the same-role chain`
- `scenario_verdict`: `soft drift toward detached task mode`
- `failure_classification`: `chain distortion`

关键观测：

1. `你先别急着给我建议。`
   - reply: `阿强，好，我先不急着给你建议，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
2. `你先帮我缓一下，再说。`
   - reply: `好呀，阿强，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
3. `好，你再陪我理一步。`
   - reply: `好呀，我来帮你一起理一理。 我会先帮你抓住本周重点，再整理出一份简洁可执行的周计划。`
   - metadata:
     - `answer_strategy=grounded-open-ended-advice`
     - `reason_code=open-ended-advice-prompt`

判断：

- anti-advice 开场本身成立
- 真正失真从 steadying turn 就开始
- 后续 guidance turn 继续滑进 detached advice / task mode
- 这是很典型的 chain-level precedence 没守住

## 当前阶段判断

这轮说明第二批场景的价值是成立的：

1. 第一批修完之后，新的失败主题确实能从第二批长链路里暴露出来
2. 失败点仍然主要集中在：
   - later-turn continuation precedence
   - continuity path 与 default-grounded / grounded-open-ended-advice 之间的切换
3. 后续更应该长出 very small 的 chain-level guardrail issue

## 建议后续动作

1. 为 `same-side -> shared-push -> light closing` 开一条 very small guardrail issue
2. 为 `anti-advice -> brief steadying -> step-by-step guidance` 开一条 very small guardrail issue
3. 先修第 2 条
   - 因为它的 drift 更明显
   - 也更贴“steadying -> guidance 过渡时掉成 detached task mode”这个新失败主题
