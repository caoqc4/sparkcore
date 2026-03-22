# SparkCore 长链路组合效应复验记录 — 2026-03-22

## Run Metadata

- `run_id`: `long-chain-composition-2026-03-22-002`
- `run_purpose`: `rerun after #232 anti-analysis chain guardrail`
- `base_run_ref`: `docs-public/real-chat-long-chain-composition-run-2026-03-22.zh-CN.md`
- `code_ref`:
  - `9390914: fix: keep catch and carry-forward after anti-analysis openings`
- `scenario_scope`:
  - `real-chat-long-chain-anti-analysis-carry-forward`
  - `real-chat-long-chain-anti-comforting-resume`
- `execution_principle`:
  - 第一轮复验仍只测组合效应
  - 不混入新 phrasing 探索
  - 优先看 scenario-level verdict 是否变化

## 结论摘要

- `overall_conclusion`: `both cases hold as one continuing role after the targeted guardrail`
- `next_action`: `do not reopen phrase expansion; move to the next long-chain scenario only if it adds a new failure theme`

这轮最重要的变化是：

- `real-chat-long-chain-anti-analysis-carry-forward`
  - 已经从上次的 `soft drift toward generic continuation`
  - 转成了 `holds as one continuing role`
- 说明这次修口解决的是组合后 answer-shape precedence 问题
- 而不是靠继续扩 phrasing 包硬压过去

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

执行路径：

- `POST /api/test/smoke-reset`
- `POST /api/test/smoke-create-thread`
- `POST /api/test/smoke-send-turn`
- 直接从 `messages` 读取 assistant reply metadata

## Per-Scenario Verdict

### `real-chat-long-chain-anti-analysis-carry-forward`

- `status`: `PASS`
- `scenario_verdict`: `holds as one continuing role`
- `delta_vs_previous_run`: `fixed previous chain distortion`

关键观测：

1. `我现在有点乱，你先别急着分析我。`
   - reply: `阿强，好，我先不急着分析你，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
2. `你就回我一句就好。`
   - reply: `阿强，我在，先别一个人扛着。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
3. `你先帮我缓一下，再陪我往下走一点。`
   - reply: `阿强，先缓一下，我陪你往下顺一点。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`

判断：

- 上次真正失真的 turn 2 / turn 3 已经稳住
- brief catch 不再塌成 `好的，我们继续。`
- gentle carry-forward 也不再沿 generic continuation 滑下去
- 这次可判定为 chain-level fix 生效

### `real-chat-long-chain-anti-comforting-resume`

- `status`: `PASS`
- `scenario_verdict`: `holds as one continuing role`
- `delta_vs_previous_run`: `stable hold`

关键观测：

1. `你先别急着安慰我。`
   - reply: `阿强，好，我先不急着安慰你，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
2. `你还在这儿陪我，对吧。`
   - reply: `阿强，我还在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
3. `好，那你慢慢继续和我说。`
   - reply: `阿强，好，我们就慢慢接着说。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`

判断：

- 这条链继续稳定
- 没有被 `#232` 带偏

## 当前阶段判断

这轮复验证明：

1. 长链路失败确实值得先按 `chain-level guardrail` 处理
2. 不是每次失败都该回到 phrase-by-phrase 扩张
3. `anti-analysis -> brief catch -> gentle carry-forward` 这条链现在已经可视为阶段性收束

## 建议后续动作

1. 关闭 `#233`
2. 不再继续给这两条长链路补近义句
3. 下一轮只在确实有新失败主题时，再开新的长链路 testing issue
